/**
 * Task Types
 *
 * This file contains the TypeScript type definitions for the task management system
 * used in the Mo MCP server.
 */

/**
 * Task status enum
 */
export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  DONE = "done",
}

/**
 * Task priority enum
 */
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Task metadata
 *
 * Contains additional information about a task beyond its core properties.
 */
export interface TaskMetadata {
  /** File path associated with this task */
  filePath?: string;

  /** Linear issue ID if synchronized */
  linearId?: string;

  /** Tags associated with this task */
  tags?: string[];

  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Task interface
 *
 * Represents a task in the system.
 */
export interface Task {
  /** Unique ID for the task */
  id: string;

  /** Task title */
  title: string;

  /** Detailed task description (markdown supported) */
  description: string;

  /** Current status */
  status: TaskStatus;

  /** Task priority */
  priority: TaskPriority;

  /** Creation timestamp (ISO format) */
  created: string;

  /** Last update timestamp (ISO format) */
  updated: string;

  /** Additional metadata */
  metadata: TaskMetadata;
}

/**
 * Task creation parameters
 *
 * Used when creating a new task.
 */
export interface CreateTaskParams {
  /** Task title */
  title: string;

  /** Task description */
  description: string;

  /** Initial status (defaults to TODO) */
  status?: TaskStatus;

  /** Initial priority (defaults to MEDIUM) */
  priority?: TaskPriority;

  /** Initial metadata */
  metadata?: TaskMetadata;
}

/**
 * Task update parameters
 *
 * Used when updating an existing task.
 */
export interface UpdateTaskParams {
  /** Updated title (optional) */
  title?: string;

  /** Updated description (optional) */
  description?: string;

  /** Updated status (optional) */
  status?: TaskStatus;

  /** Updated priority (optional) */
  priority?: TaskPriority;

  /** Updated metadata (optional, will be merged with existing) */
  metadata?: Partial<TaskMetadata>;
}

/**
 * Task filter parameters
 *
 * Used when filtering tasks.
 */
export interface TaskFilterParams {
  /** Filter by status */
  status?: TaskStatus;

  /** Filter by priority */
  priority?: TaskPriority;

  /** Filter by tag */
  tag?: string;

  /** Filter by text in title or description */
  searchText?: string;

  /** Filter by metadata presence */
  hasLinearId?: boolean;

  /** Maximum number of tasks to return */
  limit?: number;
}
