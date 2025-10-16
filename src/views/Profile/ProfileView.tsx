import React from "react";

/**
 * ProfileView
 *
 * Placeholder route-level component for the user's profile area.
 * Establishes the `/profile` navigation destination and semantic layout.
 *
 * Future responsibilities (not implemented here):
 *  - Display / edit user identity metadata (name, avatar, bio)
 *  - Usage analytics summary (capture streaks, entries per week)
 *  - Personalization preferences (will move to Settings if global)
 *  - Optional account / sync status (if remote features introduced)
 *
 * Architectural notes:
 *  - Keep domain + persistence logic in a future `features/profile/*` module
 *  - View remains a composition/orchestration layer — no direct data access
 *  - Promote any reusable UI blocks to `shared/ui` or a future `widgets/` layer
 */
export function ProfileView() {
  return (
    <main className="min-h-screen w-full bg-background px-8 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Profile (Preview)
          </h1>
          <p className="text-sm text-muted-foreground">
            User profile details and activity insights will appear here. This
            page establishes the route and layout skeleton.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Identity</h2>
            <p className="text-sm text-muted-foreground">
              Planned: avatar upload, display name, short bio or mission
              statement.
            </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Activity</h2>
          <p className="text-sm text-muted-foreground">
            Planned: capture streak, weekly entry counts, summary generation
            stats, time since first entry.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Milestones</h2>
          <p className="text-sm text-muted-foreground">
            Planned: badges / achievements (e.g. 100 entries, 10 weeks
            summarized).
          </p>
        </section>

        <footer className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Profile feature not yet implemented. All sections are placeholders.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default ProfileView;
