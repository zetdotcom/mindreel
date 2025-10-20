# Global Shortcut Testing Guide - Option+Command+K

## ✅ Quick Test

1. **Start the app:**
   ```bash
   npm run start
   ```

2. **Check the console logs** - You should see:
   ```
   [GlobalShortcut] Initializing global shortcuts...
   [GlobalShortcut] Settings loaded: { id: 1, popup_interval_minutes: 60, global_shortcut: 'Option+Command+K' }
   [GlobalShortcut] Found shortcut in settings: Option+Command+K
   [GlobalShortcut] Attempting to register shortcut: Option+Command+K
   [GlobalShortcut] ✓ Successfully registered: Option+Command+K
   [GlobalShortcut] Press Option+Command+K to test the shortcut
   ```

3. **Test the shortcut:**
   - **macOS:** Press `⌥ Option + ⌘ Command + K`
   - The capture popup window should open instantly!

4. **Verify in logs when pressed:**
   ```
   [GlobalShortcut] 🔥 SHORTCUT PRESSED: Option+Command+K
   [SHORTCUT PRESSED] Opening capture window...
   [SHORTCUT PRESSED] Capture window opened successfully
   ```

## 🔍 Debug Tools

### Run the debug script:
```bash
node debug-shortcut.js
```

This will show you:
- Current database settings
- Applied migrations
- Shortcut configuration
- Testing instructions

### Check database manually:
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db "SELECT * FROM settings;"
```
Expected output: `1|60|Option+Command+K`

### Check migrations:
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db "SELECT * FROM migrations;"
```
Should show migrations 1 and 2.

## 🧪 Manual Testing in DevTools

Open DevTools (View → Toggle Developer Tools) and test in the console:

### Check current shortcut:
```javascript
const settings = await window.appApi.db.getSettings();
console.log('Current shortcut:', settings.global_shortcut);
```

### Check registration status:
```javascript
const status = await window.appApi.shortcut.isRegistered();
console.log('Is registered:', status.isRegistered);
console.log('Shortcut:', status.shortcut);
```

### Test capture window manually:
```javascript
await window.appApi.capture.openCapturePopup();
```

### Change shortcut:
```javascript
// Try a different shortcut if Option+Command+K doesn't work
await window.appApi.db.updateGlobalShortcut('Command+Shift+M');
console.log('Changed to Command+Shift+M');

// Verify
const status = await window.appApi.shortcut.isRegistered();
console.log('New shortcut:', status.shortcut);
```

### Reset to default:
```javascript
await window.appApi.db.resetSettings();
console.log('Reset to default (Option+Command+K)');
```

## 🐛 Troubleshooting

### Shortcut doesn't work at all

**Check console for registration errors:**
- Look for `[GlobalShortcut] ✗ Failed to register` messages
- If you see "Shortcut may be already taken", another app is using it

**Try a different shortcut:**
```javascript
await window.appApi.db.updateGlobalShortcut('Command+Shift+M');
```

**Common alternatives to try:**
- `Command+Shift+M`
- `Command+Shift+Space`
- `Control+Shift+Space`
- `Option+Command+M`
- `F12`
- `Command+Option+N`

### Shortcut conflicts with other apps

**Check System Settings:**
1. Open System Settings → Keyboard → Keyboard Shortcuts
2. Look for conflicts with your shortcut
3. Disable or change conflicting shortcuts

**Common conflicts:**
- Spotlight: Command+Space
- Siri: Command+Space (hold)
- Screenshot tools: Various Command+Shift combinations

### Database has NULL shortcut

**Fix it manually:**
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db "UPDATE settings SET global_shortcut = 'Option+Command+K' WHERE id = 1;"
```

Then restart the app.

### Migration didn't run

**Check applied migrations:**
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db "SELECT * FROM migrations;"
```

**If migration 2 is missing, delete the database and restart:**
```bash
rm ~/Library/Application\ Support/mindreel/mindreel.db
npm run start
```

⚠️ **Warning:** This will delete all your data!

### App not focused but shortcut doesn't work

**This is expected behavior!** Global shortcuts work system-wide, even when the app is in the background or not focused. If it's not working:

1. Check if the shortcut is registered (see above)
2. Verify no other app is using it
3. Try a different shortcut combination

## 📝 Valid Shortcut Format

### Modifiers:
- `Command` or `Cmd` - Command key (⌘) on macOS
- `Control` or `Ctrl` - Control key
- `Alt` - Alt/Option key
- `Option` - Option key (⌥) on macOS
- `Shift` - Shift key
- `CommandOrControl` or `CmdOrCtrl` - Cmd on macOS, Ctrl on Windows/Linux
- `Super` - Windows key / Command key

### Format Rules:
✅ **VALID:**
- `Option+Command+K`
- `Command+Shift+M`
- `CommandOrControl+Shift+Space`
- `Alt+Shift+F12`
- `Control+Alt+Delete`

❌ **INVALID:**
- `Option+Command+Space+K` ← No multi-key sequences!
- `cmd+k` ← Must be capitalized
- `Option K` ← Must use + between keys

### Examples:
```javascript
// Cross-platform (works on macOS, Windows, Linux)
await window.appApi.db.updateGlobalShortcut('CommandOrControl+Shift+K');

// macOS specific
await window.appApi.db.updateGlobalShortcut('Option+Command+K');

// Function keys
await window.appApi.db.updateGlobalShortcut('F12');

// Multiple modifiers
await window.appApi.db.updateGlobalShortcut('Command+Alt+Shift+M');
```

## 🎯 Expected Behavior Checklist

- ✅ App starts and loads shortcut from database
- ✅ Shortcut is registered with Electron's globalShortcut API
- ✅ Console shows registration success message
- ✅ Pressing Option+Command+K opens capture popup
- ✅ Popup appears on top of all other windows
- ✅ Popup can be closed and reopened with shortcut
- ✅ Shortcut works when app is in background
- ✅ Shortcut works when app is not focused
- ✅ Changing shortcut in settings updates registration immediately
- ✅ Reset settings restores default shortcut

## 🚀 Additional Testing

### Test the HTML test page:
1. Open the app
2. Navigate to the test page (if available in your routes)
3. Click "Check Shortcut Status" button
4. Press Option+Command+K
5. Observe logs and popup behavior

### Stress test:
1. Register shortcut
2. Press it 10 times rapidly
3. All should trigger capture window
4. No crashes or errors

### Change shortcut multiple times:
```javascript
await window.appApi.db.updateGlobalShortcut('Command+Shift+M');
// Press Command+Shift+M - should work

await window.appApi.db.updateGlobalShortcut('Option+Command+N');
// Press Option+Command+N - should work

await window.appApi.db.updateGlobalShortcut('F12');
// Press F12 - should work
```

## 📊 Success Criteria

The implementation is successful if:

1. ✅ Shortcut registers on app start
2. ✅ Console shows clear registration messages
3. ✅ Pressing Option+Command+K opens capture popup
4. ✅ Works system-wide (app in background)
5. ✅ Can be changed via settings
6. ✅ Persists across app restarts
7. ✅ Properly cleaned up on app quit

---

**Last Updated:** 2025-01-17
**Default Shortcut:** Option+Command+K (⌥ + ⌘ + K)