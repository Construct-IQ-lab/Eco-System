# Eco-System Mobile - Quick Start Guide

Get up and running with the Eco-System mobile app in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- For Android: Android Studio installed
- For iOS: Xcode installed (Mac only)

## Quick Setup (5 Minutes)

### Step 1: Install Dependencies (1 min)

```bash
npm install
```

### Step 2: Add Platform (1 min)

**For Android:**
```bash
npm run cap:add:android
```

**For iOS (Mac only):**
```bash
npm run cap:add:ios
cd ios/App && pod install && cd ../..
```

### Step 3: Sync and Open (1 min)

**For Android:**
```bash
npm run cap:sync
npm run cap:open:android
```

**For iOS:**
```bash
npm run cap:sync
npm run cap:open:ios
```

### Step 4: Run (2 min)

**Android Studio:**
- Select device/emulator
- Click Run ▶️

**Xcode:**
- Select simulator/device
- Click Run ▶️ (or Cmd+R)

Done! 🎉

## Testing the Demo

### 1. View Cached Data
- Open app
- Switch between tabs: Schedule, Job Cards, Audits, Earnings
- All tabs show demo data loaded from SQLite cache

### 2. Create Audit Offline
- Go to **Audits** tab
- Fill in title: "Daily Safety Check"
- Add notes: "All safety equipment verified"
- Click **Add Photo** (camera/gallery)
- Click **Create Audit**
- ✅ Audit created and queued for sync

### 3. Test Sync Status
- Notice status bar at top shows:
  - 🟡 "Online (1 pending)" - if audit not synced
  - 🟢 "Online & Synced" - if all synced
  - 🔴 "Offline (X pending)" - if no connection

### 4. Manual Sync
- Click **Sync Now** button
- Watch status change to 🟡 "Syncing"
- Should complete and show 🟢 "Online & Synced"

### 5. Test Offline Mode
- **Android:** Enable airplane mode in device settings
- **iOS:** Enable airplane mode in simulator
- Status should show 🔴 "Offline"
- Create another audit - it will queue
- Disable airplane mode
- App should auto-detect and sync

## Project Structure Quick Reference

```
Eco-System/
├── mobile-demo.html          # Demo UI - start here!
├── src/
│   ├── app-mobile.js         # Main app logic - customize here
│   ├── offline-sync.js       # Database operations
│   ├── camera-helper.js      # Camera functions
│   ├── sync-ui.js            # Status UI components
│   └── demo-data.js          # Sample data
├── capacitor.config.json     # App configuration
└── package.json              # Dependencies
```

## Quick Customization

### Change App Name/ID

Edit `capacitor.config.json`:
```json
{
  "appId": "com.yourcompany.yourapp",
  "appName": "Your App Name"
}
```

Then:
```bash
npm run cap:sync
```

### Add Your API Endpoints

Edit `src/app-mobile.js`, find `apiRequest()` method:

```javascript
async apiRequest(endpoint, method = 'GET', data = null) {
  const API_BASE = 'https://your-api.com'; // ← Change this
  
  const response = await fetch(API_BASE + endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    },
    body: data ? JSON.stringify(data) : null
  });
  
  return response.json();
}
```

### Customize UI

Edit `mobile-demo.html` - it's a single HTML file with inline CSS and JavaScript. Look for:

- **Colors:** Search for `#4CAF50` (green) and replace
- **Layout:** Modify `.card`, `.tab`, etc. in `<style>` section
- **Content:** Edit HTML in `<body>` section
- **Logic:** Modify JavaScript in `<script type="module">` section

## Common Development Tasks

### Sync Changes After Code Updates

```bash
npm run cap:sync
```

Run this whenever you modify web code (HTML, JS, CSS).

### View Console Logs

**Android (Chrome DevTools):**
1. Connect device via USB
2. Chrome: `chrome://inspect`
3. Click "inspect"

**iOS (Safari):**
1. Device: Settings → Safari → Advanced → Web Inspector
2. Safari → Develop → [Device] → [App]

**Xcode Console:**
- Just run from Xcode, logs appear in bottom panel

### Clean Build

**Android:**
```bash
cd android
./gradlew clean
cd ..
```

**iOS:**
- Xcode → Product → Clean Build Folder

## Quick Tips

### 1. Fast Development Cycle

For quick UI changes:
1. Edit `mobile-demo.html`
2. Run `npm run cap:sync`
3. Reload app (or use live reload)

### 2. Test Without Device

Open `mobile-demo.html` directly in browser:
```bash
npm start
# Then open http://localhost:3000/mobile-demo.html
```

**Note:** Camera and SQLite won't work, but UI will.

### 3. Debugging SQLite

Add to your code:
```javascript
import offlineSync from './src/offline-sync.js';

// View all audits
const audits = await offlineSync.getAudits();
console.log('All audits:', audits);

// View pending count
const count = await offlineSync.getPendingSyncCount();
console.log('Pending:', count);
```

### 4. Reset Database

To clear all data during development:
```javascript
import offlineSync from './src/offline-sync.js';
await offlineSync.clearAllData();
```

Or uninstall/reinstall the app.

## Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| "SQLite not found" | `npm install @capacitor-community/sqlite && npm run cap:sync` |
| Changes not showing | `npm run cap:sync` then reload app |
| Android build fails | Check Java 11+ installed, clean build |
| iOS build fails | Run `pod install` in `ios/App/` |
| App crashes | Check console logs, verify all plugins installed |
| Camera not working | Check permissions in AndroidManifest.xml / Info.plist |

## Next Steps

Once you're comfortable with the basics:

1. **Read Full Guide:** [MOBILE_SETUP.md](./MOBILE_SETUP.md)
2. **API Integration:** [API_INTEGRATION.md](./API_INTEGRATION.md)
3. **Android Details:** [ANDROID_CONFIG.md](./ANDROID_CONFIG.md)
4. **iOS Details:** [IOS_CONFIG.md](./IOS_CONFIG.md)

## Useful NPM Scripts

```bash
# Add platforms
npm run cap:add:android
npm run cap:add:ios

# Sync web code to native projects
npm run cap:sync

# Open in IDE
npm run cap:open:android
npm run cap:open:ios

# Copy web assets only (faster than sync)
npm run cap:copy

# Start local dev server
npm start
```

## Quick Demo Script

Want to show someone the app? Follow this script:

1. **Open app** - "This is the Eco-System mobile app"
2. **Show Schedule tab** - "View cached work schedules offline"
3. **Show Job Cards** - "Track job progress"
4. **Go to Audits** - "Create site audits with photos"
5. **Click Add Photo** - "Capture evidence with camera"
6. **Create audit** - "Works completely offline"
7. **Show status bar** - "See sync status - currently 1 pending"
8. **Click Sync Now** - "Manual sync when needed"
9. **Show Earnings** - "View cached earnings data"
10. **Enable airplane mode** - "Everything still works offline"

## Getting Help

- **Issues:** https://github.com/Construct-IQ-lab/Eco-System/issues
- **Docs:** Full documentation in `MOBILE_SETUP.md`
- **Capacitor:** https://capacitorjs.com/docs

Happy coding! 🚀
