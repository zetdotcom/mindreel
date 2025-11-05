#!/usr/bin/env node
/**
 * MindReel Landing Page Tailwind Build Script
 *
 * Purpose:
 *  - Deterministically build a minimal CSS bundle for the marketing landing page.
 *  - Avoid reliance on the Tailwind CLI binary (currently unavailable / broken in environment).
 *  - Use Tailwind v4 "CSS-first" authoring style (single @import "tailwindcss").
 *
 * Features:
 *  - Reads ./landing-page/landing.css (minimal entry).
 *  - Processes with Tailwind + your tailwind.config.js content extraction (includes landing-page/*.html).
 *  - Optional --watch mode (incremental rebuild on HTML/CSS edits).
 *  - Optional --minify flag for crude size reduction (CLI-like --minify alternative).
 *  - Post-build validation for presence of critical custom utility classes.
 *  - Clear logging + exit codes for CI integration.
 *
 * Usage:
 *    node scripts/build-landing.mjs
 *    node scripts/build-landing.mjs --minify
 *    node scripts/build-landing.mjs --watch
 *
 * Output:
 *    ./landing-page/index.css
 *
 * Notes:
 *  - This uses PostCSS programmatic API instead of the (missing) tailwindcss CLI binary.
 *  - Autoprefixer is intentionally omitted (not in devDependencies); Tailwind core handles most modern cases.
 *  - If you later add `autoprefixer`, plug it into the `postcss([...])` pipeline.
 *  - For production deploy you may prefer a real minifier (cssnano) instead of the naive --minify transform.
 *
 * Future Enhancements:
 *  - Replace naive minify with cssnano when dependency is added.
 *  - Emit a build manifest (file size, hash) for caching / CDN headers.
 *  - Add an ADR documenting adoption of programmatic Tailwind build due to CLI binary absence.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postcss from "postcss";
import tailwindcssPostcss from "@tailwindcss/postcss";

// ----------------------------- Path Resolution --------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, ".."); // mindreel/
const landingDir = path.join(projectRoot, "landing-page");
const inputCssPath = path.join(landingDir, "landing.css");
const outputCssPath = path.join(landingDir, "index.css");
const htmlGlobNote =
  "tailwind.config.js content includes ./landing-page/*.html";

// ----------------------------- CLI Flags --------------------------------------
const argv = process.argv.slice(2);
const watchMode = argv.includes("--watch");
const minifyRequested = argv.includes("--minify");

// ----------------------------- Helpers ----------------------------------------
function log(msg) {
  process.stdout.write(`[landing-build] ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[landing-build:warn] ${msg}\n`);
}

function error(msg) {
  process.stderr.write(`[landing-build:error] ${msg}\n`);
}

function exitWithError(msg, code = 1) {
  error(msg);
  process.exit(code);
}

// Naive minifier (whitespace collapse + comment strip) - safe for this controlled CSS
function naiveMinify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove block comments
    .replace(/\n+/g, "\n") // collapse multiple newlines
    .replace(/\s{2,}/g, " ") // collapse multi spaces
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*:\s*/g, ":")
    .trim();
}

// Validate that key custom classes survived purge/minification
function validateCustomUtilities(css) {
  const requiredSelectors = [
    ".border-brutal",
    ".bg-card-gradient",
    ".bg-button-primary-gradient",
    ".bg-button-accent-gradient",
    ".bg-button-warm",
    ".shadow-brutal-lg",
    ".shadow-brutal-xl",
    ".rounded-app",
    ".text-cyber",
  ];
  const missing = requiredSelectors.filter((sel) => !css.includes(sel));
  if (missing.length) {
    warn(
      `Possible purge/processing issue: missing selectors -> ${missing.join(", ")}`,
    );
    return false;
  }
  return true;
}

// ----------------------------- Pre-flight -------------------------------------
if (!fs.existsSync(landingDir)) {
  exitWithError(`Landing directory not found: ${landingDir}`);
}
if (!fs.existsSync(inputCssPath)) {
  exitWithError(`Input CSS entry not found: ${inputCssPath}`);
}
// Dynamically import Tailwind config (ESM export default)
let tailwindConfig;
try {
  const configModule = await import(
    path.join(projectRoot, "tailwind.config.js")
  );
  tailwindConfig = configModule.default || configModule;
} catch (e) {
  exitWithError(`Failed to load tailwind.config.js: ${e.message}`);
}

log(
  `Loaded tailwind.config.js; content targets: ${JSON.stringify(tailwindConfig.content)} (${htmlGlobNote})`,
);
log(
  `Input: ${path.relative(projectRoot, inputCssPath)} -> Output: ${path.relative(projectRoot, outputCssPath)}`,
);

// ----------------------------- Build Function ---------------------------------
async function buildOnce() {
  const start = performance.now();
  let cssIn;
  try {
    cssIn = fs.readFileSync(inputCssPath, "utf8");
  } catch (e) {
    exitWithError(`Failed reading input CSS: ${e.message}`);
  }

  // PostCSS pipeline using @tailwindcss/postcss plugin
  let result;
  try {
    result = await postcss([
      tailwindcssPostcss({
        config: path.join(projectRoot, "tailwind.config.js"),
      }),
    ]).process(cssIn, {
      from: inputCssPath,
      to: outputCssPath,
    });
  } catch (e) {
    exitWithError(`Tailwind processing failed: ${e.message}\n${e.stack}`);
  }

  let cssOut = result.css;
  if (minifyRequested) {
    cssOut = naiveMinify(cssOut);
  }

  try {
    fs.writeFileSync(outputCssPath, cssOut, "utf8");
  } catch (e) {
    exitWithError(`Failed writing output CSS: ${e.message}`);
  }

  const ok = validateCustomUtilities(cssOut);
  const bytes = Buffer.byteLength(cssOut);
  const kb = (bytes / 1024).toFixed(2);
  const durationMs = (performance.now() - start).toFixed(1);

  log(
    `Build completed in ${durationMs}ms • size=${kb}KB • minify=${minifyRequested ? "yes" : "no"} • custom utilities ok=${ok}`,
  );
  if (result.warnings().length) {
    result.warnings().forEach((w) => warn(w.toString()));
  }
}

// ----------------------------- Watch Mode -------------------------------------
async function startWatch() {
  log("Entering watch mode...");
  const watchedPaths = [inputCssPath, path.join(landingDir, "index.html")];
  const debounceMs = 120;
  let timer = null;

  const trigger = (reason) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      log(`Change detected (${reason}); rebuilding...`);
      try {
        await buildOnce();
        log("Rebuild complete.");
      } catch (e) {
        error(`Rebuild error: ${e.message}`);
      }
    }, debounceMs);
  };

  watchedPaths.forEach((p) => {
    if (!fs.existsSync(p)) {
      warn(`Watch path missing (will skip): ${p}`);
      return;
    }
    fs.watch(p, { persistent: true }, (eventType) => {
      trigger(`${path.basename(p)}:${eventType}`);
    });
  });

  // Initial build
  await buildOnce();
  log("Watching for changes...");
}

// ----------------------------- Entrypoint -------------------------------------
(async () => {
  if (watchMode) {
    await startWatch();
  } else {
    await buildOnce();
  }
})().catch((e) => exitWithError(`Unhandled build script error: ${e.message}`));
