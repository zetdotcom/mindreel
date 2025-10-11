import React, { useState, useEffect } from "react";

export function App() {
  const [entryText, setEntryText] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await window.appApi.db.getDashboardData();
      setDashboardData(data);
      setEntries(data.todayEntries || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!entryText.trim()) return;

    try {
      setLoading(true);
      await window.appApi.db.createEntry({ content: entryText });
      setEntryText("");
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to create entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      setLoading(true);
      await window.appApi.db.deleteEntry(id);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWeekSummary = async () => {
    try {
      setLoading(true);
      const weekInfo = await window.appApi.db.getCurrentWeekInfo();
      const weekEntries = await window.appApi.db.getCurrentWeekEntries();

      if (weekEntries.length === 0) {
        alert("No entries found for current week");
        return;
      }

      const summaryContent = `Week ${weekInfo.week_of_year} Summary (${weekInfo.start_date} to ${weekInfo.end_date}):\n\n${weekEntries.map((entry) => `• ${entry.content}`).join("\n")}`;

      await window.appApi.db.createCurrentWeekSummary(summaryContent);
      await loadDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to create week summary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-neutral-950 text-neutral-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            MindReel SQLite Database Test
          </h1>
          <p className="text-neutral-400">
            Testing the SQLite database implementation
          </p>
        </header>

        {loading && <div className="text-center text-blue-400">Loading...</div>}

        {/* Create Entry Section */}
        <section className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Entry</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleCreateEntry()}
            />
            <button
              onClick={handleCreateEntry}
              disabled={loading || !entryText.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded font-medium transition"
            >
              Add Entry
            </button>
          </div>
        </section>

        {/* Today's Entries */}
        <section className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Today's Entries ({entries.length})
          </h2>
          {entries.length === 0 ? (
            <p className="text-neutral-400">No entries for today yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between bg-neutral-800 p-4 rounded"
                >
                  <div className="flex-1">
                    <p className="text-white">{entry.content}</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Current Week Summary */}
        <section className="bg-neutral-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Week Summary</h2>
            <button
              onClick={handleCreateWeekSummary}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded font-medium transition"
            >
              Generate Summary
            </button>
          </div>
          {dashboardData?.currentWeekSummary ? (
            <div className="bg-neutral-800 p-4 rounded">
              <pre className="text-sm text-neutral-200 whitespace-pre-wrap">
                {dashboardData.currentWeekSummary.content}
              </pre>
              <p className="text-xs text-neutral-400 mt-2">
                Created:{" "}
                {new Date(
                  dashboardData.currentWeekSummary.created_at,
                ).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-neutral-400">No summary for current week yet.</p>
          )}
        </section>

        {/* Recent Summaries */}
        {dashboardData?.recentSummaries &&
          dashboardData.recentSummaries.length > 0 && (
            <section className="bg-neutral-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Summaries</h2>
              <div className="space-y-3">
                {dashboardData.recentSummaries.map((summary: any) => (
                  <div key={summary.id} className="bg-neutral-800 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">
                        Week {summary.week_of_year}
                      </h3>
                      <span className="text-sm text-neutral-400">
                        {summary.start_date} to {summary.end_date}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 line-clamp-3">
                      {summary.content.split("\n")[0]}...
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Settings */}
        {dashboardData?.settings && (
          <section className="bg-neutral-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-neutral-400">Popup Interval:</span>{" "}
                {dashboardData.settings.popup_interval_minutes} minutes
              </p>
              <p>
                <span className="text-neutral-400">Global Shortcut:</span>{" "}
                {dashboardData.settings.global_shortcut || "Not set"}
              </p>
            </div>
          </section>
        )}

        {/* Database Info */}
        <section className="bg-neutral-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Database Info</h2>
          <button
            onClick={async () => {
              try {
                const path = await window.appApi.db.getDatabasePath();
                alert(`Database location: ${path}`);
              } catch (error) {
                console.error("Failed to get database path:", error);
              }
            }}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded font-medium transition"
          >
            Show Database Path
          </button>
        </section>
      </div>
    </main>
  );
}
