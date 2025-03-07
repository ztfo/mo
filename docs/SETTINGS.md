# Settings

## Linear API Configuration
The Mo plugin uses environment variables for sensitive credentials:

- `LINEAR_API_KEY`: Your Linear API key (stored in `.env` file, not committed to Git)
- `LINEAR_TEAM_ID`: Your Linear Team ID (stored in `.env` file, not committed to Git)

### How to Set Up Credentials

1. Create a `.env` file in the project root
2. Add your Linear API credentials:
   ```
   LINEAR_API_KEY=your_api_key_here
   LINEAR_TEAM_ID=your_team_id_here
   ```
3. The `.env` file is already in `.gitignore` to prevent committing credentials

### Additional Linear Configuration (Planned)

In future versions, the following Linear configurations will be supported:

- `LINEAR_PROJECT_ID`: Default project ID for new issues
- `LINEAR_CYCLE_ID`: Default cycle/sprint ID for new issues
- `LINEAR_LABEL_IDS`: Default label IDs to apply to new issues
- `LINEAR_DEFAULT_ASSIGNEE`: Default user to assign issues to
- `LINEAR_PRIORITY_DEFAULT`: Default priority for new issues

## Extension Settings
- Update Frequency: 5 minutes
- Log Location: docs/features/FEATURE_PLANS.md

## UI Configuration (Planned)

The upcoming UI interface will include the following configuration options:

### Task Queue Settings
- Auto-push threshold: Number of tasks to queue before auto-pushing to Linear
- Default task properties: Set default values for priority, labels, etc.
- Queue persistence: How long to keep tasks in the queue

### Sync Settings
- Sync frequency: How often to sync with Linear
- Sync scope: What data to sync (issues, comments, projects, etc.)
- Conflict resolution: How to handle conflicts between local and remote changes

### Notification Settings
- Notification types: What events to receive notifications for
- Notification format: How notifications should be displayed
- Do not disturb: Schedule when notifications should be muted

### Logging Settings

- Auto-Update Interval: 5 minutes
- Log Location: docs/features/FEATURE_PLANS.md 