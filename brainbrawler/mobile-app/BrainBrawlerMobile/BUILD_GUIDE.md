# BrainBrawler Mobile - Build & Deployment Guide

## 🏗️ Panoramica Build

BrainBrawler Mobile è un'app React Native P2P per quiz multiplayer che si autentica su www.brainbrawler.com.

### 📱 Architettura P2P Completa
- **WebRTC** per comunicazione peer-to-peer
- **Server Election** automatica (ADMIN > PREMIUM > FREE users)
- **Emergency Failover** per continuità di gioco
- **Real-time Question Distribution**
- **Scoring con Time Bonus**

## 🔧 Prerequisiti

### Android Build
- Docker installato
- 2GB+ RAM disponibile
- Container `brainbrawler-android-builder-1` attivo

### iOS Build
- macOS con Xcode 15+
- Node.js 20+
- CocoaPods installato (`gem install cocoapods`)

## 📦 Build Android APK

### Metodo 1: Container Docker (Raccomandato)
```bash
# 1. Copia il progetto nel container
docker cp . brainbrawler-android-builder-1:/app/

# 2. Installa dipendenze
docker exec -it brainbrawler-android-builder-1 bash -c "cd /app && npm install --legacy-peer-deps"

# 3. Build APK
docker exec -it brainbrawler-android-builder-1 bash -c "cd /app/android && ./gradlew assembleRelease"

# 4. Estrai APK
docker cp brainbrawler-android-builder-1:/app/android/app/build/outputs/apk/release/app-release.apk ./BrainBrawler-1.0.0.apk
```

### Metodo 2: Build Locale
```bash
# Richiede Android SDK e Java 17
export JAVA_HOME=/usr/lib/jvm/OpenJDK-17
export ANDROID_HOME=/path/to/android-sdk

cd android
./gradlew assembleRelease
```

## 🍎 Build iOS IPA

### Metodo Automatico
```bash
# Su macOS
./build-ios.sh
```

### Metodo Manuale
```bash
# 1. Installa dipendenze
npm install --legacy-peer-deps

# 2. Installa pods iOS
cd ios && pod install && cd ..

# 3. Build release
npx react-native run-ios --configuration Release

# 4. Archive in Xcode
# - Apri ios/BrainBrawlerMobile.xcworkspace
# - Product -> Archive
# - Distribuisci come Ad Hoc o App Store
```

## 🚀 Configurazione Production

### API Endpoints
- **Base URL**: https://www.brainbrawler.com/api
- **WebSocket**: wss://www.brainbrawler.com/socket.io
- **TURN Server**: configurato in `src/config/index.ts`

### Autenticazione
- JWT tokens con refresh automatico
- Verifica email con codice 6 cifre
- Supporto account FREE/PREMIUM/ADMIN

### Permessi
**Android** (`android/app/src/main/AndroidManifest.xml`):
- INTERNET, ACCESS_NETWORK_STATE
- ACCESS_WIFI_STATE, CHANGE_WIFI_STATE
- RECORD_AUDIO, CAMERA
- WAKE_LOCK, VIBRATE

**iOS** (`ios/BrainBrawlerMobile/Info.plist`):
- NSCameraUsageDescription
- NSMicrophoneUsageDescription
- NSLocalNetworkUsageDescription

## 📋 Testing P2P Features

### Scenario di Test Completi
1. **Server Election**: Connetti users con diversi account types
2. **Emergency Failover**: Disconnetti host durante partita
3. **Real-time Quiz**: Verifica sincronizzazione domande/timer
4. **Network Resilience**: Test con connessioni instabili

### Account Demo
- **Admin**: admin@brainbrawler.com / BrainBrawler2024!
- **Premium**: Registra account premium per testing
- **FREE**: Registra account free per testing

## 🔧 Troubleshooting

### Build Android Issues
```bash
# Java non trovato
export JAVA_HOME=/usr/lib/jvm/OpenJDK-17

# Gradle sync failed
cd android && ./gradlew clean

# Dependencies conflict
npm install --legacy-peer-deps --force
```

### Build iOS Issues
```bash
# Pod install failed
cd ios && pod deintegrate && pod install

# Metro bundler issues
npx react-native start --reset-cache

# Xcode signing issues
# Configurare Team ID in Xcode project settings
```

## 📱 Distribuzione

### Android
- **Debug**: Installazione diretta APK
- **Release**: Google Play Store o distribuzione Enterprise

### iOS
- **TestFlight**: Per beta testing
- **App Store**: Distribuzione pubblica
- **Enterprise**: Distribuzione interna

## 🌐 Server Requirements

L'app si connette a:
- **Backend API**: Node.js + Express + PostgreSQL
- **WebSocket**: Socket.io per real-time
- **TURN Server**: Per NAT traversal WebRTC

Tutti i servizi devono essere disponibili su www.brainbrawler.com con certificati SSL validi.

---

**🚀 BrainBrawler Mobile v1.0.0 - Ready for Production!** 