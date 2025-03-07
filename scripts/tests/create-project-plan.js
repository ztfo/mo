// Script to create a project plan in Linear for Mo plugin enhancements
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

// Create a project for Mo enhancements
async function createProject() {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  
  // Set target date to 2 months from now
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 2);
  const targetDateStr = targetDate.toISOString().split('T')[0];
  
  const query = `
    mutation {
      projectCreate(input: {
        name: "Mo Plugin Enhancements",
        description: "Implementation of enhanced features for the Mo plugin including UI and expanded Linear integration",
        teamIds: ["${TEAM_ID}"],
        state: "planned",
        startDate: "${startDate}",
        targetDate: "${targetDateStr}"
      }) {
        success
        project {
          id
          name
          url
        }
      }
    }
  `;
  
  const result = await makeLinearRequest(query);
  
  if (result.data?.projectCreate?.success) {
    console.log(`✅ Created project: ${result.data.projectCreate.project.name}`);
    console.log(`Project URL: ${result.data.projectCreate.project.url}`);
    return result.data.projectCreate.project.id;
  } else {
    console.error('❌ Failed to create project:', result.errors || result);
    return null;
  }
}

// Create issues for the project
async function createProjectIssues(projectId) {
  if (!projectId) return;
  
  const tasks = [
    // Phase 1: Foundation & Basic UI
    {
      title: "Set up UI framework within Cursor",
      description: "Create the basic infrastructure for UI components in Cursor, including webview panels and status bar integration.",
      priority: 2
    },
    {
      title: "Implement task queue functionality",
      description: "Build the task queue system that allows users to review and edit tasks before pushing to Linear.",
      priority: 2
    },
    {
      title: "Enhance Linear API for more issue properties",
      description: "Expand the Linear API integration to support additional issue properties like priority, labels, assignees, etc.",
      priority: 1
    },
    {
      title: "Build settings panel for configuration",
      description: "Create a settings panel that allows users to configure the plugin, including API credentials and preferences.",
      priority: 2
    },
    
    // Phase 2: Advanced Linear Integration
    {
      title: "Implement projects and cycles integration",
      description: "Add support for Linear projects and cycles, including creation, updating, and assignment.",
      priority: 2
    },
    {
      title: "Add support for labels, priorities, and custom fields",
      description: "Enhance the Linear integration to support additional metadata like labels, priorities, and custom fields.",
      priority: 2
    },
    {
      title: "Build two-way sync capabilities",
      description: "Implement bidirectional synchronization between the plugin and Linear, ensuring changes in either system are reflected in the other.",
      priority: 1
    },
    {
      title: "Create bulk operations functionality",
      description: "Add support for performing operations on multiple issues at once, such as updating status, assigning, or labeling.",
      priority: 3
    },
    
    // Phase 3: AI Enhancements
    {
      title: "Improve task generation with code context",
      description: "Enhance the AI task generation to consider the current code context, making tasks more relevant and specific.",
      priority: 2
    },
    {
      title: "Add effort estimation capabilities",
      description: "Implement AI-powered effort estimation for tasks, suggesting story points or time estimates.",
      priority: 3
    },
    {
      title: "Implement dependency detection",
      description: "Add functionality to detect and suggest dependencies between tasks based on feature requirements.",
      priority: 3
    },
    {
      title: "Build documentation generation features",
      description: "Create functionality to automatically generate technical documentation from feature plans.",
      priority: 3
    },
    
    // Phase 4: Polish & Advanced Features
    {
      title: "Add notifications system",
      description: "Implement a notifications system to alert users about assigned tasks, status changes, etc.",
      priority: 2
    },
    {
      title: "Implement code-to-task linking",
      description: "Create functionality to link code changes to specific Linear issues.",
      priority: 2
    },
    {
      title: "Create advanced filtering and search",
      description: "Add advanced filtering and search capabilities for issues, projects, and other Linear entities.",
      priority: 3
    },
    {
      title: "Add data visualization for project metrics",
      description: "Implement data visualization for project metrics, such as burndown charts, velocity, etc.",
      priority: 3
    }
  ];
  
  console.log(`Creating ${tasks.length} issues for the project...`);
  
  for (const task of tasks) {
    const query = `
      mutation {
        issueCreate(input: {
          title: "${task.title.replace(/"/g, '\\"')}",
          description: "${task.description.replace(/"/g, '\\"')}",
          teamId: "${TEAM_ID}",
          projectId: "${projectId}",
          priority: ${task.priority}
        }) {
          success
          issue {
            id
            identifier
            url
          }
        }
      }
    `;
    
    try {
      const result = await makeLinearRequest(query);
      
      if (result.data?.issueCreate?.success) {
        console.log(`✅ Created issue: ${task.title}`);
        console.log(`   Issue URL: ${result.data.issueCreate.issue.url}`);
      } else {
        console.error(`❌ Failed to create issue: ${task.title}`, result.errors || result);
      }
    } catch (error) {
      console.error(`❌ Error creating issue: ${task.title}`, error);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Main function to create the project plan
async function createProjectPlan() {
  try {
    console.log("Creating project plan in Linear for Mo plugin enhancements...");
    
    const projectId = await createProject();
    if (projectId) {
      await createProjectIssues(projectId);
      console.log("\nProject plan created successfully!");
    }
  } catch (error) {
    console.error("Error creating project plan:", error);
  }
}

// Run the script
createProjectPlan(); 