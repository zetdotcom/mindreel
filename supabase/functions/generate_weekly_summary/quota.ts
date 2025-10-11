// Quota management functions for the weekly summary edge function

import type { QuotaState } from "../_shared/types.ts";

// Constants
const QUOTA_LIMIT = 5;
const CYCLE_DAYS = 28;

/**
 * Gets or initializes user quota from the database
 */
export async function getOrInitUserQuota(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("get_or_init_user_quota", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting user quota:", error);
    throw new Error(`Failed to get quota: ${error.message}`);
  }

  return data;
}

/**
 * Resets user quota if the cycle has expired
 */
export async function resetQuotaIfExpired(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("reset_quota_if_expired", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error resetting quota:", error);
    throw new Error(`Failed to reset quota: ${error.message}`);
  }

  return data;
}

/**
 * Calculates quota information including remaining count and cycle end date
 */
export function calculateQuotaInfo(quota: QuotaState): {
  remaining: number;
  cycleEnd: string;
  isExceeded: boolean;
} {
  const remaining = Math.max(0, QUOTA_LIMIT - quota.ai_summaries_count);
  const cycleStartDate = new Date(quota.cycle_start_at);
  const cycleEndDate = new Date(
    cycleStartDate.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000,
  );

  return {
    remaining,
    cycleEnd: cycleEndDate.toISOString(),
    isExceeded: quota.ai_summaries_count >= QUOTA_LIMIT,
  };
}

/**
 * Increments quota in a concurrency-safe manner
 */
export async function conditionalIncrementQuota(
  supabase: any,
  userId: string,
  expectedCount: number,
): Promise<QuotaState | null> {
  const { data, error } = await supabase.rpc("conditional_increment_quota", {
    p_user_id: userId,
    p_expected_count: expectedCount,
  });

  if (error) {
    console.error("Error incrementing quota:", error);
    throw new Error(`Failed to increment quota: ${error.message}`);
  }

  return data; // Will be null if race condition occurred
}

/**
 * Fetches current user quota from the database
 */
export async function fetchCurrentQuota(
  supabase: any,
  userId: string,
): Promise<QuotaState> {
  const { data, error } = await supabase.rpc("get_or_init_user_quota", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error fetching quota:", error);
    throw new Error(`Failed to fetch quota: ${error.message}`);
  }

  return data;
}
