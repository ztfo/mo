import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
const TEAM_ID = process.env.LINEAR_TEAM_ID || "";

// Types for Linear entities
export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  priority: number;
  estimate: number | null;
  state: {
    id: string;
    name: string;
    color: string;
  };
  assignee: {
    id: string;
    name: string;
  } | null;
  labels: {
    nodes: {
      id: string;
      name: string;
      color: string;
    }[];
  };
  project: {
    id: string;
    name: string;
  } | null;
  cycle: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface LinearProject {
  id: string;
  name: string;
  description: string;
  state: string;
  startDate: string | null;
  targetDate: string | null;
  issues: {
    nodes: LinearIssue[];
  };
}

export interface LinearCycle {
  id: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  issues: {
    nodes: LinearIssue[];
  };
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearUser {
  id: string;
  name: string;
  email: string;
}

export interface LinearState {
  id: string;
  name: string;
  color: string;
  type: string;
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  states: {
    nodes: LinearState[];
  };
  labels: {
    nodes: LinearLabel[];
  };
  members: {
    nodes: LinearUser[];
  };
}

// Function to check if credentials are properly configured
export function checkCredentials(): { isValid: boolean; message: string } {
  if (!LINEAR_API_KEY) {
    return { 
      isValid: false, 
      message: "Linear API key not found. Please add it to your .env file as LINEAR_API_KEY." 
    };
  }
  
  if (!TEAM_ID) {
    return { 
      isValid: false, 
      message: "Linear Team ID not found. Please add it to your .env file as LINEAR_TEAM_ID." 
    };
  }
  
  // Check if API key has the expected format (starts with lin_api_)
  if (!LINEAR_API_KEY.startsWith('lin_api_')) {
    return {
      isValid: false,
      message: "Linear API key format appears invalid. It should start with 'lin_api_'."
    };
  }
  
  return { isValid: true, message: "Linear API credentials configured correctly." };
}

// Helper function to make authenticated requests to Linear API
async function makeLinearRequest(query: string, variables: Record<string, any> = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY.startsWith('lin_api_') ? LINEAR_API_KEY : `Bearer ${LINEAR_API_KEY}`,
    },
    body: JSON.stringify({ 
      query,
      variables
    }),
  });
  
  return response.json();
}

// Enhanced issue creation with support for more properties
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
  } = {}
) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      title,
      description,
      teamId: TEAM_ID,
      ...options
    }
  };

  return makeLinearRequest(query, variables);
}

// Get issues with advanced filtering
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
  } = {},
  pagination: {
    first?: number;
    after?: string;
  } = { first: 50 }
) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  // Build filter object for GraphQL
  const filterConditions: any = { team: { id: { eq: TEAM_ID } } };
  
  if (filters.states && filters.states.length > 0) {
    filterConditions.state = { id: { in: filters.states } };
  }
  
  if (filters.assignees && filters.assignees.length > 0) {
    filterConditions.assignee = { id: { in: filters.assignees } };
  }
  
  if (filters.labels && filters.labels.length > 0) {
    filterConditions.labels = { some: { id: { in: filters.labels } } };
  }
  
  if (filters.priorities && filters.priorities.length > 0) {
    filterConditions.priority = { in: filters.priorities };
  }
  
  if (filters.projects && filters.projects.length > 0) {
    filterConditions.project = { id: { in: filters.projects } };
  }
  
  if (filters.cycles && filters.cycles.length > 0) {
    filterConditions.cycle = { id: { in: filters.cycles } };
  }
  
  if (filters.dueDate) {
    filterConditions.dueDate = {};
    if (filters.dueDate.before) filterConditions.dueDate.lt = filters.dueDate.before;
    if (filters.dueDate.after) filterConditions.dueDate.gt = filters.dueDate.after;
  }
  
  if (filters.createdAt) {
    filterConditions.createdAt = {};
    if (filters.createdAt.before) filterConditions.createdAt.lt = filters.createdAt.before;
    if (filters.createdAt.after) filterConditions.createdAt.gt = filters.createdAt.after;
  }
  
  if (filters.updatedAt) {
    filterConditions.updatedAt = {};
    if (filters.updatedAt.before) filterConditions.updatedAt.lt = filters.updatedAt.before;
    if (filters.updatedAt.after) filterConditions.updatedAt.gt = filters.updatedAt.after;
  }

  const query = `
    query GetFilteredIssues($filter: IssueFilter, $first: Int, $after: String) {
      issues(filter: $filter, first: $first, after: $after) {
        nodes {
          id
          identifier
          title
          description
          priority
          estimate
          state {
            id
            name
            color
          }
          assignee {
            id
            name
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          project {
            id
            name
          }
          cycle {
            id
            name
            startsAt
            endsAt
          }
          createdAt
          updatedAt
          url
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    filter: filterConditions,
    first: pagination.first,
    after: pagination.after
  };

  return makeLinearRequest(query, variables);
}

// Update an existing issue
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
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const variables = {
    id: issueId,
    input: updates
  };

  return makeLinearRequest(query, variables);
}

// Get team details including states, labels, and members
export async function getTeamDetails() {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      team(id: "${TEAM_ID}") {
        id
        name
        key
        states {
          nodes {
            id
            name
            color
            type
          }
        }
        labels {
          nodes {
            id
            name
            color
          }
        }
        members {
          nodes {
            id
            name
            email
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Get projects for the team
export async function getProjects() {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      team(id: "${TEAM_ID}") {
        projects {
          nodes {
            id
            name
            description
            state
            startDate
            targetDate
            issues {
              nodes {
                id
                identifier
                title
              }
            }
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Create a new project
export async function createProject(
  name: string,
  description: string,
  options: {
    state?: string;
    startDate?: string;
    targetDate?: string;
    leadId?: string;
    memberIds?: string[];
  } = {}
) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project {
          id
          name
          url
        }
      }
    }
  `;

  const variables = {
    input: {
      name,
      description,
      teamIds: [TEAM_ID],
      ...options
    }
  };

  return makeLinearRequest(query, variables);
}

// Get cycles for the team
export async function getCycles() {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      team(id: "${TEAM_ID}") {
        cycles {
          nodes {
            id
            name
            description
            startsAt
            endsAt
            issues {
              nodes {
                id
                identifier
                title
              }
            }
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Create a new cycle
export async function createCycle(
  name: string,
  options: {
    description?: string;
    startsAt?: string;
    endsAt?: string;
  } = {}
) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation CreateCycle($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success
        cycle {
          id
          name
        }
      }
    }
  `;

  const variables = {
    input: {
      name,
      teamId: TEAM_ID,
      ...options
    }
  };

  return makeLinearRequest(query, variables);
}

// Add a comment to an issue
export async function addComment(issueId: string, body: string) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation CreateComment($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success
        comment {
          id
          body
        }
      }
    }
  `;

  const variables = {
    input: {
      issueId,
      body
    }
  };

  return makeLinearRequest(query, variables);
}

// Create a relation between issues
export async function createIssueRelation(
  issueId: string,
  relatedIssueId: string,
  type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate' | 'duplicated_by'
) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation CreateIssueRelation($input: IssueRelationCreateInput!) {
      issueRelationCreate(input: $input) {
        success
        issueRelation {
          id
          type
        }
      }
    }
  `;

  const variables = {
    input: {
      issueId,
      relatedIssueId,
      type
    }
  };

  return makeLinearRequest(query, variables);
}

// Get issue relations
export async function getIssueRelations(issueId: string) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      issue(id: "${issueId}") {
        id
        identifier
        title
        relations {
          nodes {
            id
            type
            relatedIssue {
              id
              identifier
              title
            }
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Cache for Linear data
const cache = {
  team: null as any,
  issues: new Map<string, any>(),
  projects: [] as any[],
  cycles: [] as any[],
  lastUpdated: {
    team: 0,
    issues: 0,
    projects: 0,
    cycles: 0
  },
  // Cache expiration in milliseconds (5 minutes)
  expirationTime: 5 * 60 * 1000
};

// Get cached data or fetch from API
export async function getCachedTeamDetails() {
  const now = Date.now();
  if (!cache.team || now - cache.lastUpdated.team > cache.expirationTime) {
    const result = await getTeamDetails();
    if (result.data?.team) {
      cache.team = result.data.team;
      cache.lastUpdated.team = now;
    }
  }
  return cache.team;
}

// Clear cache
export function clearCache() {
  cache.team = null;
  cache.issues.clear();
  cache.projects = [];
  cache.cycles = [];
  cache.lastUpdated.team = 0;
  cache.lastUpdated.issues = 0;
  cache.lastUpdated.projects = 0;
  cache.lastUpdated.cycles = 0;
}

// Export original functions for backward compatibility
export { createLinearIssue, getTeamIssues, updateIssueStatus } from './linear-api'; 