# Mo - Linear Project Management for Cursor IDE

A Linear-centric project management extension for Cursor IDE that helps you plan projects, manage tasks, and keep Linear up-to-date.

## Features

- **Project Planning**: Plan projects and generate tasks with detailed context
- **Task Management**: View and manage Linear tasks directly in Cursor
- **Context Sharing**: Copy task context to clipboard for pasting into Cursor AI chat
- **Task Export**: Export tasks as markdown files to your project
- **Linear Integration**: Push tasks to Linear and keep them in sync

## Installation

1. Download the latest `.vsix` file from the releases
2. Open Cursor IDE
3. Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
4. Click on the "..." menu in the top-right of the Extensions view
5. Select "Install from VSIX..."
6. Navigate to the downloaded `.vsix` file
7. Select the file and click "Install"

## Usage

### Project Planning

1. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Run "Mo: Plan Project"
3. Enter your project description
4. Click "Generate Tasks" to generate tasks based on your description
5. Review and customize the generated tasks
6. Click "Push to Linear" to push tasks to Linear

### Task Management

1. Click on the Mo icon in the activity bar to open the task sidebar
2. View tasks from Linear
3. Click on a task to view its details
4. Use the "Copy Context" button to copy task context to clipboard
5. Paste the context into Cursor AI chat for implementation assistance

### Task Export

1. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Run "Mo: Export Tasks"
3. Tasks will be exported to the `/tasks` directory in your project

### Linear Sync

1. Click on the sync button in the task sidebar
2. Or run "Mo: Sync with Linear" from the command palette
3. Tasks will be synced with Linear

## Commands

- **Mo: Plan Project**: Open the project planning interface
- **Mo: Show Tasks**: Show tasks in the sidebar
- **Mo: Export Tasks**: Export tasks to markdown files
- **Mo: Sync with Linear**: Sync tasks with Linear

## License

ISC 