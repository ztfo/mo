# Linear Integration Implementation Plan

This document outlines the detailed implementation plan for Phase 2 of Mo, which focuses on Linear integration.

## Timeline Overview

- **Phase 2 Timeline**: March 22 - April 5, 2024 (2 weeks)
- **Week 1**: March 22 - March 28 (Core infrastructure and authentication)
- **Week 2**: March 29 - April 5 (Synchronization and command implementation)

## Implementation Tasks

### Week 1: Core Infrastructure and Authentication

#### 1. Linear API Types and Client (March 22-23)

- [ ] Define Linear-specific type definitions in `src/linear/types.ts`
- [ ] Implement GraphQL query helpers
- [ ] Create the LinearClient class with basic query functionality
- [ ] Add retry logic and rate limiting
- [ ] Implement error handling

#### 2. Authentication System (March 24-25)

- [ ] Create secure storage mechanism for API keys
- [ ] Implement encryption/decryption of credentials using crypto-js
- [ ] Add functions to validate and test API keys
- [ ] Create configuration storage for Linear-specific settings

#### 3. Authentication Commands (March 26)

- [ ] Implement `/mo linear-auth` command
- [ ] Implement `/mo linear-status` command
- [ ] Implement `/mo linear-logout` command
- [ ] Add helpful error messages and guidance

#### 4. Data Mapping Layer (March 27-28)

- [ ] Create bidirectional mapping functions between Mo tasks and Linear issues
- [ ] Handle status/state mapping with customization options
- [ ] Implement priority mapping
- [ ] Add support for metadata storage of Linear issue IDs
- [ ] Create tests for mapping functions

### Week 2: Synchronization and Commands

#### 5. Synchronization Engine (March 29-30)

- [ ] Implement basic sync logic for push and pull operations
- [ ] Add conflict detection based on timestamps
- [ ] Implement conflict resolution strategies
- [ ] Add support for filtered synchronization
- [ ] Create sync history tracking

#### 6. Synchronization Commands (March 31 - April 1)

- [ ] Implement `/mo linear-sync` command
- [ ] Implement `/mo linear-push` command
- [ ] Implement `/mo linear-pull` command
- [ ] Add sync status reporting and error visualization

#### 7. Issue Management Commands (April 2-3)

- [ ] Implement `/mo linear-teams` command
- [ ] Implement `/mo linear-projects` command
- [ ] Implement `/mo linear-states` command
- [ ] Implement `/mo linear-issues` command

#### 8. Testing and Documentation (April 4-5)

- [ ] Add unit tests for all components
- [ ] Create integration tests for sync workflows
- [ ] Update user documentation
- [ ] Create sample workflows and examples

## Dependencies

The following dependencies will be needed for this phase:

- **graphql-request**: For GraphQL API communication
- **crypto-js**: For secure API key storage
- **date-fns**: For date manipulation and comparison

## Implementation Details

### Linear API Client

The API client will be implemented as a class that handles all communication with Linear's GraphQL API:

```typescript
export class LinearClient {
  private apiKey: string;
  private client: GraphQLClient;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new GraphQLClient("https://api.linear.app/graphql", {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });
  }

  // Methods for issues, teams, states, etc.
}
```

### Authentication Storage

API keys will be stored securely using encryption:

```typescript
export async function storeApiKey(apiKey: string): Promise<void> {
  // Generate a machine-specific salt
  const salt = getMachineSalt();

  // Encrypt the API key
  const encryptedKey = CryptoJS.AES.encrypt(apiKey, salt).toString();

  // Store in configuration
  await updateConfig({
    linearApiKey: encryptedKey,
    linearConfigured: true,
  });
}
```

### Synchronization Strategy

Synchronization will be implemented with the following strategy:

1. **Push**: Local changes are sent to Linear

   - If the task has a Linear ID, update the issue
   - If not, create a new issue and store the ID

2. **Pull**: Linear changes are fetched to local

   - Query issues updated since last sync
   - Update local tasks or create new ones

3. **Conflict Resolution**:
   - If both local and remote have changes, use the most recent update
   - Allow force push/pull to override conflict resolution

## Testing Approach

1. **Unit Tests**: Test individual components with mocked dependencies
2. **Integration Tests**: Test the sync workflow with a mock Linear API server
3. **Manual Testing**: Test real-world scenarios with actual Linear accounts

## Rollout Strategy

1. **Alpha Testing**: Internal testing with developer Linear accounts
2. **Beta Release**: Release to small group of users for feedback
3. **Full Release**: Release to all users with documentation

## Success Criteria

Phase 2 will be considered successful when:

1. Users can authenticate with Linear securely
2. Tasks can be synchronized bidirectionally with proper conflict resolution
3. Users can view Linear data (teams, projects, issues) from within Mo
4. All error cases are handled gracefully with helpful guidance
5. Documentation is clear and comprehensive
