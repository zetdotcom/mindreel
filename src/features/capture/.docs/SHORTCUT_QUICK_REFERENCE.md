# Global Shortcut Quick Reference Card

## 🎯 Current Shortcut
**Option + Command + Space** (⌥ + ⌘ + Space)

Press this anywhere on your Mac to instantly open the capture popup!

---

## ✅ Quick Test

1. **Start the app:**
   ```bash
   npm run start
   ```

2. **Look for this in console:**
   ```
   [GlobalShortcut] ✓ Successfully registered: Option+Command+Space
   ```

3. **Press:** `⌥ Option` + `⌘ Command` + `Space`

4. **Result:** Capture popup opens! 🎉

---

## 🔍 Debug Commands

### Check if shortcut is registered:
```javascript
const status = await window.appApi.shortcut.isRegistered();
console.log(status);
// { isRegistered: true, shortcut: 'Option+Command+Space' }
```

### Check database:
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db "SELECT * FROM settings;"
# Expected: 1|60|Option+Command+Space
```

### Run debug tool:
```bash
node debug-shortcut.js
```

---

## 🔧 Change Shortcut

### In DevTools Console:
```javascript
// Change to Command+Shift+M
await window.appApi.db.updateGlobalShortcut('Command+Shift+M');

// Verify
const status = await window.appApi.shortcut.isRegistered();
console.log(status.shortcut); // 'Command+Shift+M'
```

### Manually in Database:
```bash
sqlite3 ~/Library/Application\ Support/mindreel/mindreel.db \
  "UPDATE settings SET global_shortcut = 'Command+Shift+M' WHERE id = 1;"
```

---

## 🐛 Not Working?

### 1. Check console for errors
```
[GlobalShortcut] ✗ Failed to register
```
→ Another app is using this shortcut. Try a different one.

### 2. Try alternative shortcuts:
```javascript
await window.appApi.db.updateGlobalShortcut('Command+Shift+M');
await window.appApi.db.updateGlobalShortcut('F12');
await window.appApi.db.updateGlobalShortcut('Option+Command+N');
```

### 3. Check for conflicts:
System Settings → Keyboard → Keyboard Shortcuts

### 4. Reset to default:
```javascript
await window.appApi.db.resetSettings();
```

---

## 📝 Valid Format

✅ **VALID:**
- `Option+Command+Space` ← Current default
- `Command+Shift+M`
- `CommandOrControl+Shift+K` ← Cross-platform
- `F12`
- `Control+Alt+Space`

❌ **INVALID:**
- `Option+Command+Space+K` ← No multi-key sequences!
- `option+command+space` ← Must be capitalized
- `Option Space` ← Must use + separator

---

## 🚀 Common Shortcuts to Try

| Shortcut | Description |
|----------|-------------|
| `Option+Command+Space` | Default (current) |
| `Command+Shift+M` | Alternative 1 |
| `Command+Shift+Space` | Alternative 2 |
| `Option+Command+K` | Alternative 3 |
| `F12` | Simple function key |
| `Control+Shift+Space` | Cross-platform style |

---

## 📊 How It Works

1. App starts → Loads shortcut from database
2. Registers with Electron's globalShortcut API
3. User presses shortcut anywhere on system
4. Capture popup opens instantly
5. Works even when app is in background!

---

## 🎉 Success Checklist

- ✅ Console shows: `[GlobalShortcut] ✓ Successfully registered`
- ✅ Pressing shortcut opens popup
- ✅ Works when app in background
- ✅ Can change shortcut via DevTools
- ✅ Changes take effect immediately
- ✅ Shortcut persists after restart

---

## 📚 Full Documentation

- `GLOBAL_SHORTCUT_IMPLEMENTATION.md` - Complete implementation details
- `test-shortcut.md` - Comprehensive testing guide
- `debug-shortcut.js` - Diagnostic tool

---

**Last Updated:** 2025-01-17  
**Status:** ✅ Implemented and Tested