// Environment variable utilities for MindReel Edge Functions
// Provides type-safe access to required environment variables

import type { EdgeFunctionEnv } from "./types.ts";

export class EnvError extends Error {
  constructor(variable: string, message?: string) {
    super(`Environment variable ${variable} is missing or invalid${message ? `: ${message}` : ""}`);
    this.name = "EnvError";
  }
}

/**
 * Gets a required environment variable, throwing if not found
 */
export function getRequiredEnv(key: string): string {
  const value = (globalThis as any).Deno.env.get(key);
  if (!value) {
    throw new EnvError(key);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return (globalThis as any).Deno.env.get(key) ?? defaultValue;
}

/**
 * Validates and returns all required environment variables for edge functions
 */
export function getEdgeFunctionEnv(): EdgeFunctionEnv {
  return {
    SUPABASE_URL: getRequiredEnv("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    OPENROUTER_API_KEY: getRequiredEnv("OPENROUTER_API_KEY"),
    OPENROUTER_MODEL: getRequiredEnv("OPENROUTER_MODEL"),
    MAX_PROMPT_CHARS: getRequiredEnv("MAX_PROMPT_CHARS"),
    ENTRY_TRUNCATION_LIMIT: getRequiredEnv("ENTRY_TRUNCATION_LIMIT"),
    LOG_LEVEL: getOptionalEnv("LOG_LEVEL", "info"),
  };
}

/**
 * Validates that numeric environment variables are valid numbers
 */
export function getNumericEnv(key: string): number {
  const value = getRequiredEnv(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new EnvError(key, "must be a positive integer");
  }
  return parsed;
}

/**
 * Gets numeric environment variables with validation
 */
export function getNumericConfig() {
  return {
    maxPromptChars: getNumericEnv("MAX_PROMPT_CHARS"),
    entryTruncationLimit: getNumericEnv("ENTRY_TRUNCATION_LIMIT"),
  };
}

/**
 * Validates all required environment variables at startup
 * Throws descriptive error if any are missing or invalid
 */
export function validateEnvironment(): EdgeFunctionEnv {
  try {
    const env = getEdgeFunctionEnv();

    // Validate numeric configs
    getNumericConfig();

    // Validate OpenRouter model format (should contain a slash)
    if (!env.OPENROUTER_MODEL.includes("/")) {
      throw new EnvError("OPENROUTER_MODEL", 'should be in format "provider/model"');
    }

    // Validate log level
    const validLogLevels = ["debug", "info", "warn", "error"];
    if (env.LOG_LEVEL && !validLogLevels.includes(env.LOG_LEVEL)) {
      throw new EnvError("LOG_LEVEL", `must be one of: ${validLogLevels.join(", ")}`);
    }

    return env;
  } catch (error) {
    console.error("Environment validation failed:", error.message);
    throw error;
  }
}
