# Enhanced Linear API Integration

## Overview

This document outlines the expanded integration with Linear's API, focusing on utilizing more of Linear's features to create a comprehensive project management experience within the Mo plugin.

## Linear API Capabilities

Linear provides a GraphQL API that offers access to nearly all features of the platform. The current Mo plugin uses only basic issue creation and fetching, but we plan to expand to include:

### Core Entities

1. **Issues**
   - Create, read, update, delete operations
   - Custom fields support
   - Attachments
   - Comments
   - History/audit log

2. **Projects**
   - Create and manage projects
   - Project milestones
   - Project updates
   - Project status tracking

3. **Cycles (Sprints)**
   - Create and manage cycles
   - Cycle analytics
   - Cycle planning

4. **Teams**
   - Team management
   - Team settings
   - Team metrics

5. **Users**
   - User information
   - Assignments
   - Workload management

6. **Workflows**
   - Custom states
   - Workflow automation
   - Transitions

7. **Labels**
   - Create and manage labels
   - Label groups
   - Label-based filtering

## API Implementation Plan

### Phase 1: Enhanced Issue Management

#### Issue Creation Enhancements
```typescript
export async function createEnhancedLinearIssue(
  title: string,
  description: string,
  options: {
    priority?: number;
    labelIds?: string[];
    assigneeId?: string;
    projectId?: string;
    cycleId?: string;
    stateId?: string;
    estimate?: number;
    dueDate?: string;
  }
) {
  // Implementation
}
```

#### Issue Querying Enhancements
```typescript
export async function getFilteredIssues(
  filters: {
    states?: string[];
    assignees?: string[];
    labels?: string[];
    priorities?: number[];
    projects?: string[];
    cycles?: string[];
    dueDate?: { before?: string; after?: string };
    createdAt?: { before?: string; after?: string };
    updatedAt?: { before?: string; after?: string };
  },
  pagination: {
    first?: number;
    after?: string;
  }
) {
  // Implementation
}
```

#### Issue Updates
```typescript
export async function updateIssue(
  issueId: string,
  updates: {
    title?: string;
    description?: string;
    stateId?: string;
    priority?: number;
    labelIds?: string[];
    assigneeId?: string;
    projectId?: string;
    cycleId?: string;
    estimate?: number;
    dueDate?: string;
  }
) {
  // Implementation
}
```

### Phase 2: Projects and Cycles

#### Project Management
```typescript
export async function getProjects(teamId: string) {
  // Implementation
}

export async function createProject(
  name: string,
  description: string,
  teamId: string,
  options: {
    state?: string;
    startDate?: string;
    targetDate?: string;
    leadId?: string;
    memberIds?: string[];
  }
) {
  // Implementation
}

export async function updateProject(
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    state?: string;
    startDate?: string;
    targetDate?: string;
    leadId?: string;
    memberIds?: string[];
  }
) {
  // Implementation
}
```

#### Cycle Management
```typescript
export async function getCycles(teamId: string) {
  // Implementation
}

export async function createCycle(
  name: string,
  teamId: string,
  options: {
    description?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  // Implementation
}

export async function updateCycle(
  cycleId: string,
  updates: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  // Implementation
}
```

### Phase 3: Advanced Features

#### Comments and Attachments
```typescript
export async function addComment(
  issueId: string,
  body: string
) {
  // Implementation
}

export async function addAttachment(
  issueId: string,
  url: string,
  title: string,
  options: {
    subtitle?: string;
    type?: string;
  }
) {
  // Implementation
}
```

#### Relationships and Dependencies
```typescript
export async function createIssueRelation(
  issueId: string,
  relatedIssueId: string,
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate' | 'duplicated_by'
) {
  // Implementation
}

export async function getIssueRelations(issueId: string) {
  // Implementation
}
```

#### Webhooks and Subscriptions
```typescript
export async function createWebhook(
  url: string,
  teamId: string,
  resourceTypes: string[]
) {
  // Implementation
}

export async function subscribeToIssue(
  issueId: string,
  userId: string
) {
  // Implementation
}
```

## GraphQL Query Examples

### Fetching Team with Issues, Projects, and Cycles
```graphql
query {
  team(id: "TEAM_ID") {
    name
    key
    issues(first: 50) {
      nodes {
        id
        identifier
        title
        description
        state {
          name
          color
        }
        assignee {
          name
          email
        }
        labels {
          nodes {
            name
            color
          }
        }
        project {
          name
        }
        cycle {
          name
          startDate
          endDate
        }
      }
    }
    projects(first: 10) {
      nodes {
        id
        name
        description
        state
        startDate
        targetDate
      }
    }
    cycles(first: 10) {
      nodes {
        id
        name
        description
        startDate
        endDate
        issues {
          nodes {
            id
            title
          }
        }
      }
    }
  }
}
```

### Creating an Issue with Advanced Options
```graphql
mutation {
  issueCreate(input: {
    title: "Implement user authentication",
    description: "Add OAuth support for Google and GitHub",
    teamId: "TEAM_ID",
    projectId: "PROJECT_ID",
    cycleId: "CYCLE_ID",
    stateId: "STATE_ID",
    priority: 2,
    labelIds: ["LABEL_ID_1", "LABEL_ID_2"],
    assigneeId: "USER_ID",
    estimate: 5
  }) {
    success
    issue {
      id
      identifier
      url
    }
  }
}
```

## Data Caching Strategy

To minimize API calls and improve performance, we'll implement a caching strategy:

1. **Cache Layers**:
   - Memory cache for active session
   - Local storage for persistence between sessions
   - Invalidation based on timestamps

2. **Cache Entities**:
   - Teams
   - Projects
   - Cycles
   - States
   - Labels
   - Users
   - Frequently accessed issues

3. **Sync Strategy**:
   - Background sync at configurable intervals
   - Manual sync option
   - Selective sync for specific entities
   - Conflict resolution for concurrent edits

## Error Handling

1. **API Error Types**:
   - Authentication errors
   - Permission errors
   - Validation errors
   - Rate limiting
   - Network errors

2. **Error Recovery**:
   - Retry strategies with exponential backoff
   - Fallback to cached data
   - Offline queue for failed operations
   - User-friendly error messages

3. **Logging**:
   - Error logging for debugging
   - Usage analytics
   - Performance metrics

## Security Considerations

1. **API Key Management**:
   - Secure storage of API keys
   - Scope limitation
   - Rotation policies

2. **Data Privacy**:
   - Minimal data collection
   - Local processing when possible
   - Clear data retention policies

## Testing Strategy

1. **Unit Tests**:
   - Test each API function in isolation
   - Mock Linear API responses

2. **Integration Tests**:
   - Test end-to-end workflows
   - Verify data consistency

3. **Performance Tests**:
   - Measure response times
   - Test with large datasets
   - Verify caching effectiveness

## Next Steps

1. Implement enhanced issue management functions
2. Set up caching infrastructure
3. Create comprehensive error handling
4. Add project and cycle management
5. Implement advanced features like comments and relationships 