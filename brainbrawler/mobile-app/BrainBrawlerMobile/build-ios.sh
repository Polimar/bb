#!/bin/bash

# Script per build iOS IPA BrainBrawler
echo "🍎 Starting iOS build for BrainBrawler..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS build requires macOS. Current OS: $OSTYPE"
    echo "📋 Manual iOS build steps:"
    echo "1. Transfer project to macOS machine"
    echo "2. Install Xcode and command line tools"
    echo "3. Install Node.js 20 and npm"
    echo "4. Run: cd ios && pod install"
    echo "5. Run: npx react-native run-ios --configuration Release"
    echo "6. Archive and export IPA from Xcode"
    exit 1
fi

# Install dependencies if not present
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install --legacy-peer-deps
fi

# Install iOS dependencies
echo "🔧 Installing iOS CocoaPods dependencies..."
cd ios
pod install
cd ..

# Build for iOS
echo "🏗️ Building iOS app..."
npx react-native run-ios --configuration Release

echo "✅ iOS build completed!"
echo "📱 To create IPA:"
echo "1. Open ios/BrainBrawlerMobile.xcworkspace in Xcode"
echo "2. Select Product -> Archive"
echo "3. Export IPA with App Store or Ad Hoc distribution" 