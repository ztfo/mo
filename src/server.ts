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
 * Debug log to file for troubleshooting
 */
function debugLog(message: string): void {
  try {
    const fs = require("fs");
    const logFile = "/tmp/mo-mcp-debug.log";
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch (err) {
    console.error("Failed to write debug log:", err);
  }
}

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
    debugLog("MCP server is already running");
    return;
  }

  try {
    console.log("Setting up stdin stream...");
    debugLog("Setting up stdin stream...");

    // Debug info about the process
    debugLog(`Process ID: ${process.pid}`);
    debugLog(`Node version: ${process.version}`);
    debugLog(`Platform: ${process.platform}`);

    // Set encoding to utf8
    process.stdin.setEncoding("utf8");

    // Check if stdin is TTY
    debugLog(`stdin is TTY: ${process.stdin.isTTY}`);
    debugLog(`stdin readable: ${process.stdin.readable}`);

    // Set up listeners for incoming MCP requests
    process.stdin.on("data", (data) => {
      debugLog(`Received data on stdin: ${data.toString().trim()}`);
      handleMcpRequest(data);
    });

    process.stdin.on("end", () => {
      debugLog("stdin stream ended");
      console.log("stdin stream ended");
    });

    process.stdin.on("error", (err) => {
      debugLog(`stdin stream error: ${err}`);
      console.error("stdin stream error:", err);
    });

    process.stdin.on("close", () => {
      debugLog("stdin stream closed");
      console.log("stdin stream closed");
    });

    // Make sure stdin stays open
    process.stdin.resume();
    debugLog("stdin stream resumed");

    // Also set up stdout error handling
    process.stdout.on("error", (err) => {
      debugLog(`stdout stream error: ${err}`);
      console.error("stdout stream error:", err);
    });

    // Send server ready message to Cursor
    console.log("Sending initial handshake to Cursor...");
    debugLog("Sending initial handshake to Cursor");
    sendMcpResponse({
      success: true,
      message: "Mo Linear MCP ready",
      data: {
        tools: getToolsManifest(),
      },
    });

    console.log("Waiting for incoming requests...");
    debugLog("Waiting for incoming requests");

    // Start Linear webhook server if enabled
    if (enableWebhooks) {
      try {
        await startWebhookServer();
        console.log("Linear webhook server started");
        debugLog("Linear webhook server started");
      } catch (error) {
        console.error("Failed to start webhook server:", error);
        debugLog(`Failed to start webhook server: ${error}`);
        // Continue even if webhook server fails to start
      }
    } else {
      console.log(
        "Linear webhook server disabled (not recommended for MCP environments)"
      );
      debugLog("Linear webhook server disabled");
    }

    // Mark the server as running
    isServerRunning = true;

    console.log("MCP server started successfully");
    console.log(`Supporting MCP protocol version ${MIN_SUPPORTED_VERSION}+`);
    debugLog("MCP server started successfully");

    // Send an explicit ping every 5 seconds to keep the connection alive
    let pingCount = 0;
    setInterval(() => {
      pingCount++;
      debugLog(`Sending heartbeat ping #${pingCount}`);
      sendMcpResponse({
        success: true,
        message: "ping",
        data: {
          tools: getToolsManifest(),
        },
      });
    }, 5000);
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    debugLog(`Failed to start MCP server: ${error}`);
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

    // Log the incoming request for debugging
    console.log(`Received request: ${requestStr}`);
    debugLog(`Received request: ${requestStr}`);

    // Ignore empty requests
    if (!requestStr) {
      console.log("Empty request received, ignoring");
      debugLog("Empty request received, ignoring");
      return;
    }

    // Special handling for ping/handshake requests
    if (requestStr === "ping" || requestStr.includes('"ping"')) {
      console.log("Ping received, responding with pong");
      debugLog("Ping received, responding with pong");
      sendMcpResponse({
        success: true,
        message: "pong",
        data: {
          tools: getToolsManifest(),
        },
      });
      return;
    }

    // Parse the request as JSON
    let request: MCPRequest;
    try {
      request = JSON.parse(requestStr) as MCPRequest;
      debugLog(`Parsed request: ${JSON.stringify(request)}`);
    } catch (error) {
      console.error("Failed to parse request JSON:", error);
      debugLog(`Failed to parse request JSON: ${error}`);
      sendMcpResponse({
        success: false,
        message: "Invalid JSON request",
        error: "Failed to parse request as JSON",
      });
      return;
    }

    // Extract the command, context and protocol version
    const { command, context, version } = request;
    debugLog(`Command: ${command}, Version: ${version || "none"}`);

    // Check if the protocol version is supported
    if (version && !isSupportedVersion(version)) {
      debugLog(`Unsupported version: ${version}`);
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
      console.log(`Ignoring non-Mo command: ${command}`);
      debugLog(`Ignoring non-Mo command: ${command}`);
      return;
    }

    // Process the command
    console.log(`Processing command: ${command}`);
    debugLog(`Processing command: ${command}`);
    const result = await processCommand(command, context);

    // Send the response back to Cursor
    debugLog(`Sending response: ${JSON.stringify(result)}`);
    sendMcpResponse(result);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    debugLog(`Error handling MCP request: ${error}`);

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
    // Don't include full tools manifest in heartbeat pings
    if (result.message === "ping") {
      // Simple ping response without the large tools data
      const pingResponse = {
        success: true,
        message: "pong",
      };
      debugLog(`Sending ping response: ${JSON.stringify(pingResponse)}`);
      process.stdout.write(JSON.stringify(pingResponse) + "\n");
      return;
    }

    // Convert the result to a JSON string
    const responseStr = JSON.stringify(result);

    debugLog(`Sending response: ${responseStr}`);

    // Write the response to stdout for Cursor to receive
    process.stdout.write(responseStr + "\n");

    // No extra newline needed - it can cause parsing issues
  } catch (error) {
    console.error("Error sending MCP response:", error);
    debugLog(`Error sending MCP response: ${error}`);
  }
}

/**
 * Get the tools manifest for this MCP
 */
function getToolsManifest() {
  const manifest = {
    linear_auth: {
      description: "Authenticate with Linear using your API key",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Your Linear API key",
          },
          team: {
            type: "string",
            description: "Linear team ID to set as default",
          },
        },
        required: ["key"],
      },
    },
    linear_status: {
      description: "Check Linear authentication status",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    linear_logout: {
      description: "Log out from Linear API",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    linear_teams: {
      description: "List all teams in your Linear workspace",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    linear_projects: {
      description: "List Linear projects",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "Linear team ID",
          },
        },
      },
    },
    linear_states: {
      description: "List Linear workflow states",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "Linear team ID",
          },
        },
      },
    },
    linear_issues: {
      description: "List Linear issues",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "Linear team ID",
          },
          assignee: {
            type: "string",
            description: 'Filter by assignee (user ID or "me")',
          },
          states: {
            type: "string",
            description: "Comma-separated list of states to filter by",
          },
          limit: {
            type: "string",
            description: "Maximum number of issues to return (default: 10)",
          },
        },
      },
    },
    linear_sync: {
      description: "Synchronize tasks between Linear and local tasks",
      parameters: {
        type: "object",
        properties: {
          direction: {
            type: "string",
            description: "Sync direction (push, pull, or both)",
          },
          team: {
            type: "string",
            description: "Linear team ID",
          },
        },
      },
    },
    linear_push: {
      description: "Push tasks from Mo to Linear",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Specific task ID to push",
          },
          filter: {
            type: "string",
            description: "Filter query for tasks to push",
          },
        },
      },
    },
    linear_pull: {
      description: "Pull issues from Linear to Mo",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Specific Linear issue ID to pull",
          },
          team: {
            type: "string",
            description: "Linear team ID to pull from",
          },
          states: {
            type: "string",
            description: "Comma-separated list of Linear states to filter by",
          },
          limit: {
            type: "string",
            description: "Maximum number of issues to pull",
          },
        },
      },
    },
    linear_webhook_register: {
      description: "Register a webhook with Linear",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "Webhook URL",
          },
          team: {
            type: "string",
            description: "Linear team ID",
          },
          resources: {
            type: "string",
            description:
              "Comma-separated list of resource types (Issue,Comment,IssueLabel)",
          },
          label: {
            type: "string",
            description: "Label for the webhook",
          },
        },
        required: ["url"],
      },
    },
    linear_webhook_list: {
      description: "List registered webhooks",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    linear_webhook_delete: {
      description: "Delete a registered webhook",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Webhook ID to delete",
          },
        },
        required: ["id"],
      },
    },
  };

  return manifest;
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers(): void {
  // Handle process signals for cleanup
  process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down...");
    debugLog("Received SIGINT, shutting down");
    try {
      // Stop webhook server if running
      await stopWebhookServer();
    } catch (error) {
      console.error("Error during shutdown:", error);
      debugLog(`Error during shutdown: ${error}`);
    }
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down...");
    debugLog("Received SIGTERM, shutting down");
    try {
      // Stop webhook server if running
      await stopWebhookServer();
    } catch (error) {
      console.error("Error during shutdown:", error);
      debugLog(`Error during shutdown: ${error}`);
    }
    process.exit(0);
  });
}

// Set up cleanup handlers
setupCleanupHandlers();
