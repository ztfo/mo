// Simple script to test if Linear API credentials are loaded correctly
require('dotenv').config();

// Don't log the actual key, just check if it exists
const hasApiKey = !!process.env.LINEAR_API_KEY;
const hasTeamId = !!process.env.LINEAR_TEAM_ID;

console.log('Linear API Key configured:', hasApiKey);
console.log('Linear Team ID configured:', hasTeamId);

if (hasApiKey && hasTeamId) {
  console.log('✅ Credentials are properly configured!');
} else {
  console.log('❌ Missing credentials. Please check your .env file.');
} 