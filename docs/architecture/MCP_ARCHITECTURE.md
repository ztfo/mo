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
- Handles protocol version compatibility

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
- Secure credential storage with encryption
- Rate limiting and pagination
- Conflict resolution for simultaneous updates

### 4. Command Handlers

Each command is implemented as a handler that:

- Receives context and parameters
- Performs specific actions
- Returns formatted output for display in Cursor
- Updates state as needed
- Utilizes editor context to enhance functionality
- Provides rich markdown responses

## MCP Protocol Version Handling

To ensure compatibility with different versions of Cursor:

- The server detects and validates the MCP protocol version
- Features are conditionally enabled based on protocol version
- Graceful fallbacks are provided for unsupported features
- Clear error messages are returned for incompatible operations

```typescript
interface MCPRequest {
  version: string;
  command: string;
  context: CommandContext;
}

// Example version validation
function isSupportedVersion(version: string): boolean {
  const [major, minor] = version.split(".").map(Number);
  return major >= 1 || (major === 0 && minor >= 5);
}
```

## Enhanced Context Utilization

The MCP server leverages Cursor's editor context to:

- Create tasks from selected code blocks
- Link tasks to specific files and code locations
- Generate context-aware task descriptions
- Provide relevant suggestions based on the current workspace
- Enhance command responses with contextual information

```typescript
// Example of context-aware task creation
function createTaskFromContext(context: CommandContext): Task {
  return {
    title: generateTitleFromPath(context.currentFilePath),
    description: context.selectedText || "Task created from editor",
    metadata: {
      filePath: context.currentFilePath,
      selection: context.selectedText
        ? {
            start: context.cursorPosition,
            text: context.selectedText.substring(0, 100) + "...",
          }
        : undefined,
    },
  };
}
```

## Command Flow

1. User invokes a Mo command in Cursor (e.g., `/mo tasks`)
2. Cursor sends the command to the Mo MCP server with current context and protocol version
3. The MCP server validates the protocol version and routes to the appropriate command handler
4. The handler processes the command and accesses required data
5. Results are formatted with rich markdown for display in Cursor
6. Any state changes are persisted to the data layer

## Command Response Structure

Responses to commands follow a standardized format:

```typescript
interface CommandResult {
  success: boolean; // Whether the command succeeded
  message: string; // Short summary message
  markdown: string; // Rich markdown content for display
  data?: any; // Optional structured data
  actionButtons?: {
    // Optional action buttons
    label: string; // Button label
    command: string; // Command to execute when clicked
  }[];
}
```

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
      "metadata": {
        "filePath": "/path/to/file.ts",
        "selection": {
          "start": { "line": 10, "character": 5 },
          "text": "function calculateTotal() {...}"
        },
        "linearId": "optional-linear-issue-id"
      }
    }
  ],
  "config": {
    "linearApiKey": "encrypted-api-key",
    "linearTeamId": "team-id",
    "defaultPriority": "medium",
    "protocolVersion": "1.0"
  }
}
```

## Linear Integration

Linear integration is handled through:

- A secure authentication process storing encrypted credentials
- Periodic sync to pull new/updated issues from Linear
- Push capability to create/update issues in Linear from local tasks
- Conflict resolution when changes exist on both sides
- Proper error handling for API failures
- Rate limiting to prevent API abuse
- Pagination for handling large result sets

## Error Handling

The MCP server implements robust error handling:

- Clear error messages for invalid commands
- Command suggestions for similar commands when errors occur
- Graceful handling of Linear API issues
- Data validation to prevent corruption
- Automatic state recovery from invalid data
- Protocol version compatibility checks

## Testing Strategy

The project includes a comprehensive testing strategy:

- Unit tests for command parsing and handling
- Mock MCP request/response for testing without Cursor
- Integration tests for data persistence
- Linear API mocks for testing without real API calls
- Validation tests to ensure data integrity
- Command flow tests to verify end-to-end functionality

## Extension Points

The architecture is designed to be extended in the future with:

- Additional commands
- Integration with other services
- Custom workflows
- Advanced AI capabilities
