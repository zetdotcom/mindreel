# SQLite Database API Documentation

This document provides a comprehensive guide for frontend developers on how to use the SQLite database in MindReel. The database is accessed through Electron's IPC (Inter-Process Communication) system via `window.appApi.db`.

## Architecture Overview

In Electron applications, the database operations happen in the **main process** (Node.js) while your React UI runs in the **renderer process**. Communication between them happens through IPC:

```
React Component → window.appApi.db → IPC → Main Process → SQLite Database
```

## Quick Start

```typescript
// All database operations are async and accessed through window.appApi.db
const entries = await window.appApi.db.getTodayEntries();
const newEntry = await window.appApi.db.createEntry({ 
  content: "Today I learned about Electron IPC" 
});
```

## Data Types

### Entry
```typescript
interface Entry {
  id?: number;
  content: string;
  date: string; // YYYY-MM-DD format
  week_of_year: number;
  created_at: string; // ISO 8601 timestamp
}
```

### Summary
```typescript
interface Summary {
  id?: number;
  content: string;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  week_of_year: number;
  created_at: string; // ISO 8601 timestamp
}
```

### Settings
```typescript
interface Settings {
  id: 1;
  popup_interval_minutes: number;
  global_shortcut: string | null;
}
```

## Entry Management

### Creating Entries

#### `window.appApi.db.createEntry(input: CreateEntryInput): Promise<Entry>`
**When to use:** User submits a new journal entry.
```typescript
const handleCreateEntry = async (content: string) => {
  try {
    setLoading(true);
    const newEntry = await window.appApi.db.createEntry({ content });
    
    // Optimistic update - add to current entries immediately
    setEntries(prev => [...prev, newEntry]);
    
    setEntryText("");
  } catch (error) {
    console.error("Failed to create entry:", error);
    // Show user-friendly error message
  } finally {
    setLoading(false);
  }
};
```

### Reading Entries

#### `window.appApi.db.getTodayEntries(): Promise<Entry[]>`
**When to use:** Load today's entries on dashboard or today view.
```typescript
const [todayEntries, setTodayEntries] = useState<Entry[]>([]);

useEffect(() => {
  const loadTodayEntries = async () => {
    try {
      const entries = await window.appApi.db.getTodayEntries();
      setTodayEntries(entries);
    } catch (error) {
      console.error("Failed to load today's entries:", error);
    }
  };
  
  loadTodayEntries();
}, []);
```

#### `window.appApi.db.getCurrentWeekEntries(): Promise<Entry[]>`
**When to use:** Weekly review, generating summaries.
```typescript
const loadWeekEntries = async () => {
  const entries = await window.appApi.db.getCurrentWeekEntries();
  return entries;
};
```

#### `window.appApi.db.getEntriesForDate(date: string): Promise<Entry[]>`
**When to use:** Calendar view, specific date selection.
```typescript
const handleDateSelect = async (selectedDate: string) => {
  try {
    setLoading(true);
    const entries = await window.appApi.db.getEntriesForDate(selectedDate);
    setSelectedDateEntries(entries);
  } catch (error) {
    console.error("Failed to load entries for date:", error);
  } finally {
    setLoading(false);
  }
};
```

#### `window.appApi.db.getEntriesForWeek(weekOfYear: number): Promise<Entry[]>`
```typescript
const loadWeekEntries = async (weekNumber: number) => {
  const entries = await window.appApi.db.getEntriesForWeek(weekNumber);
  return entries;
};
```

#### `window.appApi.db.getEntriesForDateRange(startDate: string, endDate: string): Promise<Entry[]>`
**When to use:** Custom date range filtering, reports.
```typescript
const loadRangeEntries = async (start: string, end: string) => {
  const entries = await window.appApi.db.getEntriesForDateRange(start, end);
  return entries;
};
```

#### `window.appApi.db.getEntryById(id: number): Promise<Entry | null>`
**When to use:** Edit specific entry.
```typescript
const loadEntryForEdit = async (entryId: number) => {
  const entry = await window.appApi.db.getEntryById(entryId);
  if (entry) {
    setEditingEntry(entry);
    setEditText(entry.content);
  }
};
```

### Updating Entries

#### `window.appApi.db.updateEntry(id: number, content: string): Promise<Entry | null>`
```typescript
const handleUpdateEntry = async (id: number, newContent: string) => {
  try {
    const updatedEntry = await window.appApi.db.updateEntry(id, newContent);
    
    if (updatedEntry) {
      // Update local state immediately
      setEntries(prev => 
        prev.map(entry => 
          entry.id === id ? updatedEntry : entry
        )
      );
      setEditingEntry(null);
    }
  } catch (error) {
    console.error("Failed to update entry:", error);
  }
};
```

### Deleting Entries

#### `window.appApi.db.deleteEntry(id: number): Promise<boolean>`
```typescript
const handleDeleteEntry = async (id: number) => {
  try {
    const deleted = await window.appApi.db.deleteEntry(id);
    
    if (deleted) {
      // Remove from local state immediately
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
  } catch (error) {
    console.error("Failed to delete entry:", error);
  }
};
```

### Entry Metadata

#### `window.appApi.db.getDatesWithEntries(): Promise<string[]>`
**When to use:** Highlight calendar dates that have entries.
```typescript
const [activeDates, setActiveDates] = useState<string[]>([]);

useEffect(() => {
  const loadActiveDates = async () => {
    const dates = await window.appApi.db.getDatesWithEntries();
    setActiveDates(dates);
  };
  loadActiveDates();
}, []);
```

#### `window.appApi.db.getWeeksWithEntries(): Promise<number[]>`
```typescript
const loadActiveWeeks = async () => {
  const weeks = await window.appApi.db.getWeeksWithEntries();
  return weeks;
};
```

## Summary Management

### Creating Summaries

#### `window.appApi.db.createCurrentWeekSummary(content: string): Promise<Summary>`
**When to use:** Generate summary for current week.
```typescript
const handleCreateWeekSummary = async () => {
  try {
    setLoading(true);
    
    // Get current week entries for context
    const weekEntries = await window.appApi.db.getCurrentWeekEntries();
    
    if (weekEntries.length === 0) {
      alert("No entries found for current week");
      return;
    }

    // Generate summary content (could be AI-generated)
    const summaryContent = generateSummaryContent(weekEntries);
    
    const summary = await window.appApi.db.createCurrentWeekSummary(summaryContent);
    
    // Update local state
    setCurrentWeekSummary(summary);
    
  } catch (error) {
    console.error("Failed to create summary:", error);
  } finally {
    setLoading(false);
  }
};
```

### Reading Summaries

#### `window.appApi.db.getCurrentWeekSummary(): Promise<Summary | null>`
```typescript
const [currentWeekSummary, setCurrentWeekSummary] = useState<Summary | null>(null);

useEffect(() => {
  const loadCurrentSummary = async () => {
    const summary = await window.appApi.db.getCurrentWeekSummary();
    setCurrentWeekSummary(summary);
  };
  loadCurrentSummary();
}, []);
```

#### `window.appApi.db.getAllSummaries(): Promise<Summary[]>`
```typescript
const loadAllSummaries = async () => {
  const summaries = await window.appApi.db.getAllSummaries();
  return summaries;
};
```

#### `window.appApi.db.getSummariesByYear(year: number): Promise<Summary[]>`
```typescript
const loadYearSummaries = async (year: number) => {
  const summaries = await window.appApi.db.getSummariesByYear(year);
  return summaries;
};
```

### Summary Checks

#### `window.appApi.db.currentWeekSummaryExists(): Promise<boolean>`
```typescript
const checkCanCreateSummary = async () => {
  const exists = await window.appApi.db.currentWeekSummaryExists();
  setCanCreateSummary(!exists);
};
```

## Settings Management

#### `window.appApi.db.getSettings(): Promise<Settings | null>`
```typescript
const [settings, setSettings] = useState<Settings | null>(null);

useEffect(() => {
  const loadSettings = async () => {
    const userSettings = await window.appApi.db.getSettings();
    setSettings(userSettings);
  };
  loadSettings();
}, []);
```

#### `window.appApi.db.updateSettings(input: UpdateSettingsInput): Promise<Settings>`
```typescript
const handleUpdateSettings = async (newSettings: Partial<Settings>) => {
  try {
    const updated = await window.appApi.db.updateSettings(newSettings);
    setSettings(updated);
  } catch (error) {
    console.error("Failed to update settings:", error);
  }
};
```

## Utility Methods

#### `window.appApi.db.getDashboardData(): Promise<DashboardData>`
**When to use:** Load all dashboard data in one call (most efficient).
```typescript
const loadDashboard = async () => {
  try {
    setLoading(true);
    const data = await window.appApi.db.getDashboardData();
    
    setTodayEntries(data.todayEntries || []);
    setCurrentWeekSummary(data.currentWeekSummary);
    setRecentSummaries(data.recentSummaries || []);
    setSettings(data.settings);
    
  } catch (error) {
    console.error("Failed to load dashboard:", error);
  } finally {
    setLoading(false);
  }
};
```

#### `window.appApi.db.getCurrentWeekInfo(): WeekRange`
```typescript
const getWeekInfo = async () => {
  const weekInfo = await window.appApi.db.getCurrentWeekInfo();
  return weekInfo; // { start_date, end_date, week_of_year }
};
```

## React Best Practices

### 1. Efficient State Updates (Recommended Approach)

Instead of refetching all data after every operation, update local state immediately:

```typescript
// ❌ Inefficient - refetches everything
const handleCreateEntry = async (content: string) => {
  await window.appApi.db.createEntry({ content });
  await loadDashboardData(); // Refetches all dashboard data
};

// ✅ Efficient - updates only what changed
const handleCreateEntry = async (content: string) => {
  const newEntry = await window.appApi.db.createEntry({ content });
  setTodayEntries(prev => [...prev, newEntry]); // Add new entry to existing list
};
```

### 2. Loading States with Skeleton Screens

```typescript
const EntryList = ({ entries, loading }: { entries: Entry[], loading: boolean }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-neutral-800 p-4 rounded animate-pulse">
            <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-neutral-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
};
```

### 3. Error Handling Pattern

```typescript
const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAsync = async <T,>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      setError(message);
      console.error('Operation failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, executeAsync };
};

// Usage
const { loading, error, executeAsync } = useAsyncOperation();

const handleCreateEntry = (content: string) => {
  executeAsync(
    () => window.appApi.db.createEntry({ content }),
    (newEntry) => setEntries(prev => [...prev, newEntry])
  );
};
```

### 4. Custom Hooks for Database Operations

```typescript
// Custom hook for entries
const useEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTodayEntries = async () => {
    setLoading(true);
    try {
      const todayEntries = await window.appApi.db.getTodayEntries();
      setEntries(todayEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEntry = async (content: string) => {
    const newEntry = await window.appApi.db.createEntry({ content });
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const deleteEntry = async (id: number) => {
    const deleted = await window.appApi.db.deleteEntry(id);
    if (deleted) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
    }
    return deleted;
  };

  return {
    entries,
    loading,
    loadTodayEntries,
    createEntry,
    deleteEntry
  };
};
```

### 5. Component Organization

```typescript
// Main component focuses on orchestration
const Dashboard = () => {
  const { entries, loading: entriesLoading, loadTodayEntries, createEntry } = useEntries();
  const { summary, createWeekSummary } = useWeekSummary();
  
  useEffect(() => {
    loadTodayEntries();
  }, []);

  return (
    <div className="space-y-6">
      <EntryForm onSubmit={createEntry} />
      <EntryList entries={entries} loading={entriesLoading} />
      <WeekSummarySection summary={summary} onCreateSummary={createWeekSummary} />
    </div>
  );
};
```

## Performance Tips

1. **Use specific methods**: `getTodayEntries()` instead of `getEntries()` with filters
2. **Batch initial data**: Use `getDashboardData()` for initial page load
3. **Optimistic updates**: Update UI immediately, don't wait for database confirmation
4. **Avoid unnecessary re-renders**: Use `useMemo` and `useCallback` for expensive operations
5. **Lazy load**: Load additional data only when needed (e.g., older entries)

## Error Handling Guidelines

- Always wrap database calls in try-catch blocks
- Log errors to console for debugging
- Show user-friendly error messages
- Don't crash the app on database errors
- Consider retry mechanisms for critical operations

## Date Formats

- **Entry dates**: `YYYY-MM-DD` (e.g., "2024-01-15")
- **Timestamps**: ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
- **Week numbers**: Integer 1-53 (ISO week numbers)

## TypeScript Integration

All database methods are fully typed. Import types as needed:

```typescript
import type { Entry, Summary, Settings, CreateEntryInput } from '../sqlite/types';
```

The `window.appApi.db` object is automatically typed through the preload script, providing full IntelliSense support in your React components.