/**
 * Feature: Onboarding
 *
 * Centralized state helpers for first‑run onboarding experience.
 * These functions intentionally encapsulate storage interaction so we can
 * later swap to another persistence mechanism (e.g. Electron store) without
 * touching calling code.
 *
 * Usage:
 *  if (!hasSeenOnboarding()) { show modal ... }
 *  on confirm: setOnboardingSeen()
 *
 * Testing:
 *  - clearOnboardingFlag() can reset state between tests.
 */

const ONBOARDING_KEY = "mindreel:onboardingShown";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Resolve a storage backend. We default to window.localStorage when available.
 * If not available (e.g. in certain test or SSR contexts), we fall back to an in-memory shim.
 */
function resolveStorage(): StorageLike {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  // Minimal in-memory fallback (non-persistent)
  const memory: Record<string, string | null> = {};
  return {
    getItem: (k: string) => (Object.hasOwn(memory, k) ? memory[k] : null),
    setItem: (k: string, v: string) => {
      memory[k] = v;
    },
    removeItem: (k: string) => {
      delete memory[k];
    },
  };
}

const storage = resolveStorage();

/**
 * Determine whether the onboarding modal has already been confirmed.
 */
export function hasSeenOnboarding(): boolean {
  try {
    return storage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as completed so it will not show again.
 */
export function setOnboardingSeen(): void {
  try {
    storage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Swallow; onboarding will simply reappear next run if persist fails.
  }
}

/**
 * Clear the onboarding flag (useful for debugging or QA flows).
 */
export function clearOnboardingFlag(): void {
  try {
    storage.removeItem(ONBOARDING_KEY);
  } catch {
    /* no-op */
  }
}

/**
 * Convenience function: ensure the flag is set; returns true if it changed state.
 */
export function ensureOnboardingSeen(): boolean {
  if (!hasSeenOnboarding()) {
    setOnboardingSeen();
    return true;
  }
  return false;
}

/**
 * Exported constant for advanced consumers (e.g. migration or analytics tagging).
 * Prefer the helper functions above in most cases.
 */
export const ONBOARDING_STORAGE_KEY = ONBOARDING_KEY;
