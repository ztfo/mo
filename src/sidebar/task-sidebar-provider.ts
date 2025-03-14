import { getFilteredIssues, updateIssue } from "../linear-api-enhanced";
import * as path from "path";
import * as fs from "fs";

/**
 * FilterOptions interface for task filtering
 */
export interface FilterOptions {
  states?: string[];
  priorities?: number[];
  assignees?: string[];
  labels?: string[];
  searchTerm?: string;
  timeRange?: number; // days
}

/**
 * Task Sidebar Provider
 *
 * This class provides a tree view for displaying Linear tasks in the sidebar.
 */
export class TaskSidebarProvider {
  private onDidChangeTreeDataEmitter: any;
  private tasks: any[] = [];
  private filteredTasks: any[] = [];
  private filterOptions: FilterOptions = {
    timeRange: 7, // Default to 7 days
  };

  constructor(emitter: any) {
    this.onDidChangeTreeDataEmitter = emitter;
  }

  /**
   * Get the tree item for a task
   */
  public getTreeItem(task: any): any {
    return {
      label: task.title,
      description: `${
        task.state?.name || "Unknown"
      } | Priority: ${this.getPriorityLabel(task.priority)}`,
      tooltip: this.generateTooltip(task),
      collapsibleState: "none",
      contextValue: "task",
      command: {
        command: "mo-plugin.viewTaskDetails",
        title: "View Task Details",
        arguments: [task],
      },
      iconPath: this.getIconForTask(task),
    };
  }

  /**
   * Get the priority label for a task
   */
  private getPriorityLabel(priority?: number): string {
    switch (priority) {
      case 0:
        return "None";
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      case 4:
        return "Urgent";
      default:
        return "None";
    }
  }

  /**
   * Get an icon for the task based on its status and priority
   */
  private getIconForTask(task: any): any {
    const priority = task.priority || 0;
    const stateName = task.state?.name?.toLowerCase() || "";

    let iconName = "circle-outline";

    if (stateName.includes("done") || stateName.includes("completed")) {
      iconName = "check-circle";
    } else if (stateName.includes("in progress")) {
      iconName = "play-circle";
    } else if (stateName.includes("blocked")) {
      iconName = "alert-circle";
    } else if (stateName.includes("todo")) {
      iconName = "circle-outline";
    }

    // Modify icon based on priority
    if (priority >= 3) {
      iconName = `${iconName}-important`;
    }

    // Return the icon paths (these paths will need to be validated or icons created)
    return {
      light: path.join(
        __dirname,
        "../../assets/icons/light",
        `${iconName}.svg`
      ),
      dark: path.join(__dirname, "../../assets/icons/dark", `${iconName}.svg`),
    };
  }

  /**
   * Generate a rich tooltip for the task
   */
  private generateTooltip(task: any): string {
    return `${task.title}

State: ${task.state?.name || "Unknown"}
Priority: ${this.getPriorityLabel(task.priority)}
Assignee: ${task.assignee?.name || "Unassigned"}
${
  task.labels?.nodes?.length
    ? "Labels: " + task.labels.nodes.map((l: any) => l.name).join(", ")
    : ""
}

${task.description || "No description"}`;
  }

  /**
   * Get the children of a task
   */
  public getChildren(element?: any): any[] {
    if (element) {
      return [];
    }

    return this.filteredTasks;
  }

  /**
   * Refresh the tasks
   */
  public async refresh(): Promise<void> {
    try {
      // Calculate date range based on filter options
      const dateLimit = new Date();
      dateLimit.setDate(
        dateLimit.getDate() - (this.filterOptions.timeRange || 7)
      );

      // Create filter criteria
      let filterCriteria: any = {
        createdAt: { after: dateLimit.toISOString() },
      };

      // Add state filter if specified
      if (this.filterOptions.states && this.filterOptions.states.length > 0) {
        filterCriteria.states = this.filterOptions.states;
      }

      // Add assignee filter if specified
      if (
        this.filterOptions.assignees &&
        this.filterOptions.assignees.length > 0
      ) {
        filterCriteria.assignees = this.filterOptions.assignees;
      }

      // Get tasks from Linear
      const response = await getFilteredIssues(
        filterCriteria,
        { first: 50 } // Increased limit for more comprehensive view
      );

      this.tasks = response.data?.issues?.nodes || [];

      // Apply client-side filtering
      this.applyFilters();

      // Notify listeners
      this.onDidChangeTreeDataEmitter();
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
      this.tasks = [];
      this.filteredTasks = [];
      this.onDidChangeTreeDataEmitter();
    }
  }

  /**
   * Apply client-side filters to the tasks
   */
  private applyFilters(): void {
    this.filteredTasks = this.tasks.filter((task) => {
      // Filter by priority if specified
      if (
        this.filterOptions.priorities &&
        this.filterOptions.priorities.length > 0 &&
        !this.filterOptions.priorities.includes(task.priority || 0)
      ) {
        return false;
      }

      // Filter by label if specified
      if (this.filterOptions.labels && this.filterOptions.labels.length > 0) {
        const taskLabels = task.labels?.nodes?.map((l: any) => l.name) || [];
        if (
          !this.filterOptions.labels.some((label) => taskLabels.includes(label))
        ) {
          return false;
        }
      }

      // Filter by search term if specified
      if (this.filterOptions.searchTerm) {
        const searchTerm = this.filterOptions.searchTerm.toLowerCase();
        const title = task.title?.toLowerCase() || "";
        const description = task.description?.toLowerCase() || "";
        const id = task.identifier?.toLowerCase() || "";

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          id.includes(searchTerm)
        );
      }

      return true;
    });
  }

  /**
   * Update filter options and refresh
   */
  public async updateFilters(options: Partial<FilterOptions>): Promise<void> {
    this.filterOptions = {
      ...this.filterOptions,
      ...options,
    };

    if (options.states || options.assignees || options.timeRange) {
      // These filters need a server refresh
      await this.refresh();
    } else {
      // These filters can be applied client-side
      this.applyFilters();
      this.onDidChangeTreeDataEmitter();
    }
  }

  /**
   * Search tasks with the given term
   */
  public searchTasks(searchTerm: string): void {
    this.updateFilters({ searchTerm });
  }

  /**
   * Clear all filters
   */
  public clearFilters(): void {
    this.filterOptions = {
      timeRange: 7, // Reset to default time range
    };
    this.refresh();
  }

  /**
   * Get a task by ID
   */
  public getTask(id: string): any {
    return this.tasks.find((task) => task.id === id);
  }

  /**
   * Copy task context to clipboard
   */
  public getTaskContext(task: any): string {
    // Format task context for copying
    return `# ${task.title}

## Overview
${task.description || "No description provided."}

## Technical Requirements
- Priority: ${this.getPriorityLabel(task.priority)}
- Estimate: ${task.estimate || "None"}
- State: ${task.state?.name || "Unknown"}
${
  task.labels?.nodes?.length
    ? "- Labels: " + task.labels.nodes.map((l: any) => l.name).join(", ")
    : ""
}
${
  task.assignee ? "- Assignee: " + task.assignee.name : "- Assignee: Unassigned"
}

## Linear Issue
${task.identifier} - ${task.url}
`;
  }

  /**
   * Update task state
   */
  public async updateTaskState(
    taskId: string,
    stateId: string
  ): Promise<boolean> {
    try {
      await updateIssue(taskId, { stateId });
      await this.refresh(); // Refresh to get the updated task
      return true;
    } catch (error) {
      console.error("Failed to update task state:", error);
      return false;
    }
  }

  /**
   * Update task priority
   */
  public async updateTaskPriority(
    taskId: string,
    priority: number
  ): Promise<boolean> {
    try {
      await updateIssue(taskId, { priority });
      await this.refresh(); // Refresh to get the updated task
      return true;
    } catch (error) {
      console.error("Failed to update task priority:", error);
      return false;
    }
  }
}
