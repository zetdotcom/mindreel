/**
 * Shared Barrel (src/shared/index.ts)
 *
 * Central export point for generic, cross-cutting utilities & primitives.
 * Keep this surface intentionally *small* to avoid turning it into a
 * "god import" that every module reaches for. Export only:
 *  - Truly generic utilities (no domain assumptions)
 *  - Pure UI primitives (if you want to re-export, optional)
 *  - Widely used helpers whose stability you commit to maintain
 *
 * DO NOT export:
 *  - Feature-specific helpers (keep inside features/*)
 *  - Anything that would cause circular dependencies (shared must remain bottom-layer)
 *  - Experimental or volatile APIs (import them directly by path until stable)
 *
 * Evolution guidelines:
 *  - Prefer explicit named exports (no `export * from`) for clarity & tree‑shaking.
 *  - When a helper grows domain semantics, migrate it out to a proper feature/entity.
 *  - If this file becomes large, consider creating sub‑barrels (e.g. `shared/ui/index.ts`)
 *    but keep this root minimal.
 */

// Generic utilities
export { cn } from "../lib/utils";
// UI primitives (only re-export those you actually want consumers to use)
// Note: shadcn components live under src/components/ui and are *not* re-exported here
// to keep an explicit boundary. If you decide to expose a design system barrel later,
// create `shared/ui/index.ts` and selectively re-export there.
export { ErrorDisplay } from "./ui/ErrorDisplay";

// (Future) Example pattern:
// export { ipcClient } from "./api/ipcClient";
// export { useDebounce } from "./hooks/useDebounce";

// Types re-exports (add cautiously)
// export type { Result } from "./types/result";
