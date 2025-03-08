// Mo Plugin - Linear Project Management for Cursor IDE

// Mock data for testing
const mockTasks = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Create a secure user authentication system with login, registration, and password reset functionality.',
    priority: 1,
    estimate: 3,
    state: { name: 'Backlog' },
    identifier: 'MO-1',
    url: 'https://linear.app/example/issue/MO-1'
  },
  {
    id: 'task-2',
    title: 'Create dashboard UI',
    description: 'Design and implement the main dashboard UI with responsive layout and dark mode support.',
    priority: 2,
    estimate: 2,
    state: { name: 'Backlog' },
    identifier: 'MO-2',
    url: 'https://linear.app/example/issue/MO-2'
  },
  {
    id: 'task-3',
    title: 'Implement API integration',
    description: 'Connect the frontend to the backend API with proper error handling and loading states.',
    priority: 2,
    estimate: 2,
    state: { name: 'In Progress' },
    identifier: 'MO-3',
    url: 'https://linear.app/example/issue/MO-3'
  }
];

// Task sidebar provider
class TaskSidebarProvider {
  constructor() {
    this.tasks = [...mockTasks];
    this.onDidChangeTreeDataEmitter = () => {};
  }
  
  getTreeItem(task) {
    return {
      label: task.title,
      description: `${task.state?.name || 'Unknown'} | Priority: ${task.priority || 'None'}`,
      tooltip: task.description,
      collapsibleState: 'none',
      contextValue: 'task',
      command: {
        command: 'mo-plugin-cursor.viewTaskDetails',
        title: 'View Task Details',
        arguments: [task]
      }
    };
  }
  
  getChildren() {
    return this.tasks;
  }
  
  refresh() {
    this.onDidChangeTreeDataEmitter();
    return Promise.resolve();
  }
}

// Task details webview
class TaskDetailsWebview {
  constructor(context) {
    this.context = context;
    this.panel = null;
    this.task = null;
  }
  
  show(task) {
    this.task = task;
    
    if (this.panel) {
      this.panel.dispose();
    }
    
    this.panel = this.context.window.createWebviewPanel(
      'mo-task-details',
      `Task: ${task.title}`,
      { viewColumn: 'beside' },
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    this.panel.webview.html = this.getHtml();
    
    this.panel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'copyContext':
          this.context.window.showInformationMessage('Context copied to clipboard');
          break;
        case 'exportTask':
          this.exportTask();
          break;
      }
    });
  }
  
  getHtml() {
    if (!this.task) {
      return '<html><body><h1>No task selected</h1></body></html>';
    }
    
    return `
      <!DOCTYPE html>
      <html>
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
          }
          
          h1, h2 {
            color: var(--vscode-editor-foreground);
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
          
          .task-context {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
          }
          
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
        </style>
      </head>
      <body>
        <h1>${this.task.title}</h1>
        
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
        <div>${this.task.description}</div>
        
        <h2>Context</h2>
        <div class="task-context"># ${this.task.title}

## Overview
${this.task.description}

## Technical Requirements
- Priority: ${this.task.priority || 'None'}
- Estimate: ${this.task.estimate || 'None'}
- State: ${this.task.state?.name || 'Unknown'}

## Linear Issue
${this.task.identifier} - ${this.task.url}</div>
        
        <div>
          <button id="copy-context">Copy Context</button>
          <button id="export-task">Export Task</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          document.getElementById('copy-context').addEventListener('click', () => {
            vscode.postMessage({ command: 'copyContext' });
          });
          
          document.getElementById('export-task').addEventListener('click', () => {
            vscode.postMessage({ command: 'exportTask' });
          });
        </script>
      </body>
      </html>
    `;
  }
  
  exportTask() {
    this.context.window.showInformationMessage(`Task exported: ${this.task.title}`);
  }
}

// Planning interface webview
class PlanningWebview {
  constructor(context) {
    this.context = context;
    this.panel = null;
  }
  
  show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }
    
    this.panel = this.context.window.createWebviewPanel(
      'mo-planning',
      'Mo: Project Planning',
      { viewColumn: 'active' },
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    this.panel.webview.html = this.getHtml();
    
    this.panel.webview.onDidReceiveMessage(message => {
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
    });
    
    this.panel.onDidDispose(() => {
      this.panel = null;
    });
  }
  
  getHtml() {
    return `
      <!DOCTYPE html>
      <html>
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
          }
          
          h1, h2 {
            color: var(--vscode-editor-foreground);
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          label {
            display: block;
            margin-bottom: 5px;
          }
          
          textarea {
            width: 100%;
            height: 150px;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
          }
          
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
          
          .task-list {
            margin-top: 20px;
          }
          
          .task {
            padding: 10px;
            margin-bottom: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
          }
          
          .task-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          
          .task-title {
            font-weight: bold;
          }
          
          .task-controls {
            display: flex;
            gap: 10px;
          }
          
          .hidden {
            display: none;
          }
        </style>
      </head>
      <body>
        <h1>Project Planning</h1>
        
        <div class="form-group">
          <label for="description">Project Description</label>
          <textarea id="description" placeholder="Describe your project or feature..."></textarea>
        </div>
        
        <div class="form-group">
          <button id="generate">Generate Tasks</button>
        </div>
        
        <div id="loading" class="hidden">
          <p>Generating tasks...</p>
        </div>
        
        <div id="task-container" class="hidden">
          <h2>Generated Tasks</h2>
          <div id="task-list" class="task-list"></div>
          
          <div class="form-group">
            <button id="push-linear">Push to Linear</button>
            <button id="add-queue">Add to Queue</button>
          </div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          const description = document.getElementById('description');
          const generateButton = document.getElementById('generate');
          const loading = document.getElementById('loading');
          const taskContainer = document.getElementById('task-container');
          const taskList = document.getElementById('task-list');
          const pushLinearButton = document.getElementById('push-linear');
          const addQueueButton = document.getElementById('add-queue');
          
          let generatedTasks = [];
          
          generateButton.addEventListener('click', () => {
            if (!description.value.trim()) {
              alert('Please enter a project description');
              return;
            }
            
            loading.classList.remove('hidden');
            taskContainer.classList.add('hidden');
            
            vscode.postMessage({
              command: 'generateTasks',
              description: description.value
            });
          });
          
          pushLinearButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'pushToLinear',
              tasks: generatedTasks
            });
          });
          
          addQueueButton.addEventListener('click', () => {
            vscode.postMessage({
              command: 'addToQueue',
              tasks: generatedTasks
            });
          });
          
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
              case 'tasksGenerated':
                loading.classList.add('hidden');
                generatedTasks = message.tasks;
                
                taskList.innerHTML = '';
                generatedTasks.forEach((task, index) => {
                  const taskElement = document.createElement('div');
                  taskElement.className = 'task';
                  taskElement.innerHTML = `
                    <div class="task-header">
                      <div class="task-title">${task.title}</div>
                      <div class="task-controls">
                        <input type="number" min="1" max="5" placeholder="Priority" value="${task.priority || ''}" data-index="${index}" data-field="priority">
                        <input type="number" min="1" max="10" placeholder="Estimate" value="${task.estimate || ''}" data-index="${index}" data-field="estimate">
                      </div>
                    </div>
                    <div>${task.description}</div>
                  `;
                  taskList.appendChild(taskElement);
                  
                  const inputs = taskElement.querySelectorAll('input');
                  inputs.forEach(input => {
                    input.addEventListener('change', e => {
                      const index = parseInt(e.target.dataset.index);
                      const field = e.target.dataset.field;
                      const value = parseInt(e.target.value);
                      
                      if (!isNaN(value)) {
                        generatedTasks[index][field] = value;
                      }
                    });
                  });
                });
                
                taskContainer.classList.remove('hidden');
                break;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
  
  generateTasks(description) {
    // Generate mock tasks based on description
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
    
    this.panel.webview.postMessage({
      command: 'tasksGenerated',
      tasks
    });
  }
  
  pushToLinear(tasks) {
    this.context.window.showInformationMessage(`Pushed ${tasks.length} tasks to Linear`);
  }
  
  addToQueue(tasks) {
    this.context.window.showInformationMessage(`Added ${tasks.length} tasks to queue`);
  }
}

// Activate function
function activate(context) {
  console.log('Activating Mo Plugin - Linear Project Management');
  
  // Create providers
  const taskSidebarProvider = new TaskSidebarProvider();
  const taskDetailsWebview = new TaskDetailsWebview(context);
  const planningWebview = new PlanningWebview(context);
  
  // Register commands
  context.subscriptions.push(
    context.commands.registerCommand('mo-plugin-cursor.planProject', () => {
      planningWebview.show();
    })
  );
  
  context.subscriptions.push(
    context.commands.registerCommand('mo-plugin-cursor.showTasks', () => {
      context.window.showInformationMessage('Showing tasks');
      taskSidebarProvider.refresh();
    })
  );
  
  context.subscriptions.push(
    context.commands.registerCommand('mo-plugin-cursor.exportTasks', () => {
      context.window.showInformationMessage('Tasks exported to /tasks directory');
    })
  );
  
  context.subscriptions.push(
    context.commands.registerCommand('mo-plugin-cursor.syncWithLinear', () => {
      context.window.showInformationMessage('Synced with Linear');
      taskSidebarProvider.refresh();
    })
  );
  
  context.subscriptions.push(
    context.commands.registerCommand('mo-plugin-cursor.viewTaskDetails', (task) => {
      taskDetailsWebview.show(task);
    })
  );
  
  // Register tree data provider
  let treeDataChanged = () => {};
  context.subscriptions.push(
    context.window.registerTreeDataProvider('mo-task-sidebar', {
      getTreeItem: (task) => taskSidebarProvider.getTreeItem(task),
      getChildren: () => taskSidebarProvider.getChildren(),
      onDidChangeTreeData: (listener) => {
        treeDataChanged = listener;
        taskSidebarProvider.onDidChangeTreeDataEmitter = () => treeDataChanged();
        return { dispose: () => {} };
      }
    })
  );
  
  console.log('Mo Plugin activated');
}

// Deactivate function
function deactivate() {
  console.log('Mo Plugin deactivated');
}

module.exports = {
  activate,
  deactivate
}; 