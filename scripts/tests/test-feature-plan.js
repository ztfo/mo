// Test script to simulate feature planning functionality
const { createLinearIssue } = require('./dist/linear-api');
const fs = require('fs');
const path = require('path');

// Simple AI task simulation (in a real environment, this would call Claude or another AI)
function simulateAITaskGeneration(featureDescription) {
  console.log(`Simulating AI task generation for: "${featureDescription}"`);
  
  // Generate some mock tasks based on the feature description
  return [
    `Create ${featureDescription.toLowerCase()} database schema`,
    `Design ${featureDescription.toLowerCase()} API endpoints`,
    `Implement ${featureDescription.toLowerCase()} authentication`,
    `Develop ${featureDescription.toLowerCase()} UI components`,
    `Write tests for ${featureDescription.toLowerCase()} functionality`
  ];
}

async function testFeaturePlanning(featureDescription) {
  try {
    console.log(`Planning feature: ${featureDescription}`);
    
    // 1. Generate tasks (simulated AI response)
    const tasks = simulateAITaskGeneration(featureDescription);
    console.log('Generated tasks:');
    tasks.forEach((task, i) => console.log(`${i+1}. ${task}`));
    
    // 2. Update FEATURE_PLANS.md
    const featurePlansPath = path.join(__dirname, '../docs/features/FEATURE_PLANS.md');
    const timestamp = new Date().toISOString();
    
    const featurePlan = `
## Feature: ${featureDescription}
_Planned: ${timestamp}_

### Tasks:
${tasks.map(task => `- [ ] ${task}`).join('\n')}

---
`;
    
    try {
      let planContent = fs.readFileSync(featurePlansPath, 'utf8');
      // Insert new feature plan after the header
      const headerEndIndex = planContent.indexOf('## Recent Features') + '## Recent Features'.length;
      planContent = planContent.slice(0, headerEndIndex) + '\n' + featurePlan + planContent.slice(headerEndIndex);
      fs.writeFileSync(featurePlansPath, planContent);
      console.log('✅ Updated FEATURE_PLANS.md');
    } catch (error) {
      console.error('❌ Failed to update FEATURE_PLANS.md:', error);
      return;
    }
    
    // 3. Create Linear issues
    console.log('\nCreating Linear issues...');
    const createdIssues = [];
    
    for (const task of tasks) {
      try {
        const response = await createLinearIssue(task, `Part of feature: ${featureDescription}`);
        if (response.data?.issueCreate?.success) {
          createdIssues.push({
            title: task,
            url: response.data.issueCreate.issue.url
          });
          console.log(`✅ Created issue: ${task}`);
        } else {
          console.error(`❌ Failed to create issue for task: ${task}`, response.errors || response);
        }
      } catch (error) {
        console.error(`❌ Failed to create Linear issue for task: ${task}`, error);
      }
    }
    
    console.log(`\nSummary: Created ${createdIssues.length}/${tasks.length} Linear issues`);
    
  } catch (error) {
    console.error('Error in feature planning test:', error);
  }
}

// Run the test with a sample feature
const featureToTest = process.argv[2] || "User Authentication System";
testFeaturePlanning(featureToTest); 