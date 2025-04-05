# Mo - Linear Task Management for Cursor IDE

Mo is a task management tool designed as a Model Context Protocol (MCP) server for Cursor IDE. It provides seamless integration with Linear for issue tracking and task management, allowing developers to manage their workflow directly from within Cursor.

[![npm version](https://img.shields.io/npm/v/mo-linear-mcp.svg)](https://www.npmjs.com/package/mo-linear-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Project Status

- **Phase 1**: ✅ Completed (March 21, 2024) - Core infrastructure and basic task management
- **Phase 2**: ✅ Completed (April 5, 2024) - Linear integration and chat tool support
- **Phase 3**: 🔄 In Progress - AI enhancement features
- **Phase 4**: 📅 Planned - Advanced features and polish

See the [Project Plan](./docs/PROJECT_PLAN.md) for more details on the project timeline and phases.

## Features

- **Task Management**: Create, update, and track tasks directly in Cursor
- **Context-Awareness**: Create tasks from code selections or current file context
- **Protocol Version Handling**: Support for Cursor MCP protocol version compatibility
- **Rich Responses**: Markdown-formatted responses with action buttons
- **Linear Integration**: Sync tasks with Linear for team collaboration
  - Authentication with secure credential storage
  - Bidirectional synchronization between local tasks and Linear issues
  - Filtering and querying Linear issues
  - Support for projects, teams, and workflow states
- **Chat Integration**: Use Linear tools directly in Claude chat within Cursor
- **Webhook Support**: Register webhooks for real-time issue updates (optional)

## Installation

### Prerequisites

- [Cursor IDE](https://cursor.sh/)
- Node.js 16+
- Linear account (for Linear integration)

### Option 1: Install From npm (Recommended)

The package is available on npm and can be installed globally:

```bash
npm install -g mo-linear-mcp
```

You can also use it directly without installation via npx:

```bash
npx mo-linear-mcp
```

Visit the package on npm: [mo-linear-mcp](https://www.npmjs.com/package/mo-linear-mcp)

### Option 2: Local Development Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/mo-linear-mcp.git
   cd mo-linear-mcp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Run in development mode:

   ```bash
   npm run dev
   ```

## Cursor MCP Configuration

To use Mo in Cursor, you need to configure it in the MCP settings. Here's an example configuration:

```json
{
  "version": "0.1",
  "mcps": {
    "mo-linear-mcp-dev": {
      "name": "Mo Linear MCP (Dev)",
      "description": "Linear Task Management for Cursor IDE - Development Mode",
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/your/mo-linear-mcp",
      "enabled": true
    },
    "linear": {
      "name": "Linear",
      "description": "Linear Task Management for Cursor",
      "command": "npx",
      "args": ["-y", "mo-linear-mcp"],
      "enabled": true
    }
  }
}
```

To access the MCP configuration in Cursor:

1. Open Cursor IDE
2. Go to Settings → Extensions → MCP Servers
3. Click "Edit MCP Config" and paste the configuration above
4. Adjust the "cwd" path to match your local repository path (for development mode)

## Development and Publishing

### Local Development

For rapid development and testing:

```bash
# Watch for changes
npm run watch

# In another terminal, test commands
echo '{"command": "/mo linear-status"}' | npm run dev
```

### Publishing Updates

To publish a new version to npm:

```bash
# Bump the version (patch, minor, or major)
npm version patch   # For small fixes
npm version minor   # For new features
npm version major   # For breaking changes

# Build and publish
npm run build
npm publish
```

## Usage

### Editor Mode Commands

Mo provides commands that can be used directly in the editor:

**Basic Commands**

- `/mo tasks` - List all tasks with optional filtering
- `/mo new-task` - Create a new task
- `/mo update-task` - Update an existing task
- `/mo task-details` - View task details
- `/mo delete-task` - Delete a task
- `/mo help` - Show help information
- `/mo settings` - View/update settings

**Linear Commands**

- `/mo linear-auth` - Authenticate with Linear API
- `/mo linear-status` - Check Linear authentication status
- `/mo linear-logout` - Log out from Linear API
- `/mo linear-teams` - List Linear teams
- `/mo linear-projects` - List Linear projects
- `/mo linear-states` - List Linear workflow states
- `/mo linear-issues` - List Linear issues
- `/mo linear-sync` - Synchronize with Linear
- `/mo linear-push` - Push tasks to Linear
- `/mo linear-pull` - Pull issues from Linear

### Chat Mode Tools

Mo can also be used directly in the Claude chat interface with the following syntax:

```
@Linear linear_auth key:your_api_key
@Linear linear_status
@Linear linear_teams
@Linear linear_projects team:team-id
@Linear linear_issues team:team-id
@Linear linear_sync
```

## Authentication

To use the Linear integration, you need to authenticate with your Linear API key:

```
/mo linear-auth key:your_linear_api_key
```

Or in chat mode:

```
@Linear linear_auth key:your_linear_api_key
```

You can get your Linear API key from Linear's settings page.

## Development

### Project Structure

```
mo-linear-mcp/
├── src/             # Source code
│   ├── index.ts     # Entry point
│   ├── server.ts    # MCP server implementation
│   ├── commands/    # Command processing
│   ├── data/        # Data persistence
│   ├── linear/      # Linear API integration
│   ├── utils/       # Utility functions
│   └── types/       # TypeScript types
├── data/            # Local data storage
└── docs/            # Documentation
    ├── architecture/  # Architecture documentation
    ├── mcp/           # MCP-related documentation
    ├── linear/        # Linear integration documentation
    └── features/      # Feature specifications
```

### Development Commands

```bash
# Build the project
npm run build

# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Run linter
npm run lint

# Run tests
npm run test
```

## Publishing

To publish the package to npm:

```bash
# Build the project
npm run build

# Make sure the binary is executable
chmod +x dist/index.js

# Create npm account if needed
npm adduser

# Publish to npm
npm publish
```

## Debugging

Mo includes built-in debugging that logs to `/tmp/mo-mcp-debug.log`. Check this file for troubleshooting.

For more detailed debugging:

```bash
# Test MCP response handling
echo '{"command": "/mo linear-status"}' | npm run dev

# Test chat tool invocation directly
node dist/index.js linear_status
```

## Documentation

- [Project Plan](./docs/PROJECT_PLAN.md) - High-level plan and timeline
- [Project Context](./docs/PROJECT_CONTEXT.md) - Project status and context
- [MCP Chat Integration](./docs/MCP_CHAT_INTEGRATION.md) - Chat integration details
- [Commands](./docs/mcp/COMMANDS.md) - Command documentation
- [Linear MCP Integration](./docs/mcp/LINEAR_MCP_INTEGRATION.md) - Linear integration details
- [Implementation Guide](./docs/mcp/IMPLEMENTATION_GUIDE.md) - Development guide

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgements

- [Cursor IDE](https://cursor.sh/) for the MCP platform
- [Linear](https://linear.app/) for their excellent issue tracking API
