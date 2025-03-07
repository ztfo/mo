// Simple script to test if Linear API credentials are loaded correctly
require('dotenv').config();

// Don't log the actual key, just check if it exists and show format
const apiKey = process.env.LINEAR_API_KEY || '';
const teamId = process.env.LINEAR_TEAM_ID || '';

console.log('Linear API Key configured:', !!apiKey);
console.log('Linear Team ID configured:', !!teamId);

// Show format information without revealing the full key
if (apiKey) {
  console.log('API Key format check:');
  console.log('- Length:', apiKey.length, 'characters');
  console.log('- First 4 chars:', apiKey.substring(0, 4));
  console.log('- Last 4 chars:', apiKey.substring(apiKey.length - 4));
  
  // Linear API keys typically start with "lin_api_" and are followed by a random string
  const hasValidPrefix = apiKey.startsWith('lin_api_');
  console.log('- Has valid prefix (lin_api_):', hasValidPrefix);
}

if (teamId) {
  console.log('\nTeam ID format check:');
  console.log('- Length:', teamId.length, 'characters');
  console.log('- Format check:', teamId.startsWith('team_') ? 'Valid (starts with team_)' : 'Invalid (should start with team_)');
}

if (apiKey && teamId) {
  console.log('\n✅ Environment variables are present, but this doesn\'t guarantee they\'re valid.');
  console.log('Linear API keys should start with "lin_api_" and team IDs should start with "team_".');
} else {
  console.log('\n❌ Missing credentials. Please check your .env file.');
} 