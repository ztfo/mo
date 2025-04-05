/**
 * Linear Synchronization
 *
 * This file provides synchronization between Linear issues and Mo tasks,
 * including mapping data between the two systems.
 */

import { LinearClient } from "./api";
import { getApiKey, isLinearConfigured, getLinearAuth } from "./auth";
import {
  LinearIssue,
  LinearIssueCreateInput,
  LinearIssueUpdateInput,
  LinearSyncOptions,
  LinearSyncResult,
  LinearSyncError,
  LinearWorkflowState,
} from "./types";
import {
  Task,
  CreateTaskParams,
  TaskStatus,
  TaskPriority,
} from "../types/task";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../data/store";

/**
 * Linear priority to Mo task priority mapping
 * Linear: 0 (none), 1 (urgent), 2 (high), 3 (medium), 4 (low)
 * Mo: HIGH, MEDIUM, LOW
 */
const PRIORITY_MAP_LINEAR_TO_MO: Record<number, TaskPriority> = {
  0: TaskPriority.LOW,
  1: TaskPriority.HIGH,
  2: TaskPriority.HIGH,
  3: TaskPriority.MEDIUM,
  4: TaskPriority.LOW,
};

/**
 * Mo task priority to Linear priority mapping
 */
const PRIORITY_MAP_MO_TO_LINEAR: Record<TaskPriority, number> = {
  [TaskPriority.HIGH]: 2,
  [TaskPriority.MEDIUM]: 3,
  [TaskPriority.LOW]: 4,
};

/**
 * Map workflow state type to task status
 * Common Linear workflow state types: triage, backlog, started, completed, canceled
 */
function mapStateTypeToStatus(stateType: string): TaskStatus {
  switch (stateType.toLowerCase()) {
    case "triage":
      return TaskStatus.TODO;
    case "backlog":
      return TaskStatus.TODO;
    case "started":
      return TaskStatus.IN_PROGRESS;
    case "completed":
      return TaskStatus.DONE;
    case "canceled":
      return TaskStatus.DONE; // Map canceled to DONE since there's no CANCELLED status
    default:
      return TaskStatus.TODO;
  }
}

/**
 * Map task status to Linear workflow state type
 */
function mapStatusToStateType(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return "backlog";
    case TaskStatus.IN_PROGRESS:
      return "started";
    case TaskStatus.DONE:
      return "completed";
    default:
      return "backlog";
  }
}

/**
 * Convert a Linear issue to a Mo task
 */
export function linearIssueToTask(
  issue: LinearIssue,
  existingTask?: Task
): CreateTaskParams {
  const status = issue.state
    ? mapStateTypeToStatus(issue.state.type)
    : TaskStatus.TODO;

  const priority =
    PRIORITY_MAP_LINEAR_TO_MO[issue.priority] || TaskPriority.MEDIUM;

  return {
    title: issue.title,
    description: issue.description || "",
    status,
    priority,
    metadata: {
      ...(existingTask?.metadata || {}),
      linearId: issue.id,
      linearIssueId: issue.id,
      linearIssueKey: issue.identifier,
      linearTeamId: issue.teamId,
      linearStateId: issue.stateId,
      linearUrl: issue.url,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

/**
 * Convert a Mo task to a Linear issue create input
 */
export function taskToLinearIssueInput(
  task: Task,
  teamId: string,
  workflowStates: LinearWorkflowState[]
): LinearIssueCreateInput {
  // Find appropriate workflow state ID based on task status
  const targetStateType = mapStatusToStateType(task.status);
  const workflowState = workflowStates.find(
    (s) => s.type.toLowerCase() === targetStateType.toLowerCase()
  );

  return {
    title: task.title,
    description: task.description,
    teamId,
    stateId: workflowState?.id,
    priority: PRIORITY_MAP_MO_TO_LINEAR[task.priority] || 3,
  };
}

/**
 * Convert a Mo task to a Linear issue update input
 */
export function taskToLinearIssueUpdateInput(
  task: Task,
  workflowStates: LinearWorkflowState[]
): LinearIssueUpdateInput {
  // Find appropriate workflow state ID based on task status
  const targetStateType = mapStatusToStateType(task.status);
  const workflowState = workflowStates.find(
    (s) => s.type.toLowerCase() === targetStateType.toLowerCase()
  );

  return {
    id: task.metadata.linearId || task.metadata.linearIssueId,
    title: task.title,
    description: task.description,
    stateId: workflowState?.id,
    priority: PRIORITY_MAP_MO_TO_LINEAR[task.priority] || 3,
  };
}

/**
 * Synchronize tasks with Linear issues
 */
export async function syncWithLinear(
  options: LinearSyncOptions = { direction: "both" }
): Promise<LinearSyncResult> {
  // Check if Linear is configured
  if (!(await isLinearConfigured())) {
    throw new Error(
      "Linear integration is not configured. Please set up Linear API key first."
    );
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Linear API key not found or invalid.");
  }

  const linearAuth = await getLinearAuth();
  if (!linearAuth || !linearAuth.defaultTeamId) {
    throw new Error(
      "Linear team ID not configured. Please set up Linear team ID first."
    );
  }

  const teamId = linearAuth.defaultTeamId;
  const client = new LinearClient(apiKey);

  // Get workflow states for the team
  const workflowStates = await client.getWorkflowStates(teamId);

  const result: LinearSyncResult = {
    added: 0,
    updated: 0,
    deleted: 0,
    conflicts: 0,
    errors: [],
    details: {
      added: [],
      updated: [],
      failed: [],
    },
  };

  // Apply limits
  const limit = options.limit || 100;

  try {
    // Pull from Linear to Mo
    if (options.direction === "pull" || options.direction === "both") {
      await pullFromLinear(client, teamId, workflowStates, result, limit);
    }

    // Push from Mo to Linear
    if (options.direction === "push" || options.direction === "both") {
      await pushToLinear(client, teamId, workflowStates, result, limit);
    }

    return result;
  } catch (error) {
    console.error("Linear sync failed:", error);
    result.errors.push({
      code: "SYNC_FAILED",
      message: `Synchronization failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
    return result;
  }
}

/**
 * Pull issues from Linear to Mo
 */
async function pullFromLinear(
  client: LinearClient,
  teamId: string,
  workflowStates: LinearWorkflowState[],
  result: LinearSyncResult,
  limit: number
): Promise<void> {
  try {
    // Get recently updated issues from Linear
    const issues = await client.getIssues({
      filter: { team: { id: { eq: teamId } } },
      first: limit,
    });

    // Get existing tasks that have Linear IDs
    const existingTasks = await getTasks({ hasLinearId: true });
    const linearIdToTaskMap = new Map<string, Task>();

    existingTasks.forEach((task) => {
      const linearId = task.metadata.linearId || task.metadata.linearIssueId;
      if (linearId) {
        linearIdToTaskMap.set(linearId, task);
      }
    });

    // Process each Linear issue
    for (const issue of issues) {
      try {
        const existingTask = linearIdToTaskMap.get(issue.id);

        if (existingTask) {
          // Update existing task
          const updateParams = linearIssueToTask(issue, existingTask);
          await updateTask(existingTask.id, updateParams);
          result.updated++;
          result.details?.updated.push({
            local: existingTask.id,
            remote: issue.id,
          });
        } else {
          // Create new task
          const taskParams = linearIssueToTask(issue);
          const newTask = await createTask(taskParams);
          result.added++;
          result.details?.added.push({
            local: newTask.id,
            remote: issue.id,
          });
        }
      } catch (error) {
        console.error(`Failed to process Linear issue ${issue.id}:`, error);
        result.errors.push({
          code: "PULL_ISSUE_FAILED",
          message: `Failed to process Linear issue ${issue.identifier}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          itemId: issue.id,
        });
        result.details?.failed.push({
          id: issue.id,
          error: `Failed to process: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }
  } catch (error) {
    console.error("Pull from Linear failed:", error);
    result.errors.push({
      code: "PULL_FAILED",
      message: `Pull from Linear failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

/**
 * Push tasks from Mo to Linear
 */
async function pushToLinear(
  client: LinearClient,
  teamId: string,
  workflowStates: LinearWorkflowState[],
  result: LinearSyncResult,
  limit: number
): Promise<void> {
  try {
    // Get tasks without Linear IDs (for creation)
    const tasksToCreate = await getTasks({ hasLinearId: false });

    // Get tasks with Linear IDs (for update)
    const tasksToUpdate = await getTasks({ hasLinearId: true });

    // Create new issues in Linear
    const createLimit = Math.min(tasksToCreate.length, limit);
    for (let i = 0; i < createLimit; i++) {
      const task = tasksToCreate[i];

      try {
        const issueInput = taskToLinearIssueInput(task, teamId, workflowStates);
        const issue = await client.createIssue(issueInput);

        // Update task with Linear ID
        await updateTask(task.id, {
          metadata: {
            linearId: issue.id,
            linearIssueId: issue.id,
            linearIssueKey: issue.identifier,
            linearTeamId: issue.teamId,
            linearStateId: issue.stateId,
            linearUrl: issue.url,
            lastSyncedAt: new Date().toISOString(),
          },
        });

        result.added++;
        result.details?.added.push({
          local: task.id,
          remote: issue.id,
        });
      } catch (error) {
        console.error(
          `Failed to create Linear issue for task ${task.id}:`,
          error
        );
        result.errors.push({
          code: "CREATE_ISSUE_FAILED",
          message: `Failed to create Linear issue for task ${task.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          itemId: task.id,
        });
        result.details?.failed.push({
          id: task.id,
          error: `Failed to create: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }

    // Update existing issues in Linear
    const updateLimit = Math.min(tasksToUpdate.length, limit);
    for (let i = 0; i < updateLimit; i++) {
      const task = tasksToUpdate[i];
      const linearId = task.metadata.linearId || task.metadata.linearIssueId;

      if (!linearId) {
        continue;
      }

      try {
        const updateInput = taskToLinearIssueUpdateInput(task, workflowStates);
        await client.updateIssue(updateInput);

        // Update lastSyncedAt
        await updateTask(task.id, {
          metadata: {
            ...task.metadata,
            lastSyncedAt: new Date().toISOString(),
          },
        });

        result.updated++;
        result.details?.updated.push({
          local: task.id,
          remote: linearId,
        });
      } catch (error) {
        console.error(
          `Failed to update Linear issue for task ${task.id}:`,
          error
        );
        result.errors.push({
          code: "UPDATE_ISSUE_FAILED",
          message: `Failed to update Linear issue for task ${task.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          itemId: task.id,
        });
        result.details?.failed.push({
          id: task.id,
          error: `Failed to update: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }
  } catch (error) {
    console.error("Push to Linear failed:", error);
    result.errors.push({
      code: "PUSH_FAILED",
      message: `Push to Linear failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

// Re-export the types needed by command handlers
export type { LinearSyncOptions, LinearSyncResult } from "./types";
