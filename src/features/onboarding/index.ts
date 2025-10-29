/**
 * Onboarding Feature Barrel
 *
 * Public surface for the onboarding (first‑run experience) feature.
 *
 * Exposes:
 *  - UI:
 *      OnboardingModal          (modal component shown on initial launch)
 *  - State helpers (local persistence abstraction):
 *      hasSeenOnboarding()
 *      setOnboardingSeen()
 *      clearOnboardingFlag()
 *      ensureOnboardingSeen()
 *      ONBOARDING_STORAGE_KEY
 *
 * Design Notes:
 *  - Keeping a narrow public API preserves refactor freedom inside the feature.
 *  - If onboarding evolves (multi‑step wizard, analytics tagging), extend this
 *    barrel instead of importing deep internals from views.
 *  - When/if you introduce a centralized persistence or analytics layer, adapt
 *    the implementation inside model/ without changing consumer imports.
 */

export {
  clearOnboardingFlag,
  ensureOnboardingSeen,
  hasSeenOnboarding,
  ONBOARDING_STORAGE_KEY,
  setOnboardingSeen,
} from "./model/onboardingState";

export { OnboardingModal } from "./ui/OnboardingModal";
