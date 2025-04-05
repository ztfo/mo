# Linear MCP Integration

This document describes how the Linear integration interfaces with the Model Context Protocol (MCP) system in the Mo application.

## Overview

The Linear integration provides a bidirectional synchronization mechanism between Mo tasks and Linear issues. It enables users to manage their Linear issues directly from Mo's interface through a series of commands implemented as MCP tools.

## MCP Resources

The Linear integration exposes the following resources to the MCP system:

| Resource Type   | Description                       | Example                                  |
| --------------- | --------------------------------- | ---------------------------------------- |
| `linearUser`    | Current authenticated Linear user | User profile information                 |
| `linearTeam`    | Linear team information           | Team name, ID, and settings              |
| `linearIssue`   | Linear issue details              | Issue title, description, assignee, etc. |
| `linearProject` | Linear project information        | Project name, status, and metadata       |
| `linearState`   | Linear workflow state             | State name, type, and position           |

## MCP Tools

The Linear integration provides the following tools to the MCP system:

### Authentication Tools

- `linear-auth`: Authenticate with Linear API
- `linear-status`: Check current authentication status
- `linear-logout`: Remove stored credentials

### Synchronization Tools

- `linear-sync`: Bidirectional synchronization between Mo and Linear
- `linear-push`: Push Mo tasks to Linear
- `linear-pull`: Pull Linear issues to Mo

### Query Tools

- `linear-teams`: List available Linear teams
- `linear-projects`: List projects in a Linear team
- `linear-states`: List workflow states in a Linear team
- `linear-issues`: List issues in Linear

## Resource-Tool Mapping

The following table shows which tools operate on which resources:

| Tool              | Resources Accessed         |
| ----------------- | -------------------------- |
| `linear-auth`     | `linearUser`, `linearTeam` |
| `linear-status`   | `linearUser`, `linearTeam` |
| `linear-logout`   | `linearUser`               |
| `linear-sync`     | `linearIssue`              |
| `linear-push`     | `linearIssue`              |
| `linear-pull`     | `linearIssue`              |
| `linear-teams`    | `linearTeam`               |
| `linear-projects` | `linearProject`            |
| `linear-states`   | `linearState`              |
| `linear-issues`   | `linearIssue`              |

## MCP Integration Implementation

### Command Registration

All Linear commands are registered with the MCP system via the `getLinearCommands()` function in `src/linear/commands/register.ts`. This function returns a map of command names to `CommandRegistration` objects that include:

- The command handler function
- Command description
- Parameter definitions

These registrations are integrated into the application's command registry in `src/commands/index.ts`.

### Interactive Responses

Linear command handlers return `CommandResult` objects that include:

- `success`: Boolean indicating success or failure
- `message`: Short message summarizing the result
- `markdown`: Formatted markdown for display
- `actionButtons`: Interactive buttons for follow-up actions (where appropriate)

Example of a command result with action buttons:

```typescript
return {
  success: true,
  message: `Found ${issues.length} Linear issues`,
  markdown: formatIssues(issues, teamName),
  actionButtons: [
    {
      label: "Pull All Issues",
      command: `/mo linear-pull team:${teamId}`,
    },
  ],
};
```

### Error Handling

All Linear commands implement consistent error handling following MCP best practices:

1. Catch all exceptions and provide meaningful error messages
2. Log errors for debugging purposes
3. Provide guidance on how to fix common errors
4. Format error responses consistently using markdown

## Testing with MCP Inspector

To test the Linear integration with the MCP Inspector tool:

1. Start the Mo MCP server
2. Open the MCP Inspector tool
3. Connect to the Mo MCP server endpoint
4. Execute Linear commands and examine responses
5. Verify that resources are properly represented
6. Check that tools operate correctly on resources

## Security Considerations

The Linear integration follows these security best practices:

1. API keys are encrypted before storage
2. All user inputs are validated before use
3. Rate limiting is implemented to prevent API abuse
4. Error messages don't expose sensitive information
5. Limited to minimal required permissions in Linear

## Future Enhancements

Planned enhancements for the Linear MCP integration:

1. Add support for Linear comments and attachments
2. Implement webhooks for real-time updates
3. Enhance filtering capabilities for issues
4. Add support for custom fields in Linear
5. Implement user mentions and notifications
