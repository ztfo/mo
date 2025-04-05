#!/bin/bash

# Script to run the MCP server directly using Node
# This avoids any issues with npm run and ensures proper stdin/stdout handling

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$DIR/.." && pwd )"

# Find the main server file
SERVER_FILE="$PROJECT_ROOT/dist/index.js"

echo "Starting MCP server from $SERVER_FILE"
echo "Log file: /tmp/mo-mcp-debug.log"

# Clear any existing log file
rm -f /tmp/mo-mcp-debug.log

# Run the server
node "$SERVER_FILE"
