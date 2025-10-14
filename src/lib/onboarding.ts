/**
 * Onboarding state management utilities
 * Manages the first-time user experience flag in localStorage
 */

const ONBOARDING_KEY = "mindreel:onboardingShown";

/**
 * Checks if the user has already seen the onboarding modal
 * @returns true if onboarding has been shown, false otherwise
 */
export function hasSeenOnboarding(): boolean {
  try {
    const value = localStorage.getItem(ONBOARDING_KEY);
    return value === "true";
  } catch (error) {
    // Graceful degradation if localStorage is unavailable
    console.warn("Failed to read onboarding state from localStorage:", error);
    return false;
  }
}

/**
 * Marks the onboarding as seen by persisting a flag in localStorage
 */
export function setOnboardingSeen(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch (error) {
    // Graceful degradation if localStorage is unavailable
    console.warn("Failed to write onboarding state to localStorage:", error);
  }
}

/**
 * Clears the onboarding flag (useful for testing/debugging)
 */
export function clearOnboardingFlag(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.warn("Failed to clear onboarding state from localStorage:", error);
  }
}
