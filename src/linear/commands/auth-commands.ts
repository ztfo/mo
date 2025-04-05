/**
 * Linear Authentication Commands
 *
 * This file implements the command handlers for Linear authentication operations,
 * such as logging in, checking status, and logging out.
 */

import { CommandHandler, CommandResult } from "../../types/command";
import {
  isLinearConfigured,
  getLinearAuth,
  getApiKey,
  storeApiKey,
  getCurrentUser,
  clearLinearAuth as clearAuth,
  updateLinearAuth as storeAuth,
} from "../auth";
import { LinearClient } from "../api";
import { LinearAuth, LinearUser, LinearTeam } from "../types";

/**
 * Format Linear authentication status as markdown
 * @param isConfigured Whether Linear is configured
 * @param user Linear user details (if available)
 * @param teams Linear teams (if available)
 * @param defaultTeamId Default team ID (if set)
 */
function formatAuthStatus(
  isConfigured: boolean,
  user?: LinearUser,
  teams?: LinearTeam[],
  defaultTeamId?: string
): string {
  if (!isConfigured) {
    return `
### Linear Authentication Status

⚠️ Not authenticated with Linear.

To authenticate, use:

\`/mo linear-auth key:YOUR_LINEAR_API_KEY\`

You can generate an API key in your Linear account settings.
`;
  }

  // Basic info
  let markdown = `
### Linear Authentication Status

✅ Authenticated with Linear

`;

  // Add user details
  if (user) {
    markdown += `**User**: ${user.name} (${user.email})  \n`;

    if (user.avatarUrl) {
      markdown += `**Profile**: ${user.active ? "Active" : "Inactive"}  \n`;
    }

    markdown += "\n";
  }

  // Add teams
  if (teams && teams.length > 0) {
    markdown += `**Teams**:  \n\n`;

    teams.forEach((team) => {
      const isDefault = team.id === defaultTeamId;
      markdown += `- ${team.name} ${isDefault ? "(Default)" : ""}  \n`;
      markdown += `  ID: \`${team.id}\`  \n`;
      markdown += `  Key: \`${team.key}\`  \n`;
      if (team.description) {
        markdown += `  Description: ${team.description}  \n`;
      }
      markdown += "\n";
    });

    // Add note about setting default team
    if (!defaultTeamId && teams.length > 1) {
      markdown += `\nℹ️ You can set a default team with:  \n\n`;
      markdown += `\`/mo linear-auth team:TEAM_ID\`  \n\n`;
    }
  }

  // Add note about sync commands
  markdown += `\n**Available commands**:  \n\n`;
  markdown += `- \`/mo linear-teams\` - List all teams  \n`;
  markdown += `- \`/mo linear-projects\` - List all projects  \n`;
  markdown += `- \`/mo linear-states\` - List workflow states  \n`;
  markdown += `- \`/mo linear-issues\` - List issues  \n`;
  markdown += `- \`/mo linear-sync\` - Sync tasks with Linear  \n`;
  markdown += `- \`/mo linear-logout\` - Log out from Linear  \n`;

  return markdown;
}

/**
 * Linear auth command
 *
 * Handles authentication with the Linear API using an API key.
 * This command can be used to either set up authentication or update the default team.
 */
export const linearAuthCommand: CommandHandler = async (params, context) => {
  try {
    // Check if we're setting a default team
    if (params.team && !params.key) {
      return await setDefaultTeam(params.team);
    }

    // If we have a key parameter, validate and store it
    if (params.key) {
      return await setupAuth(params.key);
    }

    // No parameters - show status
    return linearStatusCommand(params, context);
  } catch (error) {
    console.error("Linear auth command error:", error);

    return {
      success: false,
      message: "Failed to authenticate with Linear",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Authentication Error

An error occurred while authenticating with Linear:

\`${error instanceof Error ? error.message : String(error)}\`

Please check your API key and try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-auth",
        },
      ],
    };
  }
};

/**
 * Set up Linear authentication with the provided API key
 */
async function setupAuth(apiKey: string): Promise<CommandResult> {
  try {
    // Validate the API key by making a test request
    const client = new LinearClient(apiKey);
    const user = await client.getCurrentUser();

    // Store the API key
    await storeApiKey(apiKey);

    // Get teams
    const teams = await client.getTeams();

    // Determine if we should suggest setting a default team
    let actionButtons = [];
    if (teams.length > 1) {
      // Add buttons for setting each team as default
      teams.forEach((team) => {
        actionButtons.push({
          label: `Set ${team.name} as Default`,
          command: `/mo linear-auth team:${team.id}`,
        });
      });
    } else if (teams.length === 1) {
      // Automatically set the only team as default
      await setDefaultTeam(teams[0].id);

      // Add action buttons for common next steps
      actionButtons = [
        {
          label: "View Projects",
          command: `/mo linear-projects`,
        },
        {
          label: "View Issues",
          command: `/mo linear-issues`,
        },
        {
          label: "Start Sync",
          command: `/mo linear-sync`,
        },
      ];
    }

    return {
      success: true,
      message: "Successfully authenticated with Linear",
      markdown: formatAuthStatus(true, user, teams),
      actionButtons,
    };
  } catch (error) {
    console.error("Linear setup auth error:", error);

    // If validation fails, return an error
    return {
      success: false,
      message: "Failed to authenticate with Linear",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Authentication Error

An error occurred while authenticating with Linear:

\`${error instanceof Error ? error.message : String(error)}\`

Please check your API key and try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-auth",
        },
      ],
    };
  }
}

/**
 * Set the default team for Linear integration
 */
async function setDefaultTeam(teamId: string): Promise<CommandResult> {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear first:

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

    // Get Linear auth and API key
    const auth = await getLinearAuth();
    const apiKey = await getApiKey();

    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: `
### Linear API Key Not Found

Please authenticate with Linear first:

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

    // Validate the team ID
    const client = new LinearClient(apiKey);
    const team = await client.getTeam(teamId);

    if (!team) {
      return {
        success: false,
        message: `Team not found: ${teamId}`,
        markdown: `
### Linear Team Not Found

The team with ID \`${teamId}\` was not found.

Please check the team ID and try again.
`,
        actionButtons: [
          {
            label: "View Teams",
            command: "/mo linear-teams",
          },
        ],
      };
    }

    // Update the default team ID
    const updatedAuth: LinearAuth = {
      ...auth,
      defaultTeamId: teamId,
    };

    // Store the updated auth
    await storeAuth(updatedAuth);

    // Get user for complete status
    const user = await client.getCurrentUser();

    // Get all teams for display
    const teams = await client.getTeams();

    return {
      success: true,
      message: `Set default team to: ${team.name}`,
      markdown: formatAuthStatus(true, user, teams, teamId),
      actionButtons: [
        {
          label: "View Projects",
          command: `/mo linear-projects team:${teamId}`,
        },
        {
          label: "View Issues",
          command: `/mo linear-issues team:${teamId}`,
        },
        {
          label: "Start Sync",
          command: `/mo linear-sync team:${teamId}`,
        },
      ],
    };
  } catch (error) {
    console.error("Linear set default team error:", error);

    return {
      success: false,
      message: "Failed to set default team",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Default Team Error

An error occurred while setting the default team:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "View Teams",
          command: "/mo linear-teams",
        },
      ],
    };
  }
}

/**
 * Linear status command
 *
 * Shows the current Linear authentication status
 */
export const linearStatusCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    const isConfigured = await isLinearConfigured();

    if (!isConfigured) {
      return {
        success: true,
        message: "Linear is not configured",
        markdown: formatAuthStatus(false),
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: formatAuthStatus(false),
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get the Linear auth
    const auth = await getLinearAuth();

    // Get user and teams
    const client = new LinearClient(apiKey);
    const user = await client.getCurrentUser();
    const teams = await client.getTeams();

    // Build action buttons
    const actionButtons = [];

    // Add common action buttons
    if (teams.length > 0) {
      const teamId = auth?.defaultTeamId || teams[0].id;

      actionButtons.push({
        label: "View Teams",
        command: "/mo linear-teams",
      });

      actionButtons.push({
        label: "View Issues",
        command: `/mo linear-issues team:${teamId}`,
      });

      actionButtons.push({
        label: "Sync with Linear",
        command: `/mo linear-sync team:${teamId}`,
      });
    }

    return {
      success: true,
      message: "Linear authentication status",
      markdown: formatAuthStatus(true, user, teams, auth?.defaultTeamId),
      actionButtons,
    };
  } catch (error) {
    console.error("Linear status command error:", error);

    return {
      success: false,
      message: "Failed to get Linear status",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Status Error

An error occurred while getting Linear status:

\`${error instanceof Error ? error.message : String(error)}\`

This could indicate that your authentication has expired.

Please try authenticating again:

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
};

/**
 * Linear logout command
 *
 * Removes stored Linear credentials
 */
export const linearLogoutCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    const isConfigured = await isLinearConfigured();

    if (!isConfigured) {
      return {
        success: true,
        message: "Linear is not configured",
        markdown: `
### Linear Logout

You're not authenticated with Linear, so there's nothing to log out from.
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Check for confirmation
    if (!params.confirm || params.confirm.toLowerCase() !== "true") {
      return {
        success: true,
        message: "Confirmation needed for Linear logout",
        markdown: `
### Linear Logout Confirmation

Are you sure you want to log out from Linear?
This will remove your API key and all stored credentials.

To confirm, use:

\`/mo linear-logout confirm:true\`
`,
        actionButtons: [
          {
            label: "Confirm Logout",
            command: "/mo linear-logout confirm:true",
          },
          {
            label: "Cancel",
            command: "/mo linear-status",
          },
        ],
      };
    }

    // Remove credentials
    await clearAuth();

    return {
      success: true,
      message: "Successfully logged out from Linear",
      markdown: `
### Linear Logout

✅ Successfully logged out from Linear.

Your API key and credentials have been removed.

To authenticate again, use:

\`/mo linear-auth key:your_linear_api_key\`
`,
      actionButtons: [
        {
          label: "Authenticate with Linear",
          command: "/mo linear-auth",
        },
      ],
    };
  } catch (error) {
    console.error("Linear logout command error:", error);

    return {
      success: false,
      message: "Failed to log out from Linear",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Logout Error

An error occurred while logging out from Linear:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-logout confirm:true",
        },
      ],
    };
  }
};
