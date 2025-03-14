/**
 * Mo MCP Server
 *
 * This file contains the core MCP server implementation for the Mo task management tool.
 * It handles incoming commands from Cursor and routes them to the appropriate handlers.
 */

import { processCommand } from "./commands";
import { CommandContext, CommandResult } from "./types/command";

// The MCP server state
let isServerRunning = false;

/**
 * Start the MCP server
 *
 * This function initializes the MCP server and sets up the necessary event listeners
 * to handle incoming commands from Cursor.
 */
export async function startServer(): Promise<void> {
  if (isServerRunning) {
    console.log("MCP server is already running");
    return;
  }

  try {
    // Set up listeners for incoming MCP requests
    process.stdin.on("data", handleMcpRequest);

    // Mark the server as running
    isServerRunning = true;

    console.log("MCP server started successfully");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    throw error;
  }
}

/**
 * Handle an incoming MCP request
 *
 * This function processes incoming MCP requests from Cursor,
 * parses the commands, and routes them to the appropriate handlers.
 *
 * @param data The raw data received from Cursor
 */
async function handleMcpRequest(data: Buffer): Promise<void> {
  try {
    // Convert the buffer to a string
    const requestStr = data.toString().trim();

    // Parse the request as JSON
    const request = JSON.parse(requestStr);

    // Extract the command and context
    const { command, context } = request;

    if (!command || !command.startsWith("/mo")) {
      // Not a Mo command, ignore it
      return;
    }

    // Process the command
    const result = await processCommand(command, context);

    // Send the response back to Cursor
    sendMcpResponse(result);
  } catch (error) {
    console.error("Error handling MCP request:", error);

    // Send an error response
    sendMcpResponse({
      success: false,
      message: "An error occurred while processing the command",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Send an MCP response back to Cursor
 *
 * @param result The command result to send back
 */
function sendMcpResponse(result: CommandResult): void {
  try {
    // Convert the result to a JSON string
    const responseStr = JSON.stringify(result);

    // Write the response to stdout for Cursor to receive
    process.stdout.write(responseStr + "\n");
  } catch (error) {
    console.error("Error sending MCP response:", error);
  }
}
