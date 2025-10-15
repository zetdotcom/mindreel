# Capture Feature

## Overview

The **Capture** feature provides ultra-fast entry creation through a dedicated popup window. This feature implements US-006a from the PRD, allowing users to add entries from the main application window without waiting for automatic pop-ups.

## Architecture

This feature follows the Feature-Sliced Design (FSD) architecture:

```
features/capture/
├── model/              # Business logic & state
│   ├── repository.ts   # Data access for recent entries & window control
│   └── useCapture.ts   # React hook for managing capture state
├── ui/                 # React components
│   └── CapturePopup.tsx # Main popup UI component
├── index.ts           # Public API barrel export
└── README.md          # This file
```

## Key Components

### Model Layer

#### `repository.ts`
Provides data access functions:
- `getRecentUniqueEntries(limit)` - Fetches last N unique entries for prefill
- `openCaptureWindow()` - Triggers IPC to open the capture popup
- `closeCaptureWindow()` - Closes the current capture popup

#### `useCapture.ts`
React hook that manages:
- Recent entries state
- Loading state during data fetch
- Error handling
- Refresh functionality

### UI Layer

#### `CapturePopup.tsx`
Main popup component featuring:
- **Multiline textarea** with autofocus
- **Character counter** (0-500 characters)
- **Recent entries prefill buttons** (last 4 unique entries)
- **Save button** (disabled when empty or over limit)
- **Keyboard navigation**:
  - `ESC` to close
  - `Cmd/Ctrl + Enter` to save
  - `Enter/Space` on buttons for activation
- **Accessibility**:
  - ARIA labels for screen readers
  - Live region for character count
  - Keyboard-only navigation support

## Usage

### Opening the Capture Window

From the Dashboard or any other view:

```typescript
import { openCaptureWindow } from '@/features/capture';

const handleOpenCapture = async () => {
  try {
    await openCaptureWindow();
  } catch (error) {
    console.error('Failed to open capture window:', error);
  }
};
```

### Using the CapturePopup Component

In a standalone window (like CaptureWindowView):

```typescript
import { CapturePopup } from '@/features/capture';

function MyCaptureWindow() {
  const handleSave = async (content: string) => {
    await window.appApi.db.createEntry({ content });
  };

  return <CapturePopup onSave={handleSave} />;
}
```

### Getting Recent Entries

```typescript
import { useCapture } from '@/features/capture';

function MyComponent() {
  const { recentEntries, loading, error, refresh } = useCapture();

  return (
    <div>
      {recentEntries.map(entry => (
        <button key={entry}>{entry}</button>
      ))}
    </div>
  );
}
```

## IPC Communication

The capture feature communicates with the main process through:

### Channels
- `capture:openPopup` - Opens the capture window
- `capture:closePopup` - Closes the capture window

### Exposed API
Defined in `preload.ts` and `global.d.ts`:

```typescript
window.appApi.capture = {
  openCapturePopup: () => Promise<void>;
  closeCapturePopup: () => Promise<void>;
};
```

## Window Management

The capture window is managed by `ipc/captureWindowHandlers.ts`:

- **Single instance**: Only one capture window can be open at a time
- **Always on top**: Window stays above other windows for quick access
- **Fixed size**: 600x700px, non-resizable for consistent UX
- **Auto-center**: Window centers on screen when opened
- **Auto-cleanup**: Window reference cleared when closed

## User Experience

### Character Limit
- Maximum: 500 characters
- Visual feedback: Counter changes color as limit approaches
  - Gray: Under 90% (0-450 chars)
  - Yellow: 90-100% (451-500 chars)
  - Red: Over limit (501+ chars)

### Prefill Buttons
- Shows last 4 unique entries
- Full-width buttons for easy clicking
- Truncated text with ellipsis for long entries
- Clicking prefills the textarea and focuses it

### Keyboard Shortcuts
- `ESC` - Close window without saving
- `Cmd/Ctrl + Enter` - Save and close
- `Tab` - Navigate between elements
- `Enter/Space` on focused button - Activate button

### States
- **Empty**: Save button disabled
- **Valid**: Save button enabled (1-500 chars)
- **Over limit**: Save button disabled, red counter
- **Saving**: All inputs disabled, button shows "Saving..."

## Integration Points

### Dashboard Integration
The Dashboard includes a "+ Add Entry" button that opens the capture window:

```typescript
// In DashboardView.tsx
import { openCaptureWindow } from '@/features/capture';

<Button onClick={() => openCaptureWindow()}>
  + Add Entry
</Button>
```

### Database Integration
Entries are saved through the standard database API:

```typescript
await window.appApi.db.createEntry({ content: userInput });
```

After successful save, the window automatically closes.

## Future Enhancements

Potential improvements (not in current scope):

1. **Global shortcut trigger** (US-006)
   - Register system-wide hotkey
   - Open capture window even when app not focused

2. **Interval pop-ups** (US-004)
   - Automatic scheduled appearance
   - Timer-based window opening

3. **Rich text support**
   - Markdown formatting
   - Link detection
   - Hashtag highlighting

4. **Draft persistence**
   - Save incomplete entries
   - Restore on next open

5. **Voice input**
   - Speech-to-text for hands-free entry
   - Accessibility improvement

## Testing Considerations

When testing this feature:

1. **Window lifecycle**: Verify single instance enforcement
2. **Character limit**: Test edge cases (exactly 500, 501, etc.)
3. **Keyboard navigation**: Tab through all elements
4. **Screen readers**: Verify ARIA labels are announced
5. **Recent entries**: Test with 0, 1, 4, 10+ entries
6. **Error handling**: Simulate database failures
7. **Performance**: Measure time to open/close window

## Related Files

- `src/views/CaptureWindow/CaptureWindowView.tsx` - Window entry point
- `src/capture.tsx` - React renderer entry point
- `src/capture.html` - HTML template
- `src/ipc/captureWindowHandlers.ts` - Main process window management
- `vite.capture.config.ts` - Build configuration
- `forge.config.ts` - Electron Forge configuration

## Dependencies

- React 19 - UI framework
- Electron 38 - Window management
- shadcn/ui - Button component
- Tailwind CSS 4 - Styling

## Acceptance Criteria (US-006a)

✅ Dedicated button in main window ("+ Add Entry")  
✅ Clicking button opens popup window  
✅ Saved entry immediately visible in Dashboard history  
✅ Popup is a separate window (not modal dialog)  
✅ Full keyboard navigation support  
✅ Accessibility features for screen readers  

---

**Last Updated**: 2025-01-XX  
**Maintained By**: Feature captures team