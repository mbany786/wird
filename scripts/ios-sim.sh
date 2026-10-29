#!/usr/bin/env bash
# Headless iOS Simulator run for Wird — no Xcode window, no Simulator window, no clicking.
#
# Builds the web bundle, syncs it into the iOS project, builds the app for the
# simulator with xcodebuild, then boots/installs/launches it with simctl.
# With --screenshot, also captures the screen with a clean 9:41 status bar.
#
#   bun run ios:sim                                   # iPhone 17 Pro
#   SIM_DEVICE="iPad Pro 13-inch (M5)" bun run ios:sim
#   bun run ios:sim:shot                              # + screenshot to .snapshots/sim/
#
# Requires macOS with Xcode command-line tools (xcodebuild, xcrun simctl).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEVICE="${SIM_DEVICE:-iPhone 17 Pro}"
BUNDLE_ID="com.wird.habits"
DERIVED="$ROOT/ios/build/sim"
SHOT=false
[[ "${1:-}" == "--screenshot" ]] && SHOT=true

cd "$ROOT"

echo "==> Building web assets and syncing to iOS"
bun run build:ios

echo "==> Building app for simulator: $DEVICE"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=$DEVICE" \
  -derivedDataPath "$DERIVED" \
  -quiet \
  build

APP="$DERIVED/Build/Products/Debug-iphonesimulator/App.app"
[[ -d "$APP" ]] || { echo "Built app not found at $APP" >&2; exit 1; }

UDID="$(xcrun simctl list devices available -j | /usr/bin/python3 -c '
import json, sys
name = sys.argv[1]
for runtime, devs in json.load(sys.stdin)["devices"].items():
    if "iOS" not in runtime:
        continue
    for d in devs:
        if d["name"] == name:
            print(d["udid"]); sys.exit(0)
sys.exit(1)' "$DEVICE")" || { echo "No available simulator named \"$DEVICE\"" >&2; exit 1; }

echo "==> Booting $DEVICE ($UDID) headless"
xcrun simctl boot "$UDID" 2>/dev/null || true   # already booted is fine
xcrun simctl bootstatus "$UDID" -b >/dev/null

echo "==> Installing and launching $BUNDLE_ID"
xcrun simctl install "$UDID" "$APP"
xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2>/dev/null || true
xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null

if $SHOT; then
  OUT="$ROOT/.snapshots/sim"
  mkdir -p "$OUT"
  xcrun simctl status_bar "$UDID" override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4
  sleep 3   # let the WebView render
  FILE="$OUT/$(echo "$DEVICE" | tr ' ()' '-__' | tr -s '-')-$(date +%H%M%S).png"
  xcrun simctl io "$UDID" screenshot "$FILE" >/dev/null
  xcrun simctl status_bar "$UDID" clear
  echo "==> Screenshot: $FILE"
fi

echo "==> Running on $DEVICE"
