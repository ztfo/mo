# Mo Project Context

This document serves as a central reference for the Mo project, helping to maintain context and continuity throughout development.

## Project Overview

Mo is a task management tool designed as a Model Context Protocol (MCP) server for Cursor IDE. It provides seamless integration with Linear for issue tracking and task management, allowing developers to manage their workflow directly from within Cursor.

## Project Status

**Current Phase**: Planning/Initial Development

We have decided to pivot from a traditional VS Code/Cursor extension approach to a Cursor MCP server approach, which will be simpler to develop and maintain while still providing the core functionality we need.

## Key Documents

- [Project Plan](./PROJECT_PLAN.md): High-level plan and timeline
- [MCP Architecture](./architecture/MCP_ARCHITECTURE.md): Architecture design
- [Commands](./mcp/COMMANDS.md): Detailed command specifications
- [Implementation Guide](./mcp/IMPLEMENTATION_GUIDE.md): Development guidelines
- [Feature Roadmap](./features/ROADMAP.md): Planned features and priorities

## Development History

| Date       | Milestone     | Notes                                                           |
| ---------- | ------------- | --------------------------------------------------------------- |
| 2023-03-14 | Project Pivot | Decided to switch from VS Code extension to MCP server approach |
| 2023-03-14 | Documentation | Created initial planning documents for the MCP approach         |

## Design Decisions

### Why MCP Instead of Extension?

1. **Simpler Development**: MCP servers have a more straightforward architecture compared to full VS Code extensions
2. **Focus on Functionality**: Can focus on core task management functionality without complex UI development
3. **Context Awareness**: Better integration with Cursor's AI capabilities
4. **Easier Maintenance**: Less complex code to maintain and update

### Data Storage Approach

1. **Local JSON Files**: Using simple JSON files for data storage initially
2. **Encryption for Secrets**: Encrypting sensitive data like API keys
3. **Simple CRUD API**: Clean interface for data operations

### Command Interface Design

1. **Consistent Prefix**: All commands use `/mo` prefix for consistency
2. **Parameter Format**: Using `key:value` format for parameters
3. **Context-Aware**: Commands use editor context when relevant

## Current Challenges

1. **MCP Protocol Understanding**: Need to fully understand Cursor's MCP protocol
2. **Linear API Integration**: Need to implement secure credential storage
3. **Command Parser**: Need to build robust command parser for parameter extraction

## Next Actions

1. Set up the basic project structure
2. Implement the core MCP server
3. Build the task data model and storage
4. Implement basic task management commands
5. Test within Cursor

## Team & Stakeholders

- **Developer**: @luispalomares
- **Primary User**: @luispalomares

## References

- [Cursor Documentation](https://cursor.sh/docs)
- [Linear API Documentation](https://developers.linear.app/docs)
- [MCP Protocol Documentation](https://cursor.sh/docs/mcp) (if available)
