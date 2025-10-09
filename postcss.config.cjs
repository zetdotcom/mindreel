/**
 * PostCSS configuration (Tailwind CSS v4 style)
 *
 * Tailwind v4 consolidates the processing pipeline:
 * - You no longer add `autoprefixer` manually (it is bundled).
 * - You typically do NOT need a tailwind.config.js for simple setups.
 * - A single `@import "tailwindcss";` in your CSS pulls in base/components/utilities.
 *
 * If you later need to customize (themes, plugins, content sources), you can:
 *   1. Add a `tailwind.config.(js|cjs|mjs|ts)` with your overrides.
 *   2. Or define design tokens directly in CSS with `@theme { ... }`.
 *
 * This file is intentionally minimal—just the Tailwind v4 PostCSS plugin.
 */
module.exports = {
  plugins: {
    // Tailwind v4 PostCSS plugin (replaces explicit tailwindcss + autoprefixer entries)
    "@tailwindcss/postcss": {},
  },
};

/*
 * Troubleshooting:
 * - If classes are not generated, ensure your CSS includes:  @import "tailwindcss";
 * - If using Electron + Vite, no extra integration is required; Vite auto-detects this config.
 * - Remove this file entirely only if you migrate to a different CSS pipeline.
 */
