import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  activate as activateFull,
  deactivate as deactivateFull,
} from "./extension";

// Configuration
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds

// Paths
const repoPath = process.cwd();
const settingsPath = path.join(os.homedir(), ".mo-settings.json");

// Settings storage
let settings = {
  linearApiKey: process.env.LINEAR_API_KEY || "",
  linearTeamId: process.env.LINEAR_TEAM_ID || "",
  defaultPriority: "2",
  defaultEstimate: "2",
  syncInterval: "5",
  autoSync: true,
};

// Load settings from disk if available
try {
  if (fs.existsSync(settingsPath)) {
    const settingsData = fs.readFileSync(settingsPath, "utf8");
    const loadedSettings = JSON.parse(settingsData);
    settings = Object.assign(Object.assign({}, settings), loadedSettings);
    console.log("Settings loaded from disk:", settings);
  }
} catch (error) {
  console.error("Failed to load settings from disk:", error);
}

// Types for Cursor extension API
interface CursorContext {
  subscriptions: Array<{ dispose: () => void }>;
  chat: {
    registerCommand: (
      command: string,
      handler: CommandHandler
    ) => { dispose: () => void };
    askAI: (prompt: string) => Promise<string>;
  };
}

interface CursorCommandContext {
  chat: {
    askAI: (prompt: string) => Promise<string>;
  };
}

type CommandHandler = (
  ctx: CursorCommandContext,
  input: string
) => Promise<string>;

// Main extension activation function that will proxy to the full implementation
export function activate(context: CursorContext) {
  console.log("Mo Plugin activated! Attempting to use full implementation...");

  try {
    // Forward to the full implementation
    return activateFull(context);
  } catch (error) {
    console.error("Error activating full implementation:", error);
    console.log("Falling back to simple implementation");

    // Register all commands with fallback handlers
    const commands = [
      { id: "mo-plugin.showTaskQueue", handler: handleShowTaskQueue },
      { id: "mo-plugin.planProject", handler: handlePlanProject },
      { id: "mo-plugin.showLinearSync", handler: handleShowLinearSync },
      { id: "mo-plugin.showSettings", handler: handleShowSettings },
      { id: "mo-plugin.pushTasks", handler: handlePushTasks },
      { id: "mo-plugin.showExportDialog", handler: handleShowExportDialog },
      { id: "mo-plugin.syncWithLinear", handler: handleSyncWithLinear },
    ];

    // Register all commands
    commands.forEach((cmd) => {
      const command = context.chat.registerCommand(cmd.id, cmd.handler);
      context.subscriptions.push(command);
    });

    // Return API object
    return {
      showTaskQueue: () =>
        console.log("Task Queue requested (simple implementation)"),
      showLinearSync: () =>
        console.log("Linear Sync requested (simple implementation)"),
      showSettings: () =>
        console.log("Settings requested (simple implementation)"),
      planProject: () =>
        console.log("Plan Project requested (simple implementation)"),
      pushTasks: () =>
        console.log("Push Tasks requested (simple implementation)"),
      showExportDialog: () =>
        console.log("Export Dialog requested (simple implementation)"),
      syncWithLinear: () =>
        console.log("Sync with Linear requested (simple implementation)"),
    };
  }
}

// Command handlers with improved error messages
async function handleShowTaskQueue(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Task Queue feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can manage your tasks directly in Linear.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handlePlanProject(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Project Planning feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can use Cursor AI directly for project planning.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handleShowLinearSync(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Linear Sync feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can access your issues directly on Linear's website.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handleShowSettings(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Settings feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.

Your current settings:
- Linear API Key: ${settings.linearApiKey ? "Set" : "Not set"}
- Linear Team ID: ${settings.linearTeamId ? "Set" : "Not set"}
- Default Priority: ${settings.defaultPriority}
- Default Estimate: ${settings.defaultEstimate}
- Sync Interval: ${settings.syncInterval} minutes
- Auto Sync: ${settings.autoSync ? "Enabled" : "Disabled"}

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handlePushTasks(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Push Tasks feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can create issues directly in Linear.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handleShowExportDialog(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Export Dialog feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can export data directly from Linear.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

async function handleSyncWithLinear(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return `
The Sync with Linear feature is currently under maintenance.

We are working on fixing TypeScript errors to restore full functionality.
In the meantime, you can access the latest data directly on Linear's website.

Current Status: Building a stable implementation
Next Steps: Fix remaining TypeScript errors and restore full functionality
  `;
}

// Extension deactivation function
export function deactivate() {
  console.log("Mo Plugin deactivated! Attempting to use full deactivation...");

  try {
    return deactivateFull();
  } catch (error) {
    console.error("Error deactivating full implementation:", error);
    console.log("Falling back to simple deactivation");
  }
}
