/**
 * Linear Authentication Commands
 *
 * This file implements the command handlers for Linear authentication.
 */

import { CommandHandler, CommandResult } from "../../types/command";
import {
  storeApiKey,
  validateApiKey,
  getCurrentUser,
  clearLinearAuth,
  getLinearAuth,
  isLinearConfigured,
} from "../auth";
import { LinearClient } from "../api";

/**
 * Format Linear authentication status as markdown
 */
function formatAuthStatus(
  isConfigured: boolean,
  userData?: any,
  teamData?: any[]
): string {
  if (!isConfigured) {
    return `
### Linear Authentication Status

❌ **Not Authenticated**

To authenticate with Linear, use:
\`\`\`
/mo linear-auth key:your_linear_api_key
\`\`\`

You can get your API key from [Linear Settings > API > Personal API Keys](https://linear.app/settings/api).
`;
  }

  let markdown = `
### Linear Authentication Status

✅ **Authenticated**

`;

  if (userData) {
    markdown += `**User**: ${userData.name} (${userData.email})  \n`;
  }

  if (teamData && teamData.length > 0) {
    markdown += `\n**Available Teams**:  \n`;
    teamData.forEach((team) => {
      markdown += `- ${team.name} (\`${team.id}\`)  \n`;
    });

    markdown += `\nTo set a default team: \`/mo linear-auth team:TEAM_ID\`  \n`;
  }

  markdown += `\nTo log out: \`/mo linear-logout confirm:true\``;

  return markdown;
}

/**
 * Linear authentication command
 *
 * Handles authentication with Linear API
 */
export const linearAuthCommand: CommandHandler = async (params, context) => {
  try {
    // Check for API key parameter
    if (params.key) {
      const apiKey = params.key;

      try {
        // Validate the API key with Linear
        const user = await validateApiKey(apiKey);

        // Get teams to display to the user
        const client = new LinearClient(apiKey);
        const teams = await client.getTeams();

        // Store the API key
        await storeApiKey(apiKey, params.team);

        // Format a success message
        const markdown = `
### Linear Authentication Successful

✅ **Authenticated as ${user.name}**

You now have access to Linear integration features in Mo.

${
  teams.length > 0
    ? `**Available Teams**: ${teams.length}
${teams.map((team) => `- ${team.name} (\`${team.id}\`)`).join("\n")}

${
  !params.team
    ? "To set a default team, use `/mo linear-auth team:TEAM_ID`"
    : `Default team set to: ${
        teams.find((t) => t.id === params.team)?.name || params.team
      }`
}
`
    : ""
}

To check your authentication status: \`/mo linear-status\`
`;

        return {
          success: true,
          message: "Linear authentication successful",
          markdown,
        };
      } catch (error) {
        // Handle authentication error
        return {
          success: false,
          message: "Linear authentication failed",
          markdown: `
### Linear Authentication Failed

❌ **Error: ${error instanceof Error ? error.message : String(error)}**

Please check your API key and try again.

You can get your API key from [Linear Settings > API > Personal API Keys](https://linear.app/settings/api).
`,
        };
      }
    }

    // Set team ID without changing API key
    else if (params.team) {
      if (!(await isLinearConfigured())) {
        return {
          success: false,
          message: "Not authenticated with Linear",
          markdown: `
### Linear Not Authenticated

You need to authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        };
      }

      // Get existing API key
      const user = await getCurrentUser();
      if (!user) {
        return {
          success: false,
          message: "Failed to get Linear user",
          markdown: `
### Linear Authentication Error

Unable to verify your Linear authentication. Please try authenticating again:

\`/mo linear-auth key:your_linear_api_key\`
`,
        };
      }

      // Store with updated team
      const auth = await getLinearAuth();
      if (!auth || !auth.apiKey) {
        return {
          success: false,
          message: "Linear API key not found",
          markdown: `
### Linear Authentication Error

API key not found. Please try authenticating again:

\`/mo linear-auth key:your_linear_api_key\`
`,
        };
      }

      // Decrypt and store with new team
      await storeApiKey(
        (await getCurrentUser()) ? auth.apiKey : "",
        params.team
      );

      // Get team details for display
      const client = new LinearClient(auth.apiKey);
      const team = await client.getTeam(params.team);

      return {
        success: true,
        message: "Default Linear team updated",
        markdown: `
### Default Linear Team Updated

✅ **Default team set to: ${team?.name || params.team}**

This team will be used for operations where a team ID is not specified.
`,
      };
    }

    // No parameters - show authentication status
    else {
      return await linearStatusCommand(params, context);
    }
  } catch (error) {
    console.error("Linear auth command error:", error);

    return {
      success: false,
      message: "Linear authentication command failed",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Authentication Error

An error occurred during Linear authentication:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
    };
  }
};

/**
 * Linear authentication status command
 *
 * Shows the current Linear authentication status
 */
export const linearStatusCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    const isConfigured = await isLinearConfigured();

    // Get user and team data if configured
    let userData = null;
    let teamsData = null;

    if (isConfigured) {
      try {
        userData = await getCurrentUser();

        if (userData) {
          const auth = await getLinearAuth();
          const apiKey = auth?.apiKey || "";
          const client = new LinearClient(apiKey);
          teamsData = await client.getTeams();
        }
      } catch (error) {
        console.error("Error getting Linear status details:", error);
      }
    }

    // Format status message
    const markdown = formatAuthStatus(isConfigured, userData, teamsData);

    return {
      success: true,
      message: isConfigured
        ? "Linear is authenticated"
        : "Linear is not authenticated",
      markdown,
    };
  } catch (error) {
    console.error("Linear status command error:", error);

    return {
      success: false,
      message: "Failed to get Linear status",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Status Error

An error occurred while checking Linear status:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
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
    // Check for confirmation
    if (params.confirm !== "true") {
      return {
        success: false,
        message: "Confirmation required for logout",
        markdown: `
### Linear Logout - Confirmation Required

Are you sure you want to remove your Linear credentials?
This will disconnect Mo from Linear.

To confirm, use:
\`/mo linear-logout confirm:true\`
`,
      };
    }

    // Check if Linear is configured
    const isConfigured = await isLinearConfigured();

    if (!isConfigured) {
      return {
        success: true,
        message: "Linear is not authenticated",
        markdown: `
### Linear Not Authenticated

You are not currently authenticated with Linear.
`,
      };
    }

    // Clear credentials
    await clearLinearAuth();

    return {
      success: true,
      message: "Linear credentials removed",
      markdown: `
### Linear Logout Successful

✅ Your Linear credentials have been removed.

Mo is no longer connected to Linear.

To authenticate again, use:
\`/mo linear-auth key:your_linear_api_key\`
`,
    };
  } catch (error) {
    console.error("Linear logout command error:", error);

    return {
      success: false,
      message: "Failed to logout from Linear",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Logout Error

An error occurred during Linear logout:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
    };
  }
};
