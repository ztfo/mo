/**
 * Mo MCP Server
 *
 * This file contains the core MCP server implementation for the Mo task management tool.
 * It handles incoming commands from Cursor and routes them to the appropriate handlers.
 */

import { processCommand } from "./commands";
import { CommandContext, CommandResult, MCPRequest } from "./types/command";
import { startWebhookServer, stopWebhookServer } from "./linear/webhooks";

// The MCP server state
let isServerRunning = false;

// Minimum supported MCP protocol version
const MIN_SUPPORTED_VERSION = "1.0";

/**
 * Check if the provided protocol version is supported
 *
 * @param version The protocol version to check
 * @returns Whether the version is supported
 */
function isSupportedVersion(version: string): boolean {
  if (!version) return true; // Assume compatible if no version provided

  try {
    const [major, minor] = version.split(".").map(Number);
    const [minMajor, minMinor] = MIN_SUPPORTED_VERSION.split(".").map(Number);

    return major > minMajor || (major === minMajor && minor >= minMinor);
  } catch (error) {
    console.warn(`Invalid version format: ${version}`);
    return false;
  }
}

/**
 * Start the MCP server
 *
 * This function initializes the MCP server and sets up the necessary event listeners
 * to handle incoming commands from Cursor.
 */
export async function startServer(
  enableWebhooks: boolean = false
): Promise<void> {
  if (isServerRunning) {
    console.log("MCP server is already running");
    return;
  }

  try {
    // Set up listeners for incoming MCP requests
    process.stdin.on("data", handleMcpRequest);

    // Start Linear webhook server if enabled
    if (enableWebhooks) {
      try {
        await startWebhookServer();
        console.log("Linear webhook server started");
      } catch (error) {
        console.error("Failed to start webhook server:", error);
        // Continue even if webhook server fails to start
      }
    } else {
      console.log(
        "Linear webhook server disabled (not recommended for MCP environments)"
      );
    }

    // Mark the server as running
    isServerRunning = true;

    console.log("MCP server started successfully");
    console.log(`Supporting MCP protocol version ${MIN_SUPPORTED_VERSION}+`);
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
    const request = JSON.parse(requestStr) as MCPRequest;

    // Extract the command, context and protocol version
    const { command, context, version } = request;

    // Check if the protocol version is supported
    if (version && !isSupportedVersion(version)) {
      sendMcpResponse({
        success: false,
        message: `Unsupported MCP protocol version: ${version}`,
        error: `This MCP server requires protocol version ${MIN_SUPPORTED_VERSION} or higher`,
        markdown: `### Error: Incompatible Protocol Version\n\nThis MCP server requires protocol version ${MIN_SUPPORTED_VERSION} or higher, but received ${version}.`,
      });
      return;
    }

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
      markdown:
        "### Error\n\nAn error occurred while processing the command. Please try again.",
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

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers(): void {
  // Handle process signals for cleanup
  process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down...");
    try {
      // Stop webhook server if running
      await stopWebhookServer();
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down...");
    try {
      // Stop webhook server if running
      await stopWebhookServer();
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
    process.exit(0);
  });
}

// Set up cleanup handlers
setupCleanupHandlers();
