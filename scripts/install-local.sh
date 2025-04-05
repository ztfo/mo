#!/bin/bash

# Install MCP locally for testing
# This script builds the package and installs it globally for testing purposes

# Exit on error
set -e

# Build the package
echo "Building package..."
npm run build

# Pack the package without saving the .tgz file
echo "Packing package..."
PACKAGE_TGZ=$(npm pack)

# Install the package globally
echo "Installing package globally..."
npm install -g $PACKAGE_TGZ

# Clean up
echo "Cleaning up..."
rm $PACKAGE_TGZ

echo "Installation complete!"
echo "The MCP is now available as a global command: mo-linear-mcp"
echo "Test chat mode by running: mo-linear-mcp linear_status"
echo "Test direct execution by running: npx mo-linear-mcp linear_status"
