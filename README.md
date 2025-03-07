<p align="center">
  <img src="assets/icon.png" alt="Mo" width="128" height="128">
</p>

# Mo: AI-Powered Project Management Cursor Plugin

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/cursor-compatible-brightgreen" alt="Cursor Compatible">
</p>

An intelligent project planning and management tool that seamlessly integrates with Cursor IDE and Linear to automate development workflows.

## Vision

Mo aims to be your AI-powered project management assistant that lives within your development environment. By bringing project management directly into your IDE and leveraging AI to automate routine tasks, Mo helps developers focus on coding while maintaining excellent project organization.

## Features

### Current Features
- **AI-Powered Task Generation**: Break down features into actionable tasks with the help of AI
- **Enhanced Linear Integration**: 
  - Create and track tickets in Linear with advanced properties (priority, estimates, etc.)
  - Filter and query issues with advanced criteria
  - Support for projects, cycles, labels, and other Linear features
  - Issue relations and comments
  - Caching for better performance
- **Advanced Task Queue System**: 
  - Review, edit, and reorder tasks before pushing to Linear
  - Drag-and-drop task reordering
  - Batch operations (set priority, estimate, delete)
  - Task persistence between sessions
  - Task filtering and sorting
- **UI Interface**: 
  - Task Queue Panel for managing tasks
  - Linear Sync Panel for viewing and managing issues
  - Settings Panel for configuring the plugin
- **Automated Documentation**: Maintains an up-to-date log of all features and tasks
- **Seamless Cursor IDE Integration**: Run everything directly within your IDE

### Planned Features
- **Advanced Linear Integration**: Two-way sync, bulk operations, and more
- **AI-Enhanced Project Management**: Smarter task generation, effort estimation, and dependency detection
- **Developer Experience Improvements**: Context-aware suggestions, progress tracking, and code-to-task linking

See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for a detailed roadmap of upcoming features.

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update Linear API credentials in `.env` file:
   ```
   LINEAR_API_KEY=your_api_key_here
   LINEAR_TEAM_ID=your_team_id_here
   ```
4. Build the extension:
   ```bash
   npm run build
   ```
5. Install the extension in Cursor IDE

## Usage

### Commands

#### Task Management
- `/plan-project [feature description]`: Generate tasks for a new feature and add them to the queue
- `/push-tasks`: Push queued tasks to Linear
- `/view-tasks`: View the current task queue in text format

#### UI Panels
- `/show-task-queue`: Open the Task Queue Panel
- `/show-linear-sync`: Open the Linear Sync Panel
- `/show-settings`: Open the Settings Panel

#### Linear Integration
- `/sync-linear`: Fetch high-priority issues from Linear

### Task Queue Workflow

1. Use `/plan-project` to generate tasks for a feature
2. Review and edit tasks in the Task Queue Panel (`/show-task-queue`)
   - Edit individual tasks by clicking the "Edit" button
   - Reorder tasks by dragging and dropping
   - Select multiple tasks for batch operations
   - Sort tasks by different criteria
3. Push tasks to Linear using the panel or `/push-tasks` command
4. View and manage Linear issues in the Linear Sync Panel (`/show-linear-sync`)

## Project Structure

- `src/extension.ts`: Core extension functionality
- `src/linear-api-enhanced.ts`: Enhanced Linear API integration
- `src/ui-framework.ts`: UI components and framework
- `src/task-queue.ts`: Task queue management system
- `STACK.md`: Technology stack documentation
- `SETTINGS.md`: Configuration settings
- `FEATURE_PLANS.md`: Log of features and tasks
- `ENHANCED_FEATURES.md`: Roadmap for upcoming features

## Development

For development, you can use the watch mode:

```bash
npm run watch
```

The plugin includes mock implementations for testing without Cursor's UI API.

## Contributing

Contributions are welcome! See [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) for areas where help is needed.

## License

ISC 