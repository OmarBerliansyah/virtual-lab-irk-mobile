# 🚀 Virtual Lab IRK Mobile - Deployment Guide

## 📋 Prerequisites

✅ **Sudah Ready:**
- ✅ EAS CLI installed
- ✅ `eas.json` configured
- ✅ `app.json` updated with package identifiers
- ✅ Environment variables configured

---

## 🎯 Deployment Options

### **Option 1: Quick APK Build (Testing) - RECOMMENDED FIRST**

Build APK untuk testing di Android devices tanpa perlu akun developer:

```bash
# Login ke Expo account (first time only)
eas login

# Build preview APK
eas build --platform android --profile preview
```

**Output:** APK file yang bisa di-download dan install langsung di Android

**Timeline:** ~15-20 menit

**Best for:** Internal testing, sharing dengan team

---

### **Option 2: Development Build**

Build untuk development dengan hot reload:

```bash
eas build --platform android --profile development
```

**Best for:** Active development dengan debugging

---

### **Option 3: Production Build**

Build production-ready untuk App Store/Play Store:

```bash
# Android (AAB for Play Store)
eas build --platform android --profile production

# iOS (untuk App Store)
eas build --platform ios --profile production
```

**Note:** Untuk iOS, butuh Apple Developer account ($99/year)

---

## 📱 Step-by-Step Deployment

### **Step 1: Login to Expo**

```bash
eas login
```

Masukkan credentials Expo account Anda. Jika belum punya:
1. Buat di https://expo.dev/signup
2. Free account sudah cukup untuk build

---

### **Step 2: Configure Project**

Project sudah configured! Tapi pastikan environment variables tersedia:

**Create `.env` file (jika belum ada):**

```bash
# API Configuration
EXPO_PUBLIC_API_BASE_URL=https://your-backend-api.com/api

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key

# Supabase (Optional)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**⚠️ IMPORTANT:** Environment variables harus di-set di EAS Secrets untuk build:

```bash
# Set secrets for EAS Build
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://your-api.com/api"
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_..."
```

---

### **Step 3: Build Preview APK (Recommended First)**

```bash
# Build APK untuk testing
eas build --platform android --profile preview
```

**What happens:**
1. ✅ Code di-upload ke EAS servers
2. ✅ Dependencies di-install
3. ✅ APK di-build (takes ~15-20 min)
4. ✅ Download link provided

**After build completes:**
- Download APK dari link yang diberikan
- Install di Android device (enable "Install from Unknown Sources")
- Test semua features

---

### **Step 4: Build for iOS (Optional)**

Jika ingin build untuk iOS:

```bash
# Build iOS
eas build --platform ios --profile preview
```

**Requirements:**
- Apple Developer account ($99/year)
- Certificate & provisioning profile (EAS bisa auto-generate)

---

## 🔐 Environment Variables Setup

Set all required secrets untuk build:

```bash
# Required
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "YOUR_API_URL"
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "YOUR_CLERK_KEY"

# Optional (if using Supabase)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_URL"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_KEY"

# View all secrets
eas secret:list
```

---

## 📦 Build Profiles Explained

### **`development`** (eas.json)
- Development client with debugging
- For active development
- Hot reload enabled

### **`preview`** (eas.json)
- APK build for testing
- No need for stores
- Can share directly with testers
- **RECOMMENDED for initial testing**

### **`production`** (eas.json)
- AAB (Android) / IPA (iOS)
- Optimized & minified
- Ready for App Store/Play Store
- No debugging tools

---

## 🎬 Quick Start Commands

```bash
# 1. Login (first time only)
eas login

# 2. Set environment variables
eas secret:create --scope project --name EXPO_PUBLIC_API_BASE_URL --value "https://your-api.com/api"
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_..."

# 3. Build preview APK
eas build --platform android --profile preview

# 4. Wait for build to complete (~15-20 min)
# 5. Download APK from provided link
# 6. Install & test on Android device
```

---

## 📲 Distribusi APK

Setelah APK berhasil di-build:

### **Internal Testing:**
1. Download APK dari EAS dashboard
2. Share file APK via email/drive/WhatsApp
3. Testers install di Android (enable "Unknown Sources")

### **Google Play Store (Alpha/Beta):**
```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

**Requirements untuk Play Store:**
- Google Play Console account ($25 one-time)
- App listing & screenshots
- Privacy policy URL

---

## 🍎 iOS Deployment

### **TestFlight (Beta Testing):**
```bash
# Build iOS
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios
```

### **App Store:**
```bash
# Build production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect setup
- Screenshots & metadata

---

## 🔍 Troubleshooting

### **Build Fails:**
- Check environment variables are set correctly
- Verify `app.json` has valid package names
- Check build logs: `eas build:list` then `eas build:view [BUILD_ID]`

### **APK Won't Install:**
- Enable "Install from Unknown Sources" di Android settings
- Check minimum Android version (API level)

### **App Crashes on Launch:**
- Check environment variables are accessible
- Verify backend API is reachable
- Check logs in device console

---

## 📊 Build Status

Check build status:

```bash
# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel
```

---

## 🚀 Next Steps

1. **✅ Build Preview APK** - Test internally
2. **🧪 Alpha Testing** - Share dengan small group
3. **🎯 Beta Testing** - TestFlight (iOS) / Play Store Beta (Android)
4. **📱 Production Release** - Publish ke stores

---

## 📞 Support

- **EAS Docs:** https://docs.expo.dev/build/introduction/
- **Expo Forums:** https://forums.expo.dev/
- **Issue Tracker:** GitHub Issues

---

**Current Status:** ✅ Ready to build!

**Recommended First Step:** Build preview APK for testing

```bash
eas build --platform android --profile preview
```

Good luck with deployment! 🚀

