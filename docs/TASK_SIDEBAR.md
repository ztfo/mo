# Task Sidebar Documentation

## Overview

The Task Sidebar provides a convenient way to view, filter, and interact with your Linear tasks directly within Cursor. This document explains how to use the Task Sidebar and its various features.

## Features

### Viewing Tasks

The Task Sidebar displays your Linear tasks in a tree view, showing:

- Task title
- Current state (Todo, In Progress, Done, Blocked, etc.)
- Priority level (None, Low, Medium, High, Urgent)
- Visual indicators for task state and priority

Each task can be clicked to view more details or right-clicked to access additional actions.

### Task Icons

Tasks are displayed with icons that indicate their current state:

- **Circle Outline**: Todo or backlog tasks
- **Play Circle**: Tasks in progress
- **Check Circle**: Completed tasks
- **Alert Circle**: Blocked tasks

High-priority tasks (priority 3-4) are shown with red-colored icons to make them stand out.

### Filtering Tasks

The Task Sidebar offers powerful filtering capabilities:

1. **State Filtering**: Filter tasks by their current state (Todo, In Progress, Done, etc.)
2. **Priority Filtering**: Filter tasks by priority level
3. **Assignee Filtering**: Show only tasks assigned to specific team members
4. **Label Filtering**: Filter tasks by their associated labels
5. **Time Range Filtering**: Show tasks created within a specific time period (default: 7 days)

### Searching Tasks

You can search for tasks using the search box. The search will match against:

- Task titles
- Task descriptions
- Task identifiers (e.g., "MOB-123")

### Task Actions

Right-clicking on a task provides access to several actions:

1. **View Details**: Open the task details in a separate panel
2. **Copy Context**: Copy the task context to the clipboard in a formatted way
3. **Update State**: Change the task's state directly from the sidebar
4. **Update Priority**: Change the task's priority level
5. **Open in Linear**: Open the task in the Linear web interface

### Task Context

The "Copy Context" action provides a formatted task context that includes:

```
# Task Title

## Overview
Task description text

## Technical Requirements
- Priority: Medium
- Estimate: 2
- State: In Progress
- Labels: Frontend, Bug
- Assignee: John Doe

## Linear Issue
MOB-123 - https://linear.app/team/issue/MOB-123/task-title
```

This format is designed to be pasted into documentation, chat tools, or other contexts where you need to share task information.

## Usage

### Opening the Task Sidebar

To open the Task Sidebar, use the command palette (Cmd+Shift+P or Ctrl+Shift+P) and search for "Mo: Show Linear Sync".

### Refreshing Tasks

The Task Sidebar automatically refreshes when opened. To manually refresh the tasks, click the refresh button at the top of the sidebar.

### Applying Filters

1. Click the filter button at the top of the sidebar
2. Select the desired filters from the dropdown menu
3. Click "Apply" to apply the filters

### Clearing Filters

To clear all filters and return to the default view, click the "Clear Filters" button in the filter dropdown.

### Searching Tasks

1. Click the search button at the top of the sidebar
2. Enter your search term in the search box
3. Press Enter to search

### Updating Task State

1. Right-click on a task
2. Select "Update State" from the context menu
3. Choose the new state from the dropdown menu

### Updating Task Priority

1. Right-click on a task
2. Select "Update Priority" from the context menu
3. Choose the new priority level from the dropdown menu

## Troubleshooting

### No Tasks Displayed

If no tasks are displayed in the sidebar:

1. Check your Linear API key configuration in the settings
2. Verify your internet connection
3. Try increasing the time range filter
4. Check if you have access to the Linear team

### Filters Not Working

If filters don't seem to be working correctly:

1. Try clearing all filters and applying them again
2. Refresh the task list
3. Check if the tasks actually exist with the criteria you're filtering for

### Task Updates Not Reflected

If your task updates (state or priority changes) are not reflected:

1. Refresh the task list
2. Check your Linear permissions
3. Verify your internet connection

## Keyboard Shortcuts

- **F5**: Refresh task list
- **Ctrl+F** / **Cmd+F**: Focus search box
- **Escape**: Clear search or close filter dropdown
- **Enter** (on a task): View task details

---

_Last updated: 2024-03-14_
