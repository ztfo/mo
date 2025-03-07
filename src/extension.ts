import { createEnhancedLinearIssue, getFilteredIssues, getTeamDetails, addComment } from './linear-api-enhanced';
import { UIManager, mockCursorUI, CursorUI } from './ui-framework';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TaskQueue, Task } from './task-queue';

// Configuration
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds

// Paths
const repoPath = process.cwd();
const featurePlansPath = path.join(repoPath, 'FEATURE_PLANS.md');
const settingsPath = path.join(os.homedir(), '.mo-settings.json');

// Types for Cursor extension API
interface CursorContext {
  subscriptions: Array<{ dispose: () => void }>;
  chat: {
    registerCommand: (command: string, handler: CommandHandler) => { dispose: () => void };
    askAI: (prompt: string) => Promise<string>;
  };
  ui?: CursorUI; // Optional UI API provided by Cursor
}

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

// Settings storage
let settings: Record<string, any> = {
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
    settings = { ...settings, ...loadedSettings };
    console.log('Settings loaded from disk:', settings);
  }
} catch (error) {
  console.error('Failed to load settings from disk:', error);
}

// UI Manager instance
let uiManager: UIManager | null = null;

export default {
  id: "mo-cursor-plugin",
  name: "Mo Plugin",
  description: "AI-driven project planning and management integrated with Linear.",

  activate(ctx: CursorContext): void {
    // Initialize UI Manager
    const ui = ctx.ui || mockCursorUI;
    uiManager = new UIManager(ui);
    
    // Initialize task queue
    const taskQueue = TaskQueue.getInstance();
    
    // Register the plan-project command
    ctx.subscriptions.push(
      ctx.chat.registerCommand("plan-project", async (ctx: CursorCommandContext, input: string) => {
        if (!input) {
          return "Please provide a feature description to plan.";
        }

        // Ask AI to break down the feature into tasks
        const aiTasks = await ctx.chat.askAI(`
          Break down this feature into 5-8 specific, actionable tasks:
          
          Feature: ${input}
          
          For each task:
          1. Start with a verb
          2. Be specific and clear
          3. Make it implementable in 1-2 hours
          4. Include an effort estimate (1-5 points)
          
          Format as a numbered list with effort points in parentheses.
          Example: 1. Create user authentication form (3)
        `);

        // Extract tasks from AI response
        const taskLines = aiTasks.split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => /^\d+\./.test(line));

        if (taskLines.length === 0) {
          return "Failed to generate tasks. Please try again with a more detailed feature description.";
        }

        // Parse tasks and estimates
        const parsedTasks = taskLines.map((line: string) => {
          const taskText = line.replace(/^\d+\.\s*/, '');
          const estimateMatch = taskText.match(/\((\d+)\)$/);
          
          let estimate = parseInt(settings.defaultEstimate) || 2; // Default estimate
          let title = taskText;
          
          if (estimateMatch) {
            estimate = parseInt(estimateMatch[1]);
            title = taskText.replace(/\s*\(\d+\)$/, '');
          }
          
          return {
            title,
            description: `Part of feature: ${input}`,
            priority: parseInt(settings.defaultPriority) || 2, // Default priority
            estimate,
            featureContext: input
          };
        });

        // Add tasks to queue
        taskQueue.addTasks(parsedTasks);
        
        // Update UI if visible
        if (uiManager) {
          uiManager.updateTaskQueue(taskQueue.getAllTasks());
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
      })
    );

    // Register the push-tasks command to push queued tasks to Linear
    ctx.subscriptions.push(
      ctx.chat.registerCommand("push-tasks", async () => {
        const tasks = taskQueue.getSelectedTasks();
        if (tasks.length === 0) {
          return "No tasks selected. Use `/show-task-queue` to select tasks to push.";
        }

        try {
          // Get team details to get state IDs
          const teamResult = await getTeamDetails();
          if (!teamResult.data?.team) {
            return "Failed to get team details from Linear. Please check your API credentials.";
          }

          // Get the "Backlog" state ID
          const backlogState = teamResult.data.team.states.nodes.find((state: LinearState) => state.name === "Backlog");
          if (!backlogState) {
            return "Could not find 'Backlog' state in Linear. Please check your Linear workflow configuration.";
          }

          // Create Linear issues for each selected task
          const createdIssues: { title: string; url: string }[] = [];
          
          for (const task of tasks) {
            try {
              const response = await createEnhancedLinearIssue(
                task.title,
                task.description || "",
                {
                  priority: task.priority,
                  stateId: backlogState.id,
                  estimate: task.estimate
                }
              );
              
              if (response.data?.issueCreate?.success) {
                createdIssues.push({
                  title: task.title,
                  url: response.data.issueCreate.issue.url
                });
                
                // Add a comment with the feature context if available
                if (task.featureContext) {
                  await addComment(
                    response.data.issueCreate.issue.id,
                    `This task is part of the "${task.featureContext}" feature.`
                  );
                }
                
                // Remove the task from the queue
                taskQueue.removeTask(task.id);
              }
            } catch (error) {
              console.error(`Failed to create Linear issue for task: ${task.title}`, error);
            }
          }

          // Update UI if visible
          if (uiManager) {
            uiManager.updateTaskQueue(taskQueue.getAllTasks());
          }

          return `
Successfully pushed ${createdIssues.length}/${tasks.length} tasks to Linear:
${createdIssues.map(issue => `- [${issue.title}](${issue.url})`).join('\n')}

Selected tasks have been removed from the queue.
          `;
        } catch (error) {
          console.error('Failed to push tasks to Linear:', error);
          return "Failed to push tasks to Linear. Please check your API credentials and try again.";
        }
      })
    );

    // Register the view-tasks command to view the current task queue
    ctx.subscriptions.push(
      ctx.chat.registerCommand("view-tasks", async () => {
        const tasks = taskQueue.getAllTasks();
        if (tasks.length === 0) {
          return "No tasks in the queue. Use `/plan-project` to generate tasks first.";
        }

        return `
Current task queue (${tasks.length} tasks):
${tasks.map((task, index) => `${index + 1}. ${task.title} (Priority: ${task.priority || 'Not set'}, Estimate: ${task.estimate || 'Not set'})`).join('\n')}

Use \`/push-tasks\` to push these tasks to Linear or \`/show-task-queue\` to open the task queue panel.
        `;
      })
    );

    // Register the sync-linear command to fetch latest issues
    ctx.subscriptions.push(
      ctx.chat.registerCommand("sync-linear", async () => {
        try {
          // Get high priority issues created in the last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const response = await getFilteredIssues({
            priorities: [1, 2], // High and medium priority
            createdAt: { after: sevenDaysAgo.toISOString() }
          }, { first: 20 });
          
          const issues = response.data?.issues?.nodes || [];
          
          // Update UI if visible
          if (uiManager) {
            uiManager.updateLinearIssues(issues);
          }
          
          return `
Retrieved ${issues.length} high-priority issues from Linear (last 7 days):
${issues.map((issue: any) => `- ${issue.identifier}: ${issue.title} (${issue.state.name}, Priority: ${issue.priority})`).join('\n')}

Use \`/show-linear-sync\` to open the Linear sync panel.
          `;
        } catch (error) {
          console.error('Failed to sync Linear issues:', error);
          return "Failed to sync with Linear. Check your API key and team ID.";
        }
      })
    );
    
    // Register UI commands
    
    // Show task queue panel
    ctx.subscriptions.push(
      ctx.chat.registerCommand("show-task-queue", async () => {
        if (uiManager) {
          uiManager.showTaskQueue();
          uiManager.updateTaskQueue(taskQueue.getAllTasks());
          return "Task queue panel opened.";
        } else {
          return "UI is not available in this environment.";
        }
      })
    );
    
    // Show Linear sync panel
    ctx.subscriptions.push(
      ctx.chat.registerCommand("show-linear-sync", async () => {
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
          } catch (error) {
            console.error('Failed to fetch issues for Linear sync panel:', error);
          }
          
          return "Linear sync panel opened.";
        } else {
          return "UI is not available in this environment.";
        }
      })
    );
    
    // Show settings panel
    ctx.subscriptions.push(
      ctx.chat.registerCommand("show-settings", async () => {
        if (uiManager) {
          uiManager.showSettings();
          uiManager.updateSettings(settings);
          return "Settings panel opened.";
        } else {
          return "UI is not available in this environment.";
        }
      })
    );

    // Set up automatic updates to FEATURE_PLANS.md
    const interval = setInterval(() => {
      try {
        let planContent = fs.readFileSync(featurePlansPath, 'utf8');
        const timestamp = new Date().toISOString();
        planContent = planContent.replace(/_Last updated:.*_/, `_Last updated: ${timestamp}_`);
        fs.writeFileSync(featurePlansPath, planContent);
        console.log(`Updated FEATURE_PLANS.md timestamp: ${timestamp}`);
      } catch (error) {
        console.error('Failed to update timestamp in FEATURE_PLANS.md:', error);
      }
    }, UPDATE_INTERVAL);

    // Clean up on deactivation
    ctx.subscriptions.push({ 
      dispose: () => {
        clearInterval(interval);
        console.log('Mo plugin deactivated.');
      }
    });

    console.log('Mo plugin activated successfully!');
  },
  
  // Handler for pushing tasks to Linear from the UI
  async pushTasksToLinear(tasks: Task[]): Promise<void> {
    if (tasks.length === 0) return;
    
    try {
      // Get team details to get state IDs
      const teamResult = await getTeamDetails();
      if (!teamResult.data?.team) {
        throw new Error("Failed to get team details from Linear");
      }

      // Get the "Backlog" state ID
      const backlogState = teamResult.data.team.states.nodes.find((state: LinearState) => state.name === "Backlog");
      if (!backlogState) {
        throw new Error("Could not find 'Backlog' state in Linear");
      }

      // Create Linear issues for each task
      for (const task of tasks) {
        await createEnhancedLinearIssue(
          task.title,
          task.description || "",
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
  }
}; 