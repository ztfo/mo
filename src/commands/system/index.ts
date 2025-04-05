/**
 * System Commands
 *
 * This file implements the system-related command handlers for the Mo MCP server.
 * It provides functionality for help and settings management.
 */

import {
  CommandContext,
  CommandHandler,
  CommandRegistration,
  CommandResult,
} from "../../types/command";
import { getCommands } from "../index";

/**
 * Help command handler
 *
 * Shows help information about commands.
 */
const helpCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Get all commands
    const commands = getCommands();

    // Check if help is requested for a specific command
    if (params.command) {
      const command = commands[params.command];

      if (!command) {
        return {
          success: false,
          message: `Unknown command: ${params.command}`,
          markdown: `### Error: Unknown Command\n\nThe command \`${params.command}\` is not recognized.\n\nUse \`/mo help\` to see a list of available commands.`,
        };
      }

      // Format detailed help for the specific command
      let markdown = `### Command: \`/mo ${command.name}\`\n\n`;
      markdown += `${command.description}\n\n`;

      if (command.parameters.length > 0) {
        markdown += "#### Parameters\n\n";

        command.parameters.forEach((param) => {
          markdown += `- \`${param.name}\`${
            param.required ? " (required)" : ""
          }: ${param.description}\n`;
        });

        markdown += "\n";
      }

      // Example usage
      markdown += "#### Example\n\n";
      markdown += "```\n";
      markdown += `/mo ${command.name}`;

      const requiredParams = command.parameters.filter((p) => p.required);
      requiredParams.forEach((param) => {
        markdown += ` ${param.name}:"example"`;
      });

      markdown += "\n```\n";

      return {
        success: true,
        message: `Help for command: ${command.name}`,
        markdown,
      };
    }

    // Show help for all commands
    let markdown = "# Mo Commands\n\n";
    markdown +=
      "Mo is a task management tool for Cursor. Here are the available commands:\n\n";

    // Group commands by category
    const taskCommands = Object.values(commands).filter((cmd) =>
      [
        "tasks",
        "new-task",
        "update-task",
        "delete-task",
        "task-details",
      ].includes(cmd.name)
    );

    const linearCommands = Object.values(commands).filter((cmd) =>
      cmd.name.startsWith("linear-")
    );

    const systemCommands = Object.values(commands).filter((cmd) =>
      ["help", "settings"].includes(cmd.name)
    );

    // Format task commands
    markdown += "## Task Management\n\n";
    taskCommands.forEach((cmd) => {
      markdown += `- \`/mo ${cmd.name}\`: ${cmd.description}\n`;
    });

    // Format Linear commands
    if (linearCommands.length > 0) {
      markdown += "\n## Linear Integration\n\n";

      // Group Linear commands by functionality
      const linearAuthCommands = linearCommands.filter((cmd) =>
        ["linear-auth", "linear-status", "linear-logout"].includes(cmd.name)
      );

      const linearSyncCommands = linearCommands.filter((cmd) =>
        ["linear-sync", "linear-push", "linear-pull"].includes(cmd.name)
      );

      const linearQueryCommands = linearCommands.filter((cmd) =>
        [
          "linear-teams",
          "linear-projects",
          "linear-states",
          "linear-issues",
        ].includes(cmd.name)
      );

      if (linearAuthCommands.length > 0) {
        markdown += "### Authentication\n\n";
        linearAuthCommands.forEach((cmd) => {
          markdown += `- \`/mo ${cmd.name}\`: ${cmd.description}\n`;
        });
        markdown += "\n";
      }

      if (linearSyncCommands.length > 0) {
        markdown += "### Synchronization\n\n";
        linearSyncCommands.forEach((cmd) => {
          markdown += `- \`/mo ${cmd.name}\`: ${cmd.description}\n`;
        });
        markdown += "\n";
      }

      if (linearQueryCommands.length > 0) {
        markdown += "### Queries\n\n";
        linearQueryCommands.forEach((cmd) => {
          markdown += `- \`/mo ${cmd.name}\`: ${cmd.description}\n`;
        });
      }
    }

    markdown += "\n## System\n\n";
    systemCommands.forEach((cmd) => {
      markdown += `- \`/mo ${cmd.name}\`: ${cmd.description}\n`;
    });

    markdown += "\n---\n\n";
    markdown +=
      "For more details about a specific command, use `/mo help command:command-name`.\n";

    return {
      success: true,
      message: "Mo help information",
      markdown,
    };
  } catch (error) {
    console.error("Error showing help:", error);
    return {
      success: false,
      message: "Failed to show help information",
      error: error instanceof Error ? error.message : String(error),
      markdown:
        "### Error\n\nFailed to show help information. Please try again.",
    };
  }
};

/**
 * Settings command handler
 *
 * Manages Mo settings.
 */
const settingsCommandHandler: CommandHandler = async (params, context) => {
  try {
    // For now, just show placeholder settings
    // In a full implementation, this would interact with the settings store

    const markdown =
      `### Mo Settings\n\n` +
      `⚙️ These settings will be implemented in Phase 2.\n\n` +
      `#### Current Settings\n\n` +
      `- Default priority: \`medium\`\n` +
      `- Linear API integration: \`not configured\`\n\n` +
      `#### Usage\n\n` +
      `- To view settings: \`/mo settings\`\n` +
      `- To set a value: \`/mo settings set:key=value\`\n` +
      `- To get a specific value: \`/mo settings get:key\`\n`;

    return {
      success: true,
      message: "Mo settings",
      markdown,
    };
  } catch (error) {
    console.error("Error managing settings:", error);
    return {
      success: false,
      message: "Failed to manage settings",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to manage settings. Please try again.",
    };
  }
};

// Command registrations
export const helpCommand: CommandRegistration = {
  name: "help",
  handler: helpCommandHandler,
  description: "Show help information about Mo commands",
  parameters: [
    {
      name: "command",
      required: false,
      description: "Specific command to get help about",
    },
  ],
};

export const settingsCommand: CommandRegistration = {
  name: "settings",
  handler: settingsCommandHandler,
  description: "View or update Mo settings",
  parameters: [
    {
      name: "set",
      required: false,
      description: "Key-value pair to set (format: key=value)",
    },
    {
      name: "get",
      required: false,
      description: "Setting key to retrieve",
    },
  ],
};
