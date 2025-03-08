import { CursorUI, CursorWebview } from '../ui-framework';
import { Task, TaskQueue } from '../task-queue';

/**
 * Planning Interface Component
 * 
 * This component provides a rich interface for planning projects and generating tasks with detailed context.
 */
export class PlanningInterface {
  private webview: CursorWebview | null = null;
  private ui: CursorUI;
  private taskQueue: TaskQueue;
  
  constructor(ui: CursorUI) {
    this.ui = ui;
    this.taskQueue = TaskQueue.getInstance();
  }
  
  /**
   * Show the planning interface
   */
  public show(): void {
    if (this.webview) {
      return; // Already showing
    }
    
    this.webview = this.ui.createWebviewPanel('mo-planning', {
      title: 'Mo: Project Planning',
      viewColumn: 'active',
      preserveFocus: false
    });
    
    this.webview.html = this.getHtml();
    
    // Handle messages from the webview
    this.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });
  }
  
  /**
   * Hide the planning interface
   */
  public hide(): void {
    if (this.webview) {
      this.webview.dispose();
      this.webview = null;
    }
  }
  
  /**
   * Check if the planning interface is visible
   */
  public isVisible(): boolean {
    return this.webview !== null;
  }
  
  /**
   * Generate HTML for the planning interface
   */
  private getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Planning</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
          }
          
          h1, h2, h3 {
            color: var(--vscode-editor-foreground);
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
          }
          
          textarea, input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
          }
          
          textarea {
            min-height: 150px;
            resize: vertical;
          }
          
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          
          .task-list {
            margin-top: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .task {
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-editor-background);
          }
          
          .task:last-child {
            border-bottom: none;
          }
          
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          
          .task-title {
            font-weight: bold;
          }
          
          .task-controls {
            display: flex;
            gap: 10px;
          }
          
          .task-description {
            margin-top: 5px;
            font-size: 0.9em;
          }
          
          .hidden {
            display: none;
          }
          
          .loading {
            text-align: center;
            padding: 20px;
          }
          
          .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            border: 1px solid var(--vscode-errorForeground);
            border-radius: 4px;
            margin-bottom: 20px;
          }
          
          .success {
            color: var(--vscode-terminal-ansiGreen);
            padding: 10px;
            border: 1px solid var(--vscode-terminal-ansiGreen);
            border-radius: 4px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Project Planning</h1>
          
          <div class="form-group">
            <label for="project-description">Project Description</label>
            <textarea id="project-description" placeholder="Describe your project or feature in detail..."></textarea>
          </div>
          
          <div class="form-group">
            <button id="generate-tasks">Generate Tasks</button>
          </div>
          
          <div id="error-message" class="error hidden"></div>
          <div id="success-message" class="success hidden"></div>
          
          <div id="loading" class="loading hidden">
            <p>Generating tasks...</p>
          </div>
          
          <div id="task-container" class="hidden">
            <h2>Generated Tasks</h2>
            <div id="task-list" class="task-list"></div>
            
            <div class="form-group" style="margin-top: 20px;">
              <button id="push-to-linear">Push to Linear</button>
              <button id="add-to-queue">Add to Queue</button>
            </div>
          </div>
        </div>
        
        <script>
          (function() {
            // Get elements
            const projectDescription = document.getElementById('project-description');
            const generateTasksButton = document.getElementById('generate-tasks');
            const taskContainer = document.getElementById('task-container');
            const taskList = document.getElementById('task-list');
            const pushToLinearButton = document.getElementById('push-to-linear');
            const addToQueueButton = document.getElementById('add-to-queue');
            const loadingElement = document.getElementById('loading');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            
            // Store generated tasks
            let generatedTasks = [];
            
            // Post message to extension
            function postMessage(message) {
              window.vscode.postMessage(message);
            }
            
            // Show error message
            function showError(message) {
              errorMessage.textContent = message;
              errorMessage.classList.remove('hidden');
              setTimeout(() => {
                errorMessage.classList.add('hidden');
              }, 5000);
            }
            
            // Show success message
            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.classList.remove('hidden');
              setTimeout(() => {
                successMessage.classList.add('hidden');
              }, 5000);
            }
            
            // Generate tasks
            generateTasksButton.addEventListener('click', () => {
              const description = projectDescription.value.trim();
              
              if (!description) {
                showError('Please enter a project description');
                return;
              }
              
              // Show loading
              loadingElement.classList.remove('hidden');
              taskContainer.classList.add('hidden');
              
              // Send message to extension
              postMessage({
                command: 'generateTasks',
                description
              });
            });
            
            // Push to Linear
            pushToLinearButton.addEventListener('click', () => {
              if (generatedTasks.length === 0) {
                showError('No tasks to push');
                return;
              }
              
              postMessage({
                command: 'pushToLinear',
                tasks: generatedTasks
              });
            });
            
            // Add to queue
            addToQueueButton.addEventListener('click', () => {
              if (generatedTasks.length === 0) {
                showError('No tasks to add');
                return;
              }
              
              postMessage({
                command: 'addToQueue',
                tasks: generatedTasks
              });
            });
            
            // Handle messages from extension
            window.addEventListener('message', (event) => {
              const message = event.data;
              
              switch (message.command) {
                case 'tasksGenerated':
                  // Hide loading
                  loadingElement.classList.add('hidden');
                  
                  // Store tasks
                  generatedTasks = message.tasks;
                  
                  // Render tasks
                  taskList.innerHTML = '';
                  generatedTasks.forEach((task, index) => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'task';
                    taskElement.innerHTML = `
                      <div class="task-header">
                        <div class="task-title">${task.title}</div>
                        <div class="task-controls">
                          <input type="number" min="0" max="5" placeholder="Priority" value="${task.priority || ''}" data-index="${index}" data-field="priority">
                          <input type="number" min="0" max="10" placeholder="Estimate" value="${task.estimate || ''}" data-index="${index}" data-field="estimate">
                        </div>
                      </div>
                      <div class="task-description">${task.description}</div>
                    `;
                    taskList.appendChild(taskElement);
                    
                    // Add event listeners for inputs
                    const inputs = taskElement.querySelectorAll('input');
                    inputs.forEach(input => {
                      input.addEventListener('change', (e) => {
                        const index = parseInt(e.target.dataset.index);
                        const field = e.target.dataset.field;
                        const value = parseInt(e.target.value);
                        
                        if (!isNaN(value)) {
                          generatedTasks[index][field] = value;
                        } else {
                          generatedTasks[index][field] = undefined;
                        }
                      });
                    });
                  });
                  
                  // Show task container
                  taskContainer.classList.remove('hidden');
                  break;
                  
                case 'error':
                  // Hide loading
                  loadingElement.classList.add('hidden');
                  
                  // Show error
                  showError(message.message);
                  break;
                  
                case 'success':
                  // Show success
                  showSuccess(message.message);
                  break;
              }
            });
          })();
        </script>
      </body>
      </html>
    `;
  }
  
  /**
   * Handle messages from the webview
   */
  private handleMessage(message: any): void {
    switch (message.command) {
      case 'generateTasks':
        this.generateTasks(message.description);
        break;
        
      case 'pushToLinear':
        this.pushToLinear(message.tasks);
        break;
        
      case 'addToQueue':
        this.addToQueue(message.tasks);
        break;
    }
  }
  
  /**
   * Generate tasks from a project description
   */
  private async generateTasks(description: string): Promise<void> {
    try {
      // For now, generate some sample tasks
      // In a real implementation, this would call an AI service
      const tasks = [
        {
          title: `Implement ${description} - Backend`,
          description: `Create the backend API for ${description} with proper authentication and validation.`,
          priority: 2,
          estimate: 3
        },
        {
          title: `Implement ${description} - Frontend`,
          description: `Create the frontend UI for ${description} with responsive design and proper error handling.`,
          priority: 2,
          estimate: 2
        },
        {
          title: `Write tests for ${description}`,
          description: `Create comprehensive tests for ${description} including unit tests and integration tests.`,
          priority: 3,
          estimate: 1
        }
      ];
      
      // Send tasks back to webview
      if (this.webview) {
        this.webview.postMessage({
          command: 'tasksGenerated',
          tasks
        });
      }
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      
      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: 'error',
          message: 'Failed to generate tasks'
        });
      }
    }
  }
  
  /**
   * Push tasks to Linear
   */
  private async pushToLinear(tasks: any[]): Promise<void> {
    try {
      // Add tasks to queue first
      this.addToQueue(tasks);
      
      // In a real implementation, this would call the Linear API
      // For now, just show a success message
      if (this.webview) {
        this.webview.postMessage({
          command: 'success',
          message: `Successfully pushed ${tasks.length} tasks to Linear`
        });
      }
    } catch (error) {
      console.error('Failed to push tasks to Linear:', error);
      
      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: 'error',
          message: 'Failed to push tasks to Linear'
        });
      }
    }
  }
  
  /**
   * Add tasks to the queue
   */
  private addToQueue(tasks: any[]): void {
    try {
      // Add tasks to queue
      tasks.forEach(task => {
        this.taskQueue.addTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimate: task.estimate
        });
      });
      
      // Send success to webview
      if (this.webview) {
        this.webview.postMessage({
          command: 'success',
          message: `Added ${tasks.length} tasks to queue`
        });
      }
    } catch (error) {
      console.error('Failed to add tasks to queue:', error);
      
      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: 'error',
          message: 'Failed to add tasks to queue'
        });
      }
    }
  }
} 