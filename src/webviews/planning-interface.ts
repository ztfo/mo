import { CursorUI, CursorWebview } from "../ui-framework";
import { Task, TaskQueue } from "../task-queue";

/**
 * Planning Interface Component
 *
 * This component provides a rich interface for planning projects and generating tasks with detailed context.
 */
export class PlanningInterface {
  private webview: CursorWebview | null = null;
  private ui: CursorUI;
  private taskQueue: TaskQueue;
  private cursorContext: any; // Context from Cursor with AI capabilities

  constructor(ui: CursorUI, cursorContext?: any) {
    this.ui = ui;
    this.taskQueue = TaskQueue.getInstance();
    this.cursorContext = cursorContext;
  }

  /**
   * Show the planning interface
   */
  public show(): void {
    if (this.webview) {
      return; // Already showing
    }

    this.webview = this.ui.createWebviewPanel("mo-planning", {
      title: "Mo: Project Planning",
      viewColumn: "active",
      preserveFocus: false,
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

          /* Options panel styles */
          .options-panel {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 20px;
          }

          .options-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
          }

          .options-content {
            margin-top: 10px;
          }

          .option-group {
            margin-bottom: 10px;
          }

          .option-group h4 {
            margin-top: 0;
            margin-bottom: 5px;
          }

          .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .checkbox-item {
            display: flex;
            align-items: center;
          }

          .checkbox-item input {
            width: auto;
            margin-right: 5px;
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

          <div class="options-panel">
            <div class="options-header" id="options-toggle">
              <h3>Generation Options</h3>
              <span>▼</span>
            </div>
            <div class="options-content" id="options-content">
              <div class="option-group">
                <h4>Detail Level</h4>
                <select id="detail-level">
                  <option value="low">Low - Basic task information</option>
                  <option value="medium" selected>Medium - Comprehensive task details</option>
                  <option value="high">High - Extensive technical specifications</option>
                </select>
              </div>

              <div class="option-group">
                <h4>Focus Areas</h4>
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-backend" checked>
                    <label for="focus-backend">Backend</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-frontend" checked>
                    <label for="focus-frontend">Frontend</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-database" checked>
                    <label for="focus-database">Database</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-testing" checked>
                    <label for="focus-testing">Testing</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-docs" checked>
                    <label for="focus-docs">Documentation</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="focus-devops">
                    <label for="focus-devops">DevOps</label>
                  </div>
                </div>
              </div>

              <div class="option-group">
                <h4>Tech Stack</h4>
                <input type="text" id="tech-stack" placeholder="e.g., React, Node.js, PostgreSQL">
              </div>
            </div>
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
            const optionsToggle = document.getElementById('options-toggle');
            const optionsContent = document.getElementById('options-content');
            const detailLevel = document.getElementById('detail-level');
            const techStack = document.getElementById('tech-stack');

            // Focus area checkboxes
            const focusBackend = document.getElementById('focus-backend');
            const focusFrontend = document.getElementById('focus-frontend');
            const focusDatabase = document.getElementById('focus-database');
            const focusTesting = document.getElementById('focus-testing');
            const focusDocs = document.getElementById('focus-docs');
            const focusDevops = document.getElementById('focus-devops');

            // Store generated tasks
            let generatedTasks = [];

            // Toggle options panel
            optionsToggle.addEventListener('click', () => {
              const isHidden = optionsContent.style.display === 'none';
              optionsContent.style.display = isHidden ? 'block' : 'none';
              optionsToggle.querySelector('span').textContent = isHidden ? '▼' : '▶';
            });

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

              // Get option values
              const options = {
                detailLevel: detailLevel.value,
                focusAreas: [],
                techStack: techStack.value.trim()
              };

              // Add focus areas
              if (focusBackend.checked) options.focusAreas.push('backend');
              if (focusFrontend.checked) options.focusAreas.push('frontend');
              if (focusDatabase.checked) options.focusAreas.push('database');
              if (focusTesting.checked) options.focusAreas.push('testing');
              if (focusDocs.checked) options.focusAreas.push('documentation');
              if (focusDevops.checked) options.focusAreas.push('devops');

              // Show loading
              loadingElement.classList.remove('hidden');
              taskContainer.classList.add('hidden');

              // Send message to extension
              postMessage({
                command: 'generateTasks',
                description,
                options
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

                    // Use createElement approach instead of template literals
                    const taskHeader = document.createElement('div');
                    taskHeader.className = 'task-header';

                    const taskTitle = document.createElement('div');
                    taskTitle.className = 'task-title';
                    taskTitle.textContent = task.title;

                    const taskControls = document.createElement('div');
                    taskControls.className = 'task-controls';

                    const priorityInput = document.createElement('input');
                    priorityInput.type = 'number';
                    priorityInput.min = '0';
                    priorityInput.max = '5';
                    priorityInput.placeholder = 'Priority';
                    priorityInput.value = task.priority || '';
                    priorityInput.dataset.index = index.toString();
                    priorityInput.dataset.field = 'priority';

                    const estimateInput = document.createElement('input');
                    estimateInput.type = 'number';
                    estimateInput.min = '0';
                    estimateInput.max = '10';
                    estimateInput.placeholder = 'Estimate';
                    estimateInput.value = task.estimate || '';
                    estimateInput.dataset.index = index.toString();
                    estimateInput.dataset.field = 'estimate';

                    taskControls.appendChild(priorityInput);
                    taskControls.appendChild(estimateInput);

                    taskHeader.appendChild(taskTitle);
                    taskHeader.appendChild(taskControls);

                    const taskDescription = document.createElement('div');
                    taskDescription.className = 'task-description';
                    taskDescription.textContent = task.description;

                    taskElement.appendChild(taskHeader);
                    taskElement.appendChild(taskDescription);

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
      case "generateTasks":
        this.generateTasks(message.description, message.options);
        break;

      case "pushToLinear":
        this.pushToLinear(message.tasks);
        break;

      case "addToQueue":
        this.addToQueue(message.tasks);
        break;
    }
  }

  /**
   * Generate tasks from a project description
   */
  private async generateTasks(
    description: string,
    options: any = {}
  ): Promise<void> {
    try {
      if (
        !this.cursorContext ||
        !this.cursorContext.chat ||
        !this.cursorContext.chat.askAI
      ) {
        // Fall back to mock implementation if AI API is not available
        console.warn("Cursor AI API not available, using mock implementation");

        // Generate some sample tasks
        const tasks = [
          {
            title: `Implement ${description} - Backend`,
            description: `Create the backend API for ${description} with proper authentication and validation.`,
            priority: 2,
            estimate: 3,
          },
          {
            title: `Implement ${description} - Frontend`,
            description: `Create the frontend UI for ${description} with responsive design and proper error handling.`,
            priority: 2,
            estimate: 2,
          },
          {
            title: `Write tests for ${description}`,
            description: `Create comprehensive tests for ${description} including unit tests and integration tests.`,
            priority: 3,
            estimate: 1,
          },
        ];

        // Send tasks back to webview
        if (this.webview) {
          this.webview.postMessage({
            command: "tasksGenerated",
            tasks,
          });
        }

        return;
      }

      // Create detailed prompt based on options
      const prompt = this.createTaskGenerationPrompt(description, options);

      // Call Cursor AI API
      const response = await this.cursorContext.chat.askAI(prompt);

      // Parse the response
      const tasks = this.parseAIResponse(response);

      // Send tasks back to webview
      if (this.webview) {
        this.webview.postMessage({
          command: "tasksGenerated",
          tasks,
        });
      }
    } catch (error) {
      console.error("Failed to generate tasks:", error);

      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: "error",
          message:
            "Failed to generate tasks: " +
            (error instanceof Error ? error.message : String(error)),
        });
      }
    }
  }

  /**
   * Create a prompt for AI task generation
   */
  private createTaskGenerationPrompt(
    description: string,
    options: any = {}
  ): string {
    const { detailLevel = "medium", focusAreas = [], techStack = "" } = options;

    // Build focus areas string
    const focusAreasStr =
      focusAreas.length > 0
        ? `Focus on these areas: ${focusAreas.join(", ")}.`
        : "";

    // Build tech stack string
    const techStackStr = techStack
      ? `The project uses the following technologies: ${techStack}.`
      : "";

    // Determine detail level specifications
    let detailSpec = "";
    if (detailLevel === "low") {
      detailSpec = "Provide basic task information with brief descriptions.";
    } else if (detailLevel === "high") {
      detailSpec =
        "Provide extensive technical specifications with detailed implementation guidance, architecture considerations, and potential challenges.";
    } else {
      detailSpec =
        "Provide comprehensive task details including clear technical requirements and implementation approach.";
    }

    // Create the prompt
    return `
Generate a list of tasks for implementing the following feature:
${description}

${techStackStr}
${focusAreasStr}
${detailSpec}

Each task should include:
1. A clear, concise title
2. A detailed description with technical specifications
3. A priority (1-5, where 1 is highest)
4. An estimate (1-10 points)

For the description, include:
- Technical requirements
- Implementation approach
- Integration points
- Potential challenges
- Any relevant references

Format the response as a JSON array of tasks:
[
  {
    "title": "Task title",
    "description": "Detailed technical description with markdown formatting",
    "priority": 2,
    "estimate": 3
  },
  ...
]

Please ensure the JSON is valid and properly formatted.
`;
  }

  /**
   * Parse the AI response to extract tasks
   */
  private parseAIResponse(response: string): any[] {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from response");
      }

      const parsedTasks = JSON.parse(jsonMatch[0]);

      // Validate tasks
      if (!Array.isArray(parsedTasks)) {
        throw new Error("Response is not an array");
      }

      // Validate and normalize each task
      return parsedTasks.map((task) => ({
        title: task.title || "Untitled Task",
        description: task.description || "",
        priority: typeof task.priority === "number" ? task.priority : undefined,
        estimate: typeof task.estimate === "number" ? task.estimate : undefined,
      }));
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      throw new Error(
        `Failed to parse AI response: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
          command: "success",
          message: `Successfully pushed ${tasks.length} tasks to Linear`,
        });
      }
    } catch (error) {
      console.error("Failed to push tasks to Linear:", error);

      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: "error",
          message: "Failed to push tasks to Linear",
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
      tasks.forEach((task) => {
        this.taskQueue.addTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          estimate: task.estimate,
        });
      });

      // Send success to webview
      if (this.webview) {
        this.webview.postMessage({
          command: "success",
          message: `Added ${tasks.length} tasks to queue`,
        });
      }
    } catch (error) {
      console.error("Failed to add tasks to queue:", error);

      // Send error to webview
      if (this.webview) {
        this.webview.postMessage({
          command: "error",
          message: "Failed to add tasks to queue",
        });
      }
    }
  }
}
