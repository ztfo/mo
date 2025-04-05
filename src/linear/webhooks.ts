/**
 * Linear Webhooks
 *
 * This file provides functionality for handling Linear webhooks,
 * including webhook registration, verification, and event processing.
 */

import http from "http";
import { URL } from "url";
import { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { LinearClient } from "./api";
import { getApiKey, isLinearConfigured } from "./auth";
import { LinearWebhookEvent, LinearWebhookConfig } from "./types";
import { updateConfig, getConfig } from "../data/store";
import { syncWithLinear } from "./sync";

// Default port for the webhook server
const DEFAULT_WEBHOOK_PORT = 3456;

// Webhook server instance
let webhookServer: http.Server | null = null;

// Webhook secret for verification
let webhookSecret: string | null = null;

/**
 * Start the Linear webhook server
 *
 * @param port Port number to listen on
 * @returns Promise resolving when server is started
 */
export async function startWebhookServer(
  port: number = DEFAULT_WEBHOOK_PORT
): Promise<void> {
  if (webhookServer) {
    console.log("Webhook server already running");
    return;
  }

  // Get webhook secret from config
  const config = await getConfig();
  webhookSecret = config.linearWebhookSecret || null;

  // Create the server
  webhookServer = http.createServer(handleWebhookRequest);

  // Start listening
  return new Promise((resolve, reject) => {
    webhookServer!.listen(port, () => {
      console.log(`Linear webhook server listening on port ${port}`);
      resolve();
    });

    webhookServer!.on("error", (error) => {
      console.error("Error starting webhook server:", error);
      webhookServer = null;
      reject(error);
    });
  });
}

/**
 * Stop the Linear webhook server
 *
 * @returns Promise resolving when server is stopped
 */
export async function stopWebhookServer(): Promise<void> {
  if (!webhookServer) {
    console.log("Webhook server not running");
    return;
  }

  return new Promise((resolve, reject) => {
    webhookServer!.close((err) => {
      if (err) {
        console.error("Error stopping webhook server:", err);
        reject(err);
      } else {
        console.log("Webhook server stopped");
        webhookServer = null;
        resolve();
      }
    });
  });
}

/**
 * Handle incoming webhook requests
 *
 * @param req HTTP request
 * @param res HTTP response
 */
async function handleWebhookRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Only accept POST requests to /linear-webhook
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method !== "POST" || url.pathname !== "/linear-webhook") {
    res.statusCode = 404;
    res.end("Not Found");
    return;
  }

  try {
    // Get request body
    const body = await getRequestBody(req);

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers["linear-signature"];

      if (
        !signature ||
        !verifyWebhookSignature(signature.toString(), body, webhookSecret)
      ) {
        console.error("Invalid webhook signature");
        res.statusCode = 401;
        res.end("Invalid signature");
        return;
      }
    }

    // Parse webhook event
    const event = JSON.parse(body) as LinearWebhookEvent;

    // Process the webhook event
    await processWebhookEvent(event);

    // Send success response
    res.statusCode = 200;
    res.end("OK");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}

/**
 * Get the request body as a string
 *
 * @param req HTTP request
 * @returns Promise resolving to the request body
 */
function getRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      resolve(body);
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Verify webhook signature using HMAC
 *
 * @param signature Signature from Linear request headers
 * @param body Request body
 * @param secret Webhook secret
 * @returns Whether the signature is valid
 */
function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  // Calculate expected signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(body);
  const expectedSignature = hmac.digest("hex");

  // Compare signatures (constant-time comparison to prevent timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Process a webhook event
 *
 * @param event Webhook event from Linear
 */
async function processWebhookEvent(event: LinearWebhookEvent): Promise<void> {
  console.log(`Processing Linear webhook event: ${event.type}`);

  // Handle different event types
  switch (event.type) {
    case "Issue":
      await handleIssueEvent(event);
      break;
    case "Comment":
      await handleCommentEvent(event);
      break;
    case "IssueLabel":
      await handleLabelEvent(event);
      break;
    case "Reaction":
      // Currently not handling reactions
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Handle issue-related webhook events
 *
 * @param event Webhook event
 */
async function handleIssueEvent(event: LinearWebhookEvent): Promise<void> {
  // Trigger a sync with Linear for this issue
  if (event.data && event.data.id) {
    const issueId = event.data.id;

    try {
      // If an issue was created, updated, or removed, sync with Linear
      await syncWithLinear({
        direction: "pull",
        filter: {
          taskIds: [issueId],
        },
      });
    } catch (error) {
      console.error(`Error syncing issue ${issueId}:`, error);
    }
  }
}

/**
 * Handle comment-related webhook events
 *
 * @param event Webhook event
 */
async function handleCommentEvent(event: LinearWebhookEvent): Promise<void> {
  // Not yet implemented
  console.log("Comment event handling not yet implemented");
}

/**
 * Handle label-related webhook events
 *
 * @param event Webhook event
 */
async function handleLabelEvent(event: LinearWebhookEvent): Promise<void> {
  // Not yet implemented
  console.log("Label event handling not yet implemented");
}

/**
 * Register a webhook with Linear
 *
 * @param config Webhook configuration
 * @returns Webhook ID if successful
 */
export async function registerWebhook(
  config: LinearWebhookConfig
): Promise<string> {
  // Check if Linear is configured
  if (!(await isLinearConfigured())) {
    throw new Error("Linear not configured");
  }

  // Get API key
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Linear API key not found");
  }

  // Create Linear client
  const client = new LinearClient(apiKey);

  // Create webhook in Linear
  const webhook = await client.createWebhook({
    url: config.url,
    teamId: config.teamId,
    label: config.label,
    resourceTypes: config.resourceTypes,
  });

  // Generate a random webhook secret if not provided
  const secret = config.secret || crypto.randomBytes(32).toString("hex");

  // Store webhook configuration
  await updateConfig({
    linearWebhookId: webhook.id,
    linearWebhookSecret: secret,
    linearWebhookUrl: webhook.url,
  });

  // Return webhook ID
  return webhook.id;
}

/**
 * Delete a registered webhook
 *
 * @param webhookId Webhook ID to delete
 * @returns Whether the deletion was successful
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  // Check if Linear is configured
  if (!(await isLinearConfigured())) {
    throw new Error("Linear not configured");
  }

  // Get API key
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("Linear API key not found");
  }

  // Create Linear client
  const client = new LinearClient(apiKey);

  // Delete webhook in Linear
  const success = await client.deleteWebhook(webhookId);

  if (success) {
    // Remove webhook configuration
    await updateConfig({
      linearWebhookId: "",
      linearWebhookSecret: "",
      linearWebhookUrl: "",
    });
  }

  return success;
}
