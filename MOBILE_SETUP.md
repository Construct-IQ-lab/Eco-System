# Eco-System Mobile App - Complete Setup Guide

This guide will walk you through the complete setup process for the Eco-System mobile app with offline sync capabilities.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Environment](#development-environment)
- [Android Setup](#android-setup)
- [iOS Setup](#ios-setup)
- [Testing the App](#testing-the-app)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js & npm**
   - Node.js v16 or higher
   - npm v8 or higher
   - Download from: https://nodejs.org/

2. **For Android Development:**
   - Android Studio (latest version)
   - Android SDK (API level 22 or higher, recommended: API 33)
   - Java Development Kit (JDK) 11 or higher
   - Download from: https://developer.android.com/studio

3. **For iOS Development (Mac only):**
   - macOS 12 or higher
   - Xcode 14 or higher
   - CocoaPods (install with: `sudo gem install cocoapods`)
   - Download from: https://developer.apple.com/xcode/

### System Requirements

- **Android:**
  - Minimum: Android 7.0 (API 24)
  - Recommended: Android 10+ (API 29+)
  - Storage: 500MB free space for app + data

- **iOS:**
  - Minimum: iOS 13.0
  - Recommended: iOS 15+
  - Storage: 500MB free space for app + data

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Construct-IQ-lab/Eco-System.git
cd Eco-System
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required Capacitor plugins and dependencies:
- @capacitor/core
- @capacitor/android
- @capacitor/ios
- @capacitor-community/sqlite
- @capacitor/camera
- @capacitor/filesystem
- @capacitor/network
- @capacitor/app
- @capacitor/preferences

### 3. Initialize Capacitor

If not already initialized:

```bash
npm run cap:init
```

When prompted:
- **App name:** Eco-System
- **App package ID:** com.constructiq.ecosystem
- **Web directory:** . (current directory)

### 4. Verify Configuration

Check that `capacitor.config.json` exists and contains:

```json
{
  "appId": "com.constructiq.ecosystem",
  "appName": "Eco-System",
  "webDir": ".",
  "bundledWebRuntime": false
}
```

## Development Environment

### Project Structure

```
Eco-System/
├── capacitor.config.json    # Capacitor configuration
├── package.json             # Dependencies and scripts
├── mobile-demo.html         # Demo UI
├── src/
│   ├── offline-sync.js      # SQLite database & sync
│   ├── network-monitor.js   # Network status tracking
│   ├── camera-helper.js     # Camera functionality
│   ├── sync-ui.js           # UI components
│   ├── app-mobile.js        # App initialization
│   └── demo-data.js         # Sample data
├── android/                 # Android platform (generated)
└── ios/                     # iOS platform (generated)
```

### Testing in Browser

Before testing on mobile, you can test the UI in a web browser:

```bash
npm start
```

Then open http://localhost:3000/mobile-demo.html

**Note:** Camera and SQLite features won't work in the browser, but you can test the UI and basic functionality.

## Android Setup

### 1. Add Android Platform

```bash
npm run cap:add:android
```

This creates the `android/` directory with the native Android project.

### 2. Configure Android Studio

1. Open Android Studio
2. Open the `android` folder as a project
3. Wait for Gradle sync to complete
4. Check SDK configuration:
   - File → Project Structure → SDK Location
   - Ensure Android SDK path is correct

### 3. Configure Permissions

The required permissions are already configured in the generated project, but verify in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 4. Sync Code to Android

After making changes to web code:

```bash
npm run cap:sync
```

This copies your web files to the Android project.

### 5. Open in Android Studio

```bash
npm run cap:open:android
```

### 6. Run on Device/Emulator

In Android Studio:
1. Create/start an Android emulator (Tools → Device Manager)
2. Or connect a physical device with USB debugging enabled
3. Click the Run button (▶️) or press Shift+F10

For more details, see [ANDROID_CONFIG.md](./ANDROID_CONFIG.md).

## iOS Setup

### 1. Add iOS Platform (Mac only)

```bash
npm run cap:add:ios
```

This creates the `ios/` directory with the native iOS project.

### 2. Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### 3. Configure Permissions

Edit `ios/App/App/Info.plist` to add camera and photo library permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture photos for audits</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to select photos for audits</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need permission to save photos to your library</string>
```

### 4. Sync Code to iOS

```bash
npm run cap:sync
```

### 5. Open in Xcode

```bash
npm run cap:open:ios
```

### 6. Configure Signing

In Xcode:
1. Select the project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Select your development team
5. Xcode will automatically generate a provisioning profile

### 7. Run on Simulator/Device

In Xcode:
1. Select a simulator or connected device from the device dropdown
2. Click the Run button (▶️) or press Cmd+R

For more details, see [IOS_CONFIG.md](./IOS_CONFIG.md).

## Testing the App

### Testing Offline Functionality

1. **Create an Audit Offline:**
   - Turn on airplane mode
   - Open the app
   - Go to Audits tab
   - Create a new audit with photos
   - Notice it's marked as "pending"

2. **Test Auto-Sync:**
   - Turn off airplane mode
   - App should automatically detect connection
   - Pending audits should sync automatically
   - Status should change to "synced"

3. **Test Manual Sync:**
   - Create multiple audits offline
   - Click "Sync Now" button
   - All pending items should sync

4. **Test Cached Data:**
   - View schedules, job cards, earnings while online
   - Turn on airplane mode
   - Data should still be visible (cached)

### Testing Camera

1. **Take Photo:**
   - Go to Audits tab
   - Click "Add Photo"
   - Select "Take Photo"
   - Capture image
   - Photo should appear in preview

2. **Select from Gallery:**
   - Click "Add Photo"
   - Select "From Gallery"
   - Choose existing photo
   - Photo should appear in preview

3. **Photo Compression:**
   - Take/select a large photo
   - Check console logs for size information
   - Photos should be compressed to ~80% quality

### Testing Database

1. **Data Persistence:**
   - Create audits with photos
   - Close app completely
   - Reopen app
   - Data should still be present

2. **Sync Queue:**
   - Create multiple audits offline
   - Check pending count in status bar
   - Sync should process them in order

## Building for Production

### Android APK/Bundle

1. **Generate Signing Key:**
   ```bash
   keytool -genkey -v -keystore eco-system.keystore -alias ecosystem -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Build:**
   - Place keystore in `android/app/`
   - Update `android/app/build.gradle` with signing config

3. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   
   Output: `android/app/build/outputs/apk/release/app-release.apk`

4. **Build App Bundle (for Play Store):**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   
   Output: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA

1. **Archive the App:**
   - Open project in Xcode
   - Select "Any iOS Device" as target
   - Product → Archive

2. **Distribute:**
   - Window → Organizer
   - Select your archive
   - Click "Distribute App"
   - Choose distribution method:
     - App Store Connect (for App Store)
     - Ad Hoc (for testing)
     - Enterprise (if you have enterprise account)

3. **Export IPA:**
   - Follow the distribution wizard
   - IPA will be exported to chosen location

## Troubleshooting

### Common Issues

#### "SQLite plugin not found"

**Solution:**
```bash
npm install @capacitor-community/sqlite
npm run cap:sync
```

#### "Camera permission denied"

**Solution:**
- **Android:** Check AndroidManifest.xml has CAMERA permission
- **iOS:** Check Info.plist has NSCameraUsageDescription
- Uninstall and reinstall app to reset permissions

#### "Network module not working"

**Solution:**
```bash
npm install @capacitor/network
npm run cap:sync
```

#### Android build fails

**Solution:**
- Check Java version: `java -version` (should be 11+)
- Check Android SDK installation
- Clean build: `cd android && ./gradlew clean`
- Invalidate Android Studio cache: File → Invalidate Caches

#### iOS build fails

**Solution:**
- Run `pod install` in `ios/App` directory
- Clean build folder: Product → Clean Build Folder in Xcode
- Update CocoaPods: `sudo gem install cocoapods`

#### App crashes on startup

**Solution:**
1. Check browser console (Chrome DevTools for Android)
2. Check Xcode console for iOS
3. Verify all plugins are installed: `npm run cap:sync`
4. Check capacitor.config.json is valid JSON

#### Database initialization fails

**Solution:**
- Check device storage space
- Verify SQLite plugin installation
- Check console logs for specific error
- Try clearing app data/cache

### Debug Logs

#### Android (Chrome DevTools):
1. Connect device via USB
2. Open Chrome: `chrome://inspect`
3. Click "inspect" under your app
4. View console logs

#### iOS (Safari Web Inspector):
1. Enable on device: Settings → Safari → Advanced → Web Inspector
2. Connect device
3. Safari → Develop → [Your Device] → [App]
4. View console logs

#### Xcode Console:
1. Run app from Xcode
2. View logs in bottom console panel
3. Filter by "Capacitor" or "SQLite"

### Getting Help

- **GitHub Issues:** https://github.com/Construct-IQ-lab/Eco-System/issues
- **Capacitor Docs:** https://capacitorjs.com/docs
- **SQLite Plugin:** https://github.com/capacitor-community/sqlite

## Next Steps

After successful setup:

1. Review [QUICKSTART_MOBILE.md](./QUICKSTART_MOBILE.md) for quick development guide
2. Check [API_INTEGRATION.md](./API_INTEGRATION.md) to integrate with your backend
3. Customize the UI in `mobile-demo.html`
4. Add your business logic to `src/app-mobile.js`
5. Configure backend endpoints for production sync

## Additional Resources

- [Android Configuration Guide](./ANDROID_CONFIG.md)
- [iOS Configuration Guide](./IOS_CONFIG.md)
- [API Integration Guide](./API_INTEGRATION.md)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [SQLite Plugin Documentation](https://github.com/capacitor-community/sqlite)
