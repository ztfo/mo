import { CursorUI, CursorWebview } from '../ui-framework';
import * as path from 'path';
import * as os from 'os';

/**
 * Export Dialog Component
 *
 * This component provides a webview for configuring and exporting tasks to markdown files.
 */
export class ExportDialog {
  private webview: CursorWebview | null = null;
  private ui: CursorUI;
  private tasks: any[] = [];
  private exportCallback: (tasks: any[], options: any) => Promise<void>;

  constructor(ui: CursorUI, exportCallback: (tasks: any[], options: any) => Promise<void>) {
    this.ui = ui;
    this.exportCallback = exportCallback;
  }

  /**
   * Show the export dialog with tasks
   */
  public show(tasks: any[]): void {
    this.tasks = tasks;

    if (this.webview) {
      // Update existing webview
      this.webview.html = this.getHtml();
      return;
    }

    // Create new webview
    this.webview = this.ui.createWebviewPanel('mo-export', {
      title: 'Export Tasks',
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
   * Hide the export dialog
   */
  public hide(): void {
    if (this.webview) {
      this.webview.dispose();
      this.webview = null;
    }
  }

  /**
   * Check if the export dialog is visible
   */
  public isVisible(): boolean {
    return this.webview !== null;
  }

  /**
   * Generate HTML for the export dialog
   */
  private getHtml(): string {
    const tasksJson = JSON.stringify(this.tasks);
    const defaultExportPath = path.join(process.cwd(), 'tasks');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Export Tasks</title>
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

          input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
          }

          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 8px;
          }

          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }

          .task-list {
            margin-top: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            overflow: auto;
            max-height: 300px;
          }

          .task {
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background-color: var(--vscode-editor-background);
            display: flex;
            align-items: center;
          }

          .task:last-child {
            border-bottom: none;
          }

          .task-checkbox {
            margin-right: 10px;
          }

          .task-info {
            flex-grow: 1;
          }

          .task-title {
            font-weight: bold;
          }

          .task-meta {
            font-size: 0.8em;
            color: var(--vscode-descriptionForeground);
            margin-top: 2px;
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

          .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 20px;
          }

          .tab {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
          }

          .tab.active {
            border-bottom: 2px solid var(--vscode-button-background);
            font-weight: bold;
          }

          .tab-content {
            display: none;
          }

          .tab-content.active {
            display: block;
          }

          .selection-controls {
            margin-bottom: 10px;
            display: flex;
            gap: 10px;
          }

          .preview {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow: auto;
          }

          .directory-structure {
            font-family: monospace;
            white-space: pre;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Export Tasks</h1>

          <div class="tabs">
            <div class="tab active" data-tab="tasks">Tasks</div>
            <div class="tab" data-tab="organization">Organization</div>
            <div class="tab" data-tab="format">Format</div>
            <div class="tab" data-tab="preview">Preview</div>
          </div>

          <div class="error hidden" id="error-message"></div>
          <div class="success hidden" id="success-message"></div>

          <div class="tab-content active" id="tasks-tab">
            <div class="form-group">
              <label>Task Selection</label>
              <div class="selection-controls">
                <button id="select-all">Select All</button>
                <button id="select-none">Select None</button>
                <span id="selection-count">0 tasks selected</span>
              </div>
              <div class="task-list" id="task-list"></div>
            </div>
          </div>

          <div class="tab-content" id="organization-tab">
            <div class="form-group">
              <label for="export-location">Export Location</label>
              <input type="text" id="export-location" value="${defaultExportPath}">
            </div>

            <div class="form-group">
              <label for="organization-type">Organization Structure</label>
              <select id="organization-type">
                <option value="flat">Flat (All files in one directory)</option>
                <option value="status" selected>By Status</option>
                <option value="priority">By Priority</option>
                <option value="project">By Project</option>
              </select>
            </div>

            <div class="form-group">
              <label>Directory Structure Preview</label>
              <div class="directory-structure" id="directory-structure"></div>
            </div>
          </div>

          <div class="tab-content" id="format-tab">
            <div class="form-group">
              <label for="template">Template</label>
              <select id="template">
                <option value="default" selected>Default Template</option>
                <option value="minimal">Minimal Template</option>
                <option value="detailed">Detailed Template</option>
              </select>
            </div>

            <div class="form-group">
              <label>Sections to Include</label>
              <div>
                <input type="checkbox" id="section-overview" checked>
                <label for="section-overview">Overview</label>
              </div>
              <div>
                <input type="checkbox" id="section-requirements" checked>
                <label for="section-requirements">Technical Requirements</label>
              </div>
              <div>
                <input type="checkbox" id="section-implementation" checked>
                <label for="section-implementation">Implementation Details</label>
              </div>
              <div>
                <input type="checkbox" id="section-references" checked>
                <label for="section-references">References</label>
              </div>
              <div>
                <input type="checkbox" id="section-metadata" checked>
                <label for="section-metadata">Metadata</label>
              </div>
            </div>

            <div class="form-group">
              <label for="file-naming">File Naming Pattern</label>
              <select id="file-naming">
                <option value="id">Task ID (e.g., ABC-123)</option>
                <option value="title">Task Title (slugified)</option>
                <option value="id-title" selected>Task ID + Title (e.g., ABC-123-task-title)</option>
              </select>
            </div>
          </div>

          <div class="tab-content" id="preview-tab">
            <div class="form-group">
              <label>Task Preview</label>
              <div class="preview" id="preview-content"></div>
            </div>
          </div>

          <div class="form-group" style="margin-top: 30px; display: flex; justify-content: space-between;">
            <div>
              <button id="cancel-button">Cancel</button>
            </div>
            <div>
              <button id="export-button">Export Tasks</button>
            </div>
          </div>

          <div id="loading" class="loading hidden">
            <p>Exporting tasks...</p>
          </div>
        </div>

        <script>
          (function() {
            // Store tasks
            const tasks = ${tasksJson};
            let selectedTaskIds = new Set();

            // Get elements
            const taskList = document.getElementById('task-list');
            const selectAllButton = document.getElementById('select-all');
            const selectNoneButton = document.getElementById('select-none');
            const selectionCount = document.getElementById('selection-count');
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const exportLocation = document.getElementById('export-location');
            const organizationType = document.getElementById('organization-type');
            const directoryStructure = document.getElementById('directory-structure');
            const template = document.getElementById('template');
            const sectionOverview = document.getElementById('section-overview');
            const sectionRequirements = document.getElementById('section-requirements');
            const sectionImplementation = document.getElementById('section-implementation');
            const sectionReferences = document.getElementById('section-references');
            const sectionMetadata = document.getElementById('section-metadata');
            const fileNaming = document.getElementById('file-naming');
            const previewContent = document.getElementById('preview-content');
            const cancelButton = document.getElementById('cancel-button');
            const exportButton = document.getElementById('export-button');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            const loadingElement = document.getElementById('loading');

            // Helper functions
            function showError(message) {
              errorMessage.textContent = message;
              errorMessage.classList.remove('hidden');
              setTimeout(() => {
                errorMessage.classList.add('hidden');
              }, 5000);
            }

            function showSuccess(message) {
              successMessage.textContent = message;
              successMessage.classList.remove('hidden');
              setTimeout(() => {
                successMessage.classList.add('hidden');
              }, 5000);
            }

            function postMessage(message) {
              window.vscode.postMessage(message);
            }

            // Initialize task list
            function initializeTasks() {
              taskList.innerHTML = '';

              if (tasks.length === 0) {
                taskList.innerHTML = '<div class="task">No tasks available</div>';
                return;
              }

              tasks.forEach(task => {
                const taskId = task.id;
                const taskElement = document.createElement('div');
                taskElement.className = 'task';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.dataset.id = taskId;
                checkbox.checked = selectedTaskIds.has(taskId);

                checkbox.addEventListener('change', () => {
                  if (checkbox.checked) {
                    selectedTaskIds.add(taskId);
                  } else {
                    selectedTaskIds.delete(taskId);
                  }
                  updateSelectionCount();
                  updatePreview();
                  updateDirectoryStructure();
                });

                const infoElement = document.createElement('div');
                infoElement.className = 'task-info';

                const titleElement = document.createElement('div');
                titleElement.className = 'task-title';
                titleElement.textContent = task.title;

                const metaElement = document.createElement('div');
                metaElement.className = 'task-meta';
                metaElement.textContent =
                  (task.identifier || '') + ' | Priority: ' + (task.priority || 'None') + ' | ' +
                  'Estimate: ' + (task.estimate || 'None') + ' | State: ' + (task.state?.name || 'Unknown');

                infoElement.appendChild(titleElement);
                infoElement.appendChild(metaElement);

                taskElement.appendChild(checkbox);
                taskElement.appendChild(infoElement);

                taskList.appendChild(taskElement);
              });

              updateSelectionCount();
            }

            // Update selection count
            function updateSelectionCount() {
              const count = selectedTaskIds.size;
              selectionCount.textContent = count + ' task' + (count === 1 ? '' : 's') + ' selected';
            }

            // Update preview content
            function updatePreview() {
              if (selectedTaskIds.size === 0) {
                previewContent.textContent = 'No tasks selected to preview';
                return;
              }

              // Get the first selected task for preview
              const taskId = Array.from(selectedTaskIds)[0];
              const task = tasks.find(t => t.id === taskId);

              if (!task) {
                previewContent.textContent = 'Error: Task not found';
                return;
              }

              // Create preview based on template
              let preview = '';

              if (template.value === 'minimal') {
                preview = generateMinimalTemplate(task);
              } else if (template.value === 'detailed') {
                preview = generateDetailedTemplate(task);
              } else {
                preview = generateDefaultTemplate(task);
              }

              previewContent.textContent = preview;
            }

            // Generate default template
            function generateDefaultTemplate(task) {
              let content = `# ${task.title}\n\n`;

              if (sectionOverview.checked) {
                content += `## Overview\n${task.description || 'No description provided.'}\n\n`;
              }

              if (sectionRequirements.checked) {
                content += `## Technical Requirements\n`;
                content += `- Priority: ${task.priority || 'None'}\n`;
                content += `- Estimate: ${task.estimate || 'None'}\n`;
                content += `- Status: ${task.state?.name || 'Unknown'}\n`;
                if (task.labels && task.labels.nodes && task.labels.nodes.length > 0) {
                  content += `- Labels: ${task.labels.nodes.map(l => l.name).join(', ')}\n`;
                }
                content += '\n';
              }

              if (sectionImplementation.checked) {
                content += `## Implementation Details\n`;
                content += `*No implementation details provided.*\n\n`;
              }

              if (sectionReferences.checked) {
                content += `## References\n`;
                content += `*No references provided.*\n\n`;
              }

              if (sectionMetadata.checked) {
                content += `---\n\n`;
                if (task.identifier) {
                  content += `*Task ID: ${task.identifier}*\n`;
                }
                if (task.url) {
                  content += `*Linear URL: ${task.url}*\n`;
                }
                content += `*Exported on: ${new Date().toISOString()}*\n`;
              }

              return content;
            }

            // Generate minimal template
            function generateMinimalTemplate(task) {
              let content = `# ${task.title}\n\n`;
              content += `${task.description || 'No description provided.'}\n\n`;
              content += `Priority: ${task.priority || 'None'} | `;
              content += `Estimate: ${task.estimate || 'None'} | `;
              content += `Status: ${task.state?.name || 'Unknown'}\n\n`;

              if (task.identifier && task.url) {
                content += `[${task.identifier}](${task.url})\n`;
              }

              return content;
            }

            // Generate detailed template
            function generateDetailedTemplate(task) {
              let content = `# ${task.title}\n\n`;

              if (sectionOverview.checked) {
                content += `## Overview\n${task.description || 'No description provided.'}\n\n`;
              }

              if (sectionRequirements.checked) {
                content += `## Technical Requirements\n`;
                content += `### Priority\n${task.priority || 'None'}\n\n`;
                content += `### Estimate\n${task.estimate || 'None'} points\n\n`;
                content += `### Status\n${task.state?.name || 'Unknown'}\n\n`;

                if (task.labels && task.labels.nodes && task.labels.nodes.length > 0) {
                  content += `### Labels\n`;
                  task.labels.nodes.forEach(label => {
                    content += `- ${label.name}\n`;
                  });
                  content += '\n';
                }
              }

              if (sectionImplementation.checked) {
                content += `## Implementation Details\n\n`;
                content += `### Approach\n*No approach provided.*\n\n`;
                content += `### Technical Considerations\n*No technical considerations provided.*\n\n`;
                content += `### Potential Challenges\n*No potential challenges identified.*\n\n`;
              }

              if (sectionReferences.checked) {
                content += `## References\n\n`;
                content += `### Documentation\n*No documentation references provided.*\n\n`;
                content += `### Related Tasks\n*No related tasks provided.*\n\n`;
                content += `### External Resources\n*No external resources provided.*\n\n`;
              }

              if (sectionMetadata.checked) {
                content += `---\n\n`;
                content += `**Metadata**\n\n`;
                if (task.identifier) {
                  content += `- Task ID: ${task.identifier}\n`;
                }
                if (task.url) {
                  content += `- Linear URL: ${task.url}\n`;
                }
                if (task.createdAt) {
                  content += `- Created: ${new Date(task.createdAt).toLocaleString()}\n`;
                }
                if (task.updatedAt) {
                  content += `- Updated: ${new Date(task.updatedAt).toLocaleString()}\n`;
                }
                content += `- Exported: ${new Date().toLocaleString()}\n`;
              }

              return content;
            }

            // Update directory structure
            function updateDirectoryStructure() {
              if (selectedTaskIds.size === 0) {
                directoryStructure.textContent = 'No tasks selected';
                return;
              }

              const exportPath = exportLocation.value.split('/').pop() || 'tasks';
              let structure = exportPath + '/\n';

              if (organizationType.value === 'flat') {
                // Flat structure
                const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
                selectedTasks.forEach(task => {
                  const fileName = getFileName(task);
                  structure += `├── ${fileName}.md\n`;
                });
              } else if (organizationType.value === 'status') {
                // By status
                const statuses = new Map();

                tasks.filter(t => selectedTaskIds.has(t.id)).forEach(task => {
                  const status = task.state?.name || 'Unknown';
                  if (!statuses.has(status)) {
                    statuses.set(status, []);
                  }
                  statuses.get(status).push(task);
                });

                Array.from(statuses.keys()).forEach((status, index, array) => {
                  const isLast = index === array.length - 1;
                  structure += `├── ${status}/\n`;

                  statuses.get(status).forEach((task, taskIndex, taskArray) => {
                    const taskIsLast = taskIndex === taskArray.length - 1;
                    const fileName = getFileName(task);
                    structure += `│   ${taskIsLast ? '└── ' : '├── '}${fileName}.md\n`;
                  });
                });
              } else if (organizationType.value === 'priority') {
                // By priority
                const priorities = new Map();
                const priorityNames = {
                  '1': 'Priority 1 (Urgent)',
                  '2': 'Priority 2 (High)',
                  '3': 'Priority 3 (Medium)',
                  '4': 'Priority 4 (Low)',
                  '5': 'Priority 5 (Lowest)',
                };

                tasks.filter(t => selectedTaskIds.has(t.id)).forEach(task => {
                  const priorityKey = task.priority?.toString() || 'Unknown';
                  const priority = priorityNames[priorityKey] || `Priority ${priorityKey}`;
                  if (!priorities.has(priority)) {
                    priorities.set(priority, []);
                  }
                  priorities.get(priority).push(task);
                });

                Array.from(priorities.keys()).forEach((priority, index, array) => {
                  const isLast = index === array.length - 1;
                  structure += `├── ${priority}/\n`;

                  priorities.get(priority).forEach((task, taskIndex, taskArray) => {
                    const taskIsLast = taskIndex === taskArray.length - 1;
                    const fileName = getFileName(task);
                    structure += `│   ${taskIsLast ? '└── ' : '├── '}${fileName}.md\n`;
                  });
                });
              } else if (organizationType.value === 'project') {
                // By project
                const projects = new Map();

                tasks.filter(t => selectedTaskIds.has(t.id)).forEach(task => {
                  const project = task.project?.name || 'No Project';
                  if (!projects.has(project)) {
                    projects.set(project, []);
                  }
                  projects.get(project).push(task);
                });

                Array.from(projects.keys()).forEach((project, index, array) => {
                  const isLast = index === array.length - 1;
                  structure += `├── ${project}/\n`;

                  projects.get(project).forEach((task, taskIndex, taskArray) => {
                    const taskIsLast = taskIndex === taskArray.length - 1;
                    const fileName = getFileName(task);
                    structure += `│   ${taskIsLast ? '└── ' : '├── '}${fileName}.md\n`;
                  });
                });
              }

              directoryStructure.textContent = structure;
            }

            // Get file name based on pattern
            function getFileName(task) {
              if (fileNaming.value === 'id') {
                return task.identifier || `task-${task.id}`;
              } else if (fileNaming.value === 'title') {
                return slugify(task.title);
              } else {
                return (task.identifier || `task-${task.id}`) + '-' + slugify(task.title);
              }
            }

            // Slugify string for file names
            function slugify(text) {
              return text
                .toString()
                .toLowerCase()
                .replace(/\\s+/g, '-')
                .replace(/[^\\w\\-]+/g, '')
                .replace(/\\-\\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '')
                .substring(0, 50); // Limit length
            }

            // Select all tasks
            selectAllButton.addEventListener('click', () => {
              tasks.forEach(task => {
                selectedTaskIds.add(task.id);
                const checkbox = document.querySelector(`.task-checkbox[data-id="${task.id}"]`);
                if (checkbox) {
                  checkbox.checked = true;
                }
              });
              updateSelectionCount();
              updatePreview();
              updateDirectoryStructure();
            });

            // Select none
            selectNoneButton.addEventListener('click', () => {
              selectedTaskIds.clear();
              document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.checked = false;
              });
              updateSelectionCount();
              updatePreview();
              updateDirectoryStructure();
            });

            // Tab switching
            tabs.forEach(tab => {
              tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                const tabName = tab.dataset.tab;
                tab.classList.add('active');
                document.getElementById(tabName + '-tab').classList.add('active');

                // Update preview if on preview tab
                if (tabName === 'preview') {
                  updatePreview();
                }

                // Update directory structure if on organization tab
                if (tabName === 'organization') {
                  updateDirectoryStructure();
                }
              });
            });

            // Update preview when options change
            template.addEventListener('change', updatePreview);
            sectionOverview.addEventListener('change', updatePreview);
            sectionRequirements.addEventListener('change', updatePreview);
            sectionImplementation.addEventListener('change', updatePreview);
            sectionReferences.addEventListener('change', updatePreview);
            sectionMetadata.addEventListener('change', updatePreview);

            // Update directory structure when options change
            organizationType.addEventListener('change', updateDirectoryStructure);
            fileNaming.addEventListener('change', updateDirectoryStructure);
            exportLocation.addEventListener('change', updateDirectoryStructure);

            // Cancel button
            cancelButton.addEventListener('click', () => {
              postMessage({ command: 'cancel' });
            });

            // Export button
            exportButton.addEventListener('click', () => {
              if (selectedTaskIds.size === 0) {
                showError('No tasks selected for export');
                return;
              }

              const selectedTasks = tasks.filter(t => selectedTaskIds.has(t.id));
              const exportPath = exportLocation.value;

              if (!exportPath) {
                showError('Export location cannot be empty');
                return;
              }

              // Collect export options
              const options = {
                exportPath,
                organizationType: organizationType.value,
                templateType: template.value,
                sections: {
                  overview: sectionOverview.checked,
                  requirements: sectionRequirements.checked,
                  implementation: sectionImplementation.checked,
                  references: sectionReferences.checked,
                  metadata: sectionMetadata.checked
                },
                fileNaming: fileNaming.value
              };

              // Show loading
              loadingElement.classList.remove('hidden');

              // Post export message to extension
              postMessage({
                command: 'export',
                tasks: selectedTasks,
                options
              });
            });

            // Handle messages from extension
            window.addEventListener('message', (event) => {
              const message = event.data;

              switch (message.command) {
                case 'exportComplete':
                  loadingElement.classList.add('hidden');
                  showSuccess(message.message);
                  break;

                case 'error':
                  loadingElement.classList.add('hidden');
                  showError(message.message);
                  break;
              }
            });

            // Initialize
            initializeTasks();
            updateDirectoryStructure();

            // Select all tasks by default
            selectAllButton.click();
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
      case 'export':
        this.exportTasks(message.tasks, message.options);
        break;

      case 'cancel':
        this.hide();
        break;
    }
  }

  /**
   * Export tasks using the callback
   */
  private async exportTasks(tasks: any[], options: any): Promise<void> {
    try {
      await this.exportCallback(tasks, options);

      if (this.webview) {
        this.webview.postMessage({
          command: 'exportComplete',
          message: `Successfully exported ${tasks.length} tasks to ${options.exportPath}`
        });
      }
    } catch (error) {
      console.error('Failed to export tasks:', error);

      if (this.webview) {
        this.webview.postMessage({
          command: 'error',
          message: 'Failed to export tasks: ' + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  }
}
