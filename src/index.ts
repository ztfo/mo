#!/usr/bin/env node

/**
 * Mo MCP Server - Main Entry Point
 *
 * This file serves as the entry point for the Mo MCP server,
 * which provides task management functionality for Cursor IDE.
 */

import { startServer } from "./server";
import { initializeDataStore } from "./data/store";
import dotenv from "dotenv";
import { processCommand } from "./commands";
import { CommandResult } from "./types/command";

// Load environment variables
dotenv.config();

// Check if being run in chat tool mode with a specific command
// (npx mo-linear-mcp command params)
const isDirectToolInvocation = process.argv.length > 2;

// Process direct tool invocation if applicable
if (isDirectToolInvocation) {
  handleDirectToolInvocation();
} else {
  // Standard MCP server mode
  startMcpServer();
}

/**
 * Start the MCP server in standard mode
 */
function startMcpServer() {
  // Check for webhook flag (defaults to disabled)
  const enableWebhooks = process.env.ENABLE_WEBHOOKS === "true";

  console.log("Starting Mo Linear MCP server...");

  // Initialize data store
  initializeDataStore()
    .then(() => {
      console.log("Data store initialized successfully");

      // Start the MCP server (webhooks disabled by default for MCP context)
      startServer(enableWebhooks)
        .then(() => {
          console.log("Mo MCP server started successfully");

          // Keep the process alive - this is critical for NPX execution
          console.log("Server is now ready to receive commands");

          // Don't exit - this keeps the server running
        })
        .catch((error) => {
          console.error("Failed to start MCP server:", error);
          process.exit(1);
        });
    })
    .catch((error) => {
      console.error("Failed to initialize data store:", error);
      process.exit(1);
    });
}

/**
 * Handle direct invocation as a chat tool
 */
async function handleDirectToolInvocation() {
  try {
    // Initialize data store
    await initializeDataStore();

    // Get the function name and parameters from command line arguments
    const functionName = process.argv[2];
    const params = process.argv.length > 3 ? JSON.parse(process.argv[3]) : {};

    // Convert function name to command format (e.g., linear_auth -> linear-auth)
    const commandName = functionName.replace(/_/g, "-");

    // Create command string in the format the processor expects
    const command = `/mo ${commandName}`;

    console.log(`Processing command: ${command}`);

    // Process the command
    const result = await processCommand(command, {
      ...params,
      environment: {
        cursor: true,
        chat: true,
      },
    });

    // Format response for chat tool output
    formatChatToolResponse(result);

    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error("Error in chat tool mode:", error);
    console.log(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      })
    );
    process.exit(1);
  }
}

/**
 * Format MCP response for chat tool output
 */
function formatChatToolResponse(result: CommandResult) {
  // For chat tools, we'll output a simplified response format
  // that focuses on the markdown content
  const response = {
    success: result.success,
    content: result.markdown || result.message,
    data: result.data || null,
    error: result.error || null,
  };

  // Output as JSON on stdout for Claude to consume
  console.log(JSON.stringify(response));
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down Mo MCP server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down Mo MCP server...");
  process.exit(0);
});
