/**
 * Command System
 *
 * This file provides the command routing and handling infrastructure for the Mo MCP server.
 * It parses incoming commands and routes them to the appropriate handler.
 */

import {
  CommandContext,
  CommandResult,
  CommandRegistration,
} from "../types/command";

// Import command handlers
import {
  tasksCommand,
  newTaskCommand,
  updateTaskCommand,
  deleteTaskCommand,
  taskDetailsCommand,
} from "./tasks";
import { helpCommand, settingsCommand } from "./system";

// Command registry
const commands: Record<string, CommandRegistration> = {
  // Task commands
  tasks: tasksCommand,
  "new-task": newTaskCommand,
  "update-task": updateTaskCommand,
  "delete-task": deleteTaskCommand,
  "task-details": taskDetailsCommand,

  // System commands
  help: helpCommand,
  settings: settingsCommand,
};

/**
 * Process a command
 *
 * @param commandStr The raw command string (e.g., "/mo tasks filter:status:in-progress")
 * @param context The context from Cursor
 * @returns The command result
 */
export async function processCommand(
  commandStr: string,
  context: CommandContext
): Promise<CommandResult> {
  try {
    // Remove the /mo prefix
    const trimmedCommand = commandStr.trim().replace(/^\/mo\s+/, "");

    // Split into command name and parameter string
    const [commandName, ...paramParts] = trimmedCommand.split(/\s+/);

    // Find the command handler
    const command = commands[commandName];

    if (!command) {
      return {
        success: false,
        message: `Unknown command: ${commandName}`,
        markdown: `### Error: Unknown Command\n\nThe command \`${commandName}\` is not recognized.\n\nUse \`/mo help\` to see a list of available commands.`,
      };
    }

    // Parse parameters
    const params = parseParameters(paramParts.join(" "));

    // Run the command handler
    return await command.handler(params, context);
  } catch (error) {
    console.error("Error processing command:", error);

    return {
      success: false,
      message: "An error occurred while processing the command",
      error: error instanceof Error ? error.message : String(error),
      markdown:
        "### Error\n\nAn error occurred while processing the command. Please try again.",
    };
  }
}

/**
 * Parse command parameters
 *
 * Parses a string like 'title:"My Task" priority:high' into an object
 * like { title: 'My Task', priority: 'high' }
 *
 * @param paramStr Parameter string
 * @returns Parsed parameters as an object
 */
function parseParameters(paramStr: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!paramStr.trim()) {
    return params;
  }

  // Match parameters in format key:value or key:"value with spaces"
  const paramRegex = /(\w+):((?:"[^"]*")|(?:[^\s"]+))/g;
  let match;

  while ((match = paramRegex.exec(paramStr)) !== null) {
    const [, key, rawValue] = match;

    // Remove quotes if present
    const value =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue;

    params[key] = value;
  }

  return params;
}

/**
 * Get all registered commands
 *
 * @returns All registered commands
 */
export function getCommands(): Record<string, CommandRegistration> {
  return { ...commands };
}
