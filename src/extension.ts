import { createEnhancedLinearIssue, getFilteredIssues, getTeamDetails, addComment } from './linear-api-enhanced';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds

// Paths
const repoPath = process.cwd();
const featurePlansPath = path.join(repoPath, 'FEATURE_PLANS.md');

// Types for Cursor extension API
interface CursorContext {
  subscriptions: Array<{ dispose: () => void }>;
  chat: {
    registerCommand: (command: string, handler: CommandHandler) => { dispose: () => void };
    askAI: (prompt: string) => Promise<string>;
  };
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

// Task queue for storing tasks before pushing to Linear
const taskQueue: {
  title: string;
  description: string;
  priority?: number;
  estimate?: number;
  featureContext?: string;
}[] = [];

export default {
  id: "mo-cursor-plugin",
  name: "Mo Plugin",
  description: "AI-driven project planning and management integrated with Linear.",

  activate(ctx: CursorContext): void {
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
          
          let estimate = 2; // Default estimate
          let title = taskText;
          
          if (estimateMatch) {
            estimate = parseInt(estimateMatch[1]);
            title = taskText.replace(/\s*\(\d+\)$/, '');
          }
          
          return {
            title,
            description: `Part of feature: ${input}`,
            priority: 2, // Default priority
            estimate,
            featureContext: input
          };
        });

        // Add tasks to queue
        taskQueue.push(...parsedTasks);

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
        `;
      })
    );

    // Register the push-tasks command to push queued tasks to Linear
    ctx.subscriptions.push(
      ctx.chat.registerCommand("push-tasks", async () => {
        if (taskQueue.length === 0) {
          return "No tasks in the queue. Use `/plan-project` to generate tasks first.";
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

          // Create Linear issues for each task in the queue
          const createdIssues: { title: string; url: string }[] = [];
          
          for (const task of taskQueue) {
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
              }
            } catch (error) {
              console.error(`Failed to create Linear issue for task: ${task.title}`, error);
            }
          }

          // Clear the task queue
          const pushedTaskCount = taskQueue.length;
          taskQueue.length = 0;

          return `
Successfully pushed ${createdIssues.length}/${pushedTaskCount} tasks to Linear:
${createdIssues.map(issue => `- [${issue.title}](${issue.url})`).join('\n')}

Task queue has been cleared.
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
        if (taskQueue.length === 0) {
          return "No tasks in the queue. Use `/plan-project` to generate tasks first.";
        }

        return `
Current task queue (${taskQueue.length} tasks):
${taskQueue.map((task, index) => `${index + 1}. ${task.title} (Priority: ${task.priority || 'Not set'}, Estimate: ${task.estimate || 'Not set'})`).join('\n')}

Use \`/push-tasks\` to push these tasks to Linear.
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
          
          return `
Retrieved ${issues.length} high-priority issues from Linear (last 7 days):
${issues.map((issue: any) => `- ${issue.identifier}: ${issue.title} (${issue.state.name}, Priority: ${issue.priority})`).join('\n')}
          `;
        } catch (error) {
          console.error('Failed to sync Linear issues:', error);
          return "Failed to sync with Linear. Check your API key and team ID.";
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
}; 