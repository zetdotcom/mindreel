# UI Architecture for MindReel

## 1. UI Structure Overview

MindReel is a macOS desktop (Electron + React) productivity assistant focused on fast capture of work activity and AI-assisted weekly summaries. The UI embraces a local‑first model (SQLite via IPC) with optional authenticated features (AI summaries via Supabase Edge Function). The core shell uses a persistent left sidebar (navigation) and a primary content pane (contextual views). Auxiliary transient interfaces (modals, pop-up capture window, confirmation dialogs) overlay or run in a separate always-on-top lightweight window (capture pop-up).

Structural layers:
- Application Shell: Sidebar + Content Pane
- Core Views: History (default), Settings, Profile, Auth (Sign In / Sign Up embedded surfaces)
- Transient Interfaces: Onboarding Modal, Capture Pop-Up (standalone window), Delete Confirmation Modal, Summary Retry / Error inline states
- Compositional Subviews: Week Group, Day Group, Entry List, Summary Card (multi-state)

Primary user value loop:
1. Capture entries (scheduled pop-up, shortcut, manual add)
2. Browse history (grouped weeks → days → entries)
3. View / edit weekly AI summary (if authenticated & within quota logic—quota hidden from user)
4. Adjust capture cadence & shortcut to maintain habit
5. Maintain account & privacy awareness in Profile

Guiding principles:
- Minimal friction (single key press / Enter to save; prefill buttons)
- Cognitive clarity (reverse chronological weeks, clear grouping)
- Progressive enhancement (AI summary gated; local mode fully useful)
- Accessibility-first (semantic grouping, keyboard flows, focus management)
- Privacy transparency (local-first messaging; explicit consent on signup only)

## 2. View List

### 2.1 Onboarding Modal - DONE
- View name: Onboarding Modal
- View path: (transient) launched only on first run; no direct route (logic gate before showing History)
- Main purpose: Introduce concept (periodic reminders + weekly summaries) and prime immediate first capture
- Key information to display:
  - Short 2–3 sentence value proposition
  - Explanation of periodic capture pop-ups
  - Mention of optional AI weekly summaries (requires account & consent)
  - Primary action: “Got it” leading to immediate capture pop-up
- Key view components:
  - Heading text block
  - Illustration / icon (optional future)
  - Primary button (Continue) - no other button on this modal
- UX / Accessibility / Security considerations:
  - Focus trapped;  Continue triggers first capture pop-up
  - Initial focus on heading then move to primary button for screen reader
  - No PII; no external calls
  - Not shown again (flag persisted locally in localStorage)

### 2.2 Capture Pop-Up (Scheduled / Manual / Shortcut) - DONE
- View path: system overlay window (not navigable route)
- Main purpose: Ultra-fast entry capture
- Key information to display:
  - Multiline textarea (active draft)
  - Last 4 entries quick prefill button (full-width)
  - Character counter (0–500)
  - Timestamp indicator (implicit; not editable)
- Key view components:
  - Textarea (autofocus)
  - Prefill buttons (Last + Recent)
  - Save button (disabled if empty)
  - “Discard” (if non-empty & user wants to clear draft)
  - Close / ESC handling
- UX / Accessibility / Security:
  - General keyboard navigations
    - when save button is focused Enter will save
    - focus on prefill buttons and Enter or Space will prefill and focus input
    - focus on close button and Enter or Space will close pop-up
  - Announce character limit to screen readers (aria-describedby)
  - Data stored only locally; no remote transmission here
  - Global shortcut must raise this window even if app not focused
  - window will also must be raised on interval pop-ups as per settings, even if app not focused

### 2.3 History View (Default)
- View path: `/` (root)
- Main purpose: Core dashboard of captured work; weekly summaries integrated
- Key information to display:
  - Reverse chronological week groups (Newest week at top)
  - Each week: header “Week NN – start_date – end_date”
  - Day subgroups Monday → Sunday (only days with entries)
  - Entries in time order; consecutive duplicates collapsed with ×N badge
  - Weekly Summary Card (if exists) anchored at bottom of that week group
  - Buttons: “Load previous 2 weeks” at list end (pagination)
  - Add Entry button (opens Capture Pop-Up)
- Key view components:
  - WeekGroup (collapsible)
  - DayGroup
  - EntryRow (inline edit / delete icons)
  - DuplicateGroup (expand to reveal instances)
  - SummaryCard (multi-state: Pending / Generating / Success / Failed / Gated)
  - PaginationControl - this will be 'load 2 more weeks' button
  - Floating / inline AddEntryButton
- UX / Accessibility / Security:
  - Semantic structure: week headers as h2, day headers as h3, entries list items
  - Collapse chevrons keyboard-operable (Space/Enter)
  - Inline edit: converts content to editable field; Enter to save, ESC to cancel
  - Delete requires confirmation modal (prevents accidental data loss)
  - Summary editing restricted (cannot delete summary)
  - Unauthorized summary state shows call-to-action to sign in (no quota display)
  - Only authorized summary generation triggers remote call; data limited to that week

### 2.4 Summary Card (Sub-view but stateful)
- View path: Embedded within History under its week
- Main purpose: Present AI-generated weekly summary lifecycle
- Key information:
  - Title: date range + “Week NN”
  - Content states:
    - Gated (not logged in): explanation + Sign In / Register CTA
    - Pending (no summary yet): simple “Summary will appear here automatically after week end”
    - Generating: spinner / “Generating…”
    - Success: bullet list (editable)
    - Failed: error message + Retry button (cooldown)
- Key view components:
  - State container
  - EditableContent area with Save button
  - Retry / CTA buttons
- UX / Accessibility / Security:
  - Editing uses textarea or content-editable with Save/Cancel (manual save only)
  - Retry disabled during cooldown; announces status
  - Sanitization of displayed AI content (escape HTML)
  - No raw errors from backend (generic messaging)

### 2.5 Settings View
- View path: `/settings`
- Main purpose: Configure capture cadence and shortcut & summary language
- Key information:
  - Popup interval selection (radio or segmented: 30m / 1h / 2h / 4h)
  - Global shortcut display + change flow
  - Summary language (radio buttons: English / Polish)
  - Persisted confirmation
- Key view components:
  - IntervalSelector
  - ShortcutConfigurator (capture keystroke modal)
  - LanguageSelector
  - Save / auto-save status message
- UX / Accessibility / Security:
  - Immediate feedback when interval changes
  - Shortcut conflict minimal (MVP: just accept input)
  - Keyboard accessible selectors
  - No external data exposure (purely local except language influences remote request param)

### 2.6 Profile View
- View path: `/profile`
- Main purpose: Account management & privacy info
- Key information:
  - When user not logged in/ registered it should display login/register form
  - User email (read-only)
  - Actions: Change password, Log out, Delete account
  - Privacy notice (local storage; weekly ephemeral upload for summary)
- Key view components:
  - EmailDisplay
  - ActionButtons
  - PasswordChangeFlow (modal or inline)
  - DeleteAccountConfirmation (modal)
  - PrivacyNotice block
- UX / Accessibility / Security:
  - Destructive actions styled distinctly
  - Delete account requires multi-step confirmation
  - No quota metrics shown
  - Logout clears secure token store

### 2.7 Authentication Surfaces (Sign Up / Sign In)
- View path: `/auth/login`, `/auth/register` (or modal overlays triggered from gated states)
- Main purpose: Provide credentials to access AI features
- Key information:
  - Email, password fields
  - Terms & AI processing consent checkbox (registration only; required)
  - Basic validation feedback
  - **MVP: Email confirmation disabled** - users are immediately verified upon registration
- Key view components:
  - AuthForm (shared)
  - ConsentNotice (register only)
  - Submit / SwitchMode link
- UX / Accessibility / Security:
  - Password length validation; screen reader hints
  - Errors generic ("Invalid credentials")
  - Token never stored in localStorage (handled through secure channel)
  - After success: redirect to History and attempt summary catch-up if applicable
  - No email verification step required in MVP

### 2.8 Delete Confirmation Modal
- View path: transient
- Main purpose: Prevent accidental permanent entry deletion
- Key information:
  - Entry snippet
  - Irreversibility message
- Key view components:
  - Message text
  - Confirm (destructive) & Cancel buttons
- UX / Accessibility / Security:
  - Focus trap
  - ESC / Cancel returns focus to triggering element
  - No partial undo; must be explicit

### 2.9 Shortcut Capture Modal (Settings Sub-flow)
- View path: transient
- Purpose: Capture new global shortcut
- Key information:
  - Instructions: “Press desired key combination…”
  - Display captured keys live
- Components:
  - Capture area
  - Confirm / Cancel
- Considerations:
  - Prevent propagation to app while capturing
  - Validate presence of at least one modifier (optional but advisable; MVP may allow any)

### 2.10 Error Boundary / Generic Fallback
- View path: internal wrapper for catastrophic renderer errors
- Purpose: Provide recovery (reload) without data loss
- Key information:
  - Generic message
  - “Reload App” button
- Components:
  - Error message
  - Reload action
- Considerations:
  - Do not leak stack traces to user

## 3. User Journey Map

### Primary Journey: First-Time User to Weekly Summary

1. Launch App (First Run)
   - Onboarding Modal appears (US-001)
   - User clicks Continue
2. Immediate Capture Pop-Up opens
   - User types first activity (US-004) → clicks Save OR presses TAB to focus 'save' button, then presses Enter → saved
3. History View loads with first entry visible
   - Encourages continued passive use; periodic pop-up cadence starts
4. User continues working; scheduled pop-ups appear (US-004, US-005, US-006)
   - Repeated tasks quickly re-entered via “Last entry” button
5. User explores Settings to adjust interval / shortcut (US-012, US-006)
6. User registers to unlock AI summary (US-002) or logs in later (US-003)
   - Gated summary placeholder provides CTA
7. Sunday 23:00 (or next launch) auto-generates weekly summary (US-010)
   - History displays generating → success state
8. User edits AI summary to refine wording (US-010 edit extension)
9. Subsequent week repeats; if limit reached, placeholder informs limit cycle (US-011)

### Secondary Flows

- Edit Entry (US-008): Inline edit within History → Enter saves; ESC cancels
- Delete Entry (US-009): Trash icon → Confirmation Modal → Remove row and update duplicate group if needed
- Retry Failed Summary: Failed state card → Retry (cooldown) → Generating → Success / Failed again
- Catch-Up Generation: App missed schedule → On launch detection triggers generation → Generating banner → Summary appears
- Account Deletion: Profile → Delete → Confirmation → Auth state cleared → Summary gating reappears

### Interaction Principles

- Minimal click depth (most activities from History)
- Keyboard-first: Enter & ESC semantics consistent across modals
- Progressive disclosure: advanced account tasks in Profile, not cluttering main loop
- Status clarity: Each summary state visibly distinct; no ambiguous transitions

## 4. Layout and Navigation Structure

### Global Layout

Sidebar (left, fixed width) | Content Pane (scrollable vertical)
- Sidebar sections:
  1. Logo / App name (top)
  2. Primary Nav:
     - History (/)
     - Settings (/settings)
     - Profile (/profile)
  3. Authentication CTA (if logged out: “Sign In”)
  4. Version / minimal status (footer)
- Content Pane:
  - Route outlet rendering active view
  - Context-specific banners (e.g., catch-up, error)
  - Modals rendered at root level (portal)
  - Capture Pop-Up separate window (not inside layout)

### Navigation Patterns

- Direct route change via sidebar buttons
- Authentication triggers redirect back to origin (preserve context)
- Modals push focus but do not alter route (except Auth if implemented as full-page)
- “Load previous 2 weeks” loads additional week groups in-place (no navigation)
- Summary CTA (Sign In) navigates to login (with return parameter)

### State-Based Conditional UI

- Authenticated:
  - Summary Card transitions beyond gated state
  - Profile fully enabled
- Unauthenticated:
  - Summary Card shows sign-in prompt
  - Profile shows minimal instructions or encourages registration
- No entries:
  - History view shows empty onboarding hint + prominent Add Entry

### Accessibility Navigation

- Skip-to-content hidden link jumps over sidebar to first week header
- Tab order: Sidebar → Content header → Week groups
- ARIA roles: nav (sidebar), main (content), dialog (modals), alert (banners), list/listitem (entries)

## 5. Key Components

1. AppShell
   - Composes Sidebar + Content area; manages modal portals
2. SidebarNavigation
   - Nav links with active state; auth CTA; keyboard focus ring
3. OnboardingModal
   - First-launch gate; calls callback to open capture window
4. CapturePopupWindow
   - Dedicated always-on-top window with focus-first textarea, prefill buttons, save/discard logic
5. PrefillEntryButton / PrefillEntryChip
   - Prefills textarea (does not auto-save); announces action to screen reader
6. WeekGroup
   - Collapsible section; header shows week number + date range; houses DayGroups & SummaryCard
7. DayGroup
   - Labeled list of entries for a date; groups consecutive duplicates
8. EntryRow
   - Displays content, timestamp, edit & delete affordances; inline editing state
9. DuplicateGroup
   - Aggregated consecutive duplicates; badge ×N; expand to show individual EntryRows
10. SummaryCard
    - State machine rendering: Gated / Pending / Generating / Success / Failed / LimitReached
    - Editable content area with Save button in Success state
11. PaginationControl
    - “Load previous 2 weeks” button; loading spinner state
12. AddEntryButton
    - Opens Capture Pop-Up; accessible label “Add new entry”
13. SettingsPanel
    - Organizes controls: IntervalSelector, ShortcutConfigurator, LanguageSelector
14. IntervalSelector
    - Radio/segmented; updates interval instantly
15. ShortcutConfigurator
    - Opens ShortcutCaptureModal; displays current shortcut
16. ShortcutCaptureModal
    - Listens to key events; displays captured combination; confirm/cancel
17. LanguageSelector
    - Radio buttons or segmented control (English / Polish)
18. ProfilePanel
    - Email display, password reset action, delete account action, privacy text
19. AuthForm
    - Shared login/register layout; includes consent checkbox for registration
20. DeleteConfirmationModal
    - Generic destructive confirmation for entry or account deletion
21. Banner / AlertBar
    - Inline contextual messages (catch-up generation triggered; generic error)
22. LoadingSpinner / SkeletonBlocks
    - Provide feedback during async operations (history extension, summary generation)
23. ErrorBoundary
    - Catches render errors; offers reload
24. CharacterCounter
    - Attached to textarea in Capture & Summary edit to reflect 500-char policy (summary may exceed?—entry-only; if summary edit allowed longer, adjust logic)
25. RetryButton (Summary)
    - Enforces cooldown; disabled state with countdown (optional future enhancement)
26. SecureTokenProvider (Context provider - UI harness)
    - Supplies auth token to components (abstracted logic; not visible UI but architectural component)
27. FocusTrapWrapper
    - Utility wrapper for modals to ensure accessibility compliance

---

Requirement (User Story) Mapping (Concise):
- US-001 → OnboardingModal + immediate CapturePopupWindow open
- US-002/003 → AuthForm + gated SummaryCard CTA
- US-004/005/006/006a → CapturePopupWindow + Prefill buttons + AddEntryButton + global shortcut integration
- US-007 → HistoryView (WeekGroup, DayGroup, EntryRow, pagination)
- US-008 → EntryRow inline edit
- US-009 → DeleteConfirmationModal invoked from EntryRow
- US-010 → SummaryCard lifecycle states
- US-011 → SummaryCard LimitReached state
- US-012 → SettingsPanel IntervalSelector

Key Edge Cases & UI Handling (integrated in components):
- Consecutive duplicates merging / splitting on edit or deletion (EntryRow & DuplicateGroup re-evaluation)
- Missed summary schedule triggers catch-up (Banner + SummaryCard transition)
- Failed summary retry cooldown (RetryButton disabled state)
- Offline / network error during generation (Failed state; user can retry)
- Auth token expiration mid-generation (Failed with generic error; gated if fully logged out)
- Shortcut conflict (MVP: accepted; future enhancement note)
- Empty week (no entries) - add no entries label but still show week group to preserve continuity. No summary for weeks with no entries

Accessibility & Security Summary (Cross-Cutting):
- Semantic headings and list roles for chronological data
- All interactive elements reachable and operable via keyboard
- Focus management for all modals and pop-up
- Sanitized rendering of AI-generated summary (escape HTML)
- No sensitive debug info exposed to user on errors
- Authentication gating ensures only authorized summary calls; no quota leakage

This architecture ensures each functional requirement and user story is explicitly anchored to concrete UI elements, supports a frictionless capture loop, scales to additional future views (e.g., search, analytics), and maintains strong accessibility and privacy foundations.
