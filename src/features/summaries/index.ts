/**
 * Public API (barrel) for the summaries feature.
 *
 * Purpose:
 *  - Provide a stable, curated surface for working with weekly summaries
 *    (loading, creating, displaying).
 *  - Hide internal implementation details (repository factories, internal helpers).
 *
 * Current Exports:
 *  - Hook: useCurrentWeekSummary (stateful summary lifecycle)
 *  - Repository: summariesRepository (low‑level CRUD + creation helpers)
 *  - UI: CurrentWeekSummarySection (self-contained section component)
 *  - Types: Summary (data shape), plus hook option/result types
 *
 * Evolution Path:
 *  - If AI-based generation is introduced, its mutation hook can be added here
 *    without breaking existing imports.
 *  - When a dedicated domain layer (e.g., entities/summary) is created, this
 *    barrel can re-export that domain surface transparently.
 *
 * Guidelines:
 *  - Only export what you intend other features/views to depend on.
 *  - Avoid exporting volatile internal utilities to preserve refactor freedom.
 */

export { useCurrentWeekSummary } from "./model/useCurrentWeekSummary";
export type {
  UseCurrentWeekSummaryOptions,
  UseCurrentWeekSummaryResult,
} from "./model/useCurrentWeekSummary";

export { summariesRepository } from "./model/repository";

export { CurrentWeekSummarySection } from "./ui/CurrentWeekSummarySection";

// Domain types (re-exported for convenience; consider moving to entities later)
export type { Summary } from "../../sqlite/types";

/**
 * NOTE:
 * Do NOT export experimental / internal helpers from this file. Keep the public
 * surface minimal and intentional.
 */
