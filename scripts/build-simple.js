const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ensure dist directory exists
const distDir = path.join(__dirname, "../dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create an absolute barebones extension.js file that will work
console.log("Creating minimal extension.js...");
const extensionJs = `
"use strict";

// The most minimal VS Code/Cursor extension possible - use a plain export pattern
function activate(context) {
  console.log("Mo Plugin activated!");

  // Register commands directly with the VS Code API
  if (context.subscriptions && context.commands && context.commands.registerCommand) {
    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showTaskQueue", function() {
        console.log("Task Queue Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Task Queue feature is coming soon!");
        return "Task Queue Opened";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showLinearSync", function() {
        console.log("Linear Sync Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Linear Sync feature is coming soon!");
        return "Linear Sync Opened";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showSettings", function() {
        console.log("Settings Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Settings feature is coming soon!");
        return "Settings Opened";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.planProject", function() {
        console.log("Plan Project Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Project Planning feature is coming soon!");
        return "Project Planning Opened";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.pushTasks", function() {
        console.log("Push Tasks Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Push Tasks feature is coming soon!");
        return "Push Tasks Executed";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.showExportDialog", function() {
        console.log("Export Dialog Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Export Dialog feature is coming soon!");
        return "Export Dialog Opened";
      })
    );

    context.subscriptions.push(
      context.commands.registerCommand("mo-plugin.syncWithLinear", function() {
        console.log("Sync with Linear Command Executed!");
        const vscode = require('vscode');
        vscode.window.showInformationMessage("Sync with Linear feature is coming soon!");
        return "Sync with Linear Executed";
      })
    );
  }

  // Fallback to simple object return
  return {
    showTaskQueue: function() { console.log("Task Queue API called"); },
    showLinearSync: function() { console.log("Linear Sync API called"); },
    showSettings: function() { console.log("Settings API called"); },
    planProject: function() { console.log("Plan Project API called"); },
    pushTasks: function() { console.log("Push Tasks API called"); },
    showExportDialog: function() { console.log("Export Dialog API called"); },
    syncWithLinear: function() { console.log("Sync with Linear API called"); }
  };
}

exports.activate = activate;

function deactivate() {
  console.log("Mo Plugin deactivated!");
}

exports.deactivate = deactivate;
`;

fs.writeFileSync(path.join(distDir, "extension.js"), extensionJs);
console.log("Created extension.js");

console.log("Simple build completed successfully!");
