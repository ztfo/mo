# Linear Integration Architecture

This document outlines the architectural design for integrating Linear with Mo.

## Overall Architecture

The Linear integration follows these key architectural principles:

1. **Clean Separation of Concerns**: Separate API, auth, and sync logic
2. **Secure Credential Management**: Encrypted storage of API keys
3. **Reliable Synchronization**: Robust two-way sync with conflict resolution
4. **Graceful Error Handling**: Handle API errors and rate limits gracefully
5. **Minimal Dependency**: Limit external dependencies to essential libraries

## Component Architecture

```
src/linear/
├── api.ts                  # Linear API client
├── auth.ts                 # Authentication logic
├── sync.ts                 # Synchronization engine
├── mapping.ts              # Data mapping between Mo and Linear
├── types.ts                # Linear-specific type definitions
└── commands/               # Linear-specific command handlers
    ├── index.ts            # Command registry
    ├── auth-commands.ts    # Authentication commands
    ├── sync-commands.ts    # Sync commands
    └── issue-commands.ts   # Issue management commands
```

## Authentication Component

The authentication component will:

1. Handle API key storage and retrieval
2. Encrypt credentials using a secure mechanism
3. Validate authentication status
4. Provide interfaces for adding/removing/updating credentials

```typescript
// Example auth.ts structure
export interface LinearAuth {
  apiKey: string;
  userId?: string;
  teamId?: string;
  encrypted: boolean;
}

export async function storeApiKey(apiKey: string): Promise<void>;
export async function getApiKey(): Promise<string | null>;
export async function validateApiKey(apiKey: string): Promise<boolean>;
export async function clearApiKey(): Promise<void>;
```

## API Client Component

The API client will:

1. Handle all communication with Linear's GraphQL API
2. Implement rate limiting and retry logic
3. Provide high-level methods for common operations
4. Handle error translation to user-friendly messages

```typescript
// Example api.ts structure
export class LinearClient {
  constructor(apiKey: string);

  // Issues
  async getIssues(options?: QueryOptions): Promise<Issue[]>;
  async getIssue(id: string): Promise<Issue | null>;
  async createIssue(data: CreateIssueInput): Promise<Issue>;
  async updateIssue(id: string, data: UpdateIssueInput): Promise<Issue>;
  async deleteIssue(id: string): Promise<boolean>;

  // Teams
  async getTeams(): Promise<Team[]>;
  async getTeam(id: string): Promise<Team | null>;

  // States
  async getWorkflowStates(teamId: string): Promise<WorkflowState[]>;

  // Users
  async getCurrentUser(): Promise<User>;

  // Raw GraphQL queries for advanced use cases
  async executeQuery<T>(query: string, variables?: any): Promise<T>;
}
```

## Data Mapping Component

The data mapping component will:

1. Define the mapping between Mo tasks and Linear issues
2. Handle bidirectional conversion of data
3. Preserve unmapped fields during sync
4. Handle identifier mapping and references

```typescript
// Example mapping.ts structure
export function taskToIssue(task: Task, teamId: string): CreateIssueInput;
export function issueToTask(issue: Issue): CreateTaskParams;
export function updateTaskFromIssue(task: Task, issue: Issue): UpdateTaskParams;
export function updateIssueFromTask(task: Task, issue: Issue): UpdateIssueInput;
```

Mapping table between Mo and Linear data models:

| Mo Task Field     | Linear Issue Field | Notes                                |
| ----------------- | ------------------ | ------------------------------------ |
| id                | -                  | Local identifier only                |
| title             | title              | Direct mapping                       |
| description       | description        | Direct mapping                       |
| status            | state              | Mapped to appropriate workflow state |
| priority          | priority           | Mapped to Linear's 0-4 scale         |
| created           | createdAt          | Timestamp format conversion          |
| updated           | updatedAt          | Timestamp format conversion          |
| metadata.linearId | id                 | Linear issue identifier              |
| metadata.filePath | -                  | Mo-specific, not synced              |
| metadata.position | -                  | Mo-specific, not synced              |
| metadata.tags     | labelIds           | Mapped to Linear labels              |

## Synchronization Component

The synchronization component will:

1. Implement two-way sync between Mo tasks and Linear issues
2. Detect and resolve conflicts based on update timestamps
3. Support different sync strategies (push, pull, or both)
4. Track sync status and history

```typescript
// Example sync.ts structure
export interface SyncOptions {
  direction: "push" | "pull" | "both";
  filter?: TaskFilterParams;
  force?: boolean;
  dryRun?: boolean;
}

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: SyncError[];
}

export async function synchronize(options: SyncOptions): Promise<SyncResult>;
export async function pushTaskToLinear(taskId: string): Promise<Issue | null>;
export async function pullIssueFromLinear(
  issueId: string
): Promise<Task | null>;
```

## Command Handlers

The command handlers will implement the following commands:

### Authentication Commands

- `/mo linear-auth`: Authenticate with Linear
- `/mo linear-status`: Check authentication status
- `/mo linear-logout`: Remove stored credentials

### Synchronization Commands

- `/mo linear-sync`: Synchronize tasks with Linear
- `/mo linear-push`: Push specific tasks to Linear
- `/mo linear-pull`: Pull specific issues from Linear

### Issue Management Commands

- `/mo linear-teams`: List available Linear teams
- `/mo linear-projects`: List available Linear projects
- `/mo linear-states`: List available workflow states
- `/mo linear-issues`: List Linear issues

## Error Handling Strategy

The Linear integration will implement a comprehensive error handling strategy:

1. **Network Errors**: Retry with exponential backoff
2. **Authentication Errors**: Clear guidance on reauthentication
3. **Rate Limiting**: Respect rate limits with proper backoff
4. **Validation Errors**: Detailed feedback on what needs correction
5. **Conflict Errors**: Clear explanation of conflicts and resolution options

## Data Flow Diagrams

### Authentication Flow

```
User Input -> Command Handler -> Auth Component -> Encryption -> Config Storage
```

### Task Creation Flow

```
Local Task Created -> Sync Component -> Data Mapping -> API Client -> Linear API
```

### Issue Pull Flow

```
Linear API -> API Client -> Data Mapping -> Sync Component -> Local Storage
```

## Security Considerations

1. **API Key Storage**: Keys will be encrypted using crypto-js before storage
2. **No Plaintext Secrets**: Never log or display API keys in plaintext
3. **Minimal Permissions**: Request only necessary permissions
4. **Secure Defaults**: Conservative defaults for sync behavior

## Testing Strategy

1. **Unit Tests**: For mapping, auth, and utility functions
2. **Integration Tests**: For API client with mock server
3. **End-to-End Tests**: For full sync workflow
4. **Security Tests**: Verify proper encryption of credentials
