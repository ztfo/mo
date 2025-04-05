# Mo - Task Management MCP Server for Cursor IDE

Mo is a task management tool designed as a Model Context Protocol (MCP) server for Cursor IDE. It provides seamless integration with Linear for issue tracking and task management, allowing developers to manage their workflow directly from within Cursor.

## Project Status

- **Phase 1**: ✅ Completed (March 21, 2024) - Core infrastructure and basic task management
- **Phase 2**: 🔄 In Progress - Linear integration
- **Phase 3**: 📅 Planned - AI enhancement features
- **Phase 4**: 📅 Planned - Advanced features and polish

See the [Project Plan](./docs/PROJECT_PLAN.md) for more details on the project timeline and phases.

## Features

- **Task Management**: Create, update, and track tasks directly in Cursor
- **Context-Awareness**: Create tasks from code selections or current file context
- **Protocol Version Handling**: Support for Cursor MCP protocol version compatibility
- **Rich Responses**: Markdown-formatted responses with action buttons
- **Linear Integration**: _(Coming in Phase 2)_ Sync tasks with Linear for team collaboration
- **AI-Enhanced**: _(Coming in Phase 3)_ Generate task breakdowns and project plans

## Commands

Mo provides a set of commands that can be used directly in Cursor:

- `/mo tasks` - List all tasks with optional filtering
- `/mo new-task` - Create a new task
- `/mo update-task` - Update an existing task
- `/mo task-details` - View task details
- `/mo delete-task` - Delete a task
- `/mo help` - Show help information
- `/mo settings` - View/update settings

Commands planned for future phases:

- `/mo linear-sync` - _(Phase 2)_ Synchronize with Linear
- `/mo linear-auth` - _(Phase 2)_ Authenticate with Linear
- `/mo plan-project` - _(Phase 3)_ Generate tasks for a project

See the [Commands Documentation](./docs/mcp/COMMANDS.md) for a complete list.

## Getting Started

### Prerequisites

- [Cursor IDE](https://cursor.sh/)
- Node.js 16+
- Linear account (optional, for Linear integration when Phase 2 is complete)

### Installation

1. Clone this repository:

   ```
   git clone https://github.com/ztfo/mo.git
   cd mo
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the project:

   ```
   npm run build
   ```

4. Start the MCP server:

   ```
   npm start
   ```

5. In Cursor, you can now use Mo commands (e.g., `/mo tasks`)

### Configuration

Local configuration is handled through the settings command:

```
/mo settings
```

Linear integration (coming in Phase 2):

```
/mo linear-auth key:your_linear_api_key
```

## MCP Server Approach

Mo is implemented as an MCP server for Cursor, which provides several advantages:

- **Simplified Architecture**: Lightweight command-driven interface
- **Context Awareness**: Access to your current code context
- **Protocol Version Handling**: Support across different Cursor versions
- **AI Integration**: Leverages Cursor's AI capabilities
- **Command-Based**: Familiar interface for Cursor users

## Project Structure

```
mo/
├── src/             # Source code
│   ├── index.ts     # Entry point
│   ├── server.ts    # MCP server implementation
│   │   ├── tasks/   # Task management commands
│   │   └── system/  # System/utility commands
│   ├── data/        # Data persistence
│   ├── linear/      # Linear API integration (Phase 2)
│   ├── utils/       # Utility functions
│   └── types/       # TypeScript types
├── data/            # Local data storage
└── docs/            # Documentation
```

## Development

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Watch for changes
npm run watch
```

## Documentation

- [Project Plan](./docs/PROJECT_PLAN.md) - High-level plan and timeline
- [Project Context](./docs/PROJECT_CONTEXT.md) - Project status and context
- [Architecture](./docs/architecture/MCP_ARCHITECTURE.md) - Architecture details
- [Commands](./docs/mcp/COMMANDS.md) - Command documentation
- [Implementation Guide](./docs/mcp/IMPLEMENTATION_GUIDE.md) - Development guide
- [Feature Roadmap](./docs/features/ROADMAP.md) - Planned features

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgements

- [Cursor IDE](https://cursor.sh/) for the MCP platform
- [Linear](https://linear.app/) for their excellent issue tracking API
