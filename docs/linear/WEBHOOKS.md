# Linear Webhooks Implementation

This document describes the implementation of Linear webhooks in the Mo MCP server.

## Overview

Webhooks provide a real-time notification system that allows the Mo MCP server to receive updates from Linear when issues, comments, labels, and other resources change. This enables more immediate synchronization between Linear and Mo tasks without requiring manual polling or sync commands.

## Components

The webhook implementation consists of the following components:

1. **Webhook HTTP Server**: A dedicated HTTP server that listens for incoming webhook requests from Linear
2. **Webhook Event Handler**: Logic to process different event types received from Linear
3. **Webhook Registration**: Commands to register and manage webhooks with Linear
4. **Webhook Security**: Signature verification to ensure webhook events are actually from Linear

## Webhook Server

The webhook server is implemented as a separate HTTP server that runs alongside the MCP server. It:

- Listens on a configurable port (default: 3456)
- Accepts POST requests to the `/linear-webhook` endpoint
- Validates webhook signatures using HMAC
- Processes webhook events and triggers appropriate actions

## Event Processing

When a webhook event is received, it is processed based on its type:

- **Issue Events**: When issues are created, updated, or deleted, the system syncs the affected issue
- **Comment Events**: Updates related to issue comments (not fully implemented yet)
- **Label Events**: Changes to issue labels (not fully implemented yet)

## Commands

The following MCP commands are available for managing webhooks:

### linear-webhook-register

Registers a new webhook with Linear.

```
/mo linear-webhook-register url:https://your-server.com/linear-webhook team:TEAM_ID
```

Parameters:

- `url` (required): The public URL where Linear can send webhook events
- `team` (optional): The Linear team ID to scope the webhook to (uses default if not specified)
- `resources` (optional): Comma-separated list of resource types (default: Issue,Comment,IssueLabel)
- `label` (optional): A label for the webhook (default: "Mo MCP Webhook")
- `secret` (optional): A secret key for signature verification (auto-generated if not provided)

### linear-webhook-list

Lists the registered webhooks.

```
/mo linear-webhook-list
```

### linear-webhook-delete

Deletes a registered webhook.

```
/mo linear-webhook-delete
```

Parameters:

- `id` (optional): Webhook ID to delete (uses the stored webhook ID if not specified)

## Security

Webhook security is implemented through HMAC signature validation:

1. When a webhook is registered, a secret key is generated or provided
2. Linear uses this secret to sign the webhook payload
3. The signature is sent in the `linear-signature` header
4. The server validates the signature by recalculating it with the same secret
5. Events with invalid signatures are rejected

## Implementation Details

### Server Lifecycle

- The webhook server is started and stopped alongside the MCP server
- Proper cleanup is implemented to handle process termination signals (SIGINT, SIGTERM)

### Configuration

Webhook configuration is stored in the main configuration store:

- `linearWebhookId`: ID of the registered webhook
- `linearWebhookSecret`: Secret key for signature verification
- `linearWebhookUrl`: URL where the webhook is registered

### Network Requirements

For the webhook to function properly:

1. The server must be publicly accessible from the internet
2. The specified port (default: 3456) must be open in firewalls
3. If running behind NAT or private networks, port forwarding is required

## Testing Webhooks

Since webhooks require a publicly accessible URL, testing options include:

1. **Local Testing with Tunneling**: Using services like ngrok or localtunnel to expose a local server
2. **Manual Event Triggering**: Creating or updating issues in Linear to trigger webhook events
3. **Event Logs**: Monitoring webhook event logs in the server console

## Limitations and Future Improvements

Current limitations and future improvements for webhooks include:

1. **Access to Public Internet**: The system assumes the server has a public IP or hostname
2. **Multiple Webhooks**: Currently only supports one webhook registration
3. **Retry Mechanism**: Limited support for event delivery failures
4. **Event Logging**: Minimal event logging and history
5. **Comment Implementation**: Comment handling is not fully implemented

Future versions should address these limitations with:

- Better support for private network deployments
- Multiple webhook registration
- Robust retry and failure handling
- Comprehensive event logging and dashboard
- Full implementation of all event types
