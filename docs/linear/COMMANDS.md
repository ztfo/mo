# Linear Integration Commands

This document provides detailed specifications for all commands related to the Linear integration in Mo.

## Authentication Commands

### `/mo linear-auth`

**Description**: Authenticate with Linear by providing an API key.

**Parameters**:

- `key`: Linear API key (required)
- `team`: Default team ID (optional)

**Example**:

```
/mo linear-auth key:lin_api_12345abcde
```

**Output**: Confirmation of successful authentication with basic user and team information.

**Behavior**:

- Validates the API key with Linear
- Encrypts and stores the key securely
- Retrieves and displays basic user information
- Optionally sets a default team

---

### `/mo linear-status`

**Description**: Check the current Linear authentication status.

**Parameters**: None

**Example**:

```
/mo linear-status
```

**Output**: Information about the current authentication status, user details, and configured teams.

**Behavior**:

- Checks if a valid API key is stored
- Retrieves current user information from Linear
- Shows connected team(s)
- Provides guidance on next steps based on status

---

### `/mo linear-logout`

**Description**: Remove stored Linear credentials.

**Parameters**:

- `confirm`: Set to "true" to confirm logout (required)

**Example**:

```
/mo linear-logout confirm:true
```

**Output**: Confirmation that credentials have been removed.

**Behavior**:

- Removes stored API key and related configuration
- Requires confirmation to prevent accidental logout
- Shows success message once completed

## Synchronization Commands

### `/mo linear-sync`

**Description**: Synchronize tasks between Mo and Linear.

**Parameters**:

- `direction`: Sync direction (`push`, `pull`, or `both`, default: `both`)
- `filter`: Filter expression for which tasks to sync (optional)
- `team`: Team ID for Linear (optional, uses default if not specified)
- `force`: Set to "true" to force sync and override conflicts (optional)
- `dry-run`: Set to "true" to preview changes without applying them (optional)

**Example**:

```
/mo linear-sync direction:pull filter:status:in-progress
```

**Output**: Summary of sync operation including tasks added, updated, and any conflicts or errors.

**Behavior**:

- Performs synchronization based on specified direction
- Applies filters to limit which tasks are synced
- Detects and handles conflicts based on update timestamps
- Provides detailed summary of changes
- Shows progress for larger sync operations

---

### `/mo linear-push`

**Description**: Push specific tasks from Mo to Linear.

**Parameters**:

- `id`: Task ID to push (required if not using filter)
- `filter`: Filter expression to select multiple tasks (required if not using id)
- `team`: Team ID for Linear (optional, uses default if not specified)
- `create-only`: Set to "true" to only create new issues, not update existing ones (optional)

**Example**:

```
/mo linear-push id:task-123
```

**Output**: Details of the pushed task(s) and their Linear issue IDs.

**Behavior**:

- Creates new issues in Linear for tasks without a Linear ID
- Updates existing issues for tasks with a Linear ID
- Maps Mo task fields to Linear issue fields
- Stores Linear issue ID in task metadata
- Shows success/error status for each pushed task

---

### `/mo linear-pull`

**Description**: Pull issues from Linear to Mo.

**Parameters**:

- `id`: Linear issue ID to pull (optional)
- `filter`: Filter expression for which issues to pull (optional)
- `team`: Team ID for Linear (optional, uses default if not specified)
- `states`: Comma-separated list of state names to include (optional)
- `limit`: Maximum number of issues to pull (optional, default: 50)

**Example**:

```
/mo linear-pull filter:"assignee:me status:in-progress" limit:20
```

**Output**: Summary of pulled issues and their mapping to local tasks.

**Behavior**:

- Queries Linear for issues matching the filters
- Creates local tasks for new issues
- Updates existing tasks for previously synced issues
- Maps Linear issue fields to Mo task fields
- Shows summary of created/updated tasks

## Query Commands

### `/mo linear-teams`

**Description**: List available teams in Linear.

**Parameters**: None

**Example**:

```
/mo linear-teams
```

**Output**: List of teams with their IDs, names, and key.

**Behavior**:

- Queries Linear for teams the user has access to
- Displays team information in a formatted list
- Indicates which team is set as default (if any)
- Provides commands for setting default team

---

### `/mo linear-projects`

**Description**: List available projects in Linear.

**Parameters**:

- `team`: Team ID to filter projects (optional, uses default if not specified)
- `state`: Filter by project state (`backlog`, `planned`, `started`, `paused`, `completed`, default: `started`)

**Example**:

```
/mo linear-projects team:TEAM_ID state:started
```

**Output**: List of projects with their IDs, names, and status.

**Behavior**:

- Queries Linear for projects in the specified team
- Filters projects by state if specified
- Displays project information in a formatted list
- Shows progress for each project if available

---

### `/mo linear-states`

**Description**: List available workflow states in Linear.

**Parameters**:

- `team`: Team ID (optional, uses default if not specified)

**Example**:

```
/mo linear-states team:TEAM_ID
```

**Output**: List of workflow states with their IDs, names, and categories.

**Behavior**:

- Queries Linear for workflow states in the specified team
- Displays state information grouped by category (Todo, In Progress, Done, etc.)
- Shows color coding and state type
- Provides information on how states map to Mo task statuses

---

### `/mo linear-issues`

**Description**: List issues from Linear.

**Parameters**:

- `team`: Team ID (optional, uses default if not specified)
- `filter`: Filter expression for which issues to show (optional)
- `states`: Comma-separated list of state names to include (optional)
- `assignee`: Filter by assignee (optional, use "me" for current user)
- `limit`: Maximum number of issues to display (optional, default: 10)

**Example**:

```
/mo linear-issues assignee:me states:Todo,In-Progress limit:5
```

**Output**: List of issues with their IDs, titles, states, and assignees.

**Behavior**:

- Queries Linear for issues matching the filters
- Displays issue information in a formatted list
- Shows local task ID if the issue is already synced
- Provides commands for pulling specific issues

## Settings Commands

### `/mo linear-settings`

**Description**: View or update Linear integration settings.

**Parameters**:

- `set`: Key-value pair to set (optional, format: key=value)
- `get`: Setting key to retrieve (optional)

**Example**:

```
/mo linear-settings set:defaultTeam=TEAM_ID
```

**Output**: Current settings or confirmation of updated settings.

**Behavior**:

- Shows current Linear integration settings
- Updates specific settings when using `set` parameter
- Validates settings before saving
- Shows available settings and their descriptions

## Error Handling

All commands implement consistent error handling:

1. **Authentication Errors**: If not authenticated, commands provide clear instructions on how to authenticate
2. **Network Errors**: Commands handle network failures with proper retry logic and clear error messages
3. **Rate Limiting**: If Linear API rate limits are hit, commands provide backoff information and retry guidance
4. **Validation Errors**: Invalid parameters are clearly identified with guidance on correct usage
5. **Not Found Errors**: When resources (teams, projects, issues) aren't found, helpful error messages are shown
