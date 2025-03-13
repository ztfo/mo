import { createEnhancedLinearIssue, getFilteredIssues, getTeamDetails, addComment } from './linear-api-enhanced';
import { UIManager, mockCursorUI, CursorUI } from './ui-framework';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TaskQueue, Task } from './task-queue';
import { PlanningInterface } from './webviews/planning-interface';
import { TaskSidebarProvider } from './sidebar/task-sidebar-provider';
import { TaskDetails } from './webviews/task-details';
import { ExportDialog } from './webviews/export-dialog';

// Configuration
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds

// Paths
const repoPath = process.cwd();
const featurePlansPath = path.join(repoPath, 'docs/features/FEATURE_PLANS.md');
const settingsPath = path.join(os.homedir(), '.mo-settings.json');
const tasksDir = path.join(repoPath, 'tasks');

// Settings storage
let settings = {
  linearApiKey: process.env.LINEAR_API_KEY || '',
  linearTeamId: process.env.LINEAR_TEAM_ID || '',
  defaultPriority: '2',
  defaultEstimate: '2',
  syncInterval: '5',
  autoSync: true
};

// Load settings from disk if available
try {
  if (fs.existsSync(settingsPath)) {
    const settingsData = fs.readFileSync(settingsPath, 'utf8');
    const loadedSettings = JSON.parse(settingsData);
    settings = Object.assign(Object.assign({}, settings), loadedSettings);
    console.log('Settings loaded from disk:', settings);
  }
}
catch (error) {
  console.error('Failed to load settings from disk:', error);
}

// Types for Cursor extension API
interface CursorContext {
  subscriptions: Array<{ dispose: () => void }>;
  chat: {
    registerCommand: (command: string, handler: CommandHandler) => { dispose: () => void };
    askAI: (prompt: string) => Promise<string>;
  };
  ui?: CursorUI; // Optional UI API provided by Cursor
  window?: {
    registerTreeDataProvider: (viewId: string, provider: TreeDataProvider) => { dispose: () => void };
  };
  commands?: {
    registerCommand: (command: string, callback: (...args: any[]) => any) => { dispose: () => void };
  };
}

// Add TreeDataProvider interface
interface TreeDataProvider {
  getTreeItem: (element: any) => TreeItem;
  getChildren: (element?: any) => Promise<any[]> | any[];
  onDidChangeTreeData?: (listener: () => void) => { dispose: () => void };
}

interface TreeItem {
  label: string;
  description?: string;
  tooltip?: string;
  collapsibleState?: 'none' | 'collapsed' | 'expanded';
  command?: {
    command: string;
    title: string;
    arguments?: any[];
  };
}

// Add CursorCommandContext interface
interface CursorCommandContext {
  chat: {
    askAI: (prompt: string) => Promise<string>;
  };
}

type CommandHandler = (ctx: CursorCommandContext, input: string) => Promise<string>;

interface LinearIssue {
  title: string;
  url: string;
  state: {
    name: string;
  };
}

interface LinearState {
  id: string;
  name: string;
  color: string;
  type: string;
}

// UI Manager instance
let uiManager: UIManager | null = null;
let planningInterface: PlanningInterface | null = null;
let taskSidebarProvider: TaskSidebarProvider | null = null;
let taskDetails: TaskDetails | null = null;
let exportDialog: ExportDialog | null = null;

// Plugin object with methods
export default {
  id: "mo-plugin",
  name: "Mo Plugin",
  description: "AI-driven project planning and management integrated with Linear.",
  
  // Handler for pushing tasks to Linear
  async pushTasksToLinear(tasks: Task[]): Promise<void> {
    try {
      // Get team details to find the backlog state
      const teamDetails = await getTeamDetails();
      const states = teamDetails.data?.team?.states?.nodes || [];
      
      // Find the backlog state
      const backlogState = states.find((state: LinearState) => state.type === 'backlog') || states[0];
      
      if (!backlogState) {
        throw new Error('Could not find a valid state for new issues');
      }
      
      // Push each task to Linear
      for (const task of tasks) {
        await createEnhancedLinearIssue(
          task.title,
          task.description,
          {
            priority: task.priority,
            stateId: backlogState.id,
            estimate: task.estimate
          }
        );
      }
    } catch (error) {
      console.error('Failed to push tasks to Linear:', error);
      throw error;
    }
  },
  
  // Handler for refreshing issues from Linear
  async refreshLinearIssues(): Promise<any[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const response = await getFilteredIssues({
        priorities: [1, 2], // High and medium priority
        createdAt: { after: sevenDaysAgo.toISOString() }
      }, { first: 20 });
      
      return response.data?.issues?.nodes || [];
    } catch (error) {
      console.error('Failed to refresh issues from Linear:', error);
      throw error;
    }
  },
  
  // Handler for saving settings
  async saveSettings(newSettings: Record<string, any>): Promise<void> {
    try {
      // Update settings
      settings = { ...settings, ...newSettings };
      
      // Persist settings to disk
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },
  
  // Handler for exporting tasks to files
  async exportTasks(tasks: any[], options: any = {}): Promise<void> {
    try {
      const {
        exportPath = tasksDir,
        organizationType = 'flat',
        templateType = 'default',
        sections = {
          overview: true,
          requirements: true,
          implementation: true,
          references: true,
          metadata: true
        },
        fileNaming = 'id-title'
      } = options;
      
      // Create export directory if it doesn't exist
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }
      
      // Create subdirectories and organize tasks
      const tasksByDirectory = new Map<string, any[]>();
      
      if (organizationType === 'flat') {
        // All tasks in the root directory
        tasksByDirectory.set('', tasks);
      } else if (organizationType === 'status') {
        // Organize by status
        tasks.forEach(task => {
          const status = task.state?.name || 'Unknown';
          if (!tasksByDirectory.has(status)) {
            tasksByDirectory.set(status, []);
          }
          tasksByDirectory.get(status)!.push(task);
        });
      } else if (organizationType === 'priority') {
        // Organize by priority
        const priorityNames: Record<string, string> = {
          '1': 'Priority 1 (Urgent)',
          '2': 'Priority 2 (High)',
          '3': 'Priority 3 (Medium)',
          '4': 'Priority 4 (Low)',
          '5': 'Priority 5 (Lowest)',
        };
        
        tasks.forEach(task => {
          const priorityKey = task.priority?.toString() || 'Unknown';
          const priority = priorityNames[priorityKey] || `Priority ${priorityKey}`;
          if (!tasksByDirectory.has(priority)) {
            tasksByDirectory.set(priority, []);
          }
          tasksByDirectory.get(priority)!.push(task);
        });
      } else if (organizationType === 'project') {
        // Organize by project
        tasks.forEach(task => {
          const project = task.project?.name || 'No Project';
          if (!tasksByDirectory.has(project)) {
            tasksByDirectory.set(project, []);
          }
          tasksByDirectory.get(project)!.push(task);
        });
      }
      
      // Create directories and export tasks
      for (const [dirName, dirTasks] of tasksByDirectory.entries()) {
        const dirPath = dirName ? path.join(exportPath, dirName) : exportPath;
        
        // Create directory if needed
        if (dirName && !fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Export each task
        for (const task of dirTasks) {
          // Generate file name
          let fileName: string;
          if (fileNaming === 'id') {
            fileName = task.identifier || `task-${task.id}`;
          } else if (fileNaming === 'title') {
            fileName = this.slugify(task.title);
          } else {
            fileName = (task.identifier || `task-${task.id}`) + '-' + this.slugify(task.title);
          }
          
          // Add markdown extension
          fileName = `${fileName}.md`;
          
          // Create full file path
          const filePath = path.join(dirPath, fileName);
          
          // Generate content based on template
          let content: string;
          if (templateType === 'minimal') {
            content = this.generateMinimalTemplate(task, sections);
          } else if (templateType === 'detailed') {
            content = this.generateDetailedTemplate(task, sections);
          } else {
            content = this.generateDefaultTemplate(task, sections);
          }
          
          // Write to file
          fs.writeFileSync(filePath, content);
        }
      }
    } catch (error) {
      console.error('Failed to export tasks:', error);
      throw error;
    }
  },
  
  // Helper method to generate default template
  generateDefaultTemplate(task: any, sections: any): string {
    let content = `# ${task.title}\n\n`;
    
    if (sections.overview) {
      content += `## Overview\n${task.description || 'No description provided.'}\n\n`;
    }
    
    if (sections.requirements) {
      content += `## Technical Requirements\n`;
      content += `- Priority: ${task.priority || 'None'}\n`;
      content += `- Estimate: ${task.estimate || 'None'}\n`;
      content += `- Status: ${task.state?.name || 'Unknown'}\n`;
      if (task.labels && task.labels.nodes && task.labels.nodes.length > 0) {
        content += `- Labels: ${task.labels.nodes.map((l: any) => l.name).join(', ')}\n`;
      }
      content += '\n';
    }
    
    if (sections.implementation) {
      content += `## Implementation Details\n`;
      content += `*No implementation details provided.*\n\n`;
    }
    
    if (sections.references) {
      content += `## References\n`;
      content += `*No references provided.*\n\n`;
    }
    
    if (sections.metadata) {
      content += `---\n\n`;
      if (task.identifier) {
        content += `*Task ID: ${task.identifier}*\n`;
      }
      if (task.url) {
        content += `*Linear URL: ${task.url}*\n`;
      }
      content += `*Exported on: ${new Date().toISOString()}*\n`;
    }
    
    return content;
  },
  
  // Helper method to generate minimal template
  generateMinimalTemplate(task: any, sections: any): string {
    let content = `# ${task.title}\n\n`;
    content += `${task.description || 'No description provided.'}\n\n`;
    content += `Priority: ${task.priority || 'None'} | `;
    content += `Estimate: ${task.estimate || 'None'} | `;
    content += `Status: ${task.state?.name || 'Unknown'}\n\n`;
    
    if (task.identifier && task.url) {
      content += `[${task.identifier}](${task.url})\n`;
    }
    
    return content;
  },
  
  // Helper method to generate detailed template
  generateDetailedTemplate(task: any, sections: any): string {
    let content = `# ${task.title}\n\n`;
    
    if (sections.overview) {
      content += `## Overview\n${task.description || 'No description provided.'}\n\n`;
    }
    
    if (sections.requirements) {
      content += `## Technical Requirements\n`;
      content += `### Priority\n${task.priority || 'None'}\n\n`;
      content += `### Estimate\n${task.estimate || 'None'} points\n\n`;
      content += `### Status\n${task.state?.name || 'Unknown'}\n\n`;
      
      if (task.labels && task.labels.nodes && task.labels.nodes.length > 0) {
        content += `### Labels\n`;
        task.labels.nodes.forEach((label: any) => {
          content += `- ${label.name}\n`;
        });
        content += '\n';
      }
    }
    
    if (sections.implementation) {
      content += `## Implementation Details\n\n`;
      content += `### Approach\n*No approach provided.*\n\n`;
      content += `### Technical Considerations\n*No technical considerations provided.*\n\n`;
      content += `### Potential Challenges\n*No potential challenges identified.*\n\n`;
    }
    
    if (sections.references) {
      content += `## References\n\n`;
      content += `### Documentation\n*No documentation references provided.*\n\n`;
      content += `### Related Tasks\n*No related tasks provided.*\n\n`;
      content += `### External Resources\n*No external resources provided.*\n\n`;
    }
    
    if (sections.metadata) {
      content += `---\n\n`;
      content += `**Metadata**\n\n`;
      if (task.identifier) {
        content += `- Task ID: ${task.identifier}\n`;
      }
      if (task.url) {
        content += `- Linear URL: ${task.url}\n`;
      }
      if (task.createdAt) {
        content += `- Created: ${new Date(task.createdAt).toLocaleString()}\n`;
      }
      if (task.updatedAt) {
        content += `- Updated: ${new Date(task.updatedAt).toLocaleString()}\n`;
      }
      content += `- Exported: ${new Date().toLocaleString()}\n`;
    }
    
    return content;
  },
  
  // Helper method to slugify text for file names
  slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
      .substring(0, 50); // Limit length
  }
};

// Export activate and deactivate functions explicitly for VS Code/Cursor compatibility
export function activate(context: CursorContext): void {
  console.log('Activating Mo plugin');
  
  // Initialize UI Manager
  const ui = context.ui || mockCursorUI;
  uiManager = new UIManager(ui);
  
  // Initialize task queue
  const taskQueue = TaskQueue.getInstance();
  
  // Initialize planning interface with Cursor context for AI
  planningInterface = new PlanningInterface(ui, context);
  
  // Initialize task details
  taskDetails = new TaskDetails(ui);
  
  // Initialize export dialog
  exportDialog = new ExportDialog(ui, (tasks, options) => {
    return exports.default.exportTasks(tasks, options);
  });
  
  // Register commands for the command palette (Ctrl+Shift+P or Cmd+Shift+P)
  if (context.commands) {
    // Plan project command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.planProject", () => {
        if (planningInterface) {
          planningInterface.show();
          if (context.ui) {
            context.ui.showInformationMessage("Project planning interface opened.");
          }
        }
      })
    );
    
    // Show task queue command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showTaskQueue", () => {
        if (uiManager) {
          uiManager.showTaskQueue();
          uiManager.updateTaskQueue(taskQueue.getAllTasks());
          if (context.ui) {
            context.ui.showInformationMessage("Task queue panel opened.");
          }
        }
      })
    );
    
    // Show Linear sync command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showLinearSync", async () => {
        if (uiManager) {
          uiManager.showLinearSync();
          
          // Fetch issues to populate the panel
          try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const response = await getFilteredIssues({
              priorities: [1, 2], // High and medium priority
              createdAt: { after: sevenDaysAgo.toISOString() }
            }, { first: 20 });
            
            const issues = response.data?.issues?.nodes || [];
            uiManager.updateLinearIssues(issues);
            
            if (context.ui) {
              context.ui.showInformationMessage("Linear sync panel opened.");
            }
          } catch (error) {
            console.error('Failed to fetch issues for Linear sync panel:', error);
            if (context.ui) {
              context.ui.showErrorMessage("Failed to fetch issues from Linear.");
            }
          }
        }
      })
    );
    
    // Show settings command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showSettings", () => {
        if (uiManager) {
          uiManager.showSettings();
          uiManager.updateSettings(settings);
          if (context.ui) {
            context.ui.showInformationMessage("Settings panel opened.");
          }
        }
      })
    );
    
    // Push tasks command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.pushTasks", async () => {
        const tasks = taskQueue.getSelectedTasks();
        if (tasks.length === 0) {
          if (context.ui) {
            context.ui.showWarningMessage("No tasks selected to push to Linear.");
          }
          return;
        }
        
        try {
          // Call the pushTasksToLinear function
          await exports.default.pushTasksToLinear(tasks);
          
          if (context.ui) {
            context.ui.showInformationMessage(`Successfully pushed ${tasks.length} tasks to Linear.`);
          }
        } catch (error) {
          console.error('Failed to push tasks to Linear:', error);
          if (context.ui) {
            context.ui.showErrorMessage("Failed to push tasks to Linear.");
          }
        }
      })
    );
    
    // View task details command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.viewTaskDetails", (task) => {
        if (taskDetails) {
          taskDetails.show(task);
        }
      })
    );
    
    // Export tasks command (basic version)
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.exportTasks", async () => {
        try {
          // Get tasks from Linear
          const tasks = await exports.default.refreshLinearIssues();
          
          if (tasks.length === 0) {
            if (context.ui) {
              context.ui.showWarningMessage("No tasks to export.");
            }
            return;
          }
          
          // Export tasks
          await exports.default.exportTasks(tasks);
          
          if (context.ui) {
            context.ui.showInformationMessage(`Successfully exported ${tasks.length} tasks to ${tasksDir}.`);
          }
        } catch (error) {
          console.error('Failed to export tasks:', error);
          if (context.ui) {
            context.ui.showErrorMessage("Failed to export tasks.");
          }
        }
      })
    );
    
    // Show export dialog command (enhanced version)
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showExportDialog", async () => {
        try {
          // Get tasks from Linear
          const tasks = await exports.default.refreshLinearIssues();
          
          if (tasks.length === 0) {
            if (context.ui) {
              context.ui.showWarningMessage("No tasks available to export.");
            }
            return;
          }
          
          // Show export dialog
          if (exportDialog) {
            exportDialog.show(tasks);
            if (context.ui) {
              context.ui.showInformationMessage("Export dialog opened.");
            }
          }
        } catch (error) {
          console.error('Failed to show export dialog:', error);
          if (context.ui) {
            context.ui.showErrorMessage("Failed to open export dialog.");
          }
        }
      })
    );
    
    // Sync with Linear command
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.syncWithLinear", async () => {
        if (taskSidebarProvider) {
          try {
            await taskSidebarProvider.refresh();
            if (context.ui) {
              context.ui.showInformationMessage("Successfully synced with Linear.");
            }
          } catch (error) {
            console.error('Failed to sync with Linear:', error);
            if (context.ui) {
              context.ui.showErrorMessage("Failed to sync with Linear.");
            }
          }
        }
      })
    );
  }
  
  // Register data providers for views
  if (context.window) {
    // Initialize task sidebar provider
    let treeDataChanged = () => {};
    taskSidebarProvider = new TaskSidebarProvider(() => treeDataChanged());
    
    // Task sidebar provider
    context.subscriptions.push(
      context.window.registerTreeDataProvider('mo-task-sidebar', {
        getTreeItem: (task) => taskSidebarProvider!.getTreeItem(task),
        getChildren: () => taskSidebarProvider!.getChildren(),
        onDidChangeTreeData: (listener) => {
          treeDataChanged = listener;
          return { dispose: () => {} };
        }
      })
    );
    
    // Refresh task sidebar
    taskSidebarProvider.refresh().catch(error => {
      console.error('Failed to refresh task sidebar:', error);
    });
  }
  
  // Register chat commands
  if (context.chat) {
    // Plan project chat command
    context.subscriptions.push(
      context.chat.registerCommand("plan-project", async (ctx, input) => {
        if (!input) {
          return "Please provide a feature description. Usage: `/plan-project [feature description]`";
        }
        
        try {
          // Generate a prompt for the AI to create tasks
          const prompt = `
Generate a list of tasks for implementing the following feature:
${input}

Each task should include:
1. A clear, concise title
2. A detailed description
3. A priority (1-5, where 1 is highest)
4. An estimate (1-10 points)

Format the response as a JSON array of tasks:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "priority": 2,
    "estimate": 3
  },
  ...
]
`;
          
          // Ask AI to generate tasks
          const response = await ctx.chat.askAI(prompt);
          
          // Parse the response
          let parsedTasks;
          try {
            // Extract JSON array from response
            const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch) {
              throw new Error("Could not extract JSON from response");
            }
            
            parsedTasks = JSON.parse(jsonMatch[0]);
            
            // Validate tasks
            if (!Array.isArray(parsedTasks)) {
              throw new Error("Response is not an array");
            }
            
            // Add tasks to queue
            parsedTasks.forEach(task => {
              taskQueue.addTask({
                title: task.title,
                description: task.description,
                priority: task.priority,
                estimate: task.estimate,
                featureContext: input
              });
            });
          } catch (error) {
            console.error('Failed to parse AI response:', error);
            return "Failed to parse AI response. Please try again.";
          }

          // Update FEATURE_PLANS.md
          const timestamp = new Date().toISOString();
          const featurePlan = `
## Feature: ${input}
_Planned: ${timestamp}_

### Tasks:
${parsedTasks.map((task: any) => `- [ ] ${task.title} (${task.estimate} points)`).join('\n')}

---
`;

          try {
            let planContent = fs.readFileSync(featurePlansPath, 'utf8');
            // Insert new feature plan after the header but before other content
            const headerEndIndex = planContent.indexOf('## Recent Features') + '## Recent Features'.length;
            planContent = planContent.slice(0, headerEndIndex) + '\n' + featurePlan + planContent.slice(headerEndIndex);
            fs.writeFileSync(featurePlansPath, planContent);
          } catch (error) {
            console.error('Failed to update FEATURE_PLANS.md:', error);
            return "Failed to update feature plans file.";
          }

          return `
Successfully planned feature: **${input}**
- Added ${parsedTasks.length} tasks to queue
- Updated FEATURE_PLANS.md

Use \`/push-tasks\` to push these tasks to Linear or \`/view-tasks\` to see the current task queue.
You can also use \`/show-task-queue\` to open the task queue panel.
          `;
        } catch (error) {
          console.error('Failed to plan project:', error);
          return "Failed to plan project. Please try again.";
        }
      })
    );
    
    // Push tasks chat command
    context.subscriptions.push(
      context.chat.registerCommand("push-tasks", async () => {
        const tasks = taskQueue.getSelectedTasks();
        if (tasks.length === 0) {
          return "No tasks selected to push to Linear. Use the task queue panel to select tasks.";
        }
        
        try {
          // Use the plugin's pushTasksToLinear function
          await exports.default.pushTasksToLinear(tasks);
          
          return `Successfully pushed ${tasks.length} tasks to Linear.`;
        } catch (error) {
          console.error('Failed to push tasks to Linear:', error);
          return "Failed to push tasks to Linear. Please check your Linear API credentials.";
        }
      })
    );
    
    // View tasks chat command
    context.subscriptions.push(
      context.chat.registerCommand("view-tasks", async () => {
        const tasks = taskQueue.getAllTasks();
        if (tasks.length === 0) {
          return "No tasks in queue.";
        }
        
        const taskList = tasks.map((task, index) => {
          return `${index + 1}. **${task.title}** (Priority: ${task.priority || 'None'}, Estimate: ${task.estimate || 'None'})${task.selected ? ' [Selected]' : ''}`;
        }).join('\n');
        
        return `
# Task Queue (${tasks.length} tasks)

${taskList}

Use \`/push-tasks\` to push selected tasks to Linear or \`/show-task-queue\` to open the task queue panel.
        `;
      })
    );
    
    // Export tasks chat command
    context.subscriptions.push(
      context.chat.registerCommand("export-tasks", async () => {
        try {
          // Get tasks from Linear
          const tasks = await exports.default.refreshLinearIssues();
          
          if (tasks.length === 0) {
            return "No tasks available to export.";
          }
          
          // Export tasks to default location
          await exports.default.exportTasks(tasks);
          
          return `Successfully exported ${tasks.length} tasks to ${tasksDir}. Use \`/show-export-dialog\` for more advanced export options.`;
        } catch (error) {
          console.error('Failed to export tasks:', error);
          return "Failed to export tasks. Please check the logs for more information.";
        }
      })
    );
    
    // Show export dialog chat command
    context.subscriptions.push(
      context.chat.registerCommand("show-export-dialog", async () => {
        try {
          // Pass to the command handler
          if (context.commands) {
            context.commands.registerCommand("mo-plugin.showExportDialog", () => {});
          }
          
          return "Showing export dialog. Please use the dialog to configure and export tasks.";
        } catch (error) {
          console.error('Failed to show export dialog:', error);
          return "Failed to show export dialog. Please check the logs for more information.";
        }
      })
    );
  }
  
  console.log('Mo plugin activated');
}

export function deactivate(): void {
  console.log('Mo plugin deactivated');
} 