# Mo Linear MCP Installation Guide

This guide explains how to install and configure the Mo Linear MCP for both editor usage and chat tool functionality in Cursor IDE.

## Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher
- Cursor IDE with MCP support

## Installation Options

### Option 1: Install from NPM (Recommended for Users)

Once published, you can install the MCP directly from NPM:

```bash
# Install globally
npm install -g mo-linear-mcp

# Verify installation
mo-linear-mcp linear_status
```

### Option 2: Install from Source (Development)

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/yourusername/mo-linear-mcp.git

# Navigate to the directory
cd mo-linear-mcp

# Install dependencies
npm install

# Build the package
npm run build

# Link the package globally
npm link
```

## Configuration

### 1. Configure MCP for Cursor

Create or edit the `~/.cursor/mcp.json` file to include the Mo Linear MCP:

```json
{
  "version": "0.1",
  "mcps": {
    "mo-linear-mcp": {
      "name": "Mo Linear MCP",
      "description": "Linear Task Management for Cursor IDE",
      "type": "npm",
      "command": "npx",
      "args": ["mo-linear-mcp"],
      "enabled": true
    }
  }
}
```

### 2. Linear API Configuration

1. Obtain a Linear API key from your Linear account settings
2. Authenticate within Cursor using:
   - Editor mode: `/mo linear-auth key:your_api_key`
   - Chat mode: Use the `linear_auth` function with your API key

## Usage

### Editor Interface

Access the MCP through the Cursor command palette using the `/mo` prefix:

- `/mo linear-teams` - List Linear teams
- `/mo linear-issues` - List Linear issues
- `/mo linear-status` - Check authentication status

### Chat Interface

In the Cursor chat, you can use the functions directly:

- `linear_teams` - List Linear teams
- `linear_issues` - List Linear issues
- `linear_status` - Check authentication status

## Development

For local development:

```bash
# Run in development mode
npm run dev

# Install locally for testing
./scripts/install-local.sh
```

## Troubleshooting

If you encounter issues:

1. Check the Mo Linear MCP logs in the Cursor output panel
2. Verify your Linear API key is valid
3. Ensure your MCP configuration in `~/.cursor/mcp.json` is correct

## Support

For assistance or to report issues, please [create an issue](https://github.com/yourusername/mo-linear-mcp/issues) on the GitHub repository.
