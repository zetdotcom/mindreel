# Onboarding Modal (First-Time Experience) – Implementation Plan

## 1. Summary / Intent
Implement a first-run onboarding modal (transient, no route) that:
- Educates the user in 2–3 short sentences about core value: periodic capture + weekly AI summaries (optional).
- Immediately triggers the first capture pop-up after dismissal to nudge activation (US-001).
- Never shows again once acknowledged (persist a local flag in `localStorage`).
- Uses shadcn (Radix-based) UI components placed in the prescribed folder structure.

## 2. Scope
In-scope:
- Modal UI with heading, description, optional illustration placeholder, single primary button.
- Gating logic before showing the main "History"/Dashboard content (current `App` content).
- Accessibility: focus trap, predictable reading order, ESC close support disabled (only explicit Continue) unless required for a11y; ensure screen reader flow.
- Local persistence of “has seen onboarding” flag.

Out-of-scope (future enhancements only noted):
- Illustration/animation asset.
- Multi-step onboarding.
- Account/consent flow.
- Remote analytics instrumentation.

## 3. User Story Mapping (US-001)
Acceptance Criteria coverage:
1. Modal appears on first app run → Show when localStorage key missing.
2. Contains info about periodic pop-ups and adding entries → Copy block includes both.
3. After closing (Continue) first capture pop-up appears → Click handler sets flag then triggers capture flow.

## 4. UX Copy (Draft – keep concise)
Title: "Capture your work as you go"
Body (3 sentences max):
1. MindReel helps you remember what you worked on by prompting you at gentle intervals.
2. Just jot a quick note when a capture pop-up appears—your daily stream builds automatically.
3. If you later create an account and consent, you’ll also get weekly AI summaries of your achievements.

Primary button text: "Got it – Start"
(If width concerns: fallback "Got it")

Aria labels:
- Dialog label: same as heading.
- Button aria-label: "Acknowledge introduction and open first capture form"

## 5. Local Storage Contract
Key: `mindreel:onboardingShown`
Type: string value "true" (presence check is enough; avoids JSON parsing).
Write at the *moment user confirms* (not earlier, to allow QA re-trigger by clearing).

Helper (optional small util):
- hasSeenOnboarding(): boolean
- setOnboardingSeen(): void

## 6. Component Architecture & File Layout
Create:
- `src/components/ui/dialog.tsx` (shadcn/Radix Dialog abstraction if not already present—standard shadcn pattern)
- `src/components/composites/OnboardingModal.tsx` (composite specific to onboarding)
  - Accept props:
    - `open: boolean`
    - `onConfirm: () => void`
  - Renders controlled Dialog.
- Optional central context or callback prop to trigger capture popup (placeholder until capture popup exists).

Update:
- `src/ui/App.tsx`
  - On mount: evaluate `hasSeenOnboarding`. If false → state `showOnboarding = true`.
  - Render `<OnboardingModal open={showOnboarding} onConfirm={handleOnboardingConfirm} />`.
  - In `handleOnboardingConfirm`:
    1. Persist flag.
    2. Hide modal.
    3. Invoke `triggerFirstCapture()` (stub now).
    4. Consider microtask delay to ensure dialog unmount before opening capture UI (avoid nested focus traps).

## 7. Dialog (shadcn) Implementation Notes
Radix structure pattern:
Dialog.Root (controlled)
- Dialog.Portal
  - Dialog.Overlay (semi-transparent)
  - Dialog.Content (panel)
    - (Heading)
    - (Body copy)
    - (Primary Button)
Focus:
- Auto-focus heading first (use `tabIndex={-1}` + `ref` + `useEffect` focus on mount).
- After a short delay (setTimeout 300ms) programmatically move focus to button for SR reading continuity OR rely on natural tab order and add `aria-describedby` so description is announced after heading.
Decision: Simpler approach – let dialog root label with heading; do NOT manually shift focus to button (avoid unexpected jump). Provide accessible reading order: heading then body then button.

Prevent closing via:
- Disable `onEscapeKeyDown` and `onPointerDownOutside` (or intercept) so user must click Continue (minimizes accidental dismissal).

## 8. Visual / Layout Guidelines
Sizing: Max width ~460px, centered.
Spacing: Vertical stack with 24px (6 tailwind units) between main sections.
Styling (Tailwind):
- Content container: `rounded-xl border bg-background/95 backdrop-blur p-6 shadow-lg ring-1 ring-border`
- Heading: `text-xl font-semibold tracking-tight`
- Body: `text-sm text-muted-foreground space-y-3 leading-relaxed`
- Button: reuse `Button` component (`variant=default`, `size=lg`, className `w-full mt-4`).
- Optional illustration placeholder (future): Add a top slot (currently not rendered; wrap conditional `div` with fixed height 96px placeholder—comment only).

Animation (optional):
- Fade & scale in: `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`
- Fade out similar for closing.

Overlay:
- Tailwind: `bg-black/70 backdrop-blur-sm animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0`

## 9. State & Flow (Sequence)
1. App mounts → check localStorage.
2. If unseen: `showOnboarding=true`.
3. User reads & clicks Continue.
4. Handler sets localStorage flag.
5. Modal closes.
6. After close transition (e.g., `setTimeout(..., 120)`), call `triggerFirstCapture()`.
7. Capture popup appears (or stub logs until implemented).
8. On next app launches → onboarding not shown.

## 10. Accessibility Details
- `role="dialog"` with `aria-modal="true"` (Radix handles).
- Label via heading: supply `aria-labelledby`.
- Description via body container id + `aria-describedby`.
- Ensure color contrast of text vs background matches WCAG AA (shadcn defaults typically OK).
- Trap focus: rely on Radix.
- Keyboard:
  - Tab cycles within modal.
  - Enter on button triggers confirm.
  - ESC blocked (documented) OR if allowed: treat as “Got it” for keyboard-first user; finalize after design decision (config flag constant `ALLOW_ESC_CONFIRM = false`).
- Announce immediate capture opening? When capture popup appears, ensure it has its own accessible label so context shift clear.

## 11. Security / Privacy
- Local only; no network calls.
- No PII collected.
- Avoid logging full body copy each open (just a single debug flag if necessary).

## 12. Error / Edge Cases
- localStorage unavailable (rare in Electron, but defensive):
  - Wrap in try/catch; if read/write fails, still show modal each time (graceful degradation).
- Multiple windows (future): gating per window might show modal again; accept for MVP or centralize in main process later.
- Race with future capture popup initialization: guard by checking function presence before calling; if absent, console.warn.

## 13. Testing Checklist
Functional:
- First run: modal appears.
- Dismiss: modal disappears, localStorage key written, capture trigger executed.
- Reload app: modal does not appear.
- Manually delete localStorage key → appears again.
Accessibility:
- Tab order cycles correctly.
- Screen reader announces heading + body + button.
- Focus initial inside modal.
- Button reachable via keyboard and activates.
Resilience:
- Simulate localStorage exception (monkey patch) → modal still functions (no crash).
Visual:
- Dark mode (existing theme) readability.
- Overlay covers background interactions (cannot click underlying).
Analytics (N/A now, future placeholder).
Regression:
- Existing App functionality unaffected when flag true.

## 14. Pseudo-Implementation (Described, Not Code Blocks)
Dialog component wrapper:
- Export primitives: OnboardingModal uses them.
OnboardingModal:
- Props (open, onConfirm)
- Renders Dialog.Root open={open} onOpenChange (ignore external attempts to close).
- Inside content: heading, body paragraphs, button onClick → onConfirm()
App integration:
- const [showOnboarding, setShowOnboarding] = useState(false)
- useEffect(() => if (!hasSeenOnboarding()) setShowOnboarding(true), [])
- handleOnboardingConfirm:
  - setOnboardingSeen()
  - setShowOnboarding(false)
  - setTimeout(triggerFirstCapture, 120)
triggerFirstCapture placeholder:
- If window.appApi?.capture?.openCapturePopup exists call it else console.log

## 15. Performance Considerations
- Modal mounts once; trivial footprint.
- No heavy assets; no async needed.
- Keep component lean to avoid delaying initial data fetch already happening in App.

## 16. Future Enhancements (Document, Do Not Implement Now)
- Add small illustration reinforcing “Capture → Summarize”.
- Add a second step asking to configure interval or enable weekly summaries (if authenticated).
- Add a pulse highlight on the first capture popup input after it opens.
- Add telemetry: time spent on modal, confirm rate, dropout.

## 17. Definition of Done
- All acceptance criteria from US-001 satisfied.
- Plan’s testing checklist passes.
- Lint & typecheck pass.
- No a11y violations in manual axe run (if tooling present later).
- Code reviewed & merged.

## 18. Implementation Steps (Ordered)
1. Add dialog UI abstraction (dialog.tsx) using shadcn pattern.
2. Create OnboardingModal in composites folder.
3. Add localStorage helper functions inside either new `src/lib/onboarding.ts` or inline in App (prefer helper for clarity).
4. Integrate modal into App.tsx with gating logic.
5. Add triggerFirstCapture stub (comment referencing future capture popup ticket).
6. Manual test full flow.
7. Document localStorage key in README or internal wiki (.ai/ui-plan update if desired).
8. Ship.

## 19. Risks & Mitigations
- Risk: Capture popup not yet built → user loses activation moment.
  Mitigation: Log + visually prompt user with inline toast (optional later).
- Risk: Accidentally allowing outside click to close without setting flag.
  Mitigation: Explicitly prevent outside pointer dismissal.
- Risk: Duplicate modals if multiple initial renders.
  Mitigation: Keep state in top-level App only; ensure single mount.

## 20. Open Questions (Answer Before Coding If Needed)
- Should ESC equal “Got it”? (Default: No; maintain intentional action).
- Do we want to delay the capture popup for animation smoothness? (Current: 120ms; adjust after feel test).

(If answers default unchanged, proceed.)

---

This plan provides all structural, behavioral, and accessibility specifications required for straightforward implementation.
