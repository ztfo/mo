/**
 * Linear Query Commands
 *
 * This file implements the command handlers for Linear query operations
 * to view teams, projects, states, and issues.
 */

import { CommandHandler, CommandResult } from "../../types/command";
import { isLinearConfigured, getApiKey, getLinearAuth } from "../auth";
import { LinearClient } from "../api";
import {
  LinearTeam,
  LinearProject,
  LinearWorkflowState,
  LinearIssue,
} from "../types";

/**
 * Format a list of teams as markdown
 */
function formatTeams(teams: LinearTeam[], defaultTeamId?: string): string {
  if (teams.length === 0) {
    return `
### Linear Teams

No teams found.
`;
  }

  let markdown = `
### Linear Teams

`;

  teams.forEach((team) => {
    const isDefault = team.id === defaultTeamId;
    markdown += `- **${team.name}** ${isDefault ? "(Default)" : ""}  \n`;
    markdown += `  ID: \`${team.id}\`  \n`;
    markdown += `  Key: \`${team.key}\`  \n`;
    if (team.description) {
      markdown += `  Description: ${team.description}  \n`;
    }
    markdown += `\n`;
  });

  markdown += `\nTo set a default team: \`/mo linear-auth team:TEAM_ID\`  \n`;
  markdown += `To view projects for a team: \`/mo linear-projects team:TEAM_ID\`  \n`;

  return markdown;
}

/**
 * Format a list of projects as markdown
 */
function formatProjects(
  projects: LinearProject[],
  teamName?: string,
  teamId?: string
): string {
  if (projects.length === 0) {
    return `
### Linear Projects${teamName ? ` for ${teamName}` : ""}

No projects found.
`;
  }

  let markdown = `
### Linear Projects${teamName ? ` for ${teamName}` : ""}

`;

  // Group projects by state
  const projectsByState: Record<string, LinearProject[]> = {};

  projects.forEach((project) => {
    if (!projectsByState[project.state]) {
      projectsByState[project.state] = [];
    }
    projectsByState[project.state].push(project);
  });

  // Display projects grouped by state
  Object.entries(projectsByState).forEach(([state, stateProjects]) => {
    markdown += `#### ${state} (${stateProjects.length})\n\n`;

    stateProjects.forEach((project) => {
      markdown += `- **${project.name}**  \n`;
      markdown += `  ID: \`${project.id}\`  \n`;
      if (project.description) {
        markdown += `  Description: ${project.description}  \n`;
      }
      if (project.progress !== undefined) {
        markdown += `  Progress: ${project.progress}%  \n`;
      }
      markdown += `\n`;
    });
  });

  if (teamId) {
    markdown += `\nTo view workflow states for this team: \`/mo linear-states team:${teamId}\`  \n`;
    markdown += `To view issues for this team: \`/mo linear-issues team:${teamId}\`  \n`;
  }

  return markdown;
}

/**
 * Format workflow states as markdown
 */
function formatWorkflowStates(
  states: LinearWorkflowState[],
  teamName?: string
): string {
  if (states.length === 0) {
    return `
### Linear Workflow States${teamName ? ` for ${teamName}` : ""}

No workflow states found.
`;
  }

  let markdown = `
### Linear Workflow States${teamName ? ` for ${teamName}` : ""}

`;

  // Group states by type
  const statesByType: Record<string, LinearWorkflowState[]> = {};

  states.forEach((state) => {
    if (!statesByType[state.type]) {
      statesByType[state.type] = [];
    }
    statesByType[state.type].push(state);
  });

  // Sort state types in a logical order
  const typeOrder = [
    "triage",
    "backlog",
    "unstarted",
    "started",
    "completed",
    "canceled",
  ];
  const sortedTypes = Object.keys(statesByType).sort((a, b) => {
    const indexA = typeOrder.indexOf(a.toLowerCase());
    const indexB = typeOrder.indexOf(b.toLowerCase());

    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Display states grouped by type
  sortedTypes.forEach((type) => {
    const typeStates = statesByType[type];
    markdown += `#### ${type} (${typeStates.length})\n\n`;

    // Sort states by position
    typeStates
      .sort((a, b) => a.position - b.position)
      .forEach((state) => {
        markdown += `- **${state.name}**  \n`;
        markdown += `  ID: \`${state.id}\`  \n`;
        if (state.description) {
          markdown += `  Description: ${state.description}  \n`;
        }
        if (state.color) {
          markdown += `  Color: ${state.color}  \n`;
        }
        markdown += `\n`;
      });
  });

  markdown += `\nThese states are mapped to Mo task statuses when synchronizing.  \n`;

  return markdown;
}

/**
 * Format issues as markdown
 */
function formatIssues(
  issues: LinearIssue[],
  teamName?: string,
  totalCount?: number
): string {
  if (issues.length === 0) {
    return `
### Linear Issues${teamName ? ` for ${teamName}` : ""}

No issues found.
`;
  }

  let markdown = `
### Linear Issues${teamName ? ` for ${teamName}` : ""}

${
  totalCount !== undefined
    ? `Showing ${issues.length} of ${totalCount} issues`
    : `Found ${issues.length} issues`
}

`;

  // Group issues by state
  const issuesByState: Record<string, LinearIssue[]> = {};

  issues.forEach((issue) => {
    const stateName = issue.state?.name || "Unknown";
    if (!issuesByState[stateName]) {
      issuesByState[stateName] = [];
    }
    issuesByState[stateName].push(issue);
  });

  // Display issues grouped by state
  Object.entries(issuesByState).forEach(([stateName, stateIssues]) => {
    markdown += `#### ${stateName} (${stateIssues.length})\n\n`;

    stateIssues.forEach((issue) => {
      const assigneeName = issue.assignee?.name || "Unassigned";

      markdown += `- **${issue.identifier}**: ${issue.title}  \n`;
      markdown += `  ID: \`${issue.id}\`  \n`;
      markdown += `  Assignee: ${assigneeName}  \n`;
      markdown += `  Priority: ${issue.priority}  \n`;
      markdown += `  [View in Linear](${issue.url})  \n`;
      markdown += `  [\`/mo linear-pull id:${issue.id}\`](/mo linear-pull id:${issue.id})  \n`;
      markdown += `\n`;
    });
  });

  markdown += `\nTo pull an issue into Mo: \`/mo linear-pull id:ISSUE_ID\`  \n`;

  return markdown;
}

/**
 * Linear teams command
 *
 * Lists teams available in Linear
 */
export const linearTeamsCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: `
### Linear API Key Not Found

Please authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get teams
    const client = new LinearClient(apiKey);
    const teams = await client.getTeams();

    // Get default team ID
    const auth = await getLinearAuth();
    const defaultTeamId = auth?.defaultTeamId;

    // Build action buttons
    const actionButtons = [];

    // Add button to set default team if multiple teams
    if (teams.length > 1) {
      actionButtons.push({
        label: "Set Default Team",
        command: "/mo linear-auth team:",
      });
    }

    // Add button to view projects for first team
    if (teams.length > 0) {
      const teamId = defaultTeamId || teams[0].id;
      actionButtons.push({
        label: "View Projects",
        command: `/mo linear-projects team:${teamId}`,
      });

      actionButtons.push({
        label: "View Issues",
        command: `/mo linear-issues team:${teamId}`,
      });
    }

    // Format response
    return {
      success: true,
      message: `Found ${teams.length} Linear teams`,
      markdown: formatTeams(teams, defaultTeamId),
      actionButtons: actionButtons,
    };
  } catch (error) {
    console.error("Linear teams command error:", error);

    return {
      success: false,
      message: "Failed to get Linear teams",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Teams Error

An error occurred while fetching teams:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "Check Linear Status",
          command: "/mo linear-status",
        },
        {
          label: "Try Again",
          command: "/mo linear-teams",
        },
      ],
    };
  }
};

/**
 * Linear projects command
 *
 * Lists projects available in Linear
 */
export const linearProjectsCommand: CommandHandler = async (
  params,
  context
) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: `
### Linear API Key Not Found

Please authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get team ID
    let teamId = params.team;

    if (!teamId) {
      // Use default team ID if available
      const auth = await getLinearAuth();
      teamId = auth?.defaultTeamId;

      if (!teamId) {
        // Get all teams and use the first one
        const client = new LinearClient(apiKey);
        const teams = await client.getTeams();

        if (teams.length === 0) {
          return {
            success: false,
            message: "No Linear teams found",
            markdown: `
### No Linear Teams Found

You don't have any teams in Linear.
`,
            actionButtons: [
              {
                label: "View Teams",
                command: "/mo linear-teams",
              },
            ],
          };
        }

        teamId = teams[0].id;
      }
    }

    // Get projects for the team
    const client = new LinearClient(apiKey);
    const team = await client.getTeam(teamId);

    if (!team) {
      return {
        success: false,
        message: `Team not found: ${teamId}`,
        markdown: `
### Linear Team Not Found

The team with ID \`${teamId}\` was not found.

Please check the team ID and try again.
`,
        actionButtons: [
          {
            label: "View Teams",
            command: "/mo linear-teams",
          },
        ],
      };
    }

    const projects = await client.getProjects(teamId);

    // Build action buttons
    const actionButtons = [
      {
        label: "View Teams",
        command: "/mo linear-teams",
      },
      {
        label: "View Issues",
        command: `/mo linear-issues team:${teamId}`,
      },
      {
        label: "View Workflow States",
        command: `/mo linear-states team:${teamId}`,
      },
    ];

    // Format response
    return {
      success: true,
      message: `Found ${projects.length} Linear projects for team ${team.name}`,
      markdown: formatProjects(projects, team.name, teamId),
      actionButtons,
    };
  } catch (error) {
    console.error("Linear projects command error:", error);

    return {
      success: false,
      message: "Failed to get Linear projects",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Projects Error

An error occurred while fetching projects:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "View Teams",
          command: "/mo linear-teams",
        },
        {
          label: "Try Again",
          command: "/mo linear-projects",
        },
      ],
    };
  }
};

/**
 * Linear states command
 *
 * Lists workflow states in Linear
 */
export const linearStatesCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: `
### Linear API Key Not Found

Please authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get team ID
    let teamId = params.team;

    if (!teamId) {
      // Use default team ID if available
      const auth = await getLinearAuth();
      teamId = auth?.defaultTeamId;

      if (!teamId) {
        // Get all teams and use the first one
        const client = new LinearClient(apiKey);
        const teams = await client.getTeams();

        if (teams.length === 0) {
          return {
            success: false,
            message: "No Linear teams found",
            markdown: `
### No Linear Teams Found

You don't have any teams in Linear.
`,
            actionButtons: [
              {
                label: "View Teams",
                command: "/mo linear-teams",
              },
            ],
          };
        }

        teamId = teams[0].id;
      }
    }

    // Get workflow states for the team
    const client = new LinearClient(apiKey);
    const team = await client.getTeam(teamId);

    if (!team) {
      return {
        success: false,
        message: `Team not found: ${teamId}`,
        markdown: `
### Linear Team Not Found

The team with ID \`${teamId}\` was not found.

Please check the team ID and try again.
`,
        actionButtons: [
          {
            label: "View Teams",
            command: "/mo linear-teams",
          },
        ],
      };
    }

    const states = await client.getWorkflowStates(teamId);

    // Build action buttons
    const actionButtons = [
      {
        label: "View Teams",
        command: "/mo linear-teams",
      },
      {
        label: "View Projects",
        command: `/mo linear-projects team:${teamId}`,
      },
      {
        label: "View Issues",
        command: `/mo linear-issues team:${teamId}`,
      },
      {
        label: "Sync with Linear",
        command: `/mo linear-sync team:${teamId}`,
      },
    ];

    // Format response
    return {
      success: true,
      message: `Found ${states.length} Linear workflow states for team ${team.name}`,
      markdown: formatWorkflowStates(states, team.name),
      actionButtons,
    };
  } catch (error) {
    console.error("Linear states command error:", error);

    return {
      success: false,
      message: "Failed to get Linear workflow states",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Workflow States Error

An error occurred while fetching workflow states:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "View Teams",
          command: "/mo linear-teams",
        },
        {
          label: "Try Again",
          command: "/mo linear-states",
        },
      ],
    };
  }
};

/**
 * Linear issues command
 *
 * Lists issues in Linear
 */
export const linearIssuesCommand: CommandHandler = async (params, context) => {
  try {
    // Check if Linear is configured
    if (!(await isLinearConfigured())) {
      return {
        success: false,
        message: "Linear is not configured",
        markdown: `
### Linear Not Configured

You need to authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Get API key
    const apiKey = await getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "Linear API key not found",
        markdown: `
### Linear API Key Not Found

Please authenticate with Linear first:

\`/mo linear-auth key:your_linear_api_key\`
`,
        actionButtons: [
          {
            label: "Authenticate with Linear",
            command: "/mo linear-auth",
          },
        ],
      };
    }

    // Build filter for issues
    const filter: Record<string, any> = {};

    // Add team filter
    let teamId = params.team;
    let teamName: string | undefined;

    if (!teamId) {
      // Use default team ID if available
      const auth = await getLinearAuth();
      teamId = auth?.defaultTeamId;
    }

    if (teamId) {
      filter.team = { id: { eq: teamId } };

      // Get team name for display
      const client = new LinearClient(apiKey);
      const team = await client.getTeam(teamId);
      teamName = team?.name;
    }

    // Add assignee filter
    if (params.assignee) {
      if (params.assignee.toLowerCase() === "me") {
        // Get current user ID
        const client = new LinearClient(apiKey);
        const user = await client.getCurrentUser();
        filter.assignee = { id: { eq: user.id } };
      } else {
        // Assume assignee is a user ID
        filter.assignee = { id: { eq: params.assignee } };
      }
    }

    // Add state filter
    if (params.states) {
      const stateNames = params.states.split(",").map((s) => s.trim());
      filter.state = { name: { in: stateNames } };
    }

    // Get issues
    const client = new LinearClient(apiKey);
    const limit = params.limit ? parseInt(params.limit, 10) : 10;

    // Determine if we should use pagination
    const usePagination = params.paginate === "true";
    const maxItems = params.all === "true" ? undefined : limit;

    let issues: LinearIssue[] = [];
    let hasMoreIssues = false;
    let nextCursor: string | null = null;

    if (usePagination || params.all === "true") {
      // Use the getAllIssues method that handles pagination automatically
      issues = await client.getAllIssues(
        { filter, first: Math.min(Math.max(1, limit), 50) },
        50, // batch size
        maxItems
      );
    } else {
      // Use the regular getIssues method with single page
      const result = await client.getIssues({
        filter,
        first: isNaN(limit) ? 10 : Math.min(Math.max(1, limit), 50),
      });
      issues = result.issues;
      hasMoreIssues = result.pageInfo.hasNextPage;
      nextCursor = result.pageInfo.endCursor;
    }

    // Build action buttons
    const actionButtons = [
      {
        label: "View Teams",
        command: "/mo linear-teams",
      },
    ];

    if (teamId) {
      actionButtons.push({
        label: "View Projects",
        command: `/mo linear-projects team:${teamId}`,
      });

      actionButtons.push({
        label: "View States",
        command: `/mo linear-states team:${teamId}`,
      });
    }

    // Add pagination buttons if there are more issues
    if (hasMoreIssues && nextCursor) {
      const nextPageCommand = `/mo linear-issues team:${teamId} limit:${limit} cursor:${nextCursor} paginate:true`;
      actionButtons.push({
        label: "Next Page",
        command: nextPageCommand,
      });

      const allIssuesCommand = `/mo linear-issues team:${teamId} all:true`;
      actionButtons.push({
        label: "Get All Issues",
        command: allIssuesCommand,
      });
    }

    // Add pull all button
    if (issues.length > 0) {
      const pullCommand = `/mo linear-pull team:${teamId}`;
      actionButtons.push({
        label: "Pull All Issues",
        command: pullCommand,
      });

      // Add sync button
      actionButtons.push({
        label: "Sync with Linear",
        command: `/mo linear-sync team:${teamId}`,
      });
    }

    // Format response
    return {
      success: true,
      message: `Found ${issues.length} Linear issues${
        hasMoreIssues ? " (more available)" : ""
      }`,
      markdown: formatIssues(issues, teamName),
      actionButtons,
    };
  } catch (error) {
    console.error("Linear issues command error:", error);

    return {
      success: false,
      message: "Failed to get Linear issues",
      error: error instanceof Error ? error.message : String(error),
      markdown: `
### Linear Issues Error

An error occurred while fetching issues:

\`${error instanceof Error ? error.message : String(error)}\`

Please try again.
`,
      actionButtons: [
        {
          label: "View Teams",
          command: "/mo linear-teams",
        },
        {
          label: "Try Again",
          command: "/mo linear-issues",
        },
      ],
    };
  }
};
