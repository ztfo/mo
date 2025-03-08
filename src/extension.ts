import { createEnhancedLinearIssue, getFilteredIssues, getTeamDetails, addComment } from './linear-api-enhanced';
import { UIManager, mockCursorUI, CursorUI } from './ui-framework';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TaskQueue, Task } from './task-queue';
import { PlanningInterface } from './webviews/planning-interface';
import { TaskSidebarProvider } from './sidebar/task-sidebar-provider';
import { TaskDetails } from './webviews/task-details';

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
let uiManager = null;
let planningInterface: PlanningInterface | null = null;
let taskSidebarProvider: TaskSidebarProvider | null = null;
let taskDetails: TaskDetails | null = null;

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
  async exportTasks(tasks: any[], exportDir: string = tasksDir): Promise<void> {
    try {
      // Create tasks directory if it doesn't exist
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Export each task to a file
      for (const task of tasks) {
        const fileName = `${task.identifier || `task-${Date.now()}`}.md`;
        const filePath = path.join(exportDir, fileName);
        
        // Format task context
        let context = `# ${task.title}\n\n`;
        context += `## Overview\n${task.description}\n\n`;
        context += `## Technical Requirements\n`;
        context += `- Priority: ${task.priority || 'None'}\n`;
        context += `- Estimate: ${task.estimate || 'None'}\n`;
        context += `- State: ${task.state?.name || 'Unknown'}\n\n`;
        
        if (task.identifier && task.url) {
          context += `## Linear Issue\n${task.identifier} - ${task.url}\n`;
        }
        
        // Write to file
        fs.writeFileSync(filePath, context);
      }
    } catch (error) {
      console.error('Failed to export tasks:', error);
      throw error;
    }
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
  
  // Initialize planning interface
  planningInterface = new PlanningInterface(ui);
  
  // Initialize task details
  taskDetails = new TaskDetails(ui);
  
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
    
    // Export tasks command
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
${parsedTasks.map(task => `- [ ] ${task.title} (${task.estimate} points)`).join('\n')}

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
  }
  
  console.log('Mo plugin activated');
}

export function deactivate(): void {
  console.log('Mo plugin deactivated');
} 