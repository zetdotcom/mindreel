# MindReel

[![Version](https://img.shields.io/badge/version-1.0.0-informational.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)
[![Platform](https://img.shields.io/badge/platform-macOS-only.svg)](#project-scope)
[![Status](https://img.shields.io/badge/status-MVP_in_development-orange.svg)](#project-status)

## Landing page: [https://zetdotcom.github.io/mindreel](https://zetdotcom.github.io/mindreel)

## Project Description
MindReel is a privacy‑first, intelligent macOS desktop application that helps software professionals effortlessly capture what they work on and automatically turn it into concise weekly summaries. Running unobtrusively in the background as a personal “professional memory,” it ensures no achievement is forgotten when preparing stand‑ups, sprint reviews, performance conversations, or interviews.

Key capabilities:
- Frictionless capture: periodic lightweight popups & a global shortcut ask “What are you working on?”
- Structured daily history: entries grouped per day; consecutive identical entries collapsed (`xN`) only when uninterrupted
- Automatic weekly AI summaries (authenticated + consenting users) every Sunday 23:00
- Local‑first by default: data stays on your machine unless you opt in to summaries
- Editable history; accidental entries removable (AI summaries are retained but editable)

Problems solved:
- Forgetting micro-tasks and context across busy days
- Time wasted reconstructing weekly status updates or retrospectives
- Difficulty articulating impact during evaluations or job interviews
- Lack of longitudinal, self-generated activity records

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Tech Stack
Implemented / Declared:
- Electron 38 (desktop runtime)
- Electron Forge (tooling & packaging)
- React 19
- TypeScript 5.9
- Vite ^5.x (upgrade to v7 planned; stack doc references Vite 7)
- Tailwind CSS 4 (CSS-first approach via `@import "tailwindcss";`)
- Biome 2 (formatting, linting, static analysis)
- Node.js 22 (enforced by `.nvmrc`)

Testing:
- Vitest (unit & component tests)
- React Testing Library (component interaction tests)
- Playwright (E2E tests for Electron)

Planned / Described (not yet present in dependencies):
- SQLite (local persistent storage layer)
- Supabase (email/password authentication backend & consent gating)
- OpenRouter AI API (weekly summary generation)
- react-router v7 (future multi-view navigation)

## Getting Started Locally

### Prerequisites
- macOS (MVP target platform)
- Node.js 22.x (install & activate with `nvm`)
- npm (bundled with Node)

### Clone & Install
```bash
git clone https://github.com/zetdotcom/mindreel.git
cd mindreel
nvm use
npm install
```

### Run in Development
```bash
npm start
```
Starts Electron (main process) and the Vite dev server for the renderer (hot reload).

### Quality & Type Safety
```bash
npm run typecheck      # TypeScript type validation (no emit)
npm run lint           # Biome lint & diagnostics
npm run lint:fix       # Apply Biome autofixes
npm run format         # Check formatting
npm run format:write   # Apply formatting changes
npm run validate       # typecheck + lint combo
```

### Packaging (Distributables)
Create signed/packaged artifacts (depends on platform & maker config):
```bash
npm run make
```
Raw package (no installer):
```bash
npm run package
```
Publish artifacts (requires publisher setup):
```bash
npm run publish
```

### Tailwind CSS v4 Notes
Tailwind v4 uses a CSS-first approach:
- Global import:
  ```css
  @import "tailwindcss";
  ```
- Design tokens via `@theme`
- Custom utilities via `@utility`
A minimal or absent `tailwind.config.js` is acceptable until extended customization is needed.



### Debugging Forge + Vite Startup
If startup stalls at “Building main process and preload bundles…”:
```bash
DEBUG=@electron-forge:plugin-vite*,vite:* npm run start
```

## Available Scripts
| Script | Purpose |
| ------ | ------- |
| `start` | Launch Electron + Vite in development |
| `package` | Create a raw packaged application bundle |
| `make` | Build distributable installers / archives via makers |
| `publish` | Publish artifacts (requires configuration) |
| `typecheck` | TypeScript compile check without emitting JS |
| `lint` | Run Biome lint & analysis |
| `lint:fix` | Apply Biome auto-fixes |
| `format` | Check formatting |
| `format:write` | Apply formatting changes |
| `validate` | Composite: `typecheck` + `lint` |

## Project Scope

### In Scope (MVP)
- macOS-only Electron desktop app (menu bar presence; background operation)
- Periodic popup prompt (“What are you working on?”):
  - Text input (Save enabled only if non-empty)
  - “Same” button repeating last entry
  - Quick list of recent unique entries
- Global configurable keyboard shortcut for entry capture
- Add entry from main window
- Daily history view:
  - One card per day (date + weekday)
  - Timestamped entries
  - Consecutive identical entries compressed with `xN` label (uninterrupted sequences only)
  - Edit / delete entries
- Weekly automatic AI summaries:
  - Generated Sunday 23:00
  - Covers Monday–Sunday
  - Card titled with date range + week number
  - Editable content (not deletable)
  - Limit: 5 summaries per user per calendar month
- Settings:
  - Popup frequency (30 min, 1h, 2h, 4h)
  - Global shortcut customization
- Privacy:
  - Local storage by default
  - External transmission only for summary generation with explicit user consent (during registration)

### Out of Scope (MVP)
- Windows / Linux support
- On-demand custom date-range summaries
- OAuth (Google/GitHub/etc.) logins
- Direct third‑party integrations (Jira, Git, Asana, Git repos)
- Continuous cloud sync / remote backup
- Deletion of AI summary cards
- Non-weekly AI analytics

## Project Status
MVP under active development.

Current Implementation:
- Core scaffold (Electron + React + TypeScript): Implemented
- Styling (Tailwind v4): Implemented
- Tooling (Biome, Forge, Vite): Operational
- Planned (not yet integrated): SQLite persistence, Supabase auth, OpenRouter AI pipeline, react-router navigation, weekly scheduler, settings UI, entry compression logic.

Success Metrics Targets (from Product Requirements):
- >40% authenticated users viewing weekly summary
- >60% activation (≥1 entry within first 24h)
- >3 average daily entries per active user
- Retention: 40% at week 1; 20% at week 4

Known Discrepancies:
- Tech stack doc cites Vite v7; current dependency is Vite 5.x (upgrade pending roadmap).
- SQLite, Supabase, OpenRouter, react-router absent from `package.json` (planned future integration).

Planned Next Steps:
1. Implement local SQLite schema + data access layer
2. Integrate Supabase (auth + consent handling)
3. Scheduler & AI summary pipeline (OpenRouter; monthly limit enforcement)
4. Settings UI (frequency + shortcut)
5. Entry compression & labeling logic
6. Metrics instrumentation (privacy-respecting)
7. Upgrade Vite & align stack doc once stable

## License
MIT License © 2025 michalzadarnowski

---

For detailed product requirements and user stories, see `.ai/prd.md`.
