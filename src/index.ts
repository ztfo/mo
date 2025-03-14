/**
 * Mo MCP Server - Main Entry Point
 *
 * This file serves as the entry point for the Mo MCP server,
 * which provides task management functionality for Cursor IDE.
 */

import { startServer } from "./server";
import { initializeDataStore } from "./data/store";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize data store
initializeDataStore()
  .then(() => {
    console.log("Data store initialized successfully");

    // Start the MCP server
    startServer()
      .then(() => {
        console.log("Mo MCP server started successfully");
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

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down Mo MCP server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down Mo MCP server...");
  process.exit(0);
});
