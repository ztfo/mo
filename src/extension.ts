import { createLinearIssue, getTeamIssues, checkCredentials } from './linear-api';
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
          
          Format as a numbered list.
        `);

        // Extract tasks from AI response
        const taskLines = aiTasks.split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => /^\d+\./.test(line))
          .map((line: string) => line.replace(/^\d+\.\s*/, ''));

        if (taskLines.length === 0) {
          return "Failed to generate tasks. Please try again with a more detailed feature description.";
        }

        // Update FEATURE_PLANS.md
        const timestamp = new Date().toISOString();
        const featurePlan = `
## Feature: ${input}
_Planned: ${timestamp}_

### Tasks:
${taskLines.map((task: string) => `- [ ] ${task}`).join('\n')}

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

        // Create Linear issues
        const createdIssues: LinearIssue[] = [];
        for (const task of taskLines) {
          try {
            const response = await createLinearIssue(task, `Part of feature: ${input}`);
            if (response.data?.issueCreate?.success) {
              createdIssues.push({
                title: task,
                url: response.data.issueCreate.issue.url,
                state: { name: 'Todo' }
              });
            }
          } catch (error) {
            console.error(`Failed to create Linear issue for task: ${task}`, error);
          }
        }

        return `
Successfully planned feature: **${input}**
- Created ${createdIssues.length} Linear tasks
- Updated FEATURE_PLANS.md
        `;
      })
    );

    // Register the sync-linear command to fetch latest issues
    ctx.subscriptions.push(
      ctx.chat.registerCommand("sync-linear", async () => {
        try {
          const response = await getTeamIssues();
          const issues = response.data?.team?.issues?.nodes || [];
          
          return `
Retrieved ${issues.length} issues from Linear:
${issues.slice(0, 10).map((issue: any) => `- ${issue.title} (${issue.state.name})`).join('\n')}
${issues.length > 10 ? `\n... and ${issues.length - 10} more` : ''}
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
        console.log('Migo Build plugin deactivated.');
      }
    });

    console.log('Migo Build plugin activated successfully!');
  },
}; 