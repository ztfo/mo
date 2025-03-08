# Mo: Linear-Centric Project Management for Cursor IDE

<p align="center">
  <img src="assets/icon.png" alt="Mo" width="128" height="128">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/cursor-compatible-brightgreen" alt="Cursor Compatible">
</p>

An intelligent project planning and management tool that seamlessly integrates Linear with Cursor IDE, providing rich context for AI-assisted development.

## Vision

Mo aims to be your AI-powered project management assistant that lives within your development environment. By bringing project management directly into your IDE and leveraging AI to automate routine tasks, Mo helps developers focus on coding while maintaining excellent project organization.

## Core Features

### Linear-Centric Project Planning
- **Web-Based Planning Interface**: Rich planning experience with AI-powered task generation
- **Comprehensive Context Generation**: Detailed technical specifications, technology stack information, and implementation guidelines
- **Linear Integration**: Push tasks with rich context directly to Linear
- **Consistent Project Structure**: Maintain consistency across tasks with standardized context templates

### Task Management and Context Sharing
- **Task Sidebar**: View and manage Linear tasks directly in Cursor
- **Context Copying**: Copy task context to clipboard for pasting into Cursor AI chat
- **Flexible Export**: Export selected tasks as markdown files to your project
- **Status Updates**: Update task status directly from the sidebar

### Seamless Cursor Integration
- **Command Palette Access**: Trigger all functionality through standard commands
- **Status Bar Information**: Quick access to tasks and sync status
- **Standard VS Code APIs**: Built using standard extension APIs for maximum compatibility

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
5. Package the extension:
   ```bash
   npm run package
   ```
6. Install the extension in Cursor IDE:
   - Open Cursor
   - Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
   - Click on the "..." menu in the top-right of the Extensions view
   - Select "Install from VSIX..."
   - Navigate to the .vsix file in the project directory
   - Select the file and click "Install"

## Usage

### Project Planning Workflow

1. **Plan Your Project**:
   - Open the command palette (Ctrl+Shift+P or Cmd+Shift+P)
   - Run "Mo: Plan Project"
   - Enter your project description and requirements
   - Review and customize AI-generated tasks
   - Push tasks to Linear

2. **Develop with Context**:
   - View tasks in the sidebar
   - Select a task to see its detailed context
   - Copy context to clipboard
   - Paste into Cursor AI chat for implementation assistance
   - Alternatively, export tasks to markdown files for reference

3. **Track Progress**:
   - Update task status directly from the sidebar
   - Changes sync back to Linear
   - Keep your team updated on progress

### Commands

- **Mo: Plan Project**: Open the planning interface
- **Mo: Show Tasks**: Open the task sidebar
- **Mo: Export Tasks**: Export tasks to markdown files
- **Mo: Sync with Linear**: Sync latest changes from Linear

## Task Context Structure

Each task includes comprehensive context:

- **Overview**: Brief description of the task
- **Technical Requirements**: Detailed technical specifications
- **Technology Stack**: Frameworks, libraries, and tools to use
- **Integration Points**: How this component interacts with others
- **Data Models**: Relevant data structures and schemas
- **UX Patterns**: Design patterns and user experience guidelines
- **Implementation Considerations**: Important notes for implementation
- **References**: Links to documentation and resources

## Development

For development, you can use the watch mode:

```bash
npm run watch
```

To package the extension:

```bash
npm run package
```

## Implementation Plan

See [docs/features/FEATURE_PLANS.md](./docs/features/FEATURE_PLANS.md) for our detailed implementation plan.

## Documentation

- [Enhanced Features](./docs/features/ENHANCED_FEATURES.md): Detailed roadmap of features
- [UI Specification](./docs/specs/UI_SPEC.md): Technical specifications for UI components

## License

ISC 