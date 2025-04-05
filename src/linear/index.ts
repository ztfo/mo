/**
 * Linear Integration
 *
 * This is the main export file for the Linear integration module.
 * It re-exports all Linear-related functionality to provide a clean API surface.
 */

// Core Linear client
export { LinearClient } from "./api";

// Authentication
export {
  storeApiKey,
  getApiKey,
  getLinearAuth,
  updateLinearAuth,
  validateApiKey,
  isLinearConfigured,
  getCurrentUser,
  clearLinearAuth,
} from "./auth";

// Types
export * from "./types";
export * from "./config";

// Sync utilities
export {
  syncWithLinear,
  linearIssueToTask,
  taskToLinearIssueInput,
  taskToLinearIssueUpdateInput,
} from "./sync";

// GraphQL queries
export * from "./queries";
