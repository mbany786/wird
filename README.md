# Wird (ورد) • Zero-Knowledge Habit Operating System

A high-density, privacy-first habit operating system built with React 19, TypeScript, Tailwind CSS, Dexie (IndexedDB), and Capacitor for iOS. 

Designed for disciplined execution with a 31-day density matrix grid, daily routine flow, BI analytics correlation engine, and zero external tracking.

---

## 🌟 Key Features & Specialized Templates

### 1. 🌙 Daily Spiritual Schedule
- **5 Obligatory Prayers:** Multi-state tracking with Takbeer-e-Oola (`✓`), With Jamat (`•`), Individually (`••`), and Qaza (`✗`).
- **Sunan & Nawafil:** Tahajjud, Ishraq, Chaasht, Awabeen, and 4 Nawafil with Isha.
- **Quran & Zikr:** Page counts, 3rd Kalma, Durood Sharif, Astaghfar, Moraqiba duration, and Nafi Asbat counter.
- **Lataif (Lessons 1 to 8):** Dual-mode tracking allowing users to track by count or time (5,000 count = 30 minutes, and vice versa).
- **Ahzab & Daily Litanies:** Wird al-Latif, Hizb al-Bahr, Hizb al-Nasr, Hizb al-Nawawi, Hizb al-Barr, Ratib al-Haddad, and Hizb al-Fath.
- **Negative Actions & Vices (Inverse Tracking):** Track anger incidents, backbiting, and idle talk inversely (0 incidents = 100% serene day).
- **Periodic Routines:** Surah Kahaf on Fridays, Friday Jore slot attendance, and weekly Salaat al-Tasbeeh.
- **Hijri Calendar Integration:** Sighting adjustment (-1, 0, +1 days) and Arabic/English Hijri dates across all views.

### 2. 🌸 Intelligent Menstrual & Cycle Health Tracker
- **Biological Stage Detection:** Calculates whether the user is in the **Menstrual** (Days 1–5), **Follicular** (Days 6–13), **Ovulatory** (Days 14–16), or **Luteal / PMS** (Days 17–28+) stage.
- **Dynamic Mood & Mindset Predictions:** Stage-specific psychological and emotional patterns (e.g. introverted reflection, surging optimism, magnetic confidence, or pre-menstrual sensitivity).
- **Things to Watch Out For:** Alerts for dysmenorrhea, iron depletion, ovulation twinges, progesterone drops, water retention, and sugar cravings (with metabolic explanations).
- **Cycle-Synced Daily Advice:** Specific nutrition and workout prescriptions (e.g. magnesium, bone broth, cruciferous greens, HIIT vs. yin yoga).
- **Multi-Modal Flow & Symptoms:** Bleeding flow intensity (`✓` Heavy, `•` Medium, `••` Light, `•••` Spotting, `✗` None), cervical fluid quality, pelvic cramps scale, basal body temperature, and inverse tracking for PMS meltdowns.

### 3. 👶 Baby & Child Daily Habits Tracker
- **Nutrition & Feeding:** Milk/formula volume (oz), solid meals quality (`✓` 3 balanced meals, `•` 2 meals, `••` picky, `✗` fussy), water cups, and vitamin drops.
- **Sleep Cycles:** Night sleep duration (hrs), daytime nap minutes, and consistent bedtime routine.
- **Play & Development:** Outdoor fresh air, storytime books read, and sensory/motor play.
- **Hygiene & Behavior:** Teeth brushing (2x vs 1x), gentle baths, potty training milestones, screen limits, and tantrum tracking (inverse tracking).

### 4. 📚 Multi-Book Daily Reading Tracker
- Dedicated concurrent tracking for scholars and voracious readers:
  - Primary Non-Fiction Study (pages)
  - Technical / Professional Text (pages)
  - Classical Works / Philosophy (pages)
  - Fiction / Literature (pages)
  - Research Papers & Deep Immersion Time (min)
  - Audiobook Listening & Marginalia Notes Logged

### 5. ⚡ Peak Health & Biohacking
- Hydration volume (ml), whole-food nutrition score, daily steps, gym resistance workouts (min), zone-2 cardio, sleep duration, and sauna/cold exposure.

### 6. 🧠 Deep Work & Digital Detox
- Deep focus blocks (min), non-fiction reading, screen limits after 10:30 PM, zero doomscrolling, zero sugar, and nightly reflection shutdown.

### 7. ✨ Blank Custom Tracker Canvas & AI Routine Studio
- Create open custom trackers with your own sections, units (pages, minutes, reps, oz), multi-state symbols, or use the Smart Routine Generator with pre-built blueprints (Student, Solo Founder, Mindfulness, Language Immersion, Hormonal Health).

---

## 🔒 100% On-Device & Zero-Knowledge Architecture

- **No Remote Telemetry:** All habit logs, monthly remarks, and templates stay strictly inside client-side IndexedDB via Dexie.
- **Export & Reports:** 
  - Download full 31-day density matrix as Excel spreadsheet (`.xlsx`).
  - Print / Save as vector PDF report.
  - One-click formatted email report pre-filled with monthly reflections and completion metrics.

---

## 🚀 Deployment & Web Setup

### Local Development
```bash
# Install dependencies
bun install   # or npm install

# Start development server
bun run dev   # or npm run dev
```

### Production Build
```bash
bun run build # or npm run build
```

### Render Deployment
This project includes a native `render.yaml` Blueprint for Render Static Sites:
1. Push repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), select **New > Blueprint** or **New > Static Site**.
3. Select your repository. Render automatically reads `render.yaml`:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `./dist`
   - **Routes:** Rewrite `/*` -> `/index.html`

---

## 📱 iOS Native App Setup (Capacitor)

Wird includes native iOS packaging via Capacitor:

```bash
# 1. Build web distribution & sync with iOS
bun run build:ios

# 2. Open native Xcode workspace
bun run cap:open
```

Once Xcode opens:
1. Select your Apple Development Team in **Signing & Capabilities**.
2. Select target device (iPhone / iPad / Simulator).
3. Press **Run** (⌘R) or Archive for TestFlight / App Store.

---

## 📄 License
MIT License. Built for privacy, focus, and excellence.
