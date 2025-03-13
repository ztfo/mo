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
  console.log(
    "Mo Plugin simple wrapper activated! Forwarding to full implementation..."
  );

  try {
    // Forward to the full implementation
    return activateFull(context);
  } catch (error) {
    console.error("Error activating full implementation:", error);

    // Fallback to minimal implementation
    const showTaskQueueCommand = context.chat.registerCommand(
      "mo-plugin.showTaskQueue",
      handleShowTaskQueue
    );
    const showPlanProjectCommand = context.chat.registerCommand(
      "mo-plugin.planProject",
      handlePlanProject
    );

    context.subscriptions.push(showTaskQueueCommand);
    context.subscriptions.push(showPlanProjectCommand);
  }
}

// Command handlers as fallbacks
async function handleShowTaskQueue(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return "Unable to activate full extension. Task Queue feature is currently unavailable. Please check the console for error details.";
}

async function handlePlanProject(
  ctx: CursorCommandContext,
  input: string
): Promise<string> {
  return "Unable to activate full extension. Project Planning feature is currently unavailable. Please check the console for error details.";
}

// Extension deactivation function
export function deactivate() {
  console.log(
    "Mo Plugin simple wrapper deactivated! Forwarding to full implementation..."
  );

  try {
    return deactivateFull();
  } catch (error) {
    console.error("Error deactivating full implementation:", error);
  }
}
