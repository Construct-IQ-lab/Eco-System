# 🚀 Deployment Guide - Getting Your Mobile App Live

This guide explains how to deploy the Eco-System mobile app and distribute it to field workers.

## Table of Contents
- [Option 1: Google Play Store (Android)](#option-1-google-play-store-android)
- [Option 2: Apple App Store (iOS)](#option-2-apple-app-store-ios)
- [Option 3: Direct Distribution (Testing)](#option-3-direct-distribution-testing)
- [Setting Up Your Backend API](#setting-up-your-backend-api)
- [How Field Workers Download the App](#how-field-workers-download-the-app)

---

## Prerequisites

Before deployment, you need:

1. **Development Environment Setup**
   ```bash
   npm install
   npm run cap:add:android  # For Android
   npm run cap:add:ios      # For iOS (Mac only)
   ```

2. **Backend API** (see [Setting Up Your Backend API](#setting-up-your-backend-api) below)

3. **Developer Accounts**
   - Google Play Console ($25 one-time fee) for Android
   - Apple Developer Program ($99/year) for iOS

---

## Option 1: Google Play Store (Android)

### Step 1: Build the APK/AAB

1. **Update API endpoint** in `src/app-mobile.js`:
   ```javascript
   async apiRequest(endpoint, method = 'GET', data = null) {
     const API_BASE = 'https://your-actual-api.com'; // ← Change this!
     // ... rest of implementation
   }
   ```

2. **Sync code to Android**:
   ```bash
   npm run cap:sync
   npm run cap:open:android
   ```

3. **In Android Studio**:
   - Update version in `android/app/build.gradle`:
     ```gradle
     versionCode 1
     versionName "1.0.0"
     ```
   - Generate signed App Bundle:
     - Build → Generate Signed Bundle / APK
     - Choose "Android App Bundle"
     - Create or use existing keystore (KEEP THIS SAFE!)
     - Click "release" build variant
     - Build

   Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 2: Create Google Play Console Account

1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Create new app:
   - App name: "Eco-System"
   - Default language: English
   - App/Game: Application
   - Free/Paid: Free

### Step 3: Complete Store Listing

Fill out required info:
- **App details**: Short & full description
- **Graphics**: 
  - App icon (512x512 PNG)
  - Feature graphic (1024x500)
  - Screenshots (at least 2):
    - Phone: 16:9 aspect ratio (1920x1080 or similar)
    - Use the screenshots from PR description!
- **Categorization**: Business / Productivity
- **Contact details**: Your email & privacy policy URL
- **Store listing**: Content rating questionnaire

### Step 4: Upload App Bundle

1. Production → Create new release
2. Upload the `app-release.aab` file
3. Add release notes: "Initial release with offline sync capabilities"
4. Review and roll out

### Step 5: Submit for Review

- Review all sections (must be complete)
- Click "Submit for review"
- **Wait time**: Usually 1-3 days for first review

### Step 6: Publish!

Once approved:
- Click "Publish" in Production track
- App goes live within a few hours
- Available worldwide on Google Play Store

---

## Option 2: Apple App Store (iOS)

### Step 1: Apple Developer Account

1. Enroll at https://developer.apple.com/programs/
2. Pay $99/year enrollment fee
3. Wait for approval (1-2 days)

### Step 2: Create App ID & Certificates

1. **App ID**:
   - Go to developer.apple.com → Certificates, IDs & Profiles
   - Create App ID: `com.constructiq.ecosystem`
   - Enable capabilities (if needed)

2. **Certificates**:
   - Create iOS Distribution certificate
   - Download and install in Keychain

3. **Provisioning Profile**:
   - Create App Store provisioning profile
   - Select your App ID and distribution certificate
   - Download and install

### Step 3: Build the App

1. **Update API endpoint** in `src/app-mobile.js` (same as Android)

2. **Sync code to iOS**:
   ```bash
   npm run cap:sync
   npm run cap:open:ios
   ```

3. **In Xcode**:
   - Update version: General → Identity → Version (1.0.0), Build (1)
   - Select "Any iOS Device" as target
   - Product → Archive
   - Wait for archive to complete

### Step 4: App Store Connect Setup

1. Go to https://appstoreconnect.apple.com/
2. My Apps → + → New App
3. Fill in:
   - Platform: iOS
   - Name: Eco-System
   - Primary Language: English
   - Bundle ID: com.constructiq.ecosystem
   - SKU: ecosystem001 (any unique ID)

### Step 5: Complete App Information

- **App Information**: Category, content rights
- **Pricing**: Free
- **App Privacy**: Data collection details
- **Screenshots**: 
  - iPhone 6.7" display (required)
  - Use screenshots from PR description, resize to 1290x2796
- **Description**: App description and keywords
- **Support URL**: Your website or support page

### Step 6: Submit for Review

1. In Xcode Organizer:
   - Select archive → Distribute App
   - App Store Connect → Upload
   - Wait for processing (10-30 minutes)

2. In App Store Connect:
   - Select uploaded build
   - Fill out "What to Test" notes
   - Submit for review

**Review time**: Typically 24-48 hours

### Step 7: Release

Once approved:
- Choose manual or automatic release
- App goes live on App Store!

---

## Option 3: Direct Distribution (Testing)

**Best for**: Testing with your team before public release

### Android - APK Distribution

1. **Build APK** (not AAB):
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   
   Output: `android/app/build/outputs/apk/release/app-release.apk`

2. **Sign the APK** (if not already signed):
   - Generate keystore (first time only):
     ```bash
     keytool -genkey -v -keystore ecosystem.keystore \
       -alias ecosystem -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Configure signing in `android/app/build.gradle`
   - Rebuild

3. **Distribute**:
   - Upload APK to your website, Google Drive, or Dropbox
   - Share link with field workers
   - **Installation**: 
     - Download APK on Android device
     - Enable "Install from Unknown Sources" in settings
     - Tap APK file to install

### iOS - TestFlight (Beta Testing)

1. **Upload to App Store Connect** (same as Step 6 in App Store process)

2. **TestFlight**:
   - App Store Connect → TestFlight
   - Add internal testers (up to 100, instant access)
   - Add external testers (up to 10,000, requires review)

3. **Distribution**:
   - Testers install "TestFlight" app from App Store
   - Send them invite link or email
   - They click invite → Opens TestFlight → Install app

---

## Setting Up Your Backend API

**Critical**: The app needs a working backend API to sync data.

### Quick Backend Setup

1. **Update API endpoint** in `src/app-mobile.js`:
   ```javascript
   const API_BASE = 'https://api.yourcompany.com';
   ```

2. **Implement required endpoints** (see `API_INTEGRATION.md`):
   ```
   POST /api/mobile/auth/login
   POST /api/mobile/sync/audits
   POST /api/mobile/uploads
   GET  /api/mobile/user/schedule
   GET  /api/mobile/user/job-cards
   GET  /api/mobile/user/earnings
   ```

3. **Example with Node.js/Express**:
   ```javascript
   // Example endpoint
   app.post('/api/mobile/sync/audits', authenticateToken, async (req, res) => {
     const { audits } = req.body;
     // Save to database
     // Return sync results
     res.json({ success: true, synced: [...] });
   });
   ```

4. **Deploy backend** to:
   - AWS (EC2, Lambda)
   - Google Cloud
   - Heroku
   - DigitalOcean
   - Your own server

### Testing Without Backend

For testing, the app currently uses **mock API** responses. To test:

```bash
npm start
# Open http://localhost:3000/mobile-demo.html
```

This works in browser without needing the mobile setup!

---

## How Field Workers Download the App

### After Publishing to Stores:

#### Android (Google Play Store)
1. Open Google Play Store app on phone
2. Search for "Eco-System"
3. Tap "Install"
4. Open app and log in

**OR** send direct link:
```
https://play.google.com/store/apps/details?id=com.constructiq.ecosystem
```

#### iOS (Apple App Store)
1. Open App Store app on iPhone/iPad
2. Search for "Eco-System"
3. Tap "Get"
4. Open app and log in

**OR** send direct link:
```
https://apps.apple.com/app/eco-system/idXXXXXXXXX
```

### For Direct Distribution (APK):
1. Send APK file or download link
2. Field worker downloads on Android phone
3. Enable "Install from Unknown Sources" if prompted
4. Tap APK to install
5. Open app and log in

---

## Timeline Summary

| Step | Time Estimate |
|------|---------------|
| Setup development environment | 1-2 hours |
| Configure backend API | 4-8 hours |
| Build and test locally | 2-3 hours |
| Create store accounts | 1-2 days (waiting for approval) |
| Complete store listings | 2-4 hours |
| Submit for review | - |
| **Android review** | 1-3 days |
| **iOS review** | 1-2 days |
| **Total to live** | **3-7 days** |

---

## Quick Start Checklist

- [ ] 1. Set up development environment (`npm install`, add platforms)
- [ ] 2. Deploy backend API with required endpoints
- [ ] 3. Update API URL in `src/app-mobile.js`
- [ ] 4. Test app locally (Android Studio / Xcode)
- [ ] 5. Create developer accounts (Google Play / Apple)
- [ ] 6. Build release version (AAB for Android, Archive for iOS)
- [ ] 7. Create store listings with screenshots
- [ ] 8. Upload builds and submit for review
- [ ] 9. Wait for approval (1-3 days)
- [ ] 10. Publish and share links with field workers!

---

## Common Questions

**Q: Do I need both Android and iOS?**
A: No! Start with just Android if most field workers use Android phones. Add iOS later if needed.

**Q: Can I test before publishing to stores?**
A: Yes! Use direct APK distribution for Android, or TestFlight for iOS.

**Q: What if I don't have a backend API yet?**
A: The app will work for demo purposes (locally), but you need a backend for production sync functionality.

**Q: How much does it cost?**
A: 
- Google Play: $25 one-time
- Apple Store: $99/year
- Backend hosting: $5-50/month depending on service
- Total first year: ~$130-200

**Q: How do I update the app later?**
A: Build new version with higher version code/number, upload to stores, users get automatic updates.

---

## Next Steps

1. **Immediate**: Follow [QUICKSTART_MOBILE.md](./QUICKSTART_MOBILE.md) to set up locally
2. **This week**: Deploy backend API (see [API_INTEGRATION.md](./API_INTEGRATION.md))
3. **Next week**: Create store accounts and prepare listings
4. **Week 2-3**: Submit for review and launch!

## Need Help?

- **Setup issues**: See [MOBILE_SETUP.md](./MOBILE_SETUP.md) troubleshooting
- **Android specific**: [ANDROID_CONFIG.md](./ANDROID_CONFIG.md)
- **iOS specific**: [IOS_CONFIG.md](./IOS_CONFIG.md)
- **API integration**: [API_INTEGRATION.md](./API_INTEGRATION.md)

Good luck with your launch! 🚀
