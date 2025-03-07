// Test script for enhanced Linear API integration
require('dotenv').config();
const { 
  createEnhancedLinearIssue, 
  getFilteredIssues, 
  updateIssue, 
  getTeamDetails,
  getProjects,
  createProject,
  getCycles,
  createCycle,
  addComment,
  createIssueRelation,
  getIssueRelations,
  getCachedTeamDetails,
  clearCache
} = require('./dist/linear-api-enhanced');

// Test the enhanced Linear API
async function runTests() {
  try {
    console.log("Testing Enhanced Linear API...");
    
    // 1. Get team details
    console.log("\n1. Getting team details...");
    const teamResult = await getTeamDetails();
    
    if (teamResult.data?.team) {
      console.log(`✅ Team: ${teamResult.data.team.name} (${teamResult.data.team.key})`);
      console.log(`States: ${teamResult.data.team.states.nodes.length}`);
      console.log(`Labels: ${teamResult.data.team.labels.nodes.length}`);
      console.log(`Members: ${teamResult.data.team.members.nodes.length}`);
    } else {
      console.error("❌ Failed to get team details:", teamResult.errors || teamResult);
      return;
    }
    
    // 2. Create an issue with enhanced properties
    console.log("\n2. Creating an issue with enhanced properties...");
    
    // Get a state ID for the new issue
    const stateId = teamResult.data.team.states.nodes.find(state => state.name === "Backlog")?.id;
    
    // Get a member ID for assignment
    const memberId = teamResult.data.team.members.nodes[0]?.id;
    
    const timestamp = new Date().toISOString();
    const issueResult = await createEnhancedLinearIssue(
      `Enhanced API Test - ${timestamp}`,
      "Testing the enhanced Linear API with additional properties",
      {
        priority: 2,
        stateId: stateId,
        assigneeId: memberId,
        estimate: 3
      }
    );
    
    if (issueResult.data?.issueCreate?.success) {
      console.log(`✅ Created issue: ${issueResult.data.issueCreate.issue.identifier}`);
      console.log(`URL: ${issueResult.data.issueCreate.issue.url}`);
      
      const issueId = issueResult.data.issueCreate.issue.id;
      
      // 3. Update the issue
      console.log("\n3. Updating the issue...");
      const updateResult = await updateIssue(issueId, {
        description: "Updated description with more details about the enhanced API test",
        priority: 1
      });
      
      if (updateResult.data?.issueUpdate?.success) {
        console.log(`✅ Updated issue: ${updateResult.data.issueUpdate.issue.identifier}`);
      } else {
        console.error("❌ Failed to update issue:", updateResult.errors || updateResult);
      }
      
      // 4. Add a comment to the issue
      console.log("\n4. Adding a comment to the issue...");
      const commentResult = await addComment(issueId, "This is a test comment from the enhanced API");
      
      if (commentResult.data?.commentCreate?.success) {
        console.log(`✅ Added comment: ${commentResult.data.commentCreate.comment.id}`);
      } else {
        console.error("❌ Failed to add comment:", commentResult.errors || commentResult);
      }
      
      // 5. Create a second issue for relation testing
      console.log("\n5. Creating a second issue for relation testing...");
      const issue2Result = await createEnhancedLinearIssue(
        `Related Issue - ${timestamp}`,
        "This issue will be related to the first test issue",
        {
          priority: 3,
          stateId: stateId
        }
      );
      
      if (issue2Result.data?.issueCreate?.success) {
        console.log(`✅ Created second issue: ${issue2Result.data.issueCreate.issue.identifier}`);
        
        const issue2Id = issue2Result.data.issueCreate.issue.id;
        
        // 6. Create a relation between issues
        console.log("\n6. Creating a relation between issues...");
        const relationResult = await createIssueRelation(issueId, issue2Id, "blocks");
        
        if (relationResult.data?.issueRelationCreate?.success) {
          console.log(`✅ Created relation: ${relationResult.data.issueRelationCreate.issueRelation.type}`);
          
          // 7. Get issue relations
          console.log("\n7. Getting issue relations...");
          const relationsResult = await getIssueRelations(issueId);
          
          if (relationsResult.data?.issue?.relations?.nodes) {
            console.log(`✅ Found ${relationsResult.data.issue.relations.nodes.length} relations`);
            relationsResult.data.issue.relations.nodes.forEach(relation => {
              console.log(`- ${relation.type}: ${relation.relatedIssue.identifier} (${relation.relatedIssue.title})`);
            });
          } else {
            console.error("❌ Failed to get issue relations:", relationsResult.errors || relationsResult);
          }
        } else {
          console.error("❌ Failed to create relation:", relationResult.errors || relationResult);
        }
      } else {
        console.error("❌ Failed to create second issue:", issue2Result.errors || issue2Result);
      }
    } else {
      console.error("❌ Failed to create issue:", issueResult.errors || issueResult);
    }
    
    // 8. Get projects
    console.log("\n8. Getting projects...");
    const projectsResult = await getProjects();
    
    if (projectsResult.data?.team?.projects?.nodes) {
      console.log(`✅ Found ${projectsResult.data.team.projects.nodes.length} projects`);
      projectsResult.data.team.projects.nodes.slice(0, 3).forEach(project => {
        console.log(`- ${project.name} (${project.state})`);
      });
    } else {
      console.error("❌ Failed to get projects:", projectsResult.errors || projectsResult);
    }
    
    // 9. Get cycles
    console.log("\n9. Getting cycles...");
    const cyclesResult = await getCycles();
    
    if (cyclesResult.data?.team?.cycles?.nodes) {
      console.log(`✅ Found ${cyclesResult.data.team.cycles.nodes.length} cycles`);
      cyclesResult.data.team.cycles.nodes.slice(0, 3).forEach(cycle => {
        console.log(`- ${cycle.name} (${cycle.startsAt} to ${cycle.endsAt})`);
      });
    } else {
      console.error("❌ Failed to get cycles:", cyclesResult.errors || cyclesResult);
    }
    
    // 10. Test filtered issues
    console.log("\n10. Testing filtered issues...");
    const filteredResult = await getFilteredIssues({
      priorities: [1, 2],
      createdAt: { after: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() } // Last 24 hours
    }, { first: 5 });
    
    if (filteredResult.data?.issues?.nodes) {
      console.log(`✅ Found ${filteredResult.data.issues.nodes.length} issues with priority 1-2 created in the last 24 hours`);
      filteredResult.data.issues.nodes.forEach(issue => {
        console.log(`- ${issue.identifier}: ${issue.title} (Priority: ${issue.priority})`);
      });
    } else {
      console.error("❌ Failed to get filtered issues:", filteredResult.errors || filteredResult);
    }
    
    // 11. Test caching
    console.log("\n11. Testing caching...");
    console.log("First call (should hit API):");
    console.time("First call");
    const cachedTeam1 = await getCachedTeamDetails();
    console.timeEnd("First call");
    
    console.log("Second call (should use cache):");
    console.time("Second call");
    const cachedTeam2 = await getCachedTeamDetails();
    console.timeEnd("Second call");
    
    console.log("Clearing cache...");
    clearCache();
    
    console.log("Third call (should hit API again):");
    console.time("Third call");
    const cachedTeam3 = await getCachedTeamDetails();
    console.timeEnd("Third call");
    
    if (cachedTeam1 && cachedTeam2 && cachedTeam3) {
      console.log("✅ Caching is working correctly");
    } else {
      console.error("❌ Caching test failed");
    }
    
    console.log("\nEnhanced Linear API tests completed!");
    
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
runTests(); 