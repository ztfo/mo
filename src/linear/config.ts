/**
 * Linear Configuration Types
 *
 * This file extends the base configuration type to include Linear-specific fields
 */

/**
 * This interface extends the default configuration type in the store
 * to include Linear-specific fields.
 */
export interface LinearConfig {
  /** Linear API key (encrypted) */
  linearApiKey: string;

  /** Linear team ID */
  linearTeamId: string;

  /** Whether Linear integration is configured */
  linearConfigured: boolean;

  /** Default team ID for Linear operations */
  linearDefaultTeamId: string;

  /** Linear user ID associated with the API key */
  linearUserId: string;

  /** Timestamp of last successful authentication */
  linearLastAuthenticated: string;
}
