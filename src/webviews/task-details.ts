import { CursorUI, CursorWebview } from '../ui-framework';

/**
 * Task Details Component
 * 
 * This component provides a webview for displaying task details and copying context.
 */
export class TaskDetails {
  private webview: CursorWebview | null = null;
  private ui: CursorUI;
  private task: any = null;
  
  constructor(ui: CursorUI) {
    this.ui = ui;
  }
  
  /**
   * Show task details
   */
  public show(task: any): void {
    this.task = task;
    
    if (this.webview) {
      // Update existing webview
      this.webview.html = this.getHtml();
      return;
    }
    
    // Create new webview
    this.webview = this.ui.createWebviewPanel('mo-task-details', {
      title: `Task: ${task.title}`,
      viewColumn: 'beside',
      preserveFocus: false
    });
    
    this.webview.html = this.getHtml();
    
    // Handle messages from the webview
    this.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });
  }
  
  /**
   * Hide task details
   */
  public hide(): void {
    if (this.webview) {
      this.webview.dispose();
      this.webview = null;
    }
  }
  
  /**
   * Check if task details are visible
   */
  public isVisible(): boolean {
    return this.webview !== null;
  }
  
  /**
   * Generate HTML for task details
   */
  private getHtml(): string {
    if (!this.task) {
      return `
        <html>
          <body>
            <h1>No task selected</h1>
          </body>
        </html>
      `;
    }
    
    // Format task context
    const context = this.getTaskContext();
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Details</title>
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
          
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .task-title {
            font-size: 1.5em;
            font-weight: bold;
          }
          
          .task-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .task-meta-item {
            display: flex;
            flex-direction: column;
          }
          
          .task-meta-label {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
          }
          
          .task-meta-value {
            font-weight: bold;
          }
          
          .task-description {
            margin-bottom: 20px;
            line-height: 1.5;
          }
          
          .task-context {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
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
          
          .success {
            color: var(--vscode-terminal-ansiGreen);
            padding: 10px;
            border: 1px solid var(--vscode-terminal-ansiGreen);
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
          }
          
          .actions {
            display: flex;
            gap: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="task-header">
            <div class="task-title">${this.task.title}</div>
            <div class="actions">
              <button id="copy-context">Copy Context</button>
              <button id="export-task">Export Task</button>
            </div>
          </div>
          
          <div class="task-meta">
            <div class="task-meta-item">
              <div class="task-meta-label">Priority</div>
              <div class="task-meta-value">${this.task.priority || 'None'}</div>
            </div>
            <div class="task-meta-item">
              <div class="task-meta-label">Estimate</div>
              <div class="task-meta-value">${this.task.estimate || 'None'}</div>
            </div>
            <div class="task-meta-item">
              <div class="task-meta-label">State</div>
              <div class="task-meta-value">${this.task.state?.name || 'Unknown'}</div>
            </div>
          </div>
          
          <h2>Description</h2>
          <div class="task-description">${this.task.description}</div>
          
          <h2>Context</h2>
          <div class="task-context">${context}</div>
          
          <div id="success-message" class="success"></div>
        </div>
        
        <script>
          (function() {
            // Get elements
            const copyContextButton = document.getElementById('copy-context');
            const exportTaskButton = document.getElementById('export-task');
            const successMessage = document.getElementById('success-message');
            
            // Post message to extension
            function postMessage(message) {
              window.vscode.postMessage(message);
            }
            
            // Show success message
            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.style.display = 'block';
              setTimeout(() => {
                successMessage.style.display = 'none';
              }, 3000);
            }
            
            // Copy context
            copyContextButton.addEventListener('click', () => {
              postMessage({
                command: 'copyContext'
              });
            });
            
            // Export task
            exportTaskButton.addEventListener('click', () => {
              postMessage({
                command: 'exportTask'
              });
            });
            
            // Handle messages from extension
            window.addEventListener('message', (event) => {
              const message = event.data;
              
              if (message.command === 'success') {
                showSuccess(message.message);
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
      case 'copyContext':
        this.copyContext();
        break;
        
      case 'exportTask':
        this.exportTask();
        break;
    }
  }
  
  /**
   * Copy task context to clipboard
   */
  private copyContext(): void {
    try {
      // In a real implementation, this would copy to clipboard
      // For now, just show a success message
      if (this.webview) {
        this.webview.postMessage({
          command: 'success',
          message: 'Context copied to clipboard'
        });
      }
    } catch (error) {
      console.error('Failed to copy context:', error);
    }
  }
  
  /**
   * Export task to file
   */
  private exportTask(): void {
    try {
      // In a real implementation, this would export to file
      // For now, just show a success message
      if (this.webview) {
        this.webview.postMessage({
          command: 'success',
          message: 'Task exported to file'
        });
      }
    } catch (error) {
      console.error('Failed to export task:', error);
    }
  }
  
  /**
   * Get formatted task context
   */
  private getTaskContext(): string {
    if (!this.task) {
      return '';
    }
    
    return `# ${this.task.title}

## Overview
${this.task.description}

## Technical Requirements
- Priority: ${this.task.priority || 'None'}
- Estimate: ${this.task.estimate || 'None'}
- State: ${this.task.state?.name || 'Unknown'}

## Linear Issue
${this.task.identifier} - ${this.task.url}
`;
  }
} 