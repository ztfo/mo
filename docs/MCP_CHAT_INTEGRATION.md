# MCP Chat Integration

This document outlines the steps to make our existing Linear MCP server work seamlessly in the Cursor chat interface, similar to how browser-tools and Supabase MCPs work.

## Understanding MCP Chat Integration

MCPs can work in two primary interfaces:

1. **Editor Interface**: Commands typed directly in code files
2. **Chat Interface**: Commands used in conversations with Claude

Our Linear MCP is already designed to work in the editor interface, but making it work in the chat requires some adjustments.

## Key Differences in Chat Integration

Chat-integrated MCPs have these characteristics:

1. They're typically distributed as npm packages
2. They include proper tool declarations for Claude to understand
3. They're registered differently in the MCP configuration

## Steps to Enable Chat Integration

### 1. Package the MCP as an npm Package

Convert our current project into a proper npm package:

- Update package.json with appropriate metadata
- Add a proper bin entry for the MCP server
- Include necessary dependencies

### 2. Add Tool Declarations

Add a `cursor-tools` section to package.json:

```json
{
  "name": "mo-linear-mcp",
  "version": "1.0.0",
  "cursor-tools": {
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
      {
        "name": "linear_status",
        "description": "Check Linear authentication status"
      },
      {
        "name": "linear_teams",
        "description": "List all teams in your Linear workspace"
      }
      // Additional commands...
    ]
  }
}
```

### 3. Update MCP Registration

Change the MCP registration in Cursor's mcp.json:

```json
"linear-mcp": {
  "command": "npx",
  "args": ["-y", "mo-linear-mcp@latest"],
  "enabled": true
}
```

### 4. Structure Responses for Chat

Ensure our command responses are chat-friendly:

- Format markdown appropriately for chat display
- Provide clear, concise information
- Add helpful action suggestions

### 5. Support Direct Path & NPX Execution

Update our server startup to work both ways:

- When invoked via npx from chat
- When run locally via npm run dev

## Implementation Plan

### Phase 1: Update Server for Chat Compatibility

1. Modify package.json with proper bin entry
2. Update server startup to detect execution context
3. Add basic tool declarations

### Phase 2: Optimize Command Responses

1. Review all command responses for chat-friendliness
2. Improve markdown formatting for chat display
3. Add more helpful action suggestions

### Phase 3: Publish and Test

1. Publish to npm registry
2. Test using npx installation
3. Document usage in chat

## Required Changes

### package.json Updates

```json
{
  "name": "mo-linear-mcp",
  "version": "1.0.0",
  "bin": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "prepublishOnly": "npm run build"
  },
  "cursor-tools": {
    // Tool declarations here
  }
}
```

### Server Startup Detection

```typescript
// Detect if running in chat context
const isChatContext = process.env.CURSOR_CHAT_CONTEXT === "true";

// Configure server based on context
if (isChatContext) {
  // Configure for chat operation
} else {
  // Configure for regular MCP operation
}
```

### MCP Configuration

For regular editor use:

```json
"mo-task-manager": {
  "name": "Mo Task Manager",
  "type": "local",
  "command": "npm run dev",
  "cwd": "/path/to/mo",
  "supportedPrefixes": ["/mo"]
}
```

For chat use:

```json
"mo-linear": {
  "command": "npx",
  "args": ["-y", "mo-linear-mcp@latest"],
  "enabled": true
}
```

## Next Steps

1. Update package.json with tool declarations
2. Modify server startup to detect execution context
3. Test locally before publishing
