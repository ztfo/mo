/**
 * Linear GraphQL Queries
 *
 * This file contains GraphQL queries and mutations for the Linear API
 */

import { gql } from "graphql-request";

/**
 * Fragment containing common issue fields
 */
export const ISSUE_FRAGMENT = gql`
  fragment IssueFragment on Issue {
    id
    title
    description
    identifier
    priority
    estimate
    stateId
    state {
      id
      name
      type
      color
    }
    teamId
    team {
      id
      name
      key
    }
    assigneeId
    assignee {
      id
      name
      email
    }
    creatorId
    creator {
      id
      name
      email
    }
    projectId
    project {
      id
      name
    }
    createdAt
    updatedAt
    url
  }
`;

/**
 * Query to validate API key by getting viewer information
 */
export const VALIDATE_API_KEY = gql`
  query ValidateApiKey {
    viewer {
      id
      name
      email
      displayName
      avatarUrl
      active
    }
  }
`;

/**
 * Query to get the current user
 */
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    viewer {
      id
      name
      email
      displayName
      avatarUrl
      active
    }
  }
`;

/**
 * Query to get all teams
 */
export const GET_TEAMS = gql`
  query GetTeams {
    teams {
      nodes {
        id
        name
        key
        description
        icon
        color
      }
    }
  }
`;

/**
 * Query to get a specific team by ID
 */
export const GET_TEAM = gql`
  query GetTeam($id: ID!) {
    team(id: $id) {
      id
      name
      key
      description
      icon
      color
    }
  }
`;

/**
 * Query to get workflow states for a team
 */
export const GET_WORKFLOW_STATES = gql`
  query GetWorkflowStates($teamId: ID!) {
    workflowStates(filter: { team: { id: { eq: $teamId } } }) {
      nodes {
        id
        name
        description
        color
        type
        teamId
        position
      }
    }
  }
`;

/**
 * Query to get projects for a team
 */
export const GET_PROJECTS = gql`
  query GetProjects($teamId: ID!, $first: Int) {
    projects(filter: { team: { id: { eq: $teamId } } }, first: $first) {
      nodes {
        id
        name
        description
        state
        startDate
        targetDate
        teamId
        progress
      }
    }
  }
`;

/**
 * Query to get issues
 */
export const GET_ISSUES = gql`
  query GetIssues($filter: IssueFilter, $first: Int, $after: String) {
    issues(filter: $filter, first: $first, after: $after) {
      nodes {
        ...IssueFragment
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${ISSUE_FRAGMENT}
`;

/**
 * Query to get a specific issue by ID
 */
export const GET_ISSUE = gql`
  query GetIssue($id: ID!) {
    issue(id: $id) {
      ...IssueFragment
    }
  }
  ${ISSUE_FRAGMENT}
`;

/**
 * Mutation to create an issue
 */
export const CREATE_ISSUE = gql`
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        ...IssueFragment
      }
    }
  }
  ${ISSUE_FRAGMENT}
`;

/**
 * Mutation to update an issue
 */
export const UPDATE_ISSUE = gql`
  mutation UpdateIssue($id: ID!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue {
        ...IssueFragment
      }
    }
  }
  ${ISSUE_FRAGMENT}
`;

/**
 * Mutation to delete an issue
 */
export const DELETE_ISSUE = gql`
  mutation DeleteIssue($id: ID!) {
    issueDelete(id: $id) {
      success
    }
  }
`;

/**
 * Query to search issues
 */
export const SEARCH_ISSUES = gql`
  query SearchIssues($query: String!, $first: Int) {
    issueSearch(query: $query, first: $first) {
      nodes {
        ...IssueFragment
      }
    }
  }
  ${ISSUE_FRAGMENT}
`;

/**
 * Query to get labels for a team
 */
export const GET_LABELS = gql`
  query GetLabels($teamId: ID!) {
    issueLabels(filter: { team: { id: { eq: $teamId } } }) {
      nodes {
        id
        name
        color
        description
        teamId
      }
    }
  }
`;

/**
 * Query to get comments for an issue
 */
export const GET_ISSUE_COMMENTS = gql`
  query GetIssueComments($issueId: ID!) {
    issue(id: $issueId) {
      comments {
        nodes {
          id
          body
          createdAt
          updatedAt
          user {
            id
            name
            email
          }
        }
      }
    }
  }
`;

/**
 * Mutation to add a comment to an issue
 */
export const ADD_COMMENT = gql`
  mutation AddComment($issueId: ID!, $body: String!) {
    commentCreate(input: { issueId: $issueId, body: $body }) {
      success
      comment {
        id
        body
        createdAt
      }
    }
  }
`;
