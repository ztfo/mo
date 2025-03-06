import fetch from 'node-fetch';

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = "your-linear-api-key"; // Replace this
const TEAM_ID = "your-linear-team-id"; // Replace this

export async function createLinearIssue(title: string, description: string) {
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