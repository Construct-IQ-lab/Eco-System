# Android Configuration Guide

Complete guide for Android-specific configuration for the Eco-System mobile app.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Permissions](#permissions)
- [App Signing](#app-signing)
- [Build Configuration](#build-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Android Studio**
   - Version: Latest stable (Electric Eel or newer recommended)
   - Download: https://developer.android.com/studio
   - Components needed:
     - Android SDK
     - Android SDK Platform (API 24+)
     - Android SDK Build-Tools
     - Android Emulator
     - Intel x86 Emulator Accelerator (HAXM) or equivalent

2. **Java Development Kit (JDK)**
   - Version: JDK 11 or higher
   - Check version: `java -version`
   - Download: https://adoptium.net/ (recommended)

3. **Environment Variables**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export JAVA_HOME=/path/to/your/jdk
   ```

### Verify Installation

```bash
# Check Java
java -version

# Check Android SDK
adb --version

# Check Gradle
cd android
./gradlew --version
```

## Initial Setup

### 1. Add Android Platform

```bash
npm run cap:add:android
```

This creates the `android/` directory structure:
```
android/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/
│   │       └── res/
│   └── build.gradle
├── build.gradle
├── gradle.properties
├── settings.gradle
└── gradlew
```

### 2. Open in Android Studio

```bash
npm run cap:open:android
```

Or manually:
1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `android/` folder
4. Click "OK"

### 3. Initial Gradle Sync

Android Studio will automatically sync Gradle. This may take a few minutes on first run.

If sync fails:
- File → Invalidate Caches / Restart
- Try again

## Permissions

### Required Permissions

The app requires these permissions (configured in `android/app/src/main/AndroidManifest.xml`):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.constructiq.ecosystem">

    <!-- Internet access for API sync -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Network state for offline detection -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Camera for taking audit photos -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Storage for photo access (Android 12 and below) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="32" />
    
    <!-- Photo picker (Android 13+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- Camera hardware (optional - app works without camera) -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application>
        <!-- App content -->
    </application>
</manifest>
```

### Permission Handling

The app requests permissions at runtime:

1. **Camera:** Requested when user clicks "Add Photo"
2. **Storage:** Requested when selecting photos from gallery
3. **Internet/Network:** Granted automatically (not dangerous permissions)

### Testing Permissions

To test permission flows:

1. **Grant permissions:**
   - Run app
   - Click "Add Photo"
   - Grant camera permission when prompted

2. **Revoke permissions:**
   ```bash
   adb shell pm revoke com.constructiq.ecosystem android.permission.CAMERA
   ```

3. **Check granted permissions:**
   ```bash
   adb shell pm list permissions -g
   adb shell dumpsys package com.constructiq.ecosystem | grep permission
   ```

## App Signing

### Development Signing (Default)

Android Studio automatically uses a debug keystore for development:
- Location: `~/.android/debug.keystore`
- Alias: `androiddebugkey`
- Password: `android`

No configuration needed for development.

### Production Signing

#### 1. Generate Release Keystore

```bash
keytool -genkey -v -keystore eco-system-release.keystore \
  -alias ecosystem \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be prompted for:
- Keystore password (remember this!)
- Key password (remember this!)
- Your name/organization details

**IMPORTANT:** Keep this keystore file secure! You cannot publish updates without it.

#### 2. Create Keystore Properties File

Create `android/keystore.properties`:

```properties
storeFile=/path/to/eco-system-release.keystore
storePassword=your_keystore_password
keyAlias=ecosystem
keyPassword=your_key_password
```

**IMPORTANT:** Add to `.gitignore`:
```
android/keystore.properties
*.keystore
```

#### 3. Configure build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    // ... existing config

    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            if (keystorePropertiesFile.exists()) {
                def keystoreProperties = new Properties()
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Build Configuration

### Target SDK and Minimum SDK

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.constructiq.ecosystem"
        minSdkVersion 24  // Android 7.0
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Version Management

Update version for each release:
- `versionCode`: Increment integer (1, 2, 3, ...)
- `versionName`: Semantic version string ("1.0.0", "1.0.1", ...)

### App Icon

Replace icons in `android/app/src/main/res/`:
```
mipmap-hdpi/ic_launcher.png       (72x72)
mipmap-mdpi/ic_launcher.png       (48x48)
mipmap-xhdpi/ic_launcher.png      (96x96)
mipmap-xxhdpi/ic_launcher.png     (144x144)
mipmap-xxxhdpi/ic_launcher.png    (192x192)
```

Use Android Studio's Image Asset Studio:
- Right-click `res` folder
- New → Image Asset
- Follow wizard

### Splash Screen

Edit `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
</style>
```

Add splash drawable in `res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
```

## Testing

### Run on Emulator

1. **Create Emulator:**
   - Tools → Device Manager
   - Click "Create Device"
   - Choose device (e.g., Pixel 5)
   - Choose system image (API 33 recommended)
   - Click "Finish"

2. **Start Emulator:**
   - Select emulator from device dropdown
   - Click Run ▶️

### Run on Physical Device

1. **Enable Developer Options:**
   - Settings → About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Settings → Developer Options
   - Enable "USB Debugging"

3. **Connect Device:**
   ```bash
   adb devices
   ```
   Should show your device.

4. **Run App:**
   - Select device from dropdown
   - Click Run ▶️

### Test Offline Mode

```bash
# Disable network
adb shell svc wifi disable
adb shell svc data disable

# Enable network
adb shell svc wifi enable
adb shell svc data enable
```

### View Logs

```bash
# All logs
adb logcat

# Filter for app
adb logcat | grep "Capacitor"
adb logcat | grep "SQLite"

# Clear logs
adb logcat -c
```

### Database Inspection

```bash
# Access device shell
adb shell

# Navigate to app data
cd /data/data/com.constructiq.ecosystem/databases/

# Pull database to computer
adb pull /data/data/com.constructiq.ecosystem/databases/ecosystemdb.db

# View with SQLite browser
sqlite3 ecosystemdb.db
.tables
SELECT * FROM audits;
```

## Building Release APK/AAB

### APK (for Direct Installation)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

Install:
```bash
adb install app-release.apk
```

### AAB (for Google Play Store)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload this to Google Play Console.

### Verify Signing

```bash
jarsigner -verify -verbose -certs app-release.apk
```

## Troubleshooting

### Gradle Build Fails

**Problem:** `FAILURE: Build failed with an exception`

**Solutions:**
1. Clean build:
   ```bash
   cd android
   ./gradlew clean
   ```

2. Invalidate caches:
   - Android Studio → File → Invalidate Caches / Restart

3. Check JDK version:
   ```bash
   java -version  # Should be 11+
   ```

### SQLite Plugin Not Working

**Problem:** `SQLite is not available on this platform`

**Solution:**
1. Verify plugin installation:
   ```bash
   npm install @capacitor-community/sqlite
   ```

2. Sync:
   ```bash
   npm run cap:sync
   ```

3. Check `android/app/build.gradle` includes plugin

### Camera Not Working

**Problem:** Camera permission denied or camera doesn't open

**Solutions:**
1. Check permissions in `AndroidManifest.xml`
2. Uninstall and reinstall app
3. Grant permission manually:
   ```bash
   adb shell pm grant com.constructiq.ecosystem android.permission.CAMERA
   ```

### App Crashes on Startup

**Problem:** App crashes immediately after launch

**Solutions:**
1. Check logs:
   ```bash
   adb logcat | grep "AndroidRuntime"
   ```

2. Verify `capacitor.config.json` is valid

3. Clear app data:
   ```bash
   adb shell pm clear com.constructiq.ecosystem
   ```

### "Installed Build Tools revision X is corrupted"

**Solution:**
1. Open SDK Manager in Android Studio
2. Uninstall corrupted Build Tools
3. Reinstall Build Tools

### Network Security Issues

**Problem:** API calls fail with "Cleartext HTTP traffic not permitted"

**Solution:**
Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

Add to `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config">
```

**Note:** Only use for development. Use HTTPS in production.

## Performance Optimization

### ProGuard/R8 (Code Shrinking)

Enable in `android/app/build.gradle`:

```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### App Size Optimization

1. **Enable App Bundle:**
   - Use AAB instead of APK for Play Store
   - Automatic size optimization per device

2. **Remove unused resources:**
   ```gradle
   buildTypes {
       release {
           shrinkResources true
           minifyEnabled true
       }
   }
   ```

3. **Use WebP images:**
   - Convert PNG/JPG to WebP format
   - Right-click image → Convert to WebP

## Resources

- [Android Developer Guide](https://developer.android.com/)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Gradle Documentation](https://docs.gradle.org/)
- [ADB Reference](https://developer.android.com/studio/command-line/adb)
