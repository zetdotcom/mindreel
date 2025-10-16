import React from "react";

/**
 * SettingsView
 *
 * Placeholder view for application-wide configuration.
 * This route-level component will eventually host real settings
 * (capture shortcuts, popup interval, data export, privacy controls, etc.).
 *
 * Current responsibilities:
 *  - Provide a stable route destination (/settings)
 *  - Establish semantic layout structure
 *  - Showcase planned settings groups for future implementation
 *
 * Notes:
 *  - Keep business logic in future settings feature modules (features/settings/*)
 *  - Avoid introducing persistent global state here; delegate to feature hooks later
 */
export function SettingsView() {
  return (
    <main className="min-h-screen w-full bg-background px-8 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Settings (Preview)
          </h1>
          <p className="text-sm text-muted-foreground">
            Configuration options will appear here as the settings feature is
            implemented. This placeholder establishes route structure.
          </p>
        </header>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Capture</h2>
          <p className="text-sm text-muted-foreground">
            Future controls for capture popup behavior (global shortcut,
            automatic reminder interval, default template).
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Data & Storage</h2>
          <p className="text-sm text-muted-foreground">
            Planned: database location display, local backup/export actions.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Privacy</h2>
            <p className="text-sm text-muted-foreground">
              Planned: redaction rules, optional sync settings, analytics
              opt-in/out.
            </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-3">Interface</h2>
          <p className="text-sm text-muted-foreground">
            Planned: theme, density, time display preferences.
          </p>
        </section>

        <footer className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Settings feature not yet implemented. All groups are placeholders.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default SettingsView;
