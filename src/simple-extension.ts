import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Configuration
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

// Main extension activation function
export function activate(context) {
  console.log("Mo Plugin activated!");

  // Register commands with proper VS Code/Cursor command system
  const commands = [
    {
      id: "mo-plugin.showTaskQueue",
      handler: () => showTaskQueue(),
      desc: "Show Task Queue",
    },
    {
      id: "mo-plugin.planProject",
      handler: () => planProject(),
      desc: "Plan Project",
    },
    {
      id: "mo-plugin.showLinearSync",
      handler: () => showLinearSync(),
      desc: "Show Linear Sync",
    },
    {
      id: "mo-plugin.showSettings",
      handler: () => showSettings(),
      desc: "Show Settings",
    },
    {
      id: "mo-plugin.pushTasks",
      handler: () => pushTasks(),
      desc: "Push Tasks to Linear",
    },
    {
      id: "mo-plugin.showExportDialog",
      handler: () => showExportDialog(),
      desc: "Show Export Dialog",
    },
    {
      id: "mo-plugin.syncWithLinear",
      handler: () => syncWithLinear(),
      desc: "Sync with Linear",
    },
    {
      id: "mo-plugin.viewTaskDetails",
      handler: (task) => viewTaskDetails(task),
      desc: "View Task Details",
    },
  ];

  // Register all commands
  for (const cmd of commands) {
    // Try to use VSCode-style registration if available
    if (context.commands && context.commands.registerCommand) {
      const command = context.commands.registerCommand(cmd.id, cmd.handler);
      context.subscriptions.push(command);
      console.log(`Registered VSCode command: ${cmd.id}`);
    }
    // Fallback to Cursor chat-style registration
    else if (context.chat && context.chat.registerCommand) {
      const command = context.chat.registerCommand(
        cmd.id,
        async (ctx, input) => {
          return `The ${cmd.desc} feature is currently being loaded. Please try again in a moment.`;
        }
      );
      context.subscriptions.push(command);
      console.log(`Registered Cursor chat command: ${cmd.id}`);
    } else {
      console.warn(
        `Unable to register command: ${cmd.id} - No registration method available`
      );
    }
  }

  // Return API object
  return {
    showTaskQueue,
    showLinearSync,
    showSettings,
    planProject,
    pushTasks,
    showExportDialog,
    syncWithLinear,
    viewTaskDetails,
  };
}

// Command implementation functions
function showTaskQueue() {
  console.log("Task Queue requested");
  return "The Task Queue feature is currently being implemented.";
}

function planProject() {
  console.log("Plan Project requested");
  return "The Project Planning feature is currently being implemented.";
}

function showLinearSync() {
  console.log("Linear Sync requested");
  return "The Linear Sync feature is currently being implemented.";
}

function showSettings() {
  console.log("Settings requested");
  return `Current settings:
- Linear API Key: ${settings.linearApiKey ? "Set" : "Not set"}
- Linear Team ID: ${settings.linearTeamId ? "Set" : "Not set"}
- Default Priority: ${settings.defaultPriority}
- Default Estimate: ${settings.defaultEstimate}
- Sync Interval: ${settings.syncInterval} minutes
- Auto Sync: ${settings.autoSync ? "Enabled" : "Disabled"}`;
}

function pushTasks() {
  console.log("Push Tasks requested");
  return "The Push Tasks feature is currently being implemented.";
}

function showExportDialog() {
  console.log("Export Dialog requested");
  return "The Export Dialog feature is currently being implemented.";
}

function syncWithLinear() {
  console.log("Sync with Linear requested");
  return "The Sync with Linear feature is currently being implemented.";
}

function viewTaskDetails(task) {
  console.log("View Task Details requested", task);
  return "The View Task Details feature is currently being implemented.";
}

// Extension deactivation function
export function deactivate() {
  console.log("Mo Plugin deactivated!");
}
