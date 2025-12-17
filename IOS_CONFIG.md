# iOS Configuration Guide

Complete guide for iOS-specific configuration for the Eco-System mobile app.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Permissions](#permissions)
- [App Signing & Certificates](#app-signing--certificates)
- [Build Configuration](#build-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **macOS**
   - Version: macOS 12 (Monterey) or higher
   - Apple Silicon (M1/M2) or Intel Mac

2. **Xcode**
   - Version: Xcode 14 or higher
   - Download: App Store or https://developer.apple.com/xcode/
   - Command Line Tools installed:
     ```bash
     xcode-select --install
     ```

3. **CocoaPods**
   - Install:
     ```bash
     sudo gem install cocoapods
     ```
   - Verify:
     ```bash
     pod --version
     ```

4. **Apple Developer Account**
   - Free account: Can test on your own devices
   - Paid ($99/year): Required for App Store distribution
   - Sign up: https://developer.apple.com/

### Verify Installation

```bash
# Check Xcode
xcodebuild -version

# Check CocoaPods
pod --version

# Check Node.js
node --version
npm --version
```

## Initial Setup

### 1. Add iOS Platform

```bash
npm run cap:add:ios
```

This creates the `ios/` directory structure:
```
ios/
├── App/
│   ├── App/
│   │   ├── Info.plist
│   │   ├── AppDelegate.swift
│   │   └── public/
│   ├── App.xcodeproj
│   └── App.xcworkspace  ← Open this in Xcode
└── Podfile
```

### 2. Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

**Note:** Always use `App.xcworkspace` (not `.xcodeproj`) after running `pod install`.

### 3. Open in Xcode

```bash
npm run cap:open:ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

### 4. First-Time Xcode Setup

When opening for the first time:
1. Xcode may prompt to "Trust" the project - click "Trust"
2. Wait for indexing to complete (progress bar in top center)
3. Select "App" scheme and a simulator from the device dropdown

## Permissions

### Required Permissions

Add these to `ios/App/App/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Camera access for taking audit photos -->
    <key>NSCameraUsageDescription</key>
    <string>We need camera access to capture photos for site audits and documentation</string>
    
    <!-- Photo library access for selecting existing photos -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>We need access to your photo library to select photos for audits</string>
    
    <!-- Saving photos to library (optional) -->
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>We need permission to save audit photos to your photo library</string>
    
    <!-- Network usage (for background sync) -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>  <!-- Only for development with HTTP. Use HTTPS in production! -->
    </dict>
    
    <!-- Existing Capacitor configuration -->
    <!-- ... -->
</dict>
</plist>
```

### Permission Descriptions Best Practices

Make descriptions:
- **Clear:** Explain what feature needs the permission
- **Specific:** Mention "audits" or your use case
- **User-friendly:** Avoid technical jargon

### Testing Permissions

1. **Grant permissions:**
   - Run app
   - Click "Add Photo"
   - Tap "Allow" when prompted

2. **Revoke permissions:**
   - Settings → Privacy → Camera
   - Toggle off for "Eco-System"
   - Reopen app and try camera

3. **Check permission status:**
   ```swift
   import AVFoundation
   let status = AVCaptureDevice.authorizationStatus(for: .video)
   ```

## App Signing & Certificates

### Development Signing (Free Account)

1. **Add Apple ID to Xcode:**
   - Xcode → Preferences → Accounts
   - Click "+" → Add Apple ID
   - Sign in with your Apple ID

2. **Configure Signing:**
   - Select "App" target in Project Navigator
   - Select "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your Team from dropdown
   - Xcode creates certificates automatically

3. **Bundle Identifier:**
   - Must be unique: `com.constructiq.ecosystem`
   - Or use: `com.yourname.ecosystem` for testing

### Production Signing (Paid Account - $99/year)

#### 1. Create App ID

1. Go to https://developer.apple.com/account
2. Certificates, IDs & Profiles → Identifiers
3. Click "+" to create new App ID
4. Select "App IDs" → Continue
5. Configure:
   - Description: "Eco-System"
   - Bundle ID: `com.constructiq.ecosystem` (Explicit)
   - Capabilities: Check "Associated Domains" if needed
6. Click "Register"

#### 2. Create Certificates

**Development Certificate:**
1. Certificates, IDs & Profiles → Certificates
2. Click "+" → iOS App Development
3. Follow prompts (Xcode can do this automatically)

**Distribution Certificate:**
1. Certificates, IDs & Profiles → Certificates
2. Click "+" → iOS Distribution
3. Create CSR (Certificate Signing Request):
   ```
   Keychain Access → Certificate Assistant → Request Certificate from CA
   ```
4. Upload CSR and download certificate
5. Double-click certificate to install in Keychain

#### 3. Create Provisioning Profiles

**Development Profile:**
1. Profiles → Click "+"
2. Select "iOS App Development"
3. Choose your App ID
4. Select certificates and devices
5. Download and double-click to install

**Distribution Profile (App Store):**
1. Profiles → Click "+"
2. Select "App Store"
3. Choose your App ID
4. Select distribution certificate
5. Download and double-click to install

#### 4. Configure in Xcode

1. Select "App" target
2. Signing & Capabilities tab
3. Uncheck "Automatically manage signing" for more control
4. Select appropriate provisioning profile for Debug/Release

### Trust Certificate on Device

When testing on physical device with free account:

1. Install app on device
2. Settings → General → VPN & Device Management
3. Tap on your developer account
4. Tap "Trust"

## Build Configuration

### Target and Deployment

Edit in Xcode (Project → App → Build Settings):

```
Deployment Target: iOS 13.0 (minimum)
Architectures: Standard (arm64)
Supported Platforms: iOS
```

Or edit `ios/App/App.xcodeproj/project.pbxproj`:

```
IPHONEOS_DEPLOYMENT_TARGET = 13.0;
```

### Version and Build Number

Update before each release:

1. **In Xcode:**
   - Select "App" target
   - General tab
   - Identity section:
     - Version: `1.0.0` (semantic version)
     - Build: `1` (increment integer)

2. **In Info.plist:**
   ```xml
   <key>CFBundleShortVersionString</key>
   <string>1.0.0</string>
   <key>CFBundleVersion</key>
   <string>1</string>
   ```

### App Icon

1. **Prepare icons:**
   - Multiple sizes required (20px - 1024px)
   - Use app icon generator: https://appicon.co/

2. **Add to Xcode:**
   - Open `ios/App/App/Assets.xcassets`
   - Select "AppIcon"
   - Drag and drop images into appropriate slots
   - Or use Xcode's Asset Catalog

### Launch Screen (Splash)

Edit `ios/App/App/Base.lproj/LaunchScreen.storyboard`:

1. Open in Xcode Interface Builder
2. Design your splash screen
3. Or use simple image/logo approach

Alternatively, use `capacitor.config.json`:
```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#4CAF50",
      "showSpinner": false
    }
  }
}
```

## Testing

### Run on Simulator

1. **Select Simulator:**
   - Click device dropdown in Xcode toolbar
   - Choose simulator (e.g., "iPhone 14")

2. **Run:**
   - Click Run button (▶️)
   - Or press Cmd+R

3. **Common Simulators:**
   - iPhone 14 Pro (test latest)
   - iPhone SE (test small screen)
   - iPad Pro (test tablet)

### Run on Physical Device

1. **Connect Device:**
   - Connect iPhone/iPad via USB
   - Trust computer on device when prompted

2. **Select Device:**
   - Device appears in Xcode device dropdown
   - Select your device

3. **Run:**
   - Click Run (▶️)
   - First time: Install takes longer, app opens automatically

### Test Offline Mode

**On Simulator:**
1. Settings app → Wi-Fi → Toggle off
2. Or: Hardware → Network Link Conditioner

**On Device:**
1. Control Center → Airplane Mode on

### View Console Logs

**In Xcode:**
- Run app
- View logs in Debug area (bottom panel)
- Filter: Type "Capacitor" or "SQLite" in search box

**Safari Web Inspector:**
1. Enable on device:
   - Settings → Safari → Advanced → Web Inspector
2. Connect device and run app
3. Safari → Develop → [Device Name] → [App]
4. View console, network, storage, etc.

### Database Inspection

**On Simulator:**
```bash
# Find app container
xcrun simctl get_app_container booted com.constructiq.ecosystem data

# Navigate to database
cd /path/from/above/Library/LocalDatabase

# Open database
sqlite3 ecosystemdb.db
.tables
SELECT * FROM audits;
```

**On Device:**
- Use Xcode → Window → Devices and Simulators
- Download container
- Browse files

## Building for Distribution

### Archive the App

1. **Select Device:**
   - Change device target to "Any iOS Device"

2. **Create Archive:**
   - Product → Archive
   - Wait for archive to complete (may take several minutes)
   - Organizer window opens automatically

3. **Verify Archive:**
   - Window → Organizer
   - Archives tab
   - See your app archives listed

### Distribute to TestFlight

1. **In Organizer:**
   - Select archive
   - Click "Distribute App"

2. **Select Method:**
   - Choose "App Store Connect"
   - Click "Next"

3. **Options:**
   - Upload symbols: Yes (for crash reports)
   - Upload bitcode: Yes (if enabled)
   - Click "Next"

4. **Sign and Upload:**
   - Select automatic signing
   - Click "Upload"
   - Wait for upload to complete

5. **TestFlight:**
   - Go to App Store Connect
   - My Apps → Your App → TestFlight
   - Add test information (What to Test)
   - Add internal/external testers
   - Submit for review (external testing only)

### Distribute to App Store

1. **Prepare in App Store Connect:**
   - Create app listing
   - Add screenshots (required sizes)
   - Write description
   - Set pricing
   - Add privacy policy URL

2. **Submit Build:**
   - Select build from TestFlight
   - Answer questions
   - Submit for review

3. **Review Process:**
   - Typically 24-48 hours
   - May have questions from review team
   - Approve or reject decision

### Export IPA (Ad Hoc/Enterprise)

1. **In Organizer:**
   - Select archive
   - Click "Distribute App"

2. **Select Method:**
   - Ad Hoc: For specific devices (up to 100)
   - Enterprise: For company internal distribution

3. **Export:**
   - Follow wizard
   - IPA exported to chosen folder

4. **Install:**
   - Use Xcode Devices window
   - Or over-the-air with manifest plist

## Troubleshooting

### CocoaPods Issues

**Problem:** `pod install` fails

**Solutions:**
1. Update CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

2. Clear cache:
   ```bash
   pod cache clean --all
   pod deintegrate
   pod install
   ```

3. Update repo:
   ```bash
   pod repo update
   ```

### Signing Issues

**Problem:** "Signing for 'App' requires a development team"

**Solutions:**
1. Add Apple ID to Xcode (Preferences → Accounts)
2. Select team in Signing & Capabilities
3. Ensure bundle ID is unique

**Problem:** "Could not find developer identity"

**Solutions:**
1. Check certificates in Keychain Access
2. Download certificates from developer.apple.com
3. Let Xcode manage signing automatically

### Build Failures

**Problem:** Build fails with "Command PhaseScriptExecution failed"

**Solutions:**
1. Clean build folder: Product → Clean Build Folder (Cmd+Shift+K)
2. Delete derived data:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Run `pod install` again

**Problem:** "Module not found"

**Solutions:**
1. Check pod installation:
   ```bash
   cd ios/App && pod install
   ```
2. Clean and rebuild
3. Restart Xcode

### SQLite Plugin Issues

**Problem:** SQLite not working on iOS

**Solutions:**
1. Verify plugin installed:
   ```bash
   npm install @capacitor-community/sqlite
   npm run cap:sync
   ```

2. Check Podfile includes SQLite pod
3. Run `pod install` in `ios/App`

### Camera Not Working

**Problem:** Camera doesn't open or permission denied

**Solutions:**
1. Check Info.plist has `NSCameraUsageDescription`
2. Test on physical device (camera doesn't work on simulator)
3. Reset permissions: Settings → General → Reset → Reset Location & Privacy

### App Crashes on Launch

**Problem:** App crashes immediately after launch

**Solutions:**
1. Check Xcode console for error messages
2. Verify capacitor.config.json is valid
3. Clean build and retry
4. Check all required pods are installed

### Network Requests Fail

**Problem:** API calls fail with security error

**Solution:**
Enable arbitrary loads for development (use HTTPS in production):

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

For production, use proper HTTPS or configure specific domains:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>your-api-domain.com</key>
        <dict>
            <key>NSIncludesSubdomains</key>
            <true/>
            <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

## Performance Optimization

### App Size Optimization

1. **Enable Bitcode:**
   - Build Settings → Enable Bitcode → Yes

2. **Strip symbols:**
   - Build Settings → Strip Debug Symbols → Yes (Release only)

3. **Optimize images:**
   - Use Asset Catalog
   - Compress images
   - Use appropriate formats (PNG for graphics, JPEG for photos)

### Launch Time Optimization

1. **Minimize launch screen delay:**
   ```json
   "SplashScreen": {
     "launchShowDuration": 1000
   }
   ```

2. **Lazy load resources:**
   - Load data after app is visible
   - Use async/await

### Memory Management

1. **Monitor memory:**
   - Xcode → Debug → Memory Report
   - Watch for leaks

2. **Clear caches:**
   - Clear old database records
   - Remove cached images periodically

## Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [CocoaPods Documentation](https://guides.cocoapods.org/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Next Steps

After iOS setup:
1. Test on multiple device sizes
2. Test offline functionality thoroughly
3. Prepare App Store assets (screenshots, description)
4. Submit to TestFlight for beta testing
5. Gather feedback and iterate
6. Submit to App Store
