# SQLite Database Implementation for MindReel

This document outlines the complete SQLite database implementation for the MindReel application, based on the schema defined in `.ai/sqlite-plan.md`.

## Overview

The MindReel application now includes a fully functional SQLite database layer that provides:

- Local data storage for entries, summaries, and settings
- Type-safe database operations using TypeScript
- IPC communication between Electron main and renderer processes
- Repository pattern for organized data access
- Automatic database initialization and schema creation

## Architecture

### Database Layer Structure

```
src/sqlite/
├── database.ts              # Core database connection and initialization
├── databaseService.ts       # Main service combining all repositories
├── types.ts                 # TypeScript interfaces and types
├── dateUtils.ts             # Date and week calculation utilities
├── index.ts                 # Export barrel file
└── repositories/
    ├── entriesRepository.ts     # Entry CRUD operations
    ├── summariesRepository.ts   # Summary CRUD operations
    └── settingsRepository.ts    # Settings management
```

### IPC Layer

```
src/ipc/
└── databaseHandlers.ts      # IPC handlers for database operations
```

## Database Schema

The implementation creates three main tables as defined in the schema:

### `entries` Table
- Stores individual activity entries
- Includes automatic date and week calculations
- Indexed on `date` for efficient queries

### `summaries` Table
- Stores AI-generated weekly summaries
- Linked to entries by week number
- Indexed on `week_of_year` for quick lookups

### `settings` Table
- Singleton table for application settings
- Default values: 60-minute popup interval, no global shortcut

## Key Features

### 1. Automatic Database Initialization
- Database file created in user data directory
- Tables and indexes created automatically
- Default settings inserted on first run

### 2. Type-Safe Operations
- Full TypeScript support with proper interfaces
- Input validation through type system
- Strongly typed return values

### 3. Date and Week Handling
- ISO week number calculations
- Automatic date derivation from timestamps
- Week range utilities for queries

### 4. Repository Pattern
- Separated concerns for each entity type
- Consistent async/await API
- Promise-based database operations

### 5. IPC Integration
- Secure communication between main and renderer
- Complete API exposed through context bridge
- Error handling and logging

## Usage Examples

### Creating Entries

```typescript
// In renderer process
const entry = await window.appApi.db.createEntry({
  content: "Working on database implementation"
});
```

### Querying Entries

```typescript
// Get today's entries
const todayEntries = await window.appApi.db.getTodayEntries();

// Get entries for specific date
const entries = await window.appApi.db.getEntriesForDate('2024-01-15');

// Get current week entries
const weekEntries = await window.appApi.db.getCurrentWeekEntries();
```

### Managing Summaries

```typescript
// Create a summary for current week
const summary = await window.appApi.db.createCurrentWeekSummary(
  "This week I focused on implementing the SQLite database..."
);

// Get current week summary
const currentSummary = await window.appApi.db.getCurrentWeekSummary();
```

### Settings Management

```typescript
// Update popup interval
const settings = await window.appApi.db.updatePopupInterval(30);

// Update global shortcut
await window.appApi.db.updateGlobalShortcut('CommandOrControl+Shift+M');
```

### Dashboard Data

```typescript
// Get complete dashboard data in one call
const dashboardData = await window.appApi.db.getDashboardData();
// Returns: { todayEntries, currentWeekSummary, recentSummaries, settings }
```

## Database Location

The SQLite database file is stored at:
- **Windows**: `%APPDATA%/mindreel/mindreel.db`
- **macOS**: `~/Library/Application Support/mindreel/mindreel.db`
- **Linux**: `~/.config/mindreel/mindreel.db`

## Error Handling

All database operations include proper error handling:
- Database connection errors are logged and propagated
- SQL errors are caught and reported with context
- IPC communication errors are handled gracefully

## Performance Considerations

### Indexes
- `idx_entries_date` on entries(date) for daily queries
- `idx_summaries_week` on summaries(week_of_year) for weekly lookups

### Query Optimization
- Prepared statements for all operations
- Efficient date range queries
- Minimal data transfer over IPC

## Development and Testing

### Running the Application
```bash
npm start
```

### Type Checking
```bash
npm run typecheck
```

### Database Testing
The application includes a test interface that demonstrates:
- Creating and deleting entries
- Generating weekly summaries
- Displaying dashboard data
- Accessing database settings

## Future Enhancements

Potential improvements to consider:
1. Database migrations system for schema changes
2. Data backup and restore functionality
3. Import/export capabilities
4. Database vacuum and optimization routines
5. Encryption for sensitive data
6. Database connection pooling for better performance

## Dependencies

The implementation uses:
- `sqlite3` - SQLite database driver for Node.js
- `@types/sqlite3` - TypeScript definitions
- Built-in Electron APIs for file system access

## Error Recovery

The system includes several recovery mechanisms:
- Automatic database recreation if file is corrupted
- Default settings restoration
- Graceful handling of missing tables
- Proper cleanup on application exit

This implementation provides a solid foundation for the MindReel application's data persistence needs while maintaining type safety, performance, and reliability.