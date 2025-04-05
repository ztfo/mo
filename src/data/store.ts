/**
 * Data Store
 *
 * This file provides the data storage implementation for the Mo MCP server.
 * It handles reading and writing task data to a local JSON file.
 */

import { join } from "path";
import { promises as fs } from "fs";
import {
  Task,
  CreateTaskParams,
  UpdateTaskParams,
  TaskStatus,
  TaskPriority,
  TaskFilterParams,
} from "../types/task";

// Simple custom ID generator instead of using nanoid (to avoid ESM issues)
function generateId(length: number = 10): string {
  const characters =
    "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Data store location
const DATA_DIR = join(process.cwd(), "data");
const TASKS_FILE = join(DATA_DIR, "tasks.json");
const CONFIG_FILE = join(DATA_DIR, "config.json");

// In-memory cache of tasks
let taskCache: Task[] = [];

// Default configuration
const defaultConfig = {
  defaultPriority: TaskPriority.MEDIUM,
  linearApiKey: "",
  linearTeamId: "",
  linearWebhookId: "",
  linearWebhookSecret: "",
  linearWebhookUrl: "",
};

// Current configuration
let currentConfig = { ...defaultConfig };

/**
 * Initialize the data store
 *
 * Creates the necessary directories and files if they don't exist.
 */
export async function initializeDataStore(): Promise<void> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Check if tasks file exists, if not create it
    try {
      await fs.access(TASKS_FILE);
    } catch (error) {
      await fs.writeFile(TASKS_FILE, JSON.stringify({ tasks: [] }, null, 2));
    }

    // Check if config file exists, if not create it
    try {
      await fs.access(CONFIG_FILE);
    } catch (error) {
      await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }

    // Load tasks into memory
    await loadTasks();

    // Load configuration
    await loadConfig();

    console.log("Data store initialized with", taskCache.length, "tasks");
  } catch (error) {
    console.error("Failed to initialize data store:", error);
    throw error;
  }
}

/**
 * Load tasks from the JSON file into memory
 */
async function loadTasks(): Promise<void> {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf-8");
    const { tasks } = JSON.parse(data);
    taskCache = tasks;
  } catch (error) {
    console.error("Failed to load tasks:", error);
    taskCache = [];
  }
}

/**
 * Load configuration from the JSON file
 */
async function loadConfig(): Promise<void> {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    currentConfig = { ...defaultConfig, ...JSON.parse(data) };
  } catch (error) {
    console.error("Failed to load configuration:", error);
    currentConfig = { ...defaultConfig };
  }
}

/**
 * Save tasks from memory to the JSON file
 */
async function saveTasks(): Promise<void> {
  try {
    await fs.writeFile(
      TASKS_FILE,
      JSON.stringify({ tasks: taskCache }, null, 2)
    );
  } catch (error) {
    console.error("Failed to save tasks:", error);
    throw error;
  }
}

/**
 * Save configuration to the JSON file
 */
async function saveConfig(): Promise<void> {
  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
  } catch (error) {
    console.error("Failed to save configuration:", error);
    throw error;
  }
}

/**
 * Get all tasks, optionally filtered
 *
 * @param filter Optional filter parameters
 * @returns Array of tasks matching the filter
 */
export async function getTasks(filter?: TaskFilterParams): Promise<Task[]> {
  // Apply filters if provided
  if (!filter) {
    return taskCache;
  }

  let filteredTasks = [...taskCache];

  // Filter by status
  if (filter.status !== undefined) {
    filteredTasks = filteredTasks.filter(
      (task) => task.status === filter.status
    );
  }

  // Filter by priority
  if (filter.priority !== undefined) {
    filteredTasks = filteredTasks.filter(
      (task) => task.priority === filter.priority
    );
  }

  // Filter by tag
  if (filter.tag !== undefined) {
    filteredTasks = filteredTasks.filter((task) =>
      task.metadata.tags?.includes(filter.tag!)
    );
  }

  // Filter by search text
  if (filter.searchText !== undefined) {
    const searchLower = filter.searchText.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
    );
  }

  // Filter by Linear ID presence
  if (filter.hasLinearId !== undefined) {
    filteredTasks = filteredTasks.filter((task) =>
      filter.hasLinearId ? !!task.metadata.linearId : !task.metadata.linearId
    );
  }

  // Apply limit if provided
  if (filter.limit !== undefined && filter.limit > 0) {
    filteredTasks = filteredTasks.slice(0, filter.limit);
  }

  return filteredTasks;
}

/**
 * Get a single task by ID
 *
 * @param id Task ID
 * @returns The task if found, undefined otherwise
 */
export async function getTaskById(id: string): Promise<Task | undefined> {
  return taskCache.find((task) => task.id === id);
}

/**
 * Create a new task
 *
 * @param params Task creation parameters
 * @returns The created task
 */
export async function createTask(params: CreateTaskParams): Promise<Task> {
  const now = new Date().toISOString();

  const newTask: Task = {
    id: generateId(),
    title: params.title,
    description: params.description,
    status: params.status || TaskStatus.TODO,
    priority: params.priority || currentConfig.defaultPriority,
    created: now,
    updated: now,
    metadata: params.metadata || {},
  };

  taskCache.push(newTask);
  await saveTasks();

  return newTask;
}

/**
 * Update an existing task
 *
 * @param id Task ID
 * @param params Task update parameters
 * @returns The updated task if found, undefined otherwise
 */
export async function updateTask(
  id: string,
  params: UpdateTaskParams
): Promise<Task | undefined> {
  const taskIndex = taskCache.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return undefined;
  }

  const task = taskCache[taskIndex];
  const updatedTask: Task = {
    ...task,
    title: params.title !== undefined ? params.title : task.title,
    description:
      params.description !== undefined ? params.description : task.description,
    status: params.status !== undefined ? params.status : task.status,
    priority: params.priority !== undefined ? params.priority : task.priority,
    updated: new Date().toISOString(),
    metadata: {
      ...task.metadata,
      ...(params.metadata || {}),
    },
  };

  taskCache[taskIndex] = updatedTask;
  await saveTasks();

  return updatedTask;
}

/**
 * Delete a task
 *
 * @param id Task ID
 * @returns true if the task was deleted, false if not found
 */
export async function deleteTask(id: string): Promise<boolean> {
  const initialLength = taskCache.length;
  taskCache = taskCache.filter((task) => task.id !== id);

  if (taskCache.length === initialLength) {
    return false; // Task not found
  }

  await saveTasks();
  return true;
}

/**
 * Get configuration
 *
 * @returns The current configuration
 */
export function getConfig(): typeof currentConfig {
  return { ...currentConfig };
}

/**
 * Update configuration
 *
 * @param updates Configuration updates
 * @returns The updated configuration
 */
export async function updateConfig(
  updates: Partial<typeof currentConfig>
): Promise<typeof currentConfig> {
  currentConfig = {
    ...currentConfig,
    ...updates,
  };

  await saveConfig();
  return { ...currentConfig };
}
