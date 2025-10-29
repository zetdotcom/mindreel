/**
 * Public API (barrel) for the entries feature.
 *
 * This file exposes ONLY the stable, intended surface used by other parts
 * of the application (views, other features, widgets in the future).
 *
 * Principles:
 *  - Re-export hooks / components you want consumers to use.
 *  - Keep internal implementation details (temporary helpers, experimental hooks)
 *    un-exported to preserve refactor freedom.
 *  - If the surface grows large, consider namespaced exports instead of *.
 *
 * Migration Path:
 *  - If/when a dedicated `entities/entry` domain module is introduced, this barrel
 *    can continue to re-export new domain-level utilities without breaking imports.
 */

// Domain types (re-exported for convenience; prefer importing from a future entities module once it exists)
export type { Entry } from "../../sqlite/types";

// Repository (low-level data access abstraction)
export { entriesRepository } from "./model/repository";
// Hooks (stateful logic)
export { useEntries } from "./model/useEntries";
// UI components
export { EntryForm } from "./ui/EntryForm";
export { EntryList } from "./ui/EntryList";

/**
 * NOTE:
 * Do NOT export internal implementation utilities or error string constants here
 * unless they are part of the intended stable contract. This helps keep the
 * dependency graph clean and enables internal refactors without wide churn.
 */
