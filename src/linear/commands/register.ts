/**
 * Linear Command Registration
 *
 * This file registers all Linear commands with the application's command registry.
 */

import { CommandRegistration } from "../../types/command";
import {
  linearAuthCommand,
  linearStatusCommand,
  linearLogoutCommand,
  linearSyncCommand,
  linearPushCommand,
  linearPullCommand,
  linearTeamsCommand,
  linearProjectsCommand,
  linearStatesCommand,
  linearIssuesCommand,
} from "./index";

/**
 * Get Linear command registrations
 */
export function getLinearCommands(): Record<string, CommandRegistration> {
  const commands: Record<string, CommandRegistration> = {};

  // Authentication commands
  commands["linear-auth"] = {
    name: "linear-auth",
    handler: linearAuthCommand,
    description: "Authenticate with Linear API",
    parameters: [
      {
        name: "key",
        description: "Linear API key",
        required: false,
      },
      {
        name: "team",
        description: "Linear team ID to set as default",
        required: false,
      },
    ],
  };

  commands["linear-status"] = {
    name: "linear-status",
    handler: linearStatusCommand,
    description: "Show Linear authentication status",
    parameters: [],
  };

  commands["linear-logout"] = {
    name: "linear-logout",
    handler: linearLogoutCommand,
    description: "Log out from Linear API",
    parameters: [],
  };

  // Sync commands
  commands["linear-sync"] = {
    name: "linear-sync",
    handler: linearSyncCommand,
    description: "Synchronize tasks between Mo and Linear",
    parameters: [
      {
        name: "direction",
        description: "Sync direction (push, pull, or both)",
        required: false,
      },
      {
        name: "id",
        description: "Specific task ID to sync",
        required: false,
      },
      {
        name: "team",
        description: "Linear team ID to sync with",
        required: false,
      },
      {
        name: "states",
        description: "Comma-separated list of Linear states to filter by",
        required: false,
      },
      {
        name: "limit",
        description: "Maximum number of issues to pull",
        required: false,
      },
    ],
  };

  commands["linear-push"] = {
    name: "linear-push",
    handler: linearPushCommand,
    description: "Push tasks from Mo to Linear",
    parameters: [
      {
        name: "id",
        description: "Specific task ID to push",
        required: false,
      },
      {
        name: "filter",
        description: "Filter query for tasks to push",
        required: false,
      },
    ],
  };

  commands["linear-pull"] = {
    name: "linear-pull",
    handler: linearPullCommand,
    description: "Pull issues from Linear to Mo",
    parameters: [
      {
        name: "id",
        description: "Specific Linear issue ID to pull",
        required: false,
      },
      {
        name: "team",
        description: "Linear team ID to pull from",
        required: false,
      },
      {
        name: "states",
        description: "Comma-separated list of Linear states to filter by",
        required: false,
      },
      {
        name: "limit",
        description: "Maximum number of issues to pull",
        required: false,
      },
    ],
  };

  // Query commands
  commands["linear-teams"] = {
    name: "linear-teams",
    handler: linearTeamsCommand,
    description: "List Linear teams",
    parameters: [],
  };

  commands["linear-projects"] = {
    name: "linear-projects",
    handler: linearProjectsCommand,
    description: "List Linear projects",
    parameters: [
      {
        name: "team",
        description: "Linear team ID",
        required: false,
      },
    ],
  };

  commands["linear-states"] = {
    name: "linear-states",
    handler: linearStatesCommand,
    description: "List Linear workflow states",
    parameters: [
      {
        name: "team",
        description: "Linear team ID",
        required: false,
      },
    ],
  };

  commands["linear-issues"] = {
    name: "linear-issues",
    handler: linearIssuesCommand,
    description: "List Linear issues",
    parameters: [
      {
        name: "team",
        description: "Linear team ID",
        required: false,
      },
      {
        name: "assignee",
        description: 'Filter by assignee (user ID or "me")',
        required: false,
      },
      {
        name: "states",
        description: "Comma-separated list of states to filter by",
        required: false,
      },
      {
        name: "limit",
        description: "Maximum number of issues to return (default: 10)",
        required: false,
      },
    ],
  };

  return commands;
}
