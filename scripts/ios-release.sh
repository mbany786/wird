#!/usr/bin/env bash
# Build a signed App Store archive + IPA for Wird.
#
# Usage:
#   scripts/ios-release.sh            # archive + export IPA
#   scripts/ios-release.sh --upload   # also upload to App Store Connect
#
# Upload requires an App Store Connect API key:
#   export ASC_KEY_ID=XXXXXXXXXX
#   export ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#   (and the .p8 file in ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/ios/build"
ARCHIVE="$BUILD_DIR/Wird.xcarchive"
EXPORT_DIR="$BUILD_DIR/export"

cd "$ROOT"

# Auto-increment build number from timestamp so each upload is unique.
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%Y%m%d%H%M)}"

echo "==> Building web assets and syncing to iOS"
bun run build:ios

echo "==> Archiving (build $BUILD_NUMBER)"
rm -rf "$ARCHIVE" "$EXPORT_DIR"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -allowProvisioningUpdates \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" \
  archive

echo "==> Exporting IPA"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist ios/ExportOptions.plist \
  -allowProvisioningUpdates

IPA="$(ls "$EXPORT_DIR"/*.ipa | head -1)"
echo "==> IPA: $IPA"

if [[ "${1:-}" == "--upload" ]]; then
  : "${ASC_KEY_ID:?Set ASC_KEY_ID}"
  : "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID}"
  echo "==> Validating"
  xcrun altool --validate-app -f "$IPA" -t ios --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
  echo "==> Uploading"
  xcrun altool --upload-app -f "$IPA" -t ios --apiKey "$ASC_KEY_ID" --apiIssuer "$ASC_ISSUER_ID"
fi
