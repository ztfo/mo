# Mo MCP Server Architecture

## Overview

Mo is structured as a Model Context Protocol (MCP) server for Cursor IDE. The MCP architecture provides a lightweight way to extend Cursor with AI-powered tools that can access current editor context and perform operations.

## Key Components

### 1. MCP Server

The core of Mo is an MCP server that:

- Listens for commands from Cursor
- Processes these commands with access to editor context
- Returns appropriate responses
- Maintains state between invocations

### 2. Data Layer

The data layer handles:

- Local storage of tasks in a JSON file
- Task state management
- Serialization and deserialization
- Data validation

### 3. Linear Integration Layer

This layer manages:

- API communication with Linear
- Authentication and credentials management
- Data mapping between local tasks and Linear issues
- Synchronization logic

### 4. Command Handlers

Each command is implemented as a handler that:

- Receives context and parameters
- Performs specific actions
- Returns formatted output for display in Cursor
- Updates state as needed

## Command Flow

1. User invokes a Mo command in Cursor (e.g., `/mo tasks`)
2. Cursor sends the command to the Mo MCP server with current context
3. The MCP server routes to the appropriate command handler
4. The handler processes the command and accesses required data
5. Results are formatted and returned to Cursor for display
6. Any state changes are persisted to the data layer

## Storage Structure

Tasks are stored in a structured JSON format:

```json
{
  "tasks": [
    {
      "id": "unique-id",
      "title": "Task title",
      "description": "Task description",
      "status": "todo|in-progress|done",
      "priority": "high|medium|low",
      "created": "ISO timestamp",
      "updated": "ISO timestamp",
      "linearId": "optional-linear-issue-id"
    }
  ],
  "config": {
    "linearApiKey": "encrypted-api-key",
    "linearTeamId": "team-id",
    "defaultPriority": "medium"
  }
}
```

## Linear Integration

Linear integration is handled through:

- A secure authentication process storing encrypted credentials
- Periodic sync to pull new/updated issues from Linear
- Push capability to create/update issues in Linear from local tasks
- Conflict resolution when changes exist on both sides

## Error Handling

The MCP server implements robust error handling:

- Clear error messages for invalid commands
- Graceful handling of Linear API issues
- Data validation to prevent corruption
- Automatic state recovery from invalid data

## Extension Points

The architecture is designed to be extended in the future with:

- Additional commands
- Integration with other services
- Custom workflows
- Advanced AI capabilities
