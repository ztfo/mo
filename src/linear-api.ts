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
  
  return { isValid: true, message: "Linear API credentials configured correctly." };
}

export async function createLinearIssue(title: string, description: string) {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    mutation {
      issueCreate(input: {title: "${title}", description: "${description}", teamId: "${TEAM_ID}"}) {
        success
        issue { id url }
      }
    }
  `;

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINEAR_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  return response.json();
}

// Get all issues for the team
export async function getTeamIssues() {
  const credentials = checkCredentials();
  if (!credentials.isValid) {
    throw new Error(credentials.message);
  }

  const query = `
    query {
      team(id: "${TEAM_ID}") {
        issues {
          nodes {
            id
            title
            description
            state {
              name
            }
          }
        }
      }
    }
  `;

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINEAR_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  return response.json();
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

  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINEAR_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  return response.json();
} 