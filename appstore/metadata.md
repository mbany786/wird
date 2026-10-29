# Wird — App Store Connect Metadata

Copy-paste these values into App Store Connect → *My Apps → Wird*.

## App Information

| Field | Value |
|---|---|
| Name (≤30) | `Wird: Mamulat & Habit Tracker` |
| Subtitle (≤30) | `Daily Prayer & Dhikr Matrix` |
| Bundle ID | `com.wird.habits` |
| SKU | `wird-habits-001` |
| Primary Category | Lifestyle |
| Secondary Category | Productivity |
| Content Rights | Does not contain third-party content |
| Age Rating | 4+ (no objectionable content; answer "None" to all questionnaire items) |
| Price | Free |
| Copyright | `2026 VitalScale Technologies LLC` |

## URLs

| Field | Value |
|---|---|
| Privacy Policy URL | `https://wird-habit-os.onrender.com/privacy.html` |
| Support URL | `https://wird-habit-os.onrender.com/support.html` |
| Marketing URL (optional) | `https://wird-habit-os.onrender.com/` |

> Both pages ship from `public/` and deploy with the web app on Render.

## Promotional Text (≤170)

```
Track your daily Mamulat in a beautiful 31-day matrix — prayers, dhikr, Quran and more. 100% private: everything stays on your device.
```

## Description (≤4000)

```
Wird is a private, beautifully designed spiritual habit tracker for your daily Mamulat (معمولات) — prayers, dhikr, Quran recitation, Lataif and personal routines.

31-DAY MAMULAT MATRIX
• See your entire month at a glance, with Gregorian and Hijri dates side by side
• Edit any day's count directly in the grid with quick +/− steppers
• Monthly summaries for every habit

PRAYER TRACKING
• Log each of the five daily prayers as Takbeer-e-Oola, With Jamat, Individual, or Qaza
• Track Sunnah and Nawafil: Tahajjud, Ishraq, Chaasht, Awabeen and more

DHIKR, QURAN & LATAIF
• Tasbih counters with presets (+1, +5, +10, +100)
• Quran pages and Juz progress
• Moraqiba / meditation minutes

ANALYTICS
• Overall strength index and habit retention curves
• Total zikr, Quran pages and presence time

TEMPLATES & CUSTOM ROUTINES
• Start from curated spiritual routines, a blank template, or generate one
• Add, rename and organize tasks and sections

CYCLE & EXCUSE MODE
• Optional private cycle tracker that estimates the current phase, shows wellness notes, and can mark prayers as excused

PRIVATE BY DESIGN
• No account, no ads, no tracking
• All data is stored only on your device
• Export to Excel or JSON anytime

Urdu and Arabic labels are shown throughout, alongside English.
```

## Keywords (≤100, comma-separated, no spaces)

Words already in the name and subtitle (Wird, Mamulat, Habit, Tracker, Prayer, Dhikr, Daily, Matrix) are indexed automatically, so they are left out here.

```
zikr,tasbih,salah,namaz,quran,islamic,muslim,hijri,sunnah,tahajjud,adhkar,azkar,ibadah,qaza,routine
```

## What's New (v1.0)

```
First release of Wird — your private 31-day Mamulat matrix for prayers, dhikr, Quran and daily spiritual habits.
```

## App Privacy (Nutrition Label)

- **Data Collection:** "No, we do not collect data from this app."
- **Tracking:** No.
- Privacy manifest: `ios/App/App/PrivacyInfo.xcprivacy`.

## Export Compliance

- `ITSAppUsesNonExemptEncryption = NO` is set in `Info.plist`, so App Store Connect will not ask about encryption per build.

## App Review Information

| Field | Value |
|---|---|
| Sign-in required | No |
| Notes | `Wird works fully offline with no account. All data is stored locally on the device. To test editing, open the Matrix tab, pick a day with "Active Edit Day", and tap +/− on any habit.` |
| Contact name | Mahdi Anayetullah |
| Contact email | m.anayetullah@gmail.com |
| Contact phone | +1 609 375 7753 |

## Screenshots

| Device class | Size | Folder |
|---|---|---|
| iPhone 6.9" (required) | 1320 × 2868 | `appstore/screenshots/iphone_6.9/` |
| iPad 13" (required while iPad is supported) | 2064 × 2752 | `appstore/screenshots/ipad_13/` |

Upload in order 01 → 05.

| # | Caption | Screen |
|---|---|---|
| 01 | Your 31-Day Mamulat Matrix — Edit any day's count right in the grid | Matrix with quick-count dock |
| 02 | Log Each Prayer in One Tap — Takbeer-e-Oola, Jamat, Individual or Qaza | Daily view |
| 03 | See the Whole Month at a Glance — Monthly summaries for every habit | Full-month matrix |
| 04 | Track Your Spiritual Growth — Zikr totals, Quran pages & habit strength | Analytics |
| 05 | Build Your Own Routine — Templates, a blank slate, or generate one | Template Studio |

iPad shots are real iPad Pro 13" (M5) simulator captures; uncaptioned originals are in `appstore/screenshots/ipad_raw/`.

## App Icon

- 1024 × 1024 RGB PNG, no alpha: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`

## Release Checklist

- [x] Signed IPA: `ios/build/export/App.ipa` (v1.0, build 202610291624). Rebuild with `bun run ios:release` right before uploading so it carries the latest web bundle and a fresh build number.
- [x] App icon, splash, privacy manifest, export-compliance flag
- [x] iPhone 6.9" and iPad 13" screenshots (5 each)
- [x] Listing text within App Store limits (name 29/30, subtitle 27/30, promo 134/170, keywords 99/100, description 1276/4000)
- [x] App Review contact: Mahdi Anayetullah · m.anayetullah@gmail.com · +1 609 375 7753
- [ ] Make the GitHub repo `mbany786/wird` private (Settings → General → Danger Zone → Change visibility). Privacy and Support pages no longer link to it.
- [ ] Deploy `render.yaml` on Render (New → Blueprint → `mbany786/wird`) and confirm `https://wird-habit-os.onrender.com/privacy.html` and `/support.html` load. If Render assigns a different domain, update the URLs above.
- [ ] Create the app record in App Store Connect (bundle ID `com.wird.habits`, SKU `wird-habits-001`).
- [ ] Upload: `bun run ios:upload`, or Xcode → Organizer → Distribute App. **Not yet — hold until approved.**
