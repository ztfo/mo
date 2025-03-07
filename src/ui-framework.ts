/**
 * UI Framework for Mo Plugin
 * 
 * This module provides the foundation for creating UI components within Cursor.
 * It handles webview panel creation, messaging, and state management.
 */

import { Task, TaskQueue } from './task-queue';

// Types for Cursor UI API
export interface CursorWebview {
  postMessage: (message: any) => void;
  onDidReceiveMessage: (callback: (message: any) => void) => { dispose: () => void };
  html: string;
  dispose: () => void;
}

export interface CursorWebviewOptions {
  title: string;
  viewColumn?: 'active' | 'beside';
  preserveFocus?: boolean;
}

export interface CursorUI {
  createWebviewPanel: (id: string, options: CursorWebviewOptions) => CursorWebview;
  showInformationMessage: (message: string) => void;
  showErrorMessage: (message: string) => void;
  showWarningMessage: (message: string) => void;
}

// Mock implementation for development/testing
let mockWebviews: Record<string, CursorWebview> = {};

export const mockCursorUI: CursorUI = {
  createWebviewPanel: (id: string, options: CursorWebviewOptions) => {
    console.log(`Creating webview panel: ${id} with title: ${options.title}`);
    
    const webview: CursorWebview = {
      postMessage: (message: any) => {
        console.log(`[${id}] Posting message:`, message);
      },
      onDidReceiveMessage: (callback: (message: any) => void) => {
        console.log(`[${id}] Registered message handler`);
        return { dispose: () => console.log(`[${id}] Disposed message handler`) };
      },
      html: '',
      dispose: () => {
        console.log(`[${id}] Disposed webview`);
        delete mockWebviews[id];
      }
    };
    
    mockWebviews[id] = webview;
    return webview;
  },
  showInformationMessage: (message: string) => {
    console.log(`[INFO] ${message}`);
  },
  showErrorMessage: (message: string) => {
    console.error(`[ERROR] ${message}`);
  },
  showWarningMessage: (message: string) => {
    console.warn(`[WARNING] ${message}`);
  }
};

// Base class for UI components
export abstract class UIComponent {
  protected id: string;
  protected webview: CursorWebview | null = null;
  protected ui: CursorUI;
  
  constructor(id: string, ui: CursorUI) {
    this.id = id;
    this.ui = ui;
  }
  
  protected abstract getHtml(): string;
  
  public show(options: CursorWebviewOptions): void {
    if (this.webview) {
      // Update existing webview
      this.webview.html = this.getHtml();
      return;
    }
    
    // Create new webview
    this.webview = this.ui.createWebviewPanel(this.id, options);
    this.webview.html = this.getHtml();
    
    // Set up message handling
    this.webview.onDidReceiveMessage(this.handleMessage.bind(this));
  }
  
  public hide(): void {
    if (this.webview) {
      this.webview.dispose();
      this.webview = null;
    }
  }
  
  public isVisible(): boolean {
    return this.webview !== null;
  }
  
  public postMessage(message: any): void {
    if (this.webview) {
      this.webview.postMessage(message);
    }
  }
  
  protected abstract handleMessage(message: any): void;
}

// Task Queue Panel
export class TaskQueuePanel extends UIComponent {
  private taskQueue: TaskQueue;
  private onTaskPush: (tasks: Task[]) => Promise<void>;
  
  constructor(ui: CursorUI, onTaskPush: (tasks: Task[]) => Promise<void>) {
    super('mo-task-queue', ui);
    this.taskQueue = TaskQueue.getInstance();
    this.onTaskPush = onTaskPush;
    
    // Listen for task changes
    this.taskQueue.addChangeListener(tasks => {
      if (this.webview) {
        this.postMessage({ type: 'updateTasks', tasks });
      }
    });
  }
  
  public setTasks(tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): void {
    this.taskQueue.addTasks(tasks);
  }
  
  protected getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mo Task Queue</title>
        <style>
          :root {
            --background-color: #1e1e1e;
            --text-color: #e1e1e1;
            --primary-color: #5e6ad2;
            --secondary-color: #f2c94c;
            --success-color: #27ae60;
            --error-color: #eb5757;
            --border-color: #444444;
            --modal-background: rgba(0, 0, 0, 0.7);
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            padding: 16px;
            margin: 0;
          }
          
          h1 {
            font-size: 18px;
            margin-bottom: 16px;
            color: var(--primary-color);
          }
          
          .task-list {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 16px;
          }
          
          .task-item {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: flex-start;
            gap: 8px;
            cursor: grab;
            transition: background-color 0.2s;
          }
          
          .task-item:last-child {
            border-bottom: none;
          }
          
          .task-item.dragging {
            opacity: 0.5;
            background-color: #333333;
          }
          
          .task-item.drag-over {
            border-top: 2px solid var(--primary-color);
          }
          
          .task-checkbox {
            margin-top: 4px;
          }
          
          .task-content {
            flex: 1;
          }
          
          .task-title {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .task-description {
            font-size: 12px;
            color: #888888;
            margin-bottom: 8px;
          }
          
          .task-meta {
            font-size: 12px;
            color: #888888;
            display: flex;
            gap: 16px;
          }
          
          .task-actions {
            display: flex;
            gap: 8px;
          }
          
          .button-group {
            display: flex;
            justify-content: space-between;
            margin-top: 16px;
            gap: 8px;
          }
          
          button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          button:hover {
            opacity: 0.9;
          }
          
          button:disabled {
            background-color: #555555;
            cursor: not-allowed;
          }
          
          .secondary-button {
            background-color: transparent;
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
          }
          
          .danger-button {
            background-color: var(--error-color);
          }
          
          .empty-state {
            text-align: center;
            padding: 32px;
            color: #888888;
          }
          
          .sort-controls {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          select {
            background-color: var(--background-color);
            color: var(--text-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 14px;
          }
          
          /* Modal styles */
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--modal-background);
            z-index: 100;
            justify-content: center;
            align-items: center;
          }
          
          .modal-content {
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 16px;
            width: 80%;
            max-width: 500px;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          
          .modal-title {
            font-size: 18px;
            font-weight: 500;
          }
          
          .modal-close {
            background: none;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            font-size: 18px;
            padding: 0;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          .form-label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
          }
          
          .form-control {
            width: 100%;
            background-color: #2d2d2d;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 8px;
            color: var(--text-color);
            font-family: inherit;
            font-size: 14px;
          }
          
          textarea.form-control {
            min-height: 80px;
            resize: vertical;
          }
          
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 16px;
          }
          
          .batch-actions {
            display: none;
            margin-bottom: 16px;
            padding: 8px;
            background-color: #2d2d2d;
            border: 1px solid var(--border-color);
            border-radius: 4px;
          }
          
          .batch-actions.visible {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          
          .batch-count {
            margin-right: auto;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>Mo Task Queue</h1>
        <div class="sort-controls">
          <select id="sort-key">
            <option value="createdAt">Created Date</option>
            <option value="priority">Priority</option>
            <option value="estimate">Estimate</option>
            <option value="title">Title</option>
          </select>
          <select id="sort-order">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button onclick="handleSort()" class="secondary-button">Sort</button>
        </div>
        
        <!-- Batch Actions -->
        <div id="batch-actions" class="batch-actions">
          <div class="batch-count">0 tasks selected</div>
          <button id="batch-priority" class="secondary-button">Set Priority</button>
          <button id="batch-estimate" class="secondary-button">Set Estimate</button>
          <button id="batch-delete" class="danger-button">Delete Selected</button>
        </div>
        
        <div id="task-container">
          <div class="empty-state">No tasks in queue. Use /plan-project to generate tasks.</div>
        </div>
        <div class="button-group">
          <div>
            <button id="push-button" disabled>Push Selected to Linear</button>
            <button id="select-all" class="secondary-button" disabled>Select All</button>
          </div>
          <button id="clear-button" class="danger-button" disabled>Clear Queue</button>
        </div>
        
        <!-- Edit Task Modal -->
        <div id="edit-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">Edit Task</div>
              <button class="modal-close" onclick="closeEditModal()">&times;</button>
            </div>
            <form id="edit-task-form">
              <input type="hidden" id="edit-task-id">
              <div class="form-group">
                <label for="edit-title" class="form-label">Title</label>
                <input type="text" id="edit-title" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="edit-description" class="form-label">Description</label>
                <textarea id="edit-description" class="form-control"></textarea>
              </div>
              <div class="form-group">
                <label for="edit-priority" class="form-label">Priority</label>
                <select id="edit-priority" class="form-control">
                  <option value="0">No priority</option>
                  <option value="1">Urgent</option>
                  <option value="2">High</option>
                  <option value="3">Medium</option>
                  <option value="4">Low</option>
                </select>
              </div>
              <div class="form-group">
                <label for="edit-estimate" class="form-label">Estimate (points)</label>
                <input type="number" id="edit-estimate" class="form-control" min="1" max="5">
              </div>
              <div class="modal-footer">
                <button type="button" class="secondary-button" onclick="closeEditModal()">Cancel</button>
                <button type="submit" class="primary-button">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Priority Modal -->
        <div id="priority-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">Set Priority for Selected Tasks</div>
              <button class="modal-close" onclick="closePriorityModal()">&times;</button>
            </div>
            <form id="priority-form">
              <div class="form-group">
                <label for="batch-priority-value" class="form-label">Priority</label>
                <select id="batch-priority-value" class="form-control">
                  <option value="0">No priority</option>
                  <option value="1">Urgent</option>
                  <option value="2">High</option>
                  <option value="3">Medium</option>
                  <option value="4">Low</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="secondary-button" onclick="closePriorityModal()">Cancel</button>
                <button type="submit" class="primary-button">Apply</button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Estimate Modal -->
        <div id="estimate-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <div class="modal-title">Set Estimate for Selected Tasks</div>
              <button class="modal-close" onclick="closeEstimateModal()">&times;</button>
            </div>
            <form id="estimate-form">
              <div class="form-group">
                <label for="batch-estimate-value" class="form-label">Estimate (points)</label>
                <input type="number" id="batch-estimate-value" class="form-control" min="1" max="5">
              </div>
              <div class="modal-footer">
                <button type="button" class="secondary-button" onclick="closeEstimateModal()">Cancel</button>
                <button type="submit" class="primary-button">Apply</button>
              </div>
            </form>
          </div>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          let tasks = [];
          
          // Update UI based on tasks
          function updateUI() {
            const container = document.getElementById('task-container');
            const pushButton = document.getElementById('push-button');
            const selectAllButton = document.getElementById('select-all');
            const clearButton = document.getElementById('clear-button');
            
            if (tasks.length === 0) {
              container.innerHTML = '<div class="empty-state">No tasks in queue. Use /plan-project to generate tasks.</div>';
              pushButton.disabled = true;
              selectAllButton.disabled = true;
              clearButton.disabled = true;
              return;
            }
            
            let html = '<div class="task-list">';
            tasks.forEach((task, index) => {
              html += \`
                <div class="task-item" data-id="\${task.id}">
                  <input type="checkbox" class="task-checkbox" \${task.selected ? 'checked' : ''}>
                  <div class="task-content">
                    <div class="task-title">\${task.title}</div>
                    <div class="task-description">\${task.description}</div>
                    <div class="task-meta">
                      <span>Priority: \${task.priority || 'Not set'}</span>
                      <span>Estimate: \${task.estimate || 'Not set'}</span>
                      <span>Created: \${new Date(task.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="task-actions">
                    <button onclick="handleEdit('\${task.id}')" class="secondary-button">Edit</button>
                    <button onclick="handleDelete('\${task.id}')" class="danger-button">Delete</button>
                  </div>
                </div>
              \`;
            });
            html += '</div>';
            
            container.innerHTML = html;
            pushButton.disabled = !tasks.some(t => t.selected);
            selectAllButton.disabled = false;
            clearButton.disabled = false;
            
            // Add event listeners
            document.querySelectorAll('.task-checkbox').forEach(checkbox => {
              checkbox.addEventListener('change', handleCheckboxChange);
            });
            
            // Update batch actions
            updateBatchActions();
            
            // Initialize drag and drop after updating the task list
            initDragAndDrop();
          }
          
          // Handle checkbox changes
          function handleCheckboxChange(event) {
            const taskId = event.target.closest('.task-item').dataset.id;
            vscode.postMessage({ 
              type: 'selectTask',
              taskId,
              selected: event.target.checked
            });
            
            // Update batch actions
            updateBatchActions();
          }
          
          // Handle sorting
          function handleSort() {
            const key = document.getElementById('sort-key').value;
            const ascending = document.getElementById('sort-order').value === 'asc';
            vscode.postMessage({ 
              type: 'sortTasks',
              key,
              ascending
            });
          }
          
          // Edit modal functions
          function openEditModal(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            // Populate form fields
            document.getElementById('edit-task-id').value = task.id;
            document.getElementById('edit-title').value = task.title;
            document.getElementById('edit-description').value = task.description || '';
            document.getElementById('edit-priority').value = task.priority || '0';
            document.getElementById('edit-estimate').value = task.estimate || '';
            
            // Show modal
            const modal = document.getElementById('edit-modal');
            modal.style.display = 'flex';
          }
          
          function closeEditModal() {
            const modal = document.getElementById('edit-modal');
            modal.style.display = 'none';
          }
          
          // Handle editing
          function handleEdit(taskId) {
            openEditModal(taskId);
          }
          
          // Handle deletion
          function handleDelete(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
              vscode.postMessage({ 
                type: 'removeTask',
                taskId
              });
            }
          }
          
          // Set up button event listeners
          document.getElementById('push-button').addEventListener('click', () => {
            const selectedTasks = tasks.filter(t => t.selected);
            vscode.postMessage({ type: 'pushTasks', tasks: selectedTasks });
          });
          
          document.getElementById('select-all').addEventListener('click', () => {
            const allSelected = tasks.every(t => t.selected);
            vscode.postMessage({ type: 'selectAll', selected: !allSelected });
          });
          
          document.getElementById('clear-button').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all tasks?')) {
              vscode.postMessage({ type: 'clearTasks' });
            }
          });
          
          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'updateTasks':
                tasks = message.tasks;
                updateUI();
                break;
              case 'updateTask':
                const updatedTask = this.taskQueue.updateTask(message.taskId, message.updates);
                if (updatedTask) {
                  this.ui.showInformationMessage('Task updated');
                }
                break;
            }
          });
          
          // Drag and drop functionality
          let draggedTask = null;
          
          function initDragAndDrop() {
            const taskItems = document.querySelectorAll('.task-item');
            
            taskItems.forEach(item => {
              // Make task draggable
              item.setAttribute('draggable', 'true');
              
              // Drag start
              item.addEventListener('dragstart', function(e) {
                draggedTask = this;
                setTimeout(() => {
                  this.classList.add('dragging');
                }, 0);
                
                // Set data transfer
                e.dataTransfer.setData('text/plain', this.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
              });
              
              // Drag end
              item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                draggedTask = null;
                
                // Remove all drag-over classes
                document.querySelectorAll('.drag-over').forEach(el => {
                  el.classList.remove('drag-over');
                });
              });
              
              // Drag over
              item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (this !== draggedTask) {
                  this.classList.add('drag-over');
                }
              });
              
              // Drag leave
              item.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
              });
              
              // Drop
              item.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                if (this !== draggedTask) {
                  const draggedId = e.dataTransfer.getData('text/plain');
                  const targetId = this.dataset.id;
                  
                  // Find indices
                  const draggedIndex = tasks.findIndex(t => t.id === draggedId);
                  const targetIndex = tasks.findIndex(t => t.id === targetId);
                  
                  if (draggedIndex !== -1 && targetIndex !== -1) {
                    vscode.postMessage({
                      type: 'reorderTask',
                      taskId: draggedId,
                      newIndex: targetIndex
                    });
                  }
                }
              });
            });
          }
          
          // Update batch actions visibility
          function updateBatchActions() {
            const selectedTasks = tasks.filter(t => t.selected);
            const batchActions = document.getElementById('batch-actions');
            const batchCount = document.querySelector('.batch-count');
            
            if (selectedTasks.length > 0) {
              batchActions.classList.add('visible');
              batchCount.textContent = \`\${selectedTasks.length} task\${selectedTasks.length === 1 ? '' : 's'} selected\`;
            } else {
              batchActions.classList.remove('visible');
            }
          }
          
          // Priority modal functions
          function openPriorityModal() {
            const modal = document.getElementById('priority-modal');
            modal.style.display = 'flex';
          }
          
          function closePriorityModal() {
            const modal = document.getElementById('priority-modal');
            modal.style.display = 'none';
          }
          
          // Estimate modal functions
          function openEstimateModal() {
            const modal = document.getElementById('estimate-modal');
            modal.style.display = 'flex';
          }
          
          function closeEstimateModal() {
            const modal = document.getElementById('estimate-modal');
            modal.style.display = 'none';
          }
          
          // Set up batch action buttons
          document.getElementById('batch-priority').addEventListener('click', openPriorityModal);
          document.getElementById('batch-estimate').addEventListener('click', openEstimateModal);
          document.getElementById('batch-delete').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all selected tasks?')) {
              const selectedIds = tasks.filter(t => t.selected).map(t => t.id);
              vscode.postMessage({ 
                type: 'removeTasks',
                taskIds: selectedIds
              });
            }
          });
          
          // Set up batch form submissions
          document.getElementById('priority-form').addEventListener('submit', function(event) {
            event.preventDefault();
            
            const priority = parseInt(document.getElementById('batch-priority-value').value);
            const selectedIds = tasks.filter(t => t.selected).map(t => t.id);
            
            vscode.postMessage({ 
              type: 'updateTasksBatch',
              taskIds: selectedIds,
              updates: { priority }
            });
            
            closePriorityModal();
          });
          
          document.getElementById('estimate-form').addEventListener('submit', function(event) {
            event.preventDefault();
            
            const estimate = parseInt(document.getElementById('batch-estimate-value').value);
            const selectedIds = tasks.filter(t => t.selected).map(t => t.id);
            
            vscode.postMessage({ 
              type: 'updateTasksBatch',
              taskIds: selectedIds,
              updates: { estimate }
            });
            
            closeEstimateModal();
          });
          
          // Initial UI update
          updateUI();
        </script>
      </body>
      </html>
    `;
  }
  
  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'pushTasks':
        this.onTaskPush(message.tasks)
          .then(() => {
            // Remove pushed tasks from queue
            message.tasks.forEach((task: Task) => {
              this.taskQueue.removeTask(task.id);
            });
            this.ui.showInformationMessage('Tasks pushed to Linear successfully');
          })
          .catch(error => {
            this.ui.showErrorMessage(`Failed to push tasks: ${error.message}`);
          });
        break;
        
      case 'clearTasks':
        this.taskQueue.clearTasks();
        this.ui.showInformationMessage('Task queue cleared');
        break;
        
      case 'selectTask':
        this.taskQueue.selectTask(message.taskId, message.selected);
        break;
        
      case 'selectAll':
        this.taskQueue.selectAll(message.selected);
        break;
        
      case 'removeTask':
        if (this.taskQueue.removeTask(message.taskId)) {
          this.ui.showInformationMessage('Task removed');
        }
        break;
        
      case 'sortTasks':
        this.taskQueue.sortTasks(message.key, message.ascending);
        break;
        
      case 'updateTask':
        const updatedTask = this.taskQueue.updateTask(message.taskId, message.updates);
        if (updatedTask) {
          this.ui.showInformationMessage('Task updated');
        }
        break;
        
      case 'reorderTask':
        this.taskQueue.reorderTask(message.taskId, message.newIndex);
        break;
        
      case 'removeTasks':
        const removedCount = this.taskQueue.removeTasks(message.taskIds);
        if (removedCount > 0) {
          this.ui.showInformationMessage(`${removedCount} tasks removed`);
        }
        break;
        
      case 'updateTasksBatch':
        let updatedCount = 0;
        message.taskIds.forEach((id: string) => {
          if (this.taskQueue.updateTask(id, message.updates)) {
            updatedCount++;
          }
        });
        if (updatedCount > 0) {
          this.ui.showInformationMessage(`Updated ${updatedCount} tasks`);
        }
        break;
    }
  }
}

// Linear Sync Panel
export class LinearSyncPanel extends UIComponent {
  private issues: any[] = [];
  private onRefresh: () => Promise<any[]>;
  
  constructor(ui: CursorUI, onRefresh: () => Promise<any[]>) {
    super('mo-linear-sync', ui);
    this.onRefresh = onRefresh;
  }
  
  public setIssues(issues: any[]): void {
    this.issues = issues;
    if (this.webview) {
      this.postMessage({ type: 'updateIssues', issues });
    }
  }
  
  protected getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mo Linear Sync</title>
        <style>
          :root {
            --background-color: #1e1e1e;
            --text-color: #e1e1e1;
            --primary-color: #5e6ad2;
            --secondary-color: #f2c94c;
            --success-color: #27ae60;
            --error-color: #eb5757;
            --border-color: #444444;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            padding: 16px;
            margin: 0;
          }
          
          h1 {
            font-size: 18px;
            margin-bottom: 16px;
            color: var(--primary-color);
          }
          
          .issue-list {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 16px;
          }
          
          .issue-item {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
          }
          
          .issue-item:last-child {
            border-bottom: none;
          }
          
          .issue-header {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
          }
          
          .issue-id {
            font-family: monospace;
            background-color: rgba(94, 106, 210, 0.2);
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 8px;
          }
          
          .issue-title {
            font-weight: bold;
            flex: 1;
          }
          
          .issue-meta {
            display: flex;
            font-size: 12px;
            color: #888888;
          }
          
          .issue-meta > div {
            margin-right: 16px;
          }
          
          .state-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: #555555;
          }
          
          .priority-badge {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
          }
          
          .priority-1 { background-color: #eb5757; }
          .priority-2 { background-color: #f2c94c; }
          .priority-3 { background-color: #27ae60; }
          .priority-4 { background-color: #5e6ad2; }
          
          .button-group {
            display: flex;
            justify-content: flex-start;
            margin-top: 16px;
          }
          
          button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 8px;
          }
          
          button:hover {
            opacity: 0.9;
          }
          
          .empty-state {
            text-align: center;
            padding: 32px;
            color: #888888;
          }
          
          .loading {
            text-align: center;
            padding: 32px;
            color: var(--primary-color);
          }
        </style>
      </head>
      <body>
        <h1>Linear Issues</h1>
        <div id="issue-container">
          <div class="empty-state">No issues loaded. Click Refresh to load issues.</div>
        </div>
        <div class="button-group">
          <button id="refresh-button">Refresh</button>
        </div>
        
        <script>
          // Initialize state
          let issues = ${JSON.stringify(this.issues)};
          let isLoading = false;
          const vscode = acquireVsCodeApi();
          
          // Update UI based on issues
          function updateUI() {
            const container = document.getElementById('issue-container');
            
            if (isLoading) {
              container.innerHTML = '<div class="loading">Loading issues...</div>';
              return;
            }
            
            if (issues.length === 0) {
              container.innerHTML = '<div class="empty-state">No issues found. Click Refresh to try again.</div>';
              return;
            }
            
            let html = '<div class="issue-list">';
            issues.forEach(issue => {
              const stateColor = issue.state.color || '#555555';
              
              html += \`
                <div class="issue-item">
                  <div class="issue-header">
                    <div class="issue-id">\${issue.identifier}</div>
                    <div class="issue-title">\${issue.title}</div>
                  </div>
                  <div class="issue-meta">
                    <div>
                      <span class="state-badge" style="background-color: \${stateColor}">\${issue.state.name}</span>
                    </div>
                    <div>
                      <span class="priority-badge priority-\${issue.priority}"></span>
                      Priority: \${issue.priority}
                    </div>
                    <div>
                      <a href="\${issue.url}" target="_blank">View in Linear</a>
                    </div>
                  </div>
                </div>
              \`;
            });
            html += '</div>';
            
            container.innerHTML = html;
          }
          
          // Set up button event listeners
          document.getElementById('refresh-button').addEventListener('click', () => {
            isLoading = true;
            updateUI();
            vscode.postMessage({ type: 'refreshIssues' });
          });
          
          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'updateIssues':
                issues = message.issues;
                isLoading = false;
                updateUI();
                break;
            }
          });
          
          // Initial UI update
          updateUI();
        </script>
      </body>
      </html>
    `;
  }
  
  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'refreshIssues':
        this.onRefresh()
          .then(issues => {
            this.issues = issues;
            this.postMessage({ type: 'updateIssues', issues });
          })
          .catch(error => {
            this.ui.showErrorMessage(`Failed to refresh issues: ${error.message}`);
            this.postMessage({ type: 'updateIssues', issues: this.issues });
          });
        break;
    }
  }
}

// Settings Panel
export class SettingsPanel extends UIComponent {
  private settings: Record<string, any> = {};
  private onSave: (settings: Record<string, any>) => Promise<void>;
  
  constructor(ui: CursorUI, onSave: (settings: Record<string, any>) => Promise<void>) {
    super('mo-settings', ui);
    this.onSave = onSave;
  }
  
  public setSettings(settings: Record<string, any>): void {
    this.settings = settings;
    if (this.webview) {
      this.postMessage({ type: 'updateSettings', settings });
    }
  }
  
  protected getHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mo Settings</title>
        <style>
          :root {
            --background-color: #1e1e1e;
            --text-color: #e1e1e1;
            --primary-color: #5e6ad2;
            --secondary-color: #f2c94c;
            --success-color: #27ae60;
            --error-color: #eb5757;
            --border-color: #444444;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            padding: 16px;
            margin: 0;
          }
          
          h1 {
            font-size: 18px;
            margin-bottom: 16px;
            color: var(--primary-color);
          }
          
          h2 {
            font-size: 16px;
            margin-top: 24px;
            margin-bottom: 8px;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          label {
            display: block;
            margin-bottom: 4px;
          }
          
          input, select {
            width: 100%;
            padding: 8px;
            background-color: #333333;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: var(--text-color);
          }
          
          .checkbox-group {
            display: flex;
            align-items: center;
          }
          
          .checkbox-group input {
            width: auto;
            margin-right: 8px;
          }
          
          .button-group {
            display: flex;
            justify-content: flex-start;
            margin-top: 24px;
          }
          
          button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 14px;
            margin-right: 8px;
          }
          
          button:hover {
            opacity: 0.9;
          }
          
          .secondary-button {
            background-color: transparent;
            border: 1px solid var(--primary-color);
            color: var(--primary-color);
          }
        </style>
      </head>
      <body>
        <h1>Mo Settings</h1>
        
        <h2>Linear API</h2>
        <div class="form-group">
          <label for="linear-api-key">API Key</label>
          <input type="password" id="linear-api-key" placeholder="Linear API Key">
        </div>
        <div class="form-group">
          <label for="linear-team-id">Team ID</label>
          <input type="text" id="linear-team-id" placeholder="Linear Team ID">
        </div>
        
        <h2>Task Queue</h2>
        <div class="form-group">
          <label for="default-priority">Default Priority</label>
          <select id="default-priority">
            <option value="1">1 - Urgent</option>
            <option value="2" selected>2 - High</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - Low</option>
          </select>
        </div>
        <div class="form-group">
          <label for="default-estimate">Default Estimate</label>
          <select id="default-estimate">
            <option value="1">1 - Very Small</option>
            <option value="2" selected>2 - Small</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - Large</option>
            <option value="5">5 - Very Large</option>
          </select>
        </div>
        
        <h2>Sync Settings</h2>
        <div class="form-group">
          <label for="sync-interval">Sync Interval (minutes)</label>
          <input type="number" id="sync-interval" min="1" max="60" value="5">
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" id="auto-sync" checked>
          <label for="auto-sync">Enable automatic sync</label>
        </div>
        
        <div class="button-group">
          <button id="save-button">Save Settings</button>
          <button id="reset-button" class="secondary-button">Reset to Defaults</button>
        </div>
        
        <script>
          // Initialize state
          let settings = ${JSON.stringify(this.settings)};
          const vscode = acquireVsCodeApi();
          
          // Update form with settings
          function updateForm() {
            document.getElementById('linear-api-key').value = settings.linearApiKey || '';
            document.getElementById('linear-team-id').value = settings.linearTeamId || '';
            document.getElementById('default-priority').value = settings.defaultPriority || '2';
            document.getElementById('default-estimate').value = settings.defaultEstimate || '2';
            document.getElementById('sync-interval').value = settings.syncInterval || '5';
            document.getElementById('auto-sync').checked = settings.autoSync !== false;
          }
          
          // Get settings from form
          function getFormSettings() {
            return {
              linearApiKey: document.getElementById('linear-api-key').value,
              linearTeamId: document.getElementById('linear-team-id').value,
              defaultPriority: document.getElementById('default-priority').value,
              defaultEstimate: document.getElementById('default-estimate').value,
              syncInterval: document.getElementById('sync-interval').value,
              autoSync: document.getElementById('auto-sync').checked
            };
          }
          
          // Set up button event listeners
          document.getElementById('save-button').addEventListener('click', () => {
            const newSettings = getFormSettings();
            vscode.postMessage({ type: 'saveSettings', settings: newSettings });
          });
          
          document.getElementById('reset-button').addEventListener('click', () => {
            vscode.postMessage({ type: 'resetSettings' });
          });
          
          // Handle messages from extension
          window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
              case 'updateSettings':
                settings = message.settings;
                updateForm();
                break;
            }
          });
          
          // Initial form update
          updateForm();
        </script>
      </body>
      </html>
    `;
  }
  
  protected handleMessage(message: any): void {
    switch (message.type) {
      case 'saveSettings':
        this.settings = message.settings;
        this.onSave(this.settings)
          .then(() => {
            this.ui.showInformationMessage('Settings saved successfully');
          })
          .catch(error => {
            this.ui.showErrorMessage(`Failed to save settings: ${error.message}`);
          });
        break;
        
      case 'resetSettings':
        this.settings = {
          linearApiKey: process.env.LINEAR_API_KEY || '',
          linearTeamId: process.env.LINEAR_TEAM_ID || '',
          defaultPriority: '2',
          defaultEstimate: '2',
          syncInterval: '5',
          autoSync: true
        };
        this.postMessage({ type: 'updateSettings', settings: this.settings });
        break;
    }
  }
}

// UI Manager to handle all UI components
export class UIManager {
  private ui: CursorUI;
  private taskQueuePanel: TaskQueuePanel;
  private linearSyncPanel: LinearSyncPanel;
  private settingsPanel: SettingsPanel;
  
  constructor(ui: CursorUI) {
    this.ui = ui;
    
    // Initialize panels
    this.taskQueuePanel = new TaskQueuePanel(ui, this.handleTaskPush.bind(this));
    this.linearSyncPanel = new LinearSyncPanel(ui, this.handleIssueRefresh.bind(this));
    this.settingsPanel = new SettingsPanel(ui, this.handleSettingsSave.bind(this));
  }
  
  // Task Queue methods
  public showTaskQueue(): void {
    this.taskQueuePanel.show({ title: 'Mo Task Queue' });
  }
  
  public updateTaskQueue(tasks: any[]): void {
    this.taskQueuePanel.setTasks(tasks);
  }
  
  // Linear Sync methods
  public showLinearSync(): void {
    this.linearSyncPanel.show({ title: 'Mo Linear Sync' });
  }
  
  public updateLinearIssues(issues: any[]): void {
    this.linearSyncPanel.setIssues(issues);
  }
  
  // Settings methods
  public showSettings(): void {
    this.settingsPanel.show({ title: 'Mo Settings' });
  }
  
  public updateSettings(settings: Record<string, any>): void {
    this.settingsPanel.setSettings(settings);
  }
  
  // Event handlers
  private async handleTaskPush(tasks: any[]): Promise<void> {
    // This will be implemented in the extension.ts file
    // For now, just log the tasks
    console.log('Pushing tasks to Linear:', tasks);
    return Promise.resolve();
  }
  
  private async handleIssueRefresh(): Promise<any[]> {
    // This will be implemented in the extension.ts file
    // For now, just return an empty array
    console.log('Refreshing issues from Linear');
    return Promise.resolve([]);
  }
  
  private async handleSettingsSave(settings: Record<string, any>): Promise<void> {
    // This will be implemented in the extension.ts file
    // For now, just log the settings
    console.log('Saving settings:', settings);
    return Promise.resolve();
  }
} 