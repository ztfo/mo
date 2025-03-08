import { getFilteredIssues } from '../linear-api-enhanced';

/**
 * Task Sidebar Provider
 * 
 * This class provides a tree view for displaying Linear tasks in the sidebar.
 */
export class TaskSidebarProvider {
  private onDidChangeTreeDataEmitter: any;
  private tasks: any[] = [];
  
  constructor(emitter: any) {
    this.onDidChangeTreeDataEmitter = emitter;
  }
  
  /**
   * Get the tree item for a task
   */
  public getTreeItem(task: any): any {
    return {
      label: task.title,
      description: `${task.state?.name || 'Unknown'} | Priority: ${task.priority || 'None'}`,
      tooltip: task.description,
      collapsibleState: 'none',
      contextValue: 'task',
      command: {
        command: 'mo-plugin.viewTaskDetails',
        title: 'View Task Details',
        arguments: [task]
      }
    };
  }
  
  /**
   * Get the children of a task
   */
  public getChildren(element?: any): any[] {
    if (element) {
      return [];
    }
    
    return this.tasks;
  }
  
  /**
   * Refresh the tasks
   */
  public async refresh(): Promise<void> {
    try {
      // Get tasks from Linear
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const response = await getFilteredIssues({
        createdAt: { after: sevenDaysAgo.toISOString() }
      }, { first: 20 });
      
      this.tasks = response.data?.issues?.nodes || [];
      
      // Notify listeners
      this.onDidChangeTreeDataEmitter();
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
      this.tasks = [];
      this.onDidChangeTreeDataEmitter();
    }
  }
  
  /**
   * Get a task by ID
   */
  public getTask(id: string): any {
    return this.tasks.find(task => task.id === id);
  }
  
  /**
   * Copy task context to clipboard
   */
  public getTaskContext(task: any): string {
    // Format task context for copying
    return `# ${task.title}

## Overview
${task.description}

## Technical Requirements
- Priority: ${task.priority || 'None'}
- Estimate: ${task.estimate || 'None'}
- State: ${task.state?.name || 'Unknown'}

## Linear Issue
${task.identifier} - ${task.url}
`;
  }
} 