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

# BrainBrawler Mobile - Guida alla Compilazione

## Stato Implementazione ✅
- ✅ **P2P System**: WebRTC completo con server election
- ✅ **Backend Integration**: JWT auth + PostgreSQL  
- ✅ **Emergency Failover**: Promozione automatica host
- ✅ **TypeScript Errors**: Tutti risolti
- ✅ **Configuration**: Pronto per backend locale
- ✅ **Gradle Config**: Ottimizzato per 16GB RAM

## Prerequisiti Sistema

### Backend e Frontend (Obbligatori)
I servizi devono essere attivi:
```bash
cd /home/bb/brainbrawler
docker-compose up -d
curl http://localhost:3000/health  # Deve rispondere 200
curl http://localhost:3001/        # Deve rispondere 200
```

### Android Studio (Metodo Consigliato) 🎯

1. **Apri Android Studio**
2. **Import Project**: Seleziona `/home/bb/brainbrawler/mobile-app/BrainBrawlerMobile/android`
3. **Sync Project**: Android Studio sincronizzerà automaticamente Gradle
4. **Build APK**:
   - Menu: Build → Build Bundle(s)/APK(s) → Build APK(s)
   - Oppure: `./gradlew assembleDebug` dal terminale

**Vantaggi Android Studio:**
- ✅ Accesso diretto ai 16GB RAM
- ✅ Debug integrato e error handling
- ✅ Gradle daemon ottimizzato
- ✅ Build incrementali più veloci

### Docker (Alternativo)
```bash
docker exec -it brainbrawler-android-builder-1 bash
cd /home/node/project
npm install
cd android && ./gradlew assembleDebug
```

## Configurazione Ottimizzata

### Gradle (16GB RAM)
```properties
org.gradle.jvmargs=-Xmx12g -XX:MaxMetaspaceSize=4g -XX:+UseParallelGC
org.gradle.daemon=true
org.gradle.parallel=true
```

### Backend Locale
L'app è configurata per:
- **API**: `http://localhost:3000/api`
- **WebSocket**: `ws://localhost:3000/ws`

## Architettura P2P

### Server Election Algorithm
```typescript
Score = AccountType + BatteryLevel + ConnectionQuality
- ADMIN: 1000 pts
- PREMIUM: 500 pts  
- FREE: 100 pts
```

### Emergency Failover
- Host disconnesso → Election automatica
- FREE users possono diventare host se necessario
- Sync real-time di game state

## Troubleshooting

### Android Studio Issues
1. **Out of Memory**: Aumenta `org.gradle.jvmargs` se necessario
2. **Sync Failed**: File → Invalidate Caches and Restart
3. **Build Failed**: Clean Project → Rebuild Project

### Errori Comuni
- **Backend non raggiungibile**: Verifica docker-compose up
- **Permission denied**: Aggiungi permessi WebRTC in AndroidManifest.xml
- **TypeScript errors**: Già risolti nella versione corrente

## Output APK
**Android Studio**: `android/app/build/outputs/apk/debug/app-debug.apk`
**Docker**: `/home/node/project/android/app/build/outputs/apk/debug/app-debug.apk`

## Test Deployment
1. Installa APK su device Android
2. Login con: admin@brainbrawler.com / BrainBrawler2024!
3. Crea/Unisciti a game P2P
4. Testa server election e failover 