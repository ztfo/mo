import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
const TEAM_ID = process.env.LINEAR_TEAM_ID || "";

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
  
  // Remove check for team_ prefix since Linear API expects a UUID
  
  return { isValid: true, message: "Linear API credentials configured correctly." };
}

// Helper function to make authenticated requests to Linear API
async function makeLinearRequest(query: string) {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY.startsWith('lin_api_') ? LINEAR_API_KEY : `Bearer ${LINEAR_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });
  
  return response.json();
}

export async function createLinearIssue(title: string, description: string) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  // Escape any quotes in the title and description to prevent GraphQL errors
  const safeTitle = title.replace(/"/g, '\\"');
  const safeDescription = description.replace(/"/g, '\\"');

  const query = `
    mutation {
      issueCreate(input: {title: "${safeTitle}", description: "${safeDescription}", teamId: "${TEAM_ID}"}) {
        success
        issue { id url }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Get all issues for the team with more details and a higher limit
export async function getTeamIssues() {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      team(id: "${TEAM_ID}") {
        name
        key
        issues(first: 50) {
          nodes {
            id
            identifier
            title
            description
            createdAt
            updatedAt
            state {
              id
              name
              color
            }
            url
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Update issue status
export async function updateIssueStatus(issueId: string, stateId: string) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation {
      issueUpdate(id: "${issueId}", input: {stateId: "${stateId}"}) {
        success
        issue {
          id
          state {
            name
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
} 