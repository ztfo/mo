# Mo MCP Server Implementation Guide

This guide outlines the implementation details for building the Mo MCP server for Cursor.

## Technology Stack

- **Node.js**: Core runtime environment
- **TypeScript**: Language for type safety and better developer experience
- **Cursor MCP Protocol**: For integration with Cursor IDE
- **Linear API**: For integration with Linear task management
- **lowdb/JSONFile**: For lightweight local data storage
- **crypto-js**: For secure credential encryption

## Project Structure

```
mo/
├── src/
│   ├── index.ts                 # Entry point
│   ├── server.ts                # MCP server implementation
│   ├── commands/                # Command handlers
│   │   ├── index.ts             # Command registry
│   │   ├── tasks.ts             # Task management commands
│   │   ├── linear.ts            # Linear integration commands
│   │   └── project.ts           # Project planning commands
│   ├── data/                    # Data layer
│   │   ├── store.ts             # Data storage interface
│   │   ├── tasks.ts             # Task data management
│   │   └── config.ts            # Configuration management
│   ├── linear/                  # Linear integration
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Authentication
│   │   └── sync.ts              # Synchronization logic
│   ├── utils/                   # Utility functions
│   │   ├── formatting.ts        # Output formatting
│   │   ├── parsing.ts           # Command parsing
│   │   └── encryption.ts        # Credential encryption
│   └── types/                   # TypeScript type definitions
│       ├── task.ts              # Task types
│       ├── command.ts           # Command types
│       ├── mcp.ts               # MCP protocol types
│       └── linear.ts            # Linear API types
└── data/                        # Local data storage
    └── tasks.json               # Task database
```

## MCP Protocol Implementation

### Protocol Structure

The MCP protocol uses JSON communication over stdin/stdout:

```typescript
// MCP Request format
interface MCPRequest {
  version: string; // MCP protocol version
  command: string; // Command string (e.g., "/mo tasks")
  context: CommandContext; // Editor context from Cursor
}

// MCP Response format
interface MCPResponse {
  success: boolean; // Whether the command succeeded
  message: string; // Short message for display
  markdown?: string; // Rich markdown content
  data?: any; // Optional structured data
  error?: string; // Error message if success is false
  actionButtons?: {
    // Optional action buttons
    label: string; // Button label
    command: string; // Command to execute
  }[];
}
```

### Version Handling

To handle different versions of the MCP protocol:

```typescript
// In server.ts
function isSupportedVersion(version: string): boolean {
  const [major, minor] = version.split(".").map(Number);
  return major >= 1 || (major === 0 && minor >= 5);
}

// In handleMcpRequest
const { version, command, context } = request;
if (version && !isSupportedVersion(version)) {
  sendMcpResponse({
    success: false,
    message: `Unsupported MCP protocol version: ${version}. This tool requires v1.0 or higher.`,
    markdown: `### Error: Incompatible Version\n\nThis MCP server requires protocol version 1.0 or higher.`,
  });
  return;
}
```

### Server Implementation

The core MCP server is implemented in `server.ts`:

```typescript
// Process stdin for incoming requests
process.stdin.on("data", handleMcpRequest);

// Send responses to stdout
function sendMcpResponse(response: MCPResponse): void {
  process.stdout.write(JSON.stringify(response) + "\n");
}
```

## Context Utilization

### Context Structure

The `CommandContext` interface provides access to Cursor's editor context:

```typescript
interface CommandContext {
  currentFilePath?: string; // Current file
  selectedText?: string; // Selected text
  workspacePath?: string; // Workspace path
  cursorPosition?: {
    // Cursor position
    line: number;
    character: number;
  };
  cursorVersion?: string; // Cursor version
  additionalContext?: Record<string, any>; // Extra context
}
```

### Utilizing Context in Commands

Example of using context in a new task command:

```typescript
function newTaskCommand(params, context) {
  // Generate title from file if not provided
  const title = params.title || path.basename(context.currentFilePath || "");

  // Use selected text as description
  const description = context.selectedText || "";

  // Add file context to task metadata
  const metadata = {
    filePath: context.currentFilePath,
    position: context.cursorPosition,
    selection: context.selectedText
      ? {
          text: context.selectedText.substring(0, 100) + "...",
        }
      : undefined,
  };

  // Create task with context data
  return createTask({ title, description, metadata });
}
```

## Command System

### Command Registration

Commands are registered in `commands/index.ts`:

```typescript
const commands = {
  tasks: {
    description: "List tasks with optional filtering",
    usage: "/mo tasks [filter:status:in-progress] [limit:5]",
    handler: tasksCommandHandler,
  },
  "new-task": {
    description: "Create a new task",
    usage: '/mo new-task title:"Task title" [priority:high]',
    handler: newTaskCommandHandler,
  },
  // Additional commands...
};
```

### Command Parsing

Commands are parsed using a regex-based approach:

```typescript
function parseParameters(paramStr) {
  const params = {};
  const paramRegex = /(\w+):((?:"[^"]*")|(?:[^\s"]+))/g;

  let match;
  while ((match = paramRegex.exec(paramStr)) !== null) {
    const [, key, rawValue] = match;
    params[key] = rawValue.startsWith('"') ? rawValue.slice(1, -1) : rawValue;
  }

  return params;
}
```

### Command Response Formatting

Responses should include rich markdown for best display in Cursor:

```typescript
function formatTaskList(tasks) {
  return {
    success: true,
    message: `Found ${tasks.length} tasks`,
    markdown:
      `### Tasks (${tasks.length})\n\n` +
      tasks
        .map(
          (task) =>
            `- **${task.title}** (${
              task.status
            })\n  ${task.description.substring(0, 60)}...`
        )
        .join("\n\n") +
      "\n\n*Use `/mo task-details id:[task-id]` to view details.*",
  };
}
```

## Data Storage Implementation

Tasks and configuration are stored in JSON files:

```typescript
// Task structure
interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created: string; // ISO timestamp
  updated: string; // ISO timestamp
  metadata: {
    filePath?: string;
    selection?: {
      start?: { line: number; character: number };
      text?: string;
    };
    linearId?: string;
    tags?: string[];
  };
}
```

## Linear API Integration

Linear integration uses the GraphQL API with these core operations:

1. **Authentication**: Store and manage API keys securely
2. **Issue Creation**: Map local tasks to Linear issues
3. **Issue Updates**: Sync changes between local and Linear
4. **Issue Queries**: Fetch issues based on various criteria

### Secure API Key Storage

```typescript
import CryptoJS from "crypto-js";

// Encrypt API key before storage
function encryptApiKey(apiKey: string, salt: string): string {
  return CryptoJS.AES.encrypt(apiKey, salt).toString();
}

// Decrypt API key for use
function decryptApiKey(encryptedKey: string, salt: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, salt);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

## Testing Approach

1. **Unit Tests**: Test individual components and handlers
2. **Integration Tests**: Test command flow and data persistence
3. **Linear API Mocks**: Test Linear integration without actual API calls
4. **Manual Testing**: Test within Cursor IDE for real-world usage

### Example Test Case

```typescript
// Test command parsing
test("parseParameters extracts quoted parameters correctly", () => {
  const input = 'title:"My Task Title" priority:high';
  const expected = {
    title: "My Task Title",
    priority: "high",
  };
  expect(parseParameters(input)).toEqual(expected);
});
```

## Deployment and Distribution

MCP servers for Cursor can be packaged and distributed in several ways:

1. **Local Development**: Run locally during development
2. **npm Package**: Distribute as an npm package for easy installation
3. **Bundled Distribution**: Create a standalone bundle with dependencies
4. **Cursor Extension**: Eventually package as a proper Cursor extension

## Implementation Process

1. Implement core MCP server with version handling
2. Add command parsing and routing infrastructure
3. Implement basic task management commands
4. Add context utilization to enhance task creation
5. Implement data persistence layer
6. Add Linear API integration with secure credentials
7. Implement comprehensive tests
8. Package for distribution
