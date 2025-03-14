# Mo MCP Commands

This document outlines all commands available in the Mo MCP server, their parameters, and expected behavior.

## Core Commands

### `/mo tasks`

**Description**: List all tasks with optional filtering.

**Parameters**:

- `filter`: Optional filter string (e.g., "status:todo", "priority:high")
- `limit`: Maximum number of tasks to display

**Example**:

```
/mo tasks filter:status:in-progress limit:5
```

**Output**: Formatted list of tasks matching the criteria.

---

### `/mo new-task`

**Description**: Create a new task, optionally using selected text as description.

**Parameters**:

- `title`: Task title
- `priority`: Task priority (high, medium, low)
- `status`: Initial status (todo, in-progress, done)

**Example**:

```
/mo new-task title:"Fix navigation bug" priority:high
```

**Behavior**:

- If text is selected in the editor, it's used as the task description
- Current file path is attached to the task for context
- Generates a unique ID for the task

---

### `/mo update-task`

**Description**: Update an existing task.

**Parameters**:

- `id`: Task ID
- `title`: New title (optional)
- `description`: New description (optional)
- `status`: New status (optional)
- `priority`: New priority (optional)

**Example**:

```
/mo update-task id:task-123 status:done
```

---

### `/mo delete-task`

**Description**: Delete a task.

**Parameters**:

- `id`: Task ID

**Example**:

```
/mo delete-task id:task-123
```

---

### `/mo task-details`

**Description**: Show detailed information about a specific task.

**Parameters**:

- `id`: Task ID

**Example**:

```
/mo task-details id:task-123
```

## Linear Integration Commands

### `/mo linear-auth`

**Description**: Authenticate with Linear API.

**Parameters**:

- `key`: Linear API key

**Example**:

```
/mo linear-auth key:lin_api_xxxxx
```

---

### `/mo linear-sync`

**Description**: Synchronize tasks with Linear.

**Parameters**:

- `direction`: Sync direction (pull, push, both)
- `filter`: Optional filter for which issues to sync

**Example**:

```
/mo linear-sync direction:pull filter:"updated:>7d"
```

---

### `/mo push-to-linear`

**Description**: Push selected task(s) to Linear.

**Parameters**:

- `id`: Task ID to push (if omitted, pushes all tasks)
- `team`: Linear team ID (optional, uses default if not specified)

**Example**:

```
/mo push-to-linear id:task-123
```

---

### `/mo pull-from-linear`

**Description**: Pull issues from Linear based on criteria.

**Parameters**:

- `status`: Filter by status
- `assignee`: Filter by assignee
- `limit`: Maximum number to pull

**Example**:

```
/mo pull-from-linear status:todo assignee:me limit:10
```

## Project Management Commands

### `/mo plan-project`

**Description**: Generate tasks for a project plan based on description.

**Parameters**:

- `description`: Project description
- `tech`: Technology stack
- `scope`: Project scope (small, medium, large)

**Example**:

```
/mo plan-project description:"Build a task management system" tech:"Node.js, React" scope:medium
```

---

### `/mo task-report`

**Description**: Generate a report of task status and progress.

**Parameters**:

- `format`: Report format (text, markdown)
- `groupBy`: How to group tasks (status, priority, none)

**Example**:

```
/mo task-report format:markdown groupBy:status
```

## Settings Commands

### `/mo settings`

**Description**: View or update Mo settings.

**Parameters**:

- `set`: Key-value pair to set (optional)
- `get`: Setting key to retrieve (optional)

**Example**:

```
/mo settings set:defaultPriority=medium
```

---

### `/mo help`

**Description**: Show help information about Mo commands.

**Parameters**:

- `command`: Specific command to get help about (optional)

**Example**:

```
/mo help command:linear-sync
```
