/**
 * Command Types
 *
 * This file contains the TypeScript type definitions for the command system
 * used in the Mo MCP server.
 */

/**
 * Command context from Cursor
 *
 * This represents the context provided by Cursor when a command is invoked,
 * including information about the current file, selection, and workspace.
 */
export interface CommandContext {
  /** The currently active file path */
  currentFilePath?: string;

  /** The currently selected text in the editor */
  selectedText?: string;

  /** The currently active workspace path */
  workspacePath?: string;

  /** The cursor position within the current file */
  cursorPosition?: {
    line: number;
    character: number;
  };

  /** Current Cursor version */
  cursorVersion?: string;

  /** Any additional contextual information from Cursor */
  additionalContext?: Record<string, any>;
}

/**
 * Command result sent back to Cursor
 *
 * This represents the result of processing a command, which will be
 * sent back to Cursor for display or further processing.
 */
export interface CommandResult {
  /** Whether the command was successful */
  success: boolean;

  /** A human-readable message describing the result */
  message: string;

  /** The formatted markdown content to display in Cursor */
  markdown?: string;

  /** Any structured data to return */
  data?: Record<string, any>;

  /** Error details if success is false */
  error?: string;
}

/**
 * Command handler function type
 *
 * This represents a function that handles a specific command.
 */
export type CommandHandler = (
  params: Record<string, string>,
  context: CommandContext
) => Promise<CommandResult>;

/**
 * Command registration
 *
 * This represents a registered command in the system.
 */
export interface CommandRegistration {
  /** The command name (without the /mo prefix) */
  name: string;

  /** The function that handles this command */
  handler: CommandHandler;

  /** A brief description of the command */
  description: string;

  /** The expected parameters for this command */
  parameters: {
    /** Parameter name */
    name: string;

    /** Whether this parameter is required */
    required: boolean;

    /** Brief description of the parameter */
    description: string;
  }[];
}
