# Linear Command Handlers

This directory contains the command handlers for the Linear integration. These handlers implement the user-facing commands for interacting with Linear from the Mo application.

## Command Files

- **auth-commands.ts**: Implements authentication commands (`linear-auth`, `linear-status`, `linear-logout`)
- **sync-commands.ts**: Implements synchronization commands (`linear-sync`, `linear-push`, `linear-pull`)
- **query-commands.ts**: Implements query commands (`linear-teams`, `linear-projects`, `linear-states`, `linear-issues`)
- **register.ts**: Registers all Linear commands with the application
- **index.ts**: Export all command handlers for easier imports

## Command Structure

Each command handler follows this basic pattern:

1. **Authentication Check**: Verifies that Linear is properly configured
2. **Parameter Validation**: Validates and processes command parameters
3. **API Interaction**: Communicates with the Linear API through the `LinearClient`
4. **Response Formatting**: Formats the response as markdown for display in the UI
5. **Error Handling**: Handles errors and provides helpful error messages

## Command Registration

The `getLinearCommands()` function in `register.ts` returns a map of all Linear commands. This map is integrated into the application's command registry in `src/commands/index.ts`.

## Formatter Functions

Each command file includes helper functions for formatting data as markdown. These functions create consistent and readable output for users.

## Error Handling

All commands implement consistent error handling:

- Authentication errors redirect users to authenticate
- API errors include details to help troubleshoot
- Invalid parameters are clearly identified

## Documentation

For detailed command specifications, see `docs/linear/COMMANDS.md`.
