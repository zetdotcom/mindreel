<conversation_summary>
<decisions>

1. First launch flow: Show onboarding modal (explains reminders + weekly summaries); on close immediately open capture pop-up to prompt first entry.
2. Subsequent launches default to History view (weekly grouping) with Add Entry button visible.
3. Week & day ordering: Newest week at top (reverse chronological); within each week days ordered Monday → Sunday; weekly summary card placed last in the week group.
4. Navigation: Left sidebar with three sections (History default, Settings, Profile); right pane shows selected content.
5. Unauthenticated mode: Full local capture & history allowed; AI summaries gated; sign-in CTA only in summary placeholder (no quota UI).
6. Capture pop-up: Autofocused multiline textarea; full-width last-entry button that PREFILLS (does not auto-save); 3–4 previous entry buttons also prefill; explicit Save button; Escape dismiss; Enter saves; draft persists until saved or explicitly discarded (no timeout).
7. History loading & pagination: Initial view shows current and recent weeks; “Load previous 2 weeks” batch fetch pattern (week-based pagination).
8. Duplicate handling: Consecutive duplicates folded with ×N badge; expandable to reveal individual instances; expand/collapse state not persisted across re-renders or restarts.
9. Weekly summary states: Pending placeholder (with sign-in/register CTA if logged out), Generating (simple card with centered “Generating…”), Success (editable bullet list with manual Save button), Failed (retry button).
10. Summary generation catch-up: If app not running at scheduled time (Sunday 23:00), summary generation is triggered on next launch.
11. Summary editing: Manual Save only (no debounce auto-save).
12. Failed summary handling: Retry button (1 minute cooldown).
13. State management: Lightweight React Context + custom hooks (entries, summaries, auth, settings); no Redux or Zustand.
14. Accessibility & keyboard: Full keyboard navigation; Enter saves entry & summary edits; Escape closes pop-up or cancels edit; focus management for modals.
15. Authentication & security: Supabase auth; token stored in secure store; OpenRouter key server-side; consent only at signup (no ongoing consent UI).
16. Entry constraints: Hard 500 character limit with live counter (no pre-warning threshold).
17. Draft persistence: Single unsaved draft retained until saved or discarded.
18. Week group collapsibility: All open by default; collapse chevron on each group to let user collapse week group if they want to; state not persisted.
19. Search / filtering: None in MVP (hashtags displayed as plain text only).
20. Shortcut configuration: User-configurable; no validation or conflict warnings in MVP.
21. Entry deletion: Confirmation modal required before deletion; no undo toast.
22. Profile view: Shows email, password reset, account deletion controls, brief privacy notice (local storage + limited LLM submission); no quota or consent status display.
23. Summary language: Configurable setting applies only to generated summary language parameter; UI language not localized in MVP.
24. Week header labeling: Use “Week NN - week-start - week-end (DD mmm YYYY” format.
25. Generating progress visualization: Minimal (single “Generating…” label—no multi-step indicators).
26. Quota visibility: Completely removed from UI (no counters, badges, or progress bars).
27. Error messaging: Simple generic user-facing messages (no detailed taxonomy for MVP).
28. Theme: Single fixed theme (no theme toggle in MVP).
    </decisions>
    <matched_recommendations>
29. Local-only mode with upsell adopted (original recommendation accepted, later narrowed by removing quota display).
30. Sidebar navigation pattern adopted (from earlier recommendation for left rail).
31. Pop-up enhanced with quick prefill buttons (modified from instant-save recommendation; divergence noted).
32. Weekly summary card with distinct states adopted (progress detail recommendation simplified to minimal “Generating…”).
33. Lightweight Context + hooks state management fully adopted (recommended approach).
34. Duplicate folding strategy adopted (matches recommendation to aggregate consecutive duplicates).

35. Hard entry length limit adopted (aligns with token management recommendation).
36. Draft persistence approach (diverges from time-limited suggestion—now indefinite until save/discard).
    </matched_recommendations>
    <ui_architecture_planning_summary>
    A. Main UI Architecture

- Electron + React (TypeScript) + Tailwind v4 + shadcn, local-first with SQLite via IPC.
- View composition: Left sidebar (History, Settings, Profile) + main content pane.
- History is the core hub combining daily entries and weekly summaries inside week groups.

B. Key Screens & Flows

1. First Launch: Onboarding modal → immediate capture pop-up → save entry → History view.
2. Capture Flow: Scheduled or user-triggered pop-up (global shortcut or Add Entry); user may prefill from last/previous entries; Enter saves; Escape dismisses; draft persists.
3. History Browsing: Week groups (reverse chronological) with Mon→Sun daily grouping; “Load previous 2 weeks” fetch pattern; duplicates collapsed.
   Initial load will load latest 10 weeks, after this, there will be a button to 'load 2 more weeks'
4. Summary Lifecycle: Pending placeholder (with auth CTA if logged out) → scheduled or catch-up generation → Generating card (minimal) → Success (editable, manual Save) → Failed (Retry button).
5. Entry Editing & Deletion: Inline edit for entries; deletion of entries via confirmation modal. Weekly summary cards cannot be deleted. Duplicate group expansion allows per-instance actions on entries.
6. Settings: Popup interval, global shortcut configuration, summary language selection, possibly other basic preferences (theme excluded).
7. Profile: Email, password reset, account deletion, privacy notice.
8. Catch-Up Generation: On launch, detect missed schedule and trigger summary generation for prior week.

C. Data & State Management

- Core IPC methods for entries, summaries, settings; potential extension for batch week fetch.
- React Context + custom hooks manage normalized entries, summary state machine, auth session, and settings.
- Manual persistence boundaries: entries & summaries in SQLite; ephemeral draft in memory.
- No quota state or consent UI; only login gating for summaries.
- Summary generation logic triggers remote Edge function; minimal local progress representation.

D. Component/Module Breakdown

- SidebarNavigation, WeekGroup, DayGroup, EntryRow, DuplicateGroup, SummaryCard (state-aware), CapturePopup (this must be a separate window from the main one. It has to open even when the app is minimised), OnboardingModal, DeleteConfirmationModal, SettingsPanel, ProfilePanel.
- Utility Hooks: useEntries, useSummary (state machine with states: pending, generating, success, failed), useAuth (secure token management), useSettings, useWeekPagination.

E. Interaction & UX Patterns

- Reverse chronological stacking improves quick access to current week.
- Prefill buttons vs. auto-save encourage micro-adjustments to repeated tasks.
- Manual Save for summaries emphasizes deliberate edits (avoiding confusion over auto persistence).
- Confirmation deletion over undo simplifies implementation and reduces need for ephemeral recovery logic.

F. Accessibility & Keyboard

- Focus is trapped in modals (onboarding, delete confirm, capture pop-up - remember this will be a separate window).
- Enter saves entries/summary; Escape cancels or closes.
- Semantic structure: Week headers (h2), day subheaders (h3), entries as list items.
- Sufficient color contrast (single theme) with visible focus outlines. use futuristic neubrutalism colors and style

G. Security & Privacy

- Auth via Supabase; secure store for tokens (not plain localStorage).
- OpenRouter key confined to Edge function (no exposure in renderer).
- Consent implied at signup; no dynamic consent toggles.
- Local storage (sqlite database) of entries and summaries; only weekly subset sent for generation.

H. Performance

- Week-based pagination reduces initial payload.
- Duplicate folding reduces DOM nodes.
- No virtualization initially—deferred until performance thresholds exceeded.
- Minimal state recalculation due to normalized storage and discrete hooks.

I. Internationalization / Language

- UI language static; summary language configurable (passed as parameter to generation function).
- No broader i18n; translation infrastructure deferred.

J. Error Handling

- Simple generic messages (e.g., “Failed to generate summary. Try again.”).
- Retry path for failed summaries; no exponential backoff in UI.
- Entry CRUD errors surfaced minimally (toast or inline, pattern to be standardized later).

K. Divergences & Rationale

- Removed quota visibility reduces complexity and cognitive load for MVP.
- Simplified generating state (single label) accelerates delivery.
- Manual save controls user trust over AI summary edits.
- Confirmation deletion over undo simplifies implementation and reduces need for ephemeral recovery logic.

</ui_architecture_planning_summary>
<unresolved_issues>
None at this time.
</unresolved_issues>
</conversation_summary>>
