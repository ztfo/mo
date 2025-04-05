# Linear API Research

## API Overview

Linear provides a GraphQL API that enables comprehensive integration with their issue tracking system. This document outlines the key capabilities, endpoints, and implementation considerations for Mo's Linear integration.

## Authentication Methods

Linear offers multiple authentication options:

1. **Personal API Keys**: Simple authentication using personal access tokens

   - User-specific access level
   - Easy to implement but limited to a single user's permissions
   - Suitable for personal use scenarios

2. **OAuth 2.0**: Full-featured authentication flow for multi-user scenarios
   - Requires redirect URI handling
   - Provides refresh tokens for long-term access
   - Supports different permission scopes
   - More complex to implement but offers better security

For Mo's initial implementation, we'll use Personal API Keys for simplicity, with potential to add OAuth support later.

## Core API Capabilities

### Issues Management

- **Create issues**: Create new issues in Linear
- **Read issues**: Query issues with filtering, sorting, and pagination
- **Update issues**: Modify issue details, status, assignees, etc.
- **Delete issues**: Remove issues (with proper permissions)
- **Comments**: Add, read, and manage comments on issues
- **Attachments**: Upload and link attachments to issues
- **Relations**: Create and manage relationships between issues

### Projects and Cycles

- **Projects**: Create, read, update, and delete projects
- **Cycles**: Manage development cycles/sprints
- **Roadmaps**: Access roadmap data

### Teams and Users

- **Teams**: Access team information and settings
- **Users**: Query user details and manage assignments
- **Team membership**: Manage team membership

### States and Workflows

- **States**: Access and manage workflow states
- **Labels**: Create and apply labels
- **Priorities**: Assign and update priorities
- **Custom fields**: Access and update custom fields

### Notifications and Webhooks

- **Subscriptions**: Subscribe to updates on specific issues
- **Webhooks**: Configure webhook endpoints for real-time updates

## GraphQL Schema Structure

Linear's API is built on GraphQL, which provides a flexible query language. Key object types include:

- `Issue`: Core issue object
- `Comment`: Comments on issues
- `User`: User account information
- `Team`: Team information
- `Project`: Project details
- `Cycle`: Sprint/cycle data
- `Attachment`: File attachments
- `WorkflowState`: States in the workflow (e.g., Todo, In Progress, Done)
- `IssueLabel`: Labels for categorizing issues

## Integration Challenges and Considerations

1. **Rate Limiting**: Linear API has rate limits that must be respected

   - Implement exponential backoff for retries
   - Use batched operations where possible

2. **Data Synchronization**:

   - Handling conflicts when both local and remote data change
   - Deciding on sync strategy (two-way vs. one-way)
   - Tracking relationship between local tasks and Linear issues

3. **Offline Support**:

   - Queueing changes when offline
   - Resolving conflicts upon reconnection

4. **Authentication Security**:

   - Secure storage of API tokens
   - Refresh token management (for OAuth)

5. **Error Handling**:
   - Graceful handling of API errors
   - Informative error messages for users

## Example GraphQL Queries

### Fetching Issues

```graphql
query {
  issues(
    first: 10
    filter: {
      team: { name: { eq: "Engineering" } }
      state: { name: { in: ["Todo", "In Progress"] } }
    }
  ) {
    nodes {
      id
      title
      description
      state {
        name
        color
      }
      assignee {
        name
      }
      priority
      createdAt
      updatedAt
    }
  }
}
```

### Creating an Issue

```graphql
mutation {
  issueCreate(
    input: {
      title: "Implement Linear integration"
      description: "Add Linear API support to Mo"
      teamId: "TEAM_ID"
      stateId: "STATE_ID"
      priority: 2
    }
  ) {
    success
    issue {
      id
      title
    }
  }
}
```

## Implementation Approach for Mo

For Mo's Linear integration, we'll implement:

1. A secure authentication mechanism for storing and using API tokens
2. A data mapping layer between Mo's task model and Linear's issue model
3. Two-way synchronization with conflict resolution
4. Commands for creating, updating, and syncing issues
5. Error handling and rate limit management

## Resources

- [Linear API Documentation](https://developers.linear.app/docs/)
- [Linear GraphQL API Reference](https://developers.linear.app/docs/graphql/working-with-the-graphql-api)
- [Linear API Authentication](https://developers.linear.app/docs/api/authentication)
