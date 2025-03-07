// Script to update Linear issues with priorities and assignments
require('dotenv').config();
const fetch = require('node-fetch');

const LINEAR_API_URL = "https://api.linear.app/graphql";
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.LINEAR_TEAM_ID;

// Helper function to make authenticated requests to Linear API
async function makeLinearRequest(query) {
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

// Get team members to assign tasks
async function getTeamMembers() {
  const query = `
    query {
      team(id: "${TEAM_ID}") {
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
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.team?.members?.nodes) {
    return result.data.team.members.nodes;
  } else {
    console.error('Failed to fetch team members:', result.errors || result);
    return [];
  }
}

// Get project issues
async function getProjectIssues(projectName) {
  const query = `
    query {
      projects(filter: {name: {contains: "${projectName}"}}) {
        nodes {
          id
          name
          issues {
            nodes {
              id
              identifier
              title
              priority
              assignee {
                id
                name
              }
            }
          }
        }
      }
    }
  `;
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.projects?.nodes && result.data.projects.nodes.length > 0) {
    return result.data.projects.nodes[0].issues.nodes;
  } else {
    console.error('Failed to fetch project issues:', result.errors || result);
    return [];
  }
}

// Update issue priority and assignee
async function updateIssue(issueId, updates) {
  const query = `
    mutation {
      issueUpdate(
        id: "${issueId}",
        input: {
          ${updates.priority ? `priority: ${updates.priority},` : ''}
          ${updates.assigneeId ? `assigneeId: "${updates.assigneeId}",` : ''}
          ${updates.stateId ? `stateId: "${updates.stateId}",` : ''}
          ${updates.estimate ? `estimate: ${updates.estimate},` : ''}
        }
      ) {
        success
        issue {
          id
          identifier
          title
          priority
          assignee {
            id
            name
          }
        }
      }
    }
  `;
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.issueUpdate?.success) {
    return result.data.issueUpdate.issue;
  } else {
    console.error(`Failed to update issue ${issueId}:`, result.errors || result);
    return null;
  }
}

// Main function to update tasks
async function updateTasks() {
  try {
    console.log("Fetching team members...");
    const members = await getTeamMembers();
    
    if (members.length === 0) {
      console.error("No team members found. Cannot assign tasks.");
      return;
    }
    
    console.log(`Found ${members.length} team members:`);
    members.forEach(member => {
      console.log(`- ${member.name} (${member.email})`);
    });
    
    // For this example, we'll use the first team member as the assignee
    const assigneeId = members[0].id;
    console.log(`\nUsing ${members[0].name} as the assignee for tasks.`);
    
    console.log("\nFetching project issues...");
    const issues = await getProjectIssues("Mo Plugin Enhancements");
    
    if (issues.length === 0) {
      console.error("No issues found for the project.");
      return;
    }
    
    console.log(`Found ${issues.length} issues.`);
    
    // Define task priorities based on our implementation plan
    const taskPriorities = {
      // Phase 1 (highest priority)
      "Enhance Linear API for more issue properties": { priority: 1, estimate: 3 },
      "Set up UI framework within Cursor": { priority: 1, estimate: 5 },
      "Implement task queue functionality": { priority: 2, estimate: 4 },
      "Build settings panel for configuration": { priority: 2, estimate: 3 },
      
      // Phase 2
      "Build two-way sync capabilities": { priority: 1, estimate: 5 },
      "Implement projects and cycles integration": { priority: 2, estimate: 4 },
      "Add support for labels, priorities, and custom fields": { priority: 2, estimate: 3 },
      "Create bulk operations functionality": { priority: 3, estimate: 3 },
      
      // Phase 3
      "Improve task generation with code context": { priority: 2, estimate: 4 },
      "Add effort estimation capabilities": { priority: 3, estimate: 3 },
      "Implement dependency detection": { priority: 3, estimate: 4 },
      "Build documentation generation features": { priority: 3, estimate: 3 },
      
      // Phase 4
      "Add notifications system": { priority: 2, estimate: 3 },
      "Implement code-to-task linking": { priority: 2, estimate: 4 },
      "Create advanced filtering and search": { priority: 3, estimate: 3 },
      "Add data visualization for project metrics": { priority: 3, estimate: 4 }
    };
    
    console.log("\nUpdating issues with priorities and assignments...");
    
    for (const issue of issues) {
      const priorityInfo = taskPriorities[issue.title] || { priority: 3, estimate: 2 };
      
      console.log(`Updating issue ${issue.identifier}: ${issue.title}`);
      
      const updatedIssue = await updateIssue(issue.id, {
        priority: priorityInfo.priority,
        assigneeId: assigneeId,
        estimate: priorityInfo.estimate
      });
      
      if (updatedIssue) {
        console.log(`✅ Updated issue ${updatedIssue.identifier} - Priority: ${updatedIssue.priority}, Assignee: ${updatedIssue.assignee.name}`);
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("\nTask updates completed!");
    
  } catch (error) {
    console.error("Error updating tasks:", error);
  }
}

// Run the script
updateTasks(); 