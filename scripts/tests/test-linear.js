// Test script for Linear API integration
const { createLinearIssue, getTeamIssues, checkCredentials } = require('./dist/linear-api');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get team details to debug the team ID issue
async function getTeamDetails() {
  const LINEAR_API_URL = "https://api.linear.app/graphql";
  const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
  
  const query = `
    query {
      teams {
        nodes {
          id
          name
          key
          states {
            nodes {
              id
              name
              color
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
      "Authorization": LINEAR_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  
  return response.json();
}

// Get issue details by ID
async function getIssueDetails(issueId) {
  const LINEAR_API_URL = "https://api.linear.app/graphql";
  const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
  
  const query = `
    query {
      issue(id: "${issueId}") {
        id
        title
        description
        state {
          id
          name
          color
        }
        team {
          id
          name
          key
        }
        url
      }
    }
  `;
  
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": LINEAR_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  
  return response.json();
}

// Check if credentials are properly configured
async function runTests() {
  try {
    // First check credentials
    const credentialStatus = checkCredentials();
    console.log('Credential status:', credentialStatus);
    
    if (!credentialStatus.isValid) {
      console.error('Please set up your Linear API credentials in .env first');
      return;
    }
    
    // Get team details to debug the team ID issue
    console.log('Fetching team details...');
    const teamDetails = await getTeamDetails();
    console.log('Team details:', JSON.stringify(teamDetails, null, 2));
    
    // Create a distinctive test issue with timestamp
    const timestamp = new Date().toISOString();
    const testTitle = `VISIBILITY TEST - ${timestamp}`;
    
    // Test creating an issue
    console.log(`Creating test issue: "${testTitle}"...`);
    const testIssue = await createLinearIssue(
      testTitle, 
      `This is a test issue created at ${timestamp} to verify Linear API integration and visibility in the Linear app.`
    );
    
    if (testIssue.data?.issueCreate?.success) {
      console.log('✅ Issue created successfully!');
      console.log('Issue URL:', testIssue.data.issueCreate.issue.url);
      console.log('Issue ID:', testIssue.data.issueCreate.issue.id);
      
      // Get more details about the created issue
      console.log('\nFetching details for the created issue...');
      const issueDetails = await getIssueDetails(testIssue.data.issueCreate.issue.id);
      console.log('Issue details:', JSON.stringify(issueDetails, null, 2));
      
      console.log('\nPlease check your Linear app to see if this issue appears.');
    } else {
      console.error('❌ Failed to create issue:', testIssue.errors || testIssue);
    }
    
    // Fetch all issues to verify
    console.log('\nFetching all team issues...');
    const issues = await getTeamIssues();
    
    if (issues.data?.team?.issues?.nodes) {
      const allIssues = issues.data.team.issues.nodes;
      console.log(`✅ Retrieved ${allIssues.length} issues:`);
      
      // Display the 5 most recent issues
      allIssues.slice(0, 5).forEach(issue => {
        console.log(`- ${issue.title} (${issue.state.name})`);
      });
      
      if (allIssues.length > 5) {
        console.log(`... and ${allIssues.length - 5} more`);
      }
    } else {
      console.error('❌ Failed to fetch issues:', issues.errors || issues);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

runTests(); 