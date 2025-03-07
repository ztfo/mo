const https = require('https');
const fs = require('fs');
require('dotenv').config();

// Constants
const LINEAR_API_URL = 'https://api.linear.app/graphql';
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

console.log('API Key length:', LINEAR_API_KEY ? LINEAR_API_KEY.length : 'undefined');
console.log('Team ID:', LINEAR_TEAM_ID);

// Helper function to make Linear API requests
async function makeLinearRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      query,
      variables
    });

    console.log('Making request to Linear API...');
    console.log('Query:', query.substring(0, 50) + '...');

    const options = {
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': LINEAR_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('Response data preview:', JSON.stringify(parsedData).substring(0, 100) + '...');
          if (parsedData.errors) {
            console.error('API returned errors:', parsedData.errors);
          }
          resolve(parsedData);
        } catch (error) {
          console.error('Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

// Get team states
async function getTeamStates() {
  const query = `
    query {
      team(id: "${LINEAR_TEAM_ID}") {
        states {
          nodes {
            id
            name
            type
          }
        }
      }
    }
  `;

  console.log('Getting team states...');
  const response = await makeLinearRequest(query);
  console.log('Team states response:', JSON.stringify(response).substring(0, 100) + '...');
  
  if (!response.data || !response.data.team) {
    console.error('Team data not found in response. Full response:', JSON.stringify(response));
    throw new Error('Team data not found in response');
  }
  
  return response.data.team.states.nodes;
}

// Find issue by title
async function findIssueByTitle(title) {
  const query = `
    query {
      issues(
        filter: {
          team: { id: { eq: "${LINEAR_TEAM_ID}" } }
          title: { eq: "Implement task queue functionality" }
        }
      ) {
        nodes {
          id
          title
          identifier
          state {
            id
            name
          }
        }
      }
    }
  `;

  const response = await makeLinearRequest(query);
  return response.data.issues.nodes[0];
}

// Update issue state
async function updateIssueState(issueId, stateId) {
  const query = `
    mutation {
      issueUpdate(
        id: "${issueId}",
        input: {
          stateId: "${stateId}"
        }
      ) {
        success
        issue {
          id
          title
          state {
            name
          }
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Add comment to issue
async function addComment(issueId, body) {
  const query = `
    mutation {
      commentCreate(
        input: {
          issueId: "${issueId}",
          body: """${body}"""
        }
      ) {
        success
        comment {
          id
        }
      }
    }
  `;

  return makeLinearRequest(query);
}

// Main function to update task status
async function updateTaskStatus() {
  try {
    // Get team states
    const states = await getTeamStates();
    const doneState = states.find(state => state.name === "Done");
    
    if (!doneState) {
      console.error('Could not find "Done" state');
      return;
    }
    
    console.log(`Found "Done" state with ID: ${doneState.id}`);
    
    // Find the task queue implementation issue
    const issue = await findIssueByTitle("Implement task queue functionality");
    
    if (!issue) {
      console.error('Could not find issue for task queue implementation');
      return;
    }
    
    console.log(`Found issue ${issue.identifier} with title: ${issue.title}`);
    console.log(`Current state: ${issue.state.name}`);
    
    // Only update if not already done
    if (issue.state.name === "Done") {
      console.log('Issue is already marked as Done');
      return;
    }
    
    // Update issue state to Done
    const updateResult = await updateIssueState(issue.id, doneState.id);
    
    if (updateResult.data.issueUpdate.success) {
      console.log(`Updated issue state to: ${updateResult.data.issueUpdate.issue.state.name}`);
      
      // Add completion comment
      const comment = `
# Task Queue Implementation Completed

The enhanced task queue functionality has been successfully implemented with the following features:

## Core Functionality
- Persistent storage of tasks between sessions
- Task selection for individual or batch operations
- Task reordering with drag-and-drop
- Task filtering and sorting
- Comprehensive task management API

## UI Enhancements
- Task editing with modal dialog
- Batch operations (set priority, estimate, delete)
- Improved task display with more details
- Sorting controls
- Confirmation dialogs for destructive actions

## Technical Improvements
- TypeScript type safety with Task interface
- Singleton pattern for global access
- Change listener system for UI updates
- Settings persistence

All code has been tested and is working correctly. The README has been updated to reflect the new features.
      `;
      
      const commentResult = await addComment(issue.id, comment);
      
      if (commentResult.data.commentCreate.success) {
        console.log('Added completion comment');
      } else {
        console.error('Failed to add comment');
      }
    } else {
      console.error('Failed to update issue state');
    }
  } catch (error) {
    console.error('Error updating task status:', error);
  }
}

// Run the update
updateTaskStatus(); 