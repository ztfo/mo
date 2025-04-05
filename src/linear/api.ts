/**
 * Linear API Client
 *
 * This file implements a client for the Linear API using GraphQL.
 * It handles authentication, requests, and error handling.
 */

import { GraphQLClient } from "graphql-request";
import {
  LinearApiError,
  LinearIssue,
  LinearIssueCreateInput,
  LinearIssueUpdateInput,
  LinearProject,
  LinearQueryOptions,
  LinearTeam,
  LinearUser,
  LinearWorkflowState,
} from "./types";

// Linear API endpoint
const LINEAR_API_ENDPOINT = "https://api.linear.app/graphql";

// Maximum retries for requests
const MAX_RETRIES = 3;

// Base delay for exponential backoff (ms)
const BASE_DELAY = 1000;

/**
 * Linear API Client
 *
 * Provides methods to interact with the Linear API
 */
export class LinearClient {
  private apiKey: string;
  private client: GraphQLClient;
  private lastRequestTime: number = 0;
  private rateLimitDelay: number = 100; // Min delay between requests (ms)

  /**
   * Create a new Linear API client
   *
   * @param apiKey Linear API key
   */
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new GraphQLClient(LINEAR_API_ENDPOINT, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Execute a GraphQL query with retry logic and rate limiting
   *
   * @param query GraphQL query
   * @param variables Query variables
   * @returns Query result
   */
  private async executeQuery<T>(query: string, variables?: any): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;

    // Apply rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Retry loop
    while (retries < MAX_RETRIES) {
      try {
        this.lastRequestTime = Date.now();
        return await this.client.request<T>(query, variables);
      } catch (error) {
        lastError = error as Error;
        retries++;

        // Check if it's a rate limit error
        const isRateLimit = this.isRateLimitError(error);

        if (isRateLimit || retries < MAX_RETRIES) {
          // Calculate backoff delay with exponential increase and jitter
          const delay = this.calculateBackoff(retries, isRateLimit);
          await new Promise((resolve) => setTimeout(resolve, delay));

          // If it's a rate limit error, increase the rate limit delay
          if (isRateLimit) {
            this.rateLimitDelay = Math.min(this.rateLimitDelay * 2, 5000);
          }
        } else {
          break;
        }
      }
    }

    // If we've exhausted retries, throw a formatted error
    throw this.formatError(lastError);
  }

  /**
   * Check if an error is a rate limit error
   *
   * @param error The error to check
   * @returns Whether it's a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    return (
      error?.response?.status === 429 ||
      error?.message?.includes("rate limit") ||
      error?.message?.includes("Too many requests")
    );
  }

  /**
   * Calculate backoff delay with exponential increase and jitter
   *
   * @param retry Retry attempt number
   * @param isRateLimit Whether it's a rate limit error
   * @returns Delay in milliseconds
   */
  private calculateBackoff(retry: number, isRateLimit: boolean): number {
    // Base delay with exponential increase
    const expDelay = BASE_DELAY * Math.pow(2, retry - 1);

    // Add jitter (±20%)
    const jitter = expDelay * 0.2 * (Math.random() * 2 - 1);

    // If it's a rate limit error, use a longer delay
    const multiplier = isRateLimit ? 2 : 1;

    return Math.floor((expDelay + jitter) * multiplier);
  }

  /**
   * Format an error for better error messages
   *
   * @param error The error to format
   * @returns Formatted LinearApiError
   */
  private formatError(error: any): LinearApiError {
    // Default error
    const apiError: LinearApiError = {
      message: "Unknown error occurred",
      name: "LinearApiError",
    };

    if (!error) {
      return apiError;
    }

    // Extract GraphQL errors if available
    if (error.response?.errors?.length) {
      const gqlError = error.response.errors[0];
      apiError.message = gqlError.message;
      apiError.name = gqlError.extensions?.code || "GraphQLError";
      apiError.details = gqlError.extensions;
      apiError.statusCode = error.response.status;
    } else {
      // Handle network or other errors
      apiError.message = error.message || String(error);
      apiError.name = error.name || "NetworkError";

      if (error.status) {
        apiError.statusCode = error.status;
      }
    }

    return apiError;
  }

  /**
   * Validate the API key
   *
   * @returns The current user if valid
   * @throws Error if invalid
   */
  async validateApiKey(): Promise<LinearUser> {
    const query = `
      query {
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

    try {
      const data = await this.executeQuery<{ viewer: LinearUser }>(query);
      return data.viewer;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get the current user
   *
   * @returns Current user information
   */
  async getCurrentUser(): Promise<LinearUser> {
    return this.validateApiKey();
  }

  /**
   * Get all teams the user has access to
   *
   * @returns List of teams
   */
  async getTeams(): Promise<LinearTeam[]> {
    const query = `
      query {
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

    try {
      const data = await this.executeQuery<{ teams: { nodes: LinearTeam[] } }>(
        query
      );
      return data.teams.nodes;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get a specific team by ID
   *
   * @param id Team ID
   * @returns Team information or null if not found
   */
  async getTeam(id: string): Promise<LinearTeam | null> {
    const query = `
      query($id: ID!) {
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

    try {
      const data = await this.executeQuery<{ team: LinearTeam | null }>(query, {
        id,
      });
      return data.team;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get workflow states for a team
   *
   * @param teamId Team ID
   * @returns List of workflow states
   */
  async getWorkflowStates(teamId: string): Promise<LinearWorkflowState[]> {
    const query = `
      query($teamId: ID!) {
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

    try {
      const data = await this.executeQuery<{
        workflowStates: { nodes: LinearWorkflowState[] };
      }>(query, { teamId });

      return data.workflowStates.nodes;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get projects for a team
   *
   * @param teamId Team ID
   * @param options Query options
   * @returns List of projects
   */
  async getProjects(
    teamId: string,
    options?: Partial<LinearQueryOptions>
  ): Promise<LinearProject[]> {
    const query = `
      query($teamId: ID!, $first: Int) {
        projects(
          filter: { team: { id: { eq: $teamId } } }
          first: $first
        ) {
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

    try {
      const data = await this.executeQuery<{
        projects: { nodes: LinearProject[] };
      }>(query, {
        teamId,
        first: options?.first || 100,
      });

      return data.projects.nodes;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get issues from Linear
   *
   * @param options Query options
   * @returns List of issues
   */
  async getIssues(
    options?: Partial<LinearQueryOptions>
  ): Promise<LinearIssue[]> {
    // Build filter object for GraphQL query
    const filter: Record<string, any> = options?.filter || {};

    const query = `
      query($filter: IssueFilter, $first: Int) {
        issues(
          filter: $filter
          first: $first
        ) {
          nodes {
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
              color
              type
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
              displayName
              avatarUrl
            }
            creatorId
            creator {
              id
              name
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
        }
      }
    `;

    try {
      const data = await this.executeQuery<{
        issues: { nodes: LinearIssue[] };
      }>(query, {
        filter,
        first: options?.first || 50,
      });

      return data.issues.nodes;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get a specific issue by ID
   *
   * @param id Issue ID
   * @returns Issue information or null if not found
   */
  async getIssue(id: string): Promise<LinearIssue | null> {
    const query = `
      query($id: ID!) {
        issue(id: $id) {
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
            color
            type
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
            displayName
            avatarUrl
          }
          creatorId
          creator {
            id
            name
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
      }
    `;

    try {
      const data = await this.executeQuery<{ issue: LinearIssue | null }>(
        query,
        { id }
      );
      return data.issue;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Create a new issue in Linear
   *
   * @param input Issue creation input
   * @returns Created issue
   */
  async createIssue(input: LinearIssueCreateInput): Promise<LinearIssue> {
    const query = `
      mutation($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            title
            description
            identifier
            priority
            estimate
            stateId
            teamId
            assigneeId
            creatorId
            projectId
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery<{
        issueCreate: { success: boolean; issue: LinearIssue };
      }>(query, { input });

      if (!data.issueCreate.success) {
        throw new Error("Failed to create issue");
      }

      return data.issueCreate.issue;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Update an existing issue in Linear
   *
   * @param input Issue update input
   * @returns Updated issue
   */
  async updateIssue(input: LinearIssueUpdateInput): Promise<LinearIssue> {
    const { id, ...updateInput } = input;

    const query = `
      mutation($id: ID!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            title
            description
            identifier
            priority
            estimate
            stateId
            teamId
            assigneeId
            creatorId
            projectId
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    try {
      const data = await this.executeQuery<{
        issueUpdate: { success: boolean; issue: LinearIssue };
      }>(query, { id, input: updateInput });

      if (!data.issueUpdate.success) {
        throw new Error("Failed to update issue");
      }

      return data.issueUpdate.issue;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Delete an issue in Linear
   *
   * @param id Issue ID
   * @returns Whether the deletion was successful
   */
  async deleteIssue(id: string): Promise<boolean> {
    const query = `
      mutation($id: ID!) {
        issueDelete(id: $id) {
          success
        }
      }
    `;

    try {
      const data = await this.executeQuery<{
        issueDelete: { success: boolean };
      }>(query, { id });

      return data.issueDelete.success;
    } catch (error) {
      throw this.formatError(error);
    }
  }
}
