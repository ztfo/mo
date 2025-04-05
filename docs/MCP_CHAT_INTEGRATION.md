# MCP Chat Integration

This document outlines how our Linear MCP server works in the Cursor chat interface, similar to how browser-tools and Supabase MCPs work.

## Current Implementation Status

The Linear MCP has been successfully implemented to work in both interfaces:

1. **Editor Interface**: Commands typed directly in code files
2. **Chat Interface**: Commands used in conversations with Claude

## Chat Integration Features

Our implementation includes:

1. **Package Structure**: Properly configured as an npm package with bin entry
2. **Tool Declarations**: Added `cursor-tools` section to package.json with function definitions
3. **Dual-mode Operation**: Server detects whether it's running in chat or editor mode
4. **Chat-optimized Responses**: Formatted responses specifically for chat display

## How Chat Integration Works

### Package Configuration

The MCP is configured as an npm package with:

- Proper bin entry to make it executable
- `cursor-tools` section in package.json that defines available functions
- Conversion between underscore format (chat) and dash format (editor)

### Execution Modes

The server detects its execution mode:

```typescript
// Check if being run in chat tool mode with a specific command
// (npx mo-linear-mcp command params)
const isDirectToolInvocation = process.argv.length > 2;

if (isDirectToolInvocation) {
  handleDirectToolInvocation();
} else {
  // Standard MCP server mode
  startMcpServer();
}
```

### Tool Definitions

Chat tools are defined in package.json:

```json
"cursor-tools": {
  "name": "Linear",
  "description": "Linear Task Management for Cursor",
  "functions": [
    {
      "name": "linear_auth",
      "description": "Authenticate with Linear using your API key",
      "parameters": {
        "type": "object",
        "properties": {
          "key": {
            "type": "string",
            "description": "Your Linear API key"
          }
        }
      }
    },
    // Additional tools...
  ]
}
```

### Chat Response Formatting

Responses are formatted specifically for chat display:

```typescript
function formatChatToolResponse(result: CommandResult) {
  const response = {
    success: result.success,
    content: result.markdown || result.message,
    data: result.data || null,
    error: result.error || null,
  };

  // Output as JSON on stdout for Claude to consume
  console.log(JSON.stringify(response));
}
```

## MCP Configuration

The MCP is configured in the local mcp.json file:

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
    "mo-linear-mcp": {
      "name": "Mo Linear MCP",
      "description": "Linear Task Management for Cursor IDE",
      "command": "npx",
      "args": ["mo-linear-mcp"],
      "enabled": true
    },
    "linear-chat": {
      "name": "Linear",
      "description": "Linear Task Management Chat Tool for Cursor",
      "command": "npx",
      "args": ["-y", "mo-linear-mcp"],
      "enabled": true
    }
  }
}
```

## Implemented Chat Tools

The following tools are implemented for chat integration:

1. `linear_auth`: Authenticate with Linear API
2. `linear_status`: Check authentication status
3. `linear_teams`: List available teams
4. `linear_projects`: List projects in a team
5. `linear_issues`: List issues
6. `linear_sync`: Synchronize between Linear and local tasks

## Testing the Chat Integration

You can test the chat integration by:

1. Running the MCP server with `npm run dev`
2. Opening Cursor and accessing Claude chat interface
3. Using Linear tools via the chat interface, e.g., `@Linear linear_teams`

## Next Steps

1. Add the remaining tools to cursor-tools configuration:

   - `linear_states`
   - `linear_webhook_register`
   - `linear_webhook_list`
   - `linear_webhook_delete`
   - `linear_logout`
   - `linear_push`
   - `linear_pull`

2. Optimize all command responses for chat display
3. Add more helpful action suggestions in responses
4. Test chat interface with real-world Linear tasks
