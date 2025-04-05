# Linear API Integration Improvements

This document outlines recommended improvements to our Linear API integration based on the latest [Linear API documentation](https://developers.linear.app/docs).

## Current State

Our Linear integration currently provides:

- Authentication via personal API key
- Basic team, project, and issue querying
- Manual two-way synchronization
- Basic rate limiting with exponential backoff
- Status mapping between Linear and Mo

## Recommended Improvements

### 1. Enhanced Pagination Implementation (Priority: High)

**Current Limitation:**
Our implementation defines query support for pagination with `first` and `after` parameters, but our API methods don't fully utilize cursor-based pagination for large result sets.

**Recommendation:**

- Update the `getIssues` method in `api.ts` to implement cursor-based pagination
- Add a utility function to automatically fetch all results when needed
- Support batched operations for better performance

**Implementation Details:**

- Use the `pageInfo.hasNextPage` and `pageInfo.endCursor` from query responses
- Implement an async generator pattern for easy iteration through paginated results
- Add options to control pagination behavior

### 2. Webhooks Implementation (Priority: High)

**Current Limitation:**
We rely on manual synchronization which can lead to data inconsistencies and requires explicit user action.

**Recommendation:**

- Implement webhook support to receive real-time updates from Linear
- Create endpoint to receive webhook events
- Process incoming webhook payloads to update local data
- Add webhook configuration UI/commands

**Implementation Details:**

- Create a webhook receiver endpoint in the server
- Implement webhook verification using Linear's signature verification
- Create webhook registration command using Linear's API
- Add event handlers for different webhook event types

### 3. OAuth 2.0 Authentication (Priority: Medium)

**Current Limitation:**
We're using personal API keys, which limit the integration to a single user's permissions.

**Recommendation:**

- Implement OAuth 2.0 authentication as an alternative to API keys
- Support refresh tokens for long-lived access
- Add proper scopes management

**Implementation Details:**

- Implement OAuth 2.0 flow with authorization and token endpoints
- Store refresh tokens securely
- Implement automatic token refresh
- Update API client to use OAuth tokens

### 4. File Attachments Support (Priority: Medium)

**Current Limitation:**
Our integration doesn't support Linear's file attachment capabilities.

**Recommendation:**

- Add support for uploading attachments to Linear issues
- Implement downloading attachments from Linear
- Support linking attachments to issues

**Implementation Details:**

- Implement file upload functionality using Linear's attachment API
- Add commands for attachment management
- Extend the issue data model to include attachments

### 5. Improved Filtering Capabilities (Priority: Medium)

**Current Limitation:**
We're using basic filters and not leveraging Linear's advanced filtering options.

**Recommendation:**

- Expand our filter implementation to utilize more of Linear's filtering options
- Support complex filter expressions
- Add specialized filters for common use cases

**Implementation Details:**

- Update the filter builder in the API client
- Add support for nested filters and logical operators
- Implement common filter presets

### 6. Comments Support (Priority: Medium)

**Current Limitation:**
We don't currently support issue comments.

**Recommendation:**

- Add support for creating, reading, and managing comments
- Implement two-way comment synchronization
- Support for user mentions

**Implementation Details:**

- Add comment data model
- Implement comment-related API methods
- Add commands for comment management

### 7. Rate Limiting Enhancement (Priority: Low)

**Current Limitation:**
We have basic rate limiting with static delays and exponential backoff.

**Recommendation:**

- Improve rate limiting by using the rate limit headers provided by Linear's API
- Implement adaptive rate limiting based on API responses
- Add rate limit monitoring

**Implementation Details:**

- Extract and use rate limit headers from API responses
- Adjust request timing dynamically based on remaining rate limits
- Log rate limit information for monitoring

## Implementation Plan

1. **Phase 1: Core Functionality Improvements**

   - Enhanced pagination implementation
   - Webhooks support

2. **Phase 2: Extended Features**

   - File attachments support
   - Comments support
   - Improved filtering

3. **Phase 3: Authentication and Performance**
   - OAuth 2.0 authentication
   - Rate limiting enhancement

## Next Steps

1. Implement enhanced pagination in the API client
2. Add webhook support for real-time updates
3. Document the improved capabilities
4. Update the command handlers to leverage new features
