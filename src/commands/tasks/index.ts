/**
 * Task Commands
 *
 * This file implements the task-related command handlers for the Mo MCP server.
 * It provides functionality for listing, creating, updating, and deleting tasks.
 */

import {
  CommandContext,
  CommandHandler,
  CommandRegistration,
  CommandResult,
} from "../../types/command";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from "../../data/store";
import { TaskPriority, TaskStatus } from "../../types/task";
import path from "path";

/**
 * Format a task as markdown
 *
 * @param task The task to format
 * @returns Formatted markdown string
 */
function formatTaskMarkdown(task: any): string {
  const priorityEmoji = {
    [TaskPriority.HIGH]: "🔴",
    [TaskPriority.MEDIUM]: "🟡",
    [TaskPriority.LOW]: "🟢",
  };

  const statusEmoji = {
    [TaskStatus.TODO]: "📋",
    [TaskStatus.IN_PROGRESS]: "⏳",
    [TaskStatus.DONE]: "✅",
  };

  const priorityStr = `${priorityEmoji[task.priority] || ""} ${task.priority}`;
  const statusStr = `${statusEmoji[task.status] || ""} ${task.status}`;

  let markdown = `### Task: ${task.title}\n\n`;
  markdown += `**ID:** \`${task.id}\`  \n`;
  markdown += `**Status:** ${statusStr}  \n`;
  markdown += `**Priority:** ${priorityStr}  \n`;
  markdown += `**Created:** ${new Date(task.created).toLocaleString()}  \n`;
  markdown += `**Updated:** ${new Date(task.updated).toLocaleString()}  \n`;

  if (task.metadata?.filePath) {
    markdown += `**File:** \`${task.metadata.filePath}\`  \n`;
  }

  if (task.metadata?.linearId) {
    markdown += `**Linear ID:** ${task.metadata.linearId}  \n`;
  }

  markdown += `\n#### Description\n\n${
    task.description || "*No description*"
  }\n`;

  return markdown;
}

/**
 * List tasks command handler
 *
 * Lists all tasks with optional filtering.
 */
const tasksCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Parse filter parameters
    const filter: any = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.priority) {
      filter.priority = params.priority;
    }

    if (params.tag) {
      filter.tag = params.tag;
    }

    if (params.search) {
      filter.searchText = params.search;
    }

    if (params.limit) {
      filter.limit = parseInt(params.limit, 10);
    }

    // Get tasks with the filter
    const tasks = await getTasks(filter);

    // Format the tasks as markdown
    let markdown = `### Tasks (${tasks.length})\n\n`;

    if (tasks.length === 0) {
      markdown += "*No tasks found matching your criteria.*\n\n";
      markdown += "Use `/mo new-task` to create a new task.";
    } else {
      // Group tasks by status
      const grouped: Record<string, any[]> = {};

      tasks.forEach((task) => {
        if (!grouped[task.status]) {
          grouped[task.status] = [];
        }
        grouped[task.status].push(task);
      });

      // List tasks by status group
      Object.entries(grouped).forEach(([status, statusTasks]) => {
        markdown += `#### ${status} (${statusTasks.length})\n\n`;

        statusTasks.forEach((task) => {
          const priorityEmoji = {
            [TaskPriority.HIGH]: "🔴",
            [TaskPriority.MEDIUM]: "🟡",
            [TaskPriority.LOW]: "🟢",
          };

          markdown += `- ${priorityEmoji[task.priority] || ""} **${
            task.title
          }** (\`${task.id}\`)\n`;
          if (task.description) {
            const desc =
              task.description.length > 60
                ? task.description.substring(0, 60) + "..."
                : task.description;
            markdown += `  ${desc}\n`;
          }
          markdown += "\n";
        });
      });

      markdown += "\nUse `/mo task-details id:[task-id]` to view details.";
    }

    return {
      success: true,
      message: `Found ${tasks.length} tasks`,
      markdown,
    };
  } catch (error) {
    console.error("Error listing tasks:", error);
    return {
      success: false,
      message: "Failed to list tasks",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to list tasks. Please try again.",
    };
  }
};

/**
 * Create a new task command handler
 *
 * Creates a new task with the provided parameters.
 */
const newTaskCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Validate required parameters
    if (!params.title) {
      return {
        success: false,
        message: "Task title is required",
        markdown:
          '### Error\n\nTask title is required. Use `title:"Your task title"`.',
      };
    }

    // Build metadata from context
    const metadata: Record<string, any> = {};

    if (context.currentFilePath) {
      metadata.filePath = context.currentFilePath;
    }

    if (context.cursorPosition) {
      metadata.position = context.cursorPosition;
    }

    // Create the task
    const task = await createTask({
      title: params.title,
      description: params.description || context.selectedText || "",
      status: (params.status as TaskStatus) || TaskStatus.TODO,
      priority: (params.priority as TaskPriority) || TaskPriority.MEDIUM,
      metadata,
    });

    return {
      success: true,
      message: `Created task: ${task.title}`,
      markdown: formatTaskMarkdown(task),
    };
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      message: "Failed to create task",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to create task. Please try again.",
    };
  }
};

/**
 * Update a task command handler
 *
 * Updates an existing task with the provided parameters.
 */
const updateTaskCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Validate required parameters
    if (!params.id) {
      return {
        success: false,
        message: "Task ID is required",
        markdown: '### Error\n\nTask ID is required. Use `id:"task-id"`.',
      };
    }

    // Get the existing task
    const existingTask = await getTaskById(params.id);

    if (!existingTask) {
      return {
        success: false,
        message: `Task not found: ${params.id}`,
        markdown: `### Error\n\nTask with ID \`${params.id}\` not found.`,
      };
    }

    // Update the task
    const updatedTask = await updateTask(params.id, {
      title: params.title,
      description: params.description,
      status: params.status as TaskStatus,
      priority: params.priority as TaskPriority,
    });

    if (!updatedTask) {
      return {
        success: false,
        message: "Failed to update task",
        markdown: "### Error\n\nFailed to update task. Please try again.",
      };
    }

    return {
      success: true,
      message: `Updated task: ${updatedTask.title}`,
      markdown: formatTaskMarkdown(updatedTask),
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      success: false,
      message: "Failed to update task",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to update task. Please try again.",
    };
  }
};

/**
 * Delete a task command handler
 *
 * Deletes an existing task.
 */
const deleteTaskCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Validate required parameters
    if (!params.id) {
      return {
        success: false,
        message: "Task ID is required",
        markdown: '### Error\n\nTask ID is required. Use `id:"task-id"`.',
      };
    }

    // Get the existing task
    const existingTask = await getTaskById(params.id);

    if (!existingTask) {
      return {
        success: false,
        message: `Task not found: ${params.id}`,
        markdown: `### Error\n\nTask with ID \`${params.id}\` not found.`,
      };
    }

    // Delete the task
    const success = await deleteTask(params.id);

    if (!success) {
      return {
        success: false,
        message: "Failed to delete task",
        markdown: "### Error\n\nFailed to delete task. Please try again.",
      };
    }

    return {
      success: true,
      message: `Deleted task: ${existingTask.title}`,
      markdown: `### Success\n\nDeleted task: **${existingTask.title}**`,
    };
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      success: false,
      message: "Failed to delete task",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to delete task. Please try again.",
    };
  }
};

/**
 * View task details command handler
 *
 * Shows detailed information about a specific task.
 */
const taskDetailsCommandHandler: CommandHandler = async (params, context) => {
  try {
    // Validate required parameters
    if (!params.id) {
      return {
        success: false,
        message: "Task ID is required",
        markdown: '### Error\n\nTask ID is required. Use `id:"task-id"`.',
      };
    }

    // Get the task
    const task = await getTaskById(params.id);

    if (!task) {
      return {
        success: false,
        message: `Task not found: ${params.id}`,
        markdown: `### Error\n\nTask with ID \`${params.id}\` not found.`,
      };
    }

    return {
      success: true,
      message: `Task: ${task.title}`,
      markdown: formatTaskMarkdown(task),
      actionButtons: [
        {
          label: "Mark as In Progress",
          command: `/mo update-task id:${task.id} status:in-progress`,
        },
        {
          label: "Mark as Done",
          command: `/mo update-task id:${task.id} status:done`,
        },
      ],
    };
  } catch (error) {
    console.error("Error getting task details:", error);
    return {
      success: false,
      message: "Failed to get task details",
      error: error instanceof Error ? error.message : String(error),
      markdown: "### Error\n\nFailed to get task details. Please try again.",
    };
  }
};

// Command registrations
export const tasksCommand: CommandRegistration = {
  name: "tasks",
  handler: tasksCommandHandler,
  description: "List all tasks with optional filtering",
  parameters: [
    {
      name: "status",
      required: false,
      description: "Filter by status (todo, in-progress, done)",
    },
    {
      name: "priority",
      required: false,
      description: "Filter by priority (high, medium, low)",
    },
    {
      name: "tag",
      required: false,
      description: "Filter by tag",
    },
    {
      name: "search",
      required: false,
      description: "Search text in title and description",
    },
    {
      name: "limit",
      required: false,
      description: "Maximum number of tasks to display",
    },
  ],
};

export const newTaskCommand: CommandRegistration = {
  name: "new-task",
  handler: newTaskCommandHandler,
  description: "Create a new task",
  parameters: [
    {
      name: "title",
      required: true,
      description: "Task title",
    },
    {
      name: "description",
      required: false,
      description: "Task description (uses selected text if not provided)",
    },
    {
      name: "status",
      required: false,
      description: "Initial status (todo, in-progress, done)",
    },
    {
      name: "priority",
      required: false,
      description: "Priority (high, medium, low)",
    },
  ],
};

export const updateTaskCommand: CommandRegistration = {
  name: "update-task",
  handler: updateTaskCommandHandler,
  description: "Update an existing task",
  parameters: [
    {
      name: "id",
      required: true,
      description: "Task ID",
    },
    {
      name: "title",
      required: false,
      description: "New title",
    },
    {
      name: "description",
      required: false,
      description: "New description",
    },
    {
      name: "status",
      required: false,
      description: "New status (todo, in-progress, done)",
    },
    {
      name: "priority",
      required: false,
      description: "New priority (high, medium, low)",
    },
  ],
};

export const deleteTaskCommand: CommandRegistration = {
  name: "delete-task",
  handler: deleteTaskCommandHandler,
  description: "Delete a task",
  parameters: [
    {
      name: "id",
      required: true,
      description: "Task ID",
    },
  ],
};

export const taskDetailsCommand: CommandRegistration = {
  name: "task-details",
  handler: taskDetailsCommandHandler,
  description: "Show detailed information about a specific task",
  parameters: [
    {
      name: "id",
      required: true,
      description: "Task ID",
    },
  ],
};
