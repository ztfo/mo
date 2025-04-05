/**
 * Linear API Types
 *
 * This file contains TypeScript type definitions for the Linear API integration.
 * These types are used to interact with Linear's GraphQL API and for data mapping.
 */

/**
 * Linear Authentication Configuration
 */
export interface LinearAuth {
  /** The API key (encrypted) */
  apiKey: string;

  /** Whether the API key is encrypted */
  encrypted: boolean;

  /** The default team ID to use */
  defaultTeamId?: string;

  /** The user ID associated with the API key */
  userId?: string;

  /** Last successful authentication timestamp */
  lastAuthenticated?: string;
}

/**
 * Linear User
 */
export interface LinearUser {
  /** Linear user ID */
  id: string;

  /** User's name */
  name: string;

  /** User's email */
  email: string;

  /** User's display name */
  displayName?: string;

  /** User's avatar URL */
  avatarUrl?: string;

  /** Whether the user is active */
  active: boolean;
}

/**
 * Linear Team
 */
export interface LinearTeam {
  /** Team ID */
  id: string;

  /** Team name */
  name: string;

  /** Team key (used in issue identifiers, e.g. "ENG") */
  key: string;

  /** Team description */
  description?: string;

  /** Team icon */
  icon?: string;

  /** Team color */
  color?: string;
}

/**
 * Linear Workflow State
 */
export interface LinearWorkflowState {
  /** State ID */
  id: string;

  /** State name */
  name: string;

  /** State description */
  description?: string;

  /** State color */
  color?: string;

  /** State type (triage, started, completed, etc.) */
  type: string;

  /** Team ID this state belongs to */
  teamId: string;

  /** Position in the workflow */
  position: number;
}

/**
 * Linear Project
 */
export interface LinearProject {
  /** Project ID */
  id: string;

  /** Project name */
  name: string;

  /** Project description */
  description?: string;

  /** Project state */
  state: string;

  /** Project start date */
  startDate?: string;

  /** Project target date */
  targetDate?: string;

  /** Team ID this project belongs to */
  teamId: string;

  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Linear Issue
 */
export interface LinearIssue {
  /** Issue ID */
  id: string;

  /** Issue title */
  title: string;

  /** Issue description */
  description?: string;

  /** Issue number (e.g. ENG-123) */
  identifier: string;

  /** Issue priority (0-4) */
  priority: number;

  /** Estimate (complexity/story points) */
  estimate?: number;

  /** Workflow state ID */
  stateId: string;

  /** Workflow state object */
  state?: LinearWorkflowState;

  /** Team ID */
  teamId: string;

  /** Team object */
  team?: LinearTeam;

  /** Assignee user ID */
  assigneeId?: string;

  /** Assignee user object */
  assignee?: LinearUser;

  /** Creator user ID */
  creatorId: string;

  /** Creator user object */
  creator?: LinearUser;

  /** Project ID */
  projectId?: string;

  /** Project object */
  project?: LinearProject;

  /** Creation timestamp */
  createdAt: string;

  /** Update timestamp */
  updatedAt: string;

  /** Labels */
  labelIds?: string[];

  /** URLs associated with this issue */
  url?: string;
}

/**
 * Linear Issue Creation Input
 */
export interface LinearIssueCreateInput {
  /** Issue title (required) */
  title: string;

  /** Issue description */
  description?: string;

  /** Team ID (required) */
  teamId: string;

  /** Workflow state ID */
  stateId?: string;

  /** Assignee user ID */
  assigneeId?: string;

  /** Issue priority (0-4) */
  priority?: number;

  /** Estimate (complexity/story points) */
  estimate?: number;

  /** Project ID */
  projectId?: string;

  /** Parent issue ID */
  parentId?: string;

  /** Label IDs */
  labelIds?: string[];
}

/**
 * Linear Issue Update Input
 */
export interface LinearIssueUpdateInput {
  /** Issue ID (required) */
  id: string;

  /** Updated title */
  title?: string;

  /** Updated description */
  description?: string;

  /** Updated state ID */
  stateId?: string;

  /** Updated assignee ID */
  assigneeId?: string;

  /** Updated priority */
  priority?: number;

  /** Updated estimate */
  estimate?: number;

  /** Updated project ID */
  projectId?: string;

  /** Updated parent issue ID */
  parentId?: string;

  /** Updated label IDs */
  labelIds?: string[];
}

/**
 * Linear API Query Options
 */
export interface LinearQueryOptions {
  /** Maximum number of items to return */
  first?: number;

  /** Filter expression */
  filter?: Record<string, any>;

  /** Order by expression */
  orderBy?: { [key: string]: "ASC" | "DESC" };

  /** Pagination cursor */
  after?: string;

  /** Fields to include */
  include?: string[];
}

/**
 * Linear API Error
 */
export interface LinearApiError {
  /** Error message */
  message: string;

  /** Error name/type */
  name: string;

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Error details */
  details?: any;
}

/**
 * Linear Sync Options
 */
export interface LinearSyncOptions {
  /** Sync direction */
  direction: "push" | "pull" | "both";

  /** Filter for tasks to sync */
  filter?: Record<string, any>;

  /** Team ID to use for sync */
  teamId?: string;

  /** Force sync (override conflicts) */
  force?: boolean;

  /** Dry run (preview only) */
  dryRun?: boolean;

  /** Maximum number of items to sync */
  limit?: number;
}

/**
 * Linear Sync Result
 */
export interface LinearSyncResult {
  /** Number of items added */
  added: number;

  /** Number of items updated */
  updated: number;

  /** Number of items deleted */
  deleted: number;

  /** Number of conflicts detected */
  conflicts: number;

  /** Errors that occurred during sync */
  errors: LinearSyncError[];

  /** Detailed results for individual items */
  details?: {
    /** Added items */
    added: Array<{ local: string; remote: string }>;

    /** Updated items */
    updated: Array<{ local: string; remote: string }>;

    /** Failed items */
    failed: Array<{ id: string; error: string }>;
  };
}

/**
 * Linear Sync Error
 */
export interface LinearSyncError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** ID of the item that caused the error */
  itemId?: string;

  /** Additional error details */
  details?: any;
}
