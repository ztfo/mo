# Mo - Task Management MCP Server for Cursor IDE

Mo is a task management tool designed as a Model Context Protocol (MCP) server for Cursor IDE. It provides seamless integration with Linear for issue tracking and task management, allowing developers to manage their workflow directly from within Cursor.

## Features

- **Task Management**: Create, update, and track tasks directly in Cursor
- **Linear Integration**: Sync tasks with Linear for team collaboration
- **Context-Awareness**: Create tasks from code selections or current file context
- **AI-Enhanced**: Use AI to generate task breakdowns and project plans
- **Command-Driven**: Simple command interface integrated with Cursor

## Commands

Mo provides a set of commands that can be used directly in Cursor:

- `/mo tasks` - List all tasks with optional filtering
- `/mo new-task` - Create a new task
- `/mo update-task` - Update an existing task
- `/mo task-details` - View task details
- `/mo linear-sync` - Synchronize with Linear
- `/mo plan-project` - Generate tasks for a project
- `/mo help` - Show help information

See the [Commands Documentation](./docs/mcp/COMMANDS.md) for a complete list.

## Getting Started

### Prerequisites

- [Cursor IDE](https://cursor.sh/)
- Node.js 16+
- Linear account (optional, for Linear integration)

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

For Linear integration, you'll need to authenticate:

```
/mo linear-auth key:your_linear_api_key
```

## MCP Server Approach

Mo is implemented as an MCP server for Cursor, which provides several advantages:

- **Simplified Architecture**: Lightweight command-driven interface
- **Context Awareness**: Access to your current code context
- **AI Integration**: Leverages Cursor's AI capabilities
- **Command-Based**: Familiar interface for Cursor users

## Project Structure

```
mo/
├── src/             # Source code
│   ├── index.ts     # Entry point
│   ├── server.ts    # MCP server implementation
│   ├── commands/    # Command handlers
│   ├── data/        # Data persistence
│   ├── linear/      # Linear API integration
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

- [Project Plan](./docs/PROJECT_PLAN.md) - High-level project plan
- [Architecture](./docs/architecture/MCP_ARCHITECTURE.md) - Architecture details
- [Commands](./docs/mcp/COMMANDS.md) - Command documentation
- [Implementation Guide](./docs/mcp/IMPLEMENTATION_GUIDE.md) - Development guide
- [Feature Roadmap](./docs/features/ROADMAP.md) - Planned features

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgements

- [Cursor IDE](https://cursor.sh/) for the MCP platform
- [Linear](https://linear.app/) for their excellent issue tracking API
