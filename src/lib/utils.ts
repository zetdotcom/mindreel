import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn (class name merge)
 *
 * Unified helper for composing Tailwind / conditional class strings.
 *
 * Why this exists:
 *  - clsx: handles conditional & variadic class value normalization.
 *  - tailwind-merge: resolves Tailwind config conflicts (e.g. "p-2 p-4" => "p-4").
 *
 * Usage:
 *   <div className={cn("p-2", conditional && "bg-red-500", props.className)} />
 *
 * Important:
 *  - Keep this utility *tiny*; do not add unrelated helpers here.
 *  - If you need variant generation (e.g. recipe/variants), build that
 *    separately to avoid bloating this foundational helper.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Optional: type guard example (can be useful if extending this file later)
// function isString(x: unknown): x is string {
//   return typeof x === "string";
// }

/* Future extension ideas (only if justified):
 *  - `withPrefix(prefix, ...classes)` for namespace conventions
 *  - Logging unexpected non-string class fragments in dev mode
 *
 * Before adding features here, challenge necessity—this file should remain minimal.
 */

// Re-exporting types for consumers that build higher-level helpers.
export type { ClassValue };
