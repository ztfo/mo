// Script to update the status of the UI framework task
require('dotenv').config();
const fetch = require('node-fetch');

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.LINEAR_TEAM_ID;

// Helper function to make authenticated requests to Linear API
async function makeLinearRequest(query, variables = {}) {
  const options = {
    hostname: 'api.linear.app',
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': LINEAR_API_KEY  // Removed the Bearer prefix
    }
  };
  
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY,
    },
    body: JSON.stringify({ 
      query,
      variables
    }),
  });
  
  return response.json();
}

// Get team states to find the "Done" state ID
async function getTeamStates() {
  const query = `
    query {
      team(id: "${TEAM_ID}") {
        states {
          nodes {
            id
            name
            color
            type
          }
        }
      }
    }
  `;
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.team?.states?.nodes) {
    return result.data.team.states.nodes;
  } else {
    console.error('Failed to fetch team states:', result.errors || result);
    return [];
  }
}

// Find issue by title
async function findIssueByTitle(title) {
  const query = `
    query {
      issues(filter: {team: {id: {eq: "${TEAM_ID}"}}, title: {contains: "${title}"}}) {
        nodes {
          id
          identifier
          title
          state {
            id
            name
          }
        }
      }
    }
  `;
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.issues?.nodes && result.data.issues.nodes.length > 0) {
    return result.data.issues.nodes[0];
  } else {
    console.error('Failed to find issue with title containing:', title);
    return null;
  }
}

// Update issue state
async function updateIssueState(issueId, stateId) {
  const query = `
    mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          id
          identifier
          title
          state {
            id
            name
          }
        }
      }
    }
  `;
  
  const variables = {
    id: issueId,
    input: {
      stateId: stateId
    }
  };
  
  const result = await makeLinearRequest(query, variables);
  
  if (result.data?.issueUpdate?.success) {
    return result.data.issueUpdate.issue;
  } else {
    console.error(`Failed to update issue ${issueId}:`, result.errors || result);
    return null;
  }
}

// Add a comment to the issue
async function addComment(issueId, body) {
  const query = `
    mutation CreateComment($issueId: String!, $body: String!) {
      commentCreate(
        input: {
          issueId: $issueId,
          body: $body
        }
      ) {
        success
        comment {
          id
        }
      }
    }
  `;
  
  const variables = {
    issueId,
    body
  };
  
  const result = await makeLinearRequest(query, variables);
  
  if (result.data?.commentCreate?.success) {
    return result.data.commentCreate.comment;
  } else {
    console.error(`Failed to add comment to issue ${issueId}:`, result.errors || result);
    return null;
  }
}

// Main function to update task status
async function updateTaskStatus() {
  try {
    console.log("Updating UI framework task status...");
    
    // Get team states
    const states = await getTeamStates();
    if (states.length === 0) {
      console.error("No states found for the team.");
      return;
    }
    
    // Find the "Done" state
    const doneState = states.find(state => state.name === "Done");
    if (!doneState) {
      console.error("Could not find 'Done' state.");
      return;
    }
    
    console.log(`Found 'Done' state with ID: ${doneState.id}`);
    
    // Find the issue
    const issue = await findIssueByTitle("Set up UI framework within Cursor");
    if (!issue) {
      console.error("Could not find the issue.");
      return;
    }
    
    console.log(`Found issue: ${issue.identifier} - ${issue.title}`);
    console.log(`Current state: ${issue.state.name}`);
    
    // Update the issue state if it's not already Done
    if (issue.state.name !== "Done") {
      const updatedIssue = await updateIssueState(issue.id, doneState.id);
      if (!updatedIssue) {
        console.error("Failed to update issue state.");
        return;
      }
      
      console.log(`✅ Updated issue state to: ${updatedIssue.state.name}`);
    } else {
      console.log("Issue is already in Done state.");
    }
    
    // Add a comment
    const commentText = 
      "Completed the UI framework implementation for the Mo plugin. The implementation includes:\n\n" +
      "- Base UI component architecture\n" +
      "- Task Queue Panel for managing tasks before pushing to Linear\n" +
      "- Linear Sync Panel for viewing and managing Linear issues\n" +
      "- Settings Panel for configuring the plugin\n" +
      "- UI Manager for coordinating all UI components\n" +
      "- Integration with the extension.ts file\n\n" +
      "The UI framework provides a foundation for all UI components in the plugin and includes mock implementations for testing without Cursor's UI API.";
    
    const comment = await addComment(issue.id, commentText);
    
    if (comment) {
      console.log("✅ Added completion comment to the issue");
    }
    
    console.log("Task status update completed!");
    
  } catch (error) {
    console.error("Error updating task status:", error);
  }
}

// Run the script
updateTaskStatus(); 