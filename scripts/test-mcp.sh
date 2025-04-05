#!/bin/bash

# This script tests the MCP using direct command line execution
# It simulates what Cursor would do when sending a command

# Function to send a command to the MCP
send_command() {
  local command="$1"
  echo "Sending command: $command"
  echo "{\"command\":\"$command\",\"context\":{\"environment\":{\"cursor\":true}}}" | npx mo-linear-mcp
}

# Test status command
echo "=== Testing status command ==="
send_command "/mo linear-status"
echo

# Test list teams (will fail if not authenticated)
echo "=== Testing teams command ==="
send_command "/mo linear-teams"
echo

echo "Tests completed"
