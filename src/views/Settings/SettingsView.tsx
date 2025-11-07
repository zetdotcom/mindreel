import { Alert } from "@/components/ui/alert";
import { PopupIntervalControl, useSettings } from "@/features/settings";

export function SettingsView() {
  const { settings, loading, error, updatePopupInterval } = useSettings();

  const handleIntervalChange = async (minutes: number) => {
    try {
      await updatePopupInterval(minutes);
      console.log(`Popup interval updated to ${minutes} minutes`);
    } catch (err) {
      console.error("Failed to update popup interval:", err);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background px-8 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your MindReel experience</p>
        </header>

        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Capture</h2>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <div className="space-y-4">
              <PopupIntervalControl
                value={settings?.popup_interval_minutes ?? 60}
                onChange={handleIntervalChange}
              />

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium mb-2">Global Shortcut</h3>
                <p className="text-sm text-muted-foreground">
                  Press{" "}
                  <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                    {settings?.global_shortcut ?? "Option+Command+Space"}
                  </kbd>{" "}
                  to open the capture window from anywhere.
                </p>
              </div>
            </div>
          )}
        </section>

        <footer className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">MindReel v1.0.0</p>
        </footer>
      </div>
    </main>
  );
}

export default SettingsView;
