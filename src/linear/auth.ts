/**
 * Linear Authentication
 *
 * This file handles authentication with Linear, including secure storage and validation of API keys.
 */

import CryptoJS from "crypto-js";
import { LinearAuth, LinearUser } from "./types";
import { LinearClient } from "./api";
import os from "os";
import { updateConfig, getConfig } from "../data/store";
import { LinearConfig } from "./config";

/**
 * Get a machine-specific salt for encryption
 * This creates a consistent salt based on machine details, so we don't need to store it
 *
 * @returns Machine-specific salt string
 */
function getMachineSalt(): string {
  // Use machine-specific information as salt
  // This is a simplified approach - in production, you might use a more sophisticated method
  const hostname = os.hostname();
  const username = os.userInfo().username;
  const platform = os.platform();

  // Combine into a salt string
  return `mo-linear-salt-${username}-${hostname}-${platform}`;
}

/**
 * Encrypt an API key
 *
 * @param apiKey The API key to encrypt
 * @returns Encrypted API key
 */
function encryptApiKey(apiKey: string): string {
  const salt = getMachineSalt();
  return CryptoJS.AES.encrypt(apiKey, salt).toString();
}

/**
 * Decrypt an API key
 *
 * @param encryptedKey The encrypted API key
 * @returns Decrypted API key
 */
function decryptApiKey(encryptedKey: string): string {
  const salt = getMachineSalt();
  const bytes = CryptoJS.AES.decrypt(encryptedKey, salt);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Store a Linear API key
 *
 * @param apiKey The API key to store
 * @param teamId Optional default team ID
 * @returns Promise resolving when storage is complete
 */
export async function storeApiKey(
  apiKey: string,
  teamId?: string
): Promise<void> {
  // Encrypt the API key
  const encryptedKey = encryptApiKey(apiKey);

  // Store in configuration
  await updateConfig({
    linearApiKey: encryptedKey,
    linearTeamId: teamId || "",
  });

  // Store additional linear configuration
  const linearConfig = {
    linearConfigured: true,
    linearDefaultTeamId: teamId || "",
  } as unknown as Partial<typeof getConfig>;

  await updateConfig(linearConfig);
}

/**
 * Get the stored Linear API key
 *
 * @returns Decrypted API key or null if not found
 */
export async function getApiKey(): Promise<string | null> {
  const config = await getConfig();
  const linearConfig = config as unknown as LinearConfig;

  if (!config.linearApiKey || !linearConfig.linearConfigured) {
    return null;
  }

  try {
    return decryptApiKey(config.linearApiKey);
  } catch (error) {
    console.error("Failed to decrypt Linear API key:", error);
    return null;
  }
}

/**
 * Get Linear authentication details
 *
 * @returns Authentication details or null if not configured
 */
export async function getLinearAuth(): Promise<LinearAuth | null> {
  const config = await getConfig();
  const linearConfig = config as unknown as LinearConfig;

  if (!config.linearApiKey || !linearConfig.linearConfigured) {
    return null;
  }

  return {
    apiKey: config.linearApiKey,
    encrypted: true,
    defaultTeamId: linearConfig.linearDefaultTeamId || config.linearTeamId,
    userId: linearConfig.linearUserId,
    lastAuthenticated: linearConfig.linearLastAuthenticated,
  };
}

/**
 * Update Linear authentication details
 *
 * @param auth Authentication details to update
 */
export async function updateLinearAuth(
  auth: Partial<LinearAuth>
): Promise<void> {
  const updates: Record<string, any> = {
    linearApiKey: auth.apiKey !== undefined ? auth.apiKey : undefined,
  };

  // Add extended properties
  const linearUpdates = {} as unknown as Partial<typeof getConfig>;

  if (auth.userId !== undefined) {
    updates.linearUserId = auth.userId;
  }

  if (auth.defaultTeamId !== undefined) {
    updates.linearTeamId = auth.defaultTeamId;
    updates.linearDefaultTeamId = auth.defaultTeamId;
  }

  if (auth.lastAuthenticated !== undefined) {
    updates.linearLastAuthenticated = auth.lastAuthenticated;
  }

  // Merge regular and linear updates
  await updateConfig({
    ...updates,
    ...linearUpdates,
  } as unknown as Partial<typeof getConfig>);
}

/**
 * Validate a Linear API key
 *
 * @param apiKey API key to validate
 * @returns User information if valid, throws error if invalid
 */
export async function validateApiKey(apiKey: string): Promise<LinearUser> {
  // Create a Linear client with the API key
  const client = new LinearClient(apiKey);

  // Try to get user information
  const user = await client.validateApiKey();

  // If we get here, the API key is valid
  return user;
}

/**
 * Check if Linear is properly configured
 *
 * @returns Whether Linear is configured
 */
export async function isLinearConfigured(): Promise<boolean> {
  const config = await getConfig();
  const linearConfig = config as unknown as LinearConfig;
  return Boolean(linearConfig.linearConfigured && config.linearApiKey);
}

/**
 * Get the current Linear user
 *
 * @returns Current user information or null if not authenticated
 */
export async function getCurrentUser(): Promise<LinearUser | null> {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return null;
  }

  try {
    const client = new LinearClient(apiKey);
    return await client.getCurrentUser();
  } catch (error) {
    console.error("Failed to get Linear user:", error);
    return null;
  }
}

/**
 * Clear Linear authentication
 *
 * @returns Promise resolving when auth is cleared
 */
export async function clearLinearAuth(): Promise<void> {
  await updateConfig({
    linearApiKey: "",
    linearTeamId: "",
  });

  // Clear additional linear configuration
  const linearConfig = {
    linearConfigured: false,
    linearDefaultTeamId: "",
    linearUserId: "",
    linearLastAuthenticated: "",
  } as unknown as Partial<typeof getConfig>;

  await updateConfig(linearConfig);
}
