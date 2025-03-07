# Linear Integration Scripts

This directory contains scripts for managing and interacting with Linear tasks and projects.

## Scripts

- `update-task-queue-status.js`: Updates the status of the task queue implementation task in Linear
- `update-ui-task-status.js`: Updates the status of the UI framework implementation task in Linear
- `update-task-status.js`: General script for updating task statuses in Linear

## Usage

These scripts can be run using Node.js:

```bash
node scripts/linear/update-task-queue-status.js
```

They require a valid Linear API key and team ID to be set in the `.env` file at the root of the project. 