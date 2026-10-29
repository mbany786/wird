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

## URLs

| Field | Value |
|---|---|
| Privacy Policy URL | `https://<your-render-domain>/privacy.html` |
| Support URL | `https://<your-render-domain>/support.html` |
| Marketing URL (optional) | `https://<your-render-domain>/` |

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

```
mamulat,wird,dhikr,zikr,tasbih,salah,namaz,prayer,quran,habit,islamic,muslim,tracker,hijri,sunnah
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
| Contact | *(your name, phone, email)* |

## Screenshots

| Device class | Size | Folder |
|---|---|---|
| iPhone 6.9" (required) | 1320 × 2868 | `appstore/screenshots/iphone_6.9/` |
| iPad 13" (required while iPad is supported) | 2064 × 2752 | `appstore/screenshots/ipad_13/` |

Upload in order 01 → 05.

## App Icon

- 1024 × 1024 RGB PNG, no alpha: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`
