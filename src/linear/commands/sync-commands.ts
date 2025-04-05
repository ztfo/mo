/**
 * Linear Synchronization Commands
 *
 * This file implements the command handlers for Linear synchronization operations.
 */

import { CommandHandler, CommandResult } from "../../types/command";
import { isLinearConfigured, getLinearAuth, getApiKey } from "../auth";
import { LinearClient } from "../api";
import { syncWithLinear, LinearSyncResult, LinearSyncOptions } from "../sync";
import { getTaskById, getTasks } from "../../data/store";

/**
 * Format a sync result as markdown
 */
function formatSyncResult(
  result: LinearSyncResult,
  options: LinearSyncOptions
): string {
  const { added, updated, deleted, conflicts, errors } = result;
  const directionText =
    options.direction === "push"
      ? "Mo → Linear"
      : options.direction === "pull"
      ? "Linear → Mo"
      : "Bidirectional";

  let markdown = `
### Linear Synchronization Complete

**Direction**: ${directionText}
**Results**:
- Added: ${added}
- Updated: ${updated}
- Deleted: ${deleted}
- Conflicts: ${conflicts}
- Errors: ${errors.length}
`;

  if (errors.length > 0) {
    markdown += `\n**Errors**:\n`;
    errors.slice(0, 5).forEach((error) => {
      markdown += `- ${error.message}\n`;
    });

    if (errors.length > 5) {
      markdown += `- ... and ${errors.length - 5} more errors\n`;
    }
  }

  if (result.details) {
    const totalItems =
      result.details.added.length +
      result.details.updated.length +
      result.details.failed.length;

    if (totalItems > 0) {
      markdown += `\n**Details**:\n`;

      if (result.details.added.length > 0) {
        const addedCount = Math.min(result.details.added.length, 3);
        markdown += `- Added ${result.details.added.length} items`;
        if (addedCount > 0) {
          markdown += `: ${result.details.added
            .slice(0, addedCount)
            .map((item) => `${item.local} → ${item.remote}`)
            .join(", ")}`;
          if (result.details.added.length > addedCount) {
            markdown += `, ...`;
          }
        }
        markdown += `\n`;
      }

      if (result.details.updated.length > 0) {
        const updatedCount = Math.min(result.details.updated.length, 3);
        markdown += `- Updated ${result.details.updated.length} items`;
        if (updatedCount > 0) {
          markdown += `: ${result.details.updated
            .slice(0, updatedCount)
            .map((item) => `${item.local} → ${item.remote}`)
            .join(", ")}`;
          if (result.details.updated.length > updatedCount) {
            markdown += `, ...`;
          }
        }
        markdown += `\n`;
      }

      if (result.details.failed.length > 0) {
        markdown += `- Failed: ${result.details.failed.length} items\n`;
      }
    }
  }

  return markdown;
}

/**
 * Linear sync command
 *
 * Synchronizes tasks between Mo and Linear
 */
export const linearSyncCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear before you can sync:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Parse sync direction
    let direction: "push" | "pull" | "both" = "both";
    if (params.direction) {
      if (["push", "pull", "both"].includes(params.direction)) {
        direction = params.direction as "push" | "pull" | "both";
      } else {
        return {
          success: false,
          message: "Invalid sync direction",
          markdown: `
### Invalid Sync Direction

The direction parameter must be one of: \`push\`, \`pull\`, or \`both\`.

Example: \`/mo linear-sync direction:pull\`
`,
          actionButtons: [
            {
              label: "Sync Both Ways",
              command: "/mo linear-sync",
            },
            {
              label: "Push to Linear",
              command: "/mo linear-sync direction:push",
            },
            {
              label: "Pull from Linear",
              command: "/mo linear-sync direction:pull",
            },
          ],
        };
      }
    }

    // Parse filter and other options
    const options: LinearSyncOptions = {
      direction,
      dryRun: params.dryRun === "true",
      force: params.force === "true",
    };

    // Add filter if provided
    if (params.filter) {
      options.filter = { searchText: params.filter };
    }

    // Add team if provided
    if (params.team) {
      options.teamId = params.team;
    }

    // Add limit if provided
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        options.limit = limit;
      }
    }

    // Start sync
    const result = await syncWithLinear(options);

    // Generate response
    return {
      success: true,
      message: `Linear sync complete: ${result.added} added, ${result.updated} updated`,
      markdown: formatSyncResult(result, options),
      actionButtons: [
        {
          label: "View Linear Issues",
          command: `/mo linear-issues team:${options.teamId}`,
        },
        {
          label: "View Mo Tasks",
          command: "/mo tasks",
        },
      ],
    };
  } catch (error) {
    console.error("Linear sync command error:", error);

    return {
      success: false,
      message: "Linear sync failed",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Sync Error

An error occurred during synchronization:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Check Linear Status",
          command: "/mo linear-status",
        },
        {
          label: "Try Again",
          command: "/mo linear-sync",
        },
      ],
    };
  }
};

/**
 * Linear push command
 *
 * Pushes a specific task or tasks to Linear
 */
export const linearPushCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear before you can push tasks:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Check if task ID is provided
    if (!params.id && !params.filter) {
      return {
        success: false,
        message: "Task ID or filter is required",
        markdown: `
### Missing Task ID or Filter

You must specify either a task ID or a filter:

\`/mo linear-push id:task-123\`
\`/mo linear-push filter:status:todo\`
`,
        actionButtons: [
          {
            label: "Push All Tasks",
            command: "/mo linear-push filter:all",
          },
          {
            label: "Push Todo Tasks",
            command: "/mo linear-push filter:status:todo",
          },
        ],
      };
    }

    // Set up sync options
    const options: LinearSyncOptions = {
      direction: "push",
      dryRun: params.dryRun === "true",
      force: params.force === "true",
      teamId: params.team,
    };

    // Filter to specific task(s)
    if (params.id) {
      const task = await getTaskById(params.id);

      if (!task) {
        return {
          success: false,
          message: `Task not found: ${params.id}`,
          markdown: `
### Task Not Found

The task with ID \`${params.id}\` was not found.

Please check the ID and try again.
`,
        };
      }

      options.filter = { taskIds: [params.id] };
    } else if (params.filter) {
      // Use the filter as provided
      options.filter = { searchText: params.filter };
    }

    // Execute the push
    const result = await syncWithLinear(options);

    // Generate response
    return {
      success: true,
      message: `Linear push complete: ${result.added} added, ${result.updated} updated`,
      markdown: formatSyncResult(result, options),
      actionButtons: [
        {
          label: "View Linear Issues",
          command: `/mo linear-issues team:${options.teamId}`,
        },
        {
          label: "View Mo Tasks",
          command: "/mo tasks",
        },
      ],
    };
  } catch (error) {
    console.error("Linear push command error:", error);

    return {
      success: false,
      message: "Linear push failed",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Push Error

An error occurred while pushing to Linear:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Check Linear Status",
          command: "/mo linear-status",
        },
        {
          label: "Try Again",
          command: "/mo linear-push",
        },
      ],
    };
  }
};

/**
 * Linear pull command
 *
 * Pulls issues from Linear to Mo
 */
export const linearPullCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear before you can pull issues:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Set up sync options
    const options: LinearSyncOptions = {
      direction: "pull",
      dryRun: params.dryRun === "true",
      teamId: params.team,
    };

    // Handle specific issue ID
    if (params.id) {
      options.filter = { issueIds: [params.id] };
    }

    // Handle filter
    if (params.filter) {
      options.filter = { ...options.filter, searchText: params.filter };
    }

    // Handle states filter
    if (params.states) {
      const states = params.states.split(",").map((s) => s.trim());
      options.filter = { ...options.filter, states };
    }

    // Handle limit
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        options.limit = limit;
      }
    }

    // Execute the pull
    const result = await syncWithLinear(options);

    // Generate response
    return {
      success: true,
      message: `Linear pull complete: ${result.added} added, ${result.updated} updated`,
      markdown: formatSyncResult(result, options),
      actionButtons: [
        {
          label: "View Linear Issues",
          command: `/mo linear-issues team:${options.teamId}`,
        },
        {
          label: "View Mo Tasks",
          command: "/mo tasks",
        },
      ],
    };
  } catch (error) {
    console.error("Linear pull command error:", error);

    return {
      success: false,
      message: "Linear pull failed",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Pull Error

An error occurred while pulling from Linear:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Check Linear Status",
          command: "/mo linear-status",
        },
        {
          label: "View Linear Issues",
          command: "/mo linear-issues",
        },
        {
          label: "Try Again",
          command: "/mo linear-pull",
        },
      ],
    };
  }
};
