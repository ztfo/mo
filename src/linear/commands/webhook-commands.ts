/**
 * Linear Webhook Commands
 *
 * This file implements the command handlers for Linear webhook operations
 * to register, list, and delete webhooks.
 */

import { CommandHandler, CommandResult } from "../../types/command";
import { isLinearConfigured, getApiKey, getLinearAuth } from "../auth";
import { registerWebhook, deleteWebhook } from "../webhooks";
import { getConfig } from "../../data/store";
import { LinearWebhookConfig } from "../types";

/**
 * Linear webhook register command
 *
 * Registers a new webhook with Linear
 */
export const linearWebhookRegisterCommand: CommandHandler = async (
  params,
  context
) => {
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

    // Check required parameters
    if (!params.url) {
      return {
        success: false,
        message: "Missing webhook URL",
        markdown: `
### Missing Webhook URL

You need to provide a webhook URL:

\`/mo linear-webhook-register url:https://your-webhook-url.com/linear-webhook\`

The URL must be publicly accessible from the internet for Linear to send events to it.
`,
      };
    }

    // Get team ID either from params or default
    let teamId = params.team;

    if (!teamId) {
      // Use default team ID if available
      const auth = await getLinearAuth();
      teamId = auth?.defaultTeamId;

      if (!teamId) {
        return {
          success: false,
          message: "Missing team ID",
          markdown: `
### Missing Team ID

You need to provide a team ID:

\`/mo linear-webhook-register url:https://example.com/webhook team:TEAM_ID\`

You can list your teams with:

\`/mo linear-teams\`
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

    // Create webhook config
    const webhookConfig: LinearWebhookConfig = {
      url: params.url,
      teamId,
      label: params.label || "Mo MCP Webhook",
      resourceTypes: params.resources?.split(",") || [
        "Issue",
        "Comment",
        "IssueLabel",
      ],
      secret: params.secret,
    };

    // Register webhook
    const webhookId = await registerWebhook(webhookConfig);

    return {
      success: true,
      message: "Webhook registered successfully",
      markdown: `
### Linear Webhook Registered

Successfully registered a new webhook with Linear.

- **Webhook ID:** \`${webhookId}\`
- **URL:** ${webhookConfig.url}
- **Team ID:** ${webhookConfig.teamId}
- **Resources:** ${webhookConfig.resourceTypes.join(", ")}

Events from Linear will now be delivered to your webhook endpoint.
`,
      actionButtons: [
        {
          label: "List Webhooks",
          command: "/mo linear-webhook-list",
        },
      ],
    };
  } catch (error) {
    console.error("Linear webhook register command error:", error);

    return {
      success: false,
      message: "Failed to register Linear webhook",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Webhook Registration Error

An error occurred while registering the webhook:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-webhook-register",
        },
      ],
    };
  }
};

/**
 * Linear webhook list command
 *
 * Lists registered webhooks
 */
export const linearWebhookListCommand: CommandHandler = async (
  params,
  context
) => {
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

    // Get config to check if webhooks are registered
    const config = await getConfig();

    if (!config.linearWebhookId) {
      return {
        success: false,
        message: "No webhooks registered",
        markdown: `
### No Webhooks Registered

You don't have any webhooks registered with Linear.

To register a webhook:

\`/mo linear-webhook-register url:https://your-webhook-url.com/linear-webhook\`
`,
        actionButtons: [
          {
            label: "Register Webhook",
            command: "/mo linear-webhook-register",
          },
        ],
      };
    }

    return {
      success: true,
      message: "Webhook found",
      markdown: `
### Linear Webhook

You have a webhook registered with Linear.

- **Webhook ID:** \`${config.linearWebhookId}\`
- **URL:** ${config.linearWebhookUrl}

To delete this webhook:

\`/mo linear-webhook-delete\`
`,
      actionButtons: [
        {
          label: "Delete Webhook",
          command: "/mo linear-webhook-delete",
        },
      ],
    };
  } catch (error) {
    console.error("Linear webhook list command error:", error);

    return {
      success: false,
      message: "Failed to list Linear webhooks",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Webhook List Error

An error occurred while listing webhooks:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-webhook-list",
        },
      ],
    };
  }
};

/**
 * Linear webhook delete command
 *
 * Deletes a registered webhook
 */
export const linearWebhookDeleteCommand: CommandHandler = async (
  params,
  context
) => {
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

    // Get config to check if webhooks are registered
    const config = await getConfig();

    if (!config.linearWebhookId) {
      return {
        success: false,
        message: "No webhooks registered",
        markdown: `
### No Webhooks Registered

You don't have any webhooks registered with Linear.

To register a webhook:

\`/mo linear-webhook-register url:https://your-webhook-url.com/linear-webhook\`
`,
        actionButtons: [
          {
            label: "Register Webhook",
            command: "/mo linear-webhook-register",
          },
        ],
      };
    }

    // Delete webhook
    const webhookId = config.linearWebhookId;
    await deleteWebhook(webhookId);

    return {
      success: true,
      message: "Webhook deleted successfully",
      markdown: `
### Linear Webhook Deleted

Successfully deleted the webhook with ID \`${webhookId}\`.

To register a new webhook:

\`/mo linear-webhook-register url:https://your-webhook-url.com/linear-webhook\`
`,
      actionButtons: [
        {
          label: "Register Webhook",
          command: "/mo linear-webhook-register",
        },
      ],
    };
  } catch (error) {
    console.error("Linear webhook delete command error:", error);

    return {
      success: false,
      message: "Failed to delete Linear webhook",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Webhook Deletion Error

An error occurred while deleting the webhook:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Try Again",
          command: "/mo linear-webhook-delete",
        },
      ],
    };
  }
};
