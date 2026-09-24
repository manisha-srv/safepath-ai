# SafePath AI

The Mobile-Based Smart Hazard & Pothole Mapping System — a phone-only, zero-hardware
solution built for the "Innovate Without Borders" hackathon.

- **`index.html`** — the Driver App. Uses the phone's accelerometer + GPS to
  automatically detect and log potholes, and speaks a voice warning when
  approaching a previously logged hazard.
- **`dashboard.html`** — the City Dashboard. Shows every logged hazard on a
  live map for road-repair prioritization.

No coding is required to run this — just two free accounts and a few clicks.

---

## 1. Set up Firebase (free, ~5 minutes)

Firebase is the free cloud database that lets the Driver App and the
Dashboard share hazard data in real time.

1. Go to **console.firebase.google.com** and sign in with any Google account.
2. Click **Add project**, give it any name (e.g. `safepath-ai`), and finish
   the setup wizard (you can turn off Google Analytics, it's not needed).
3. In the left sidebar, go to **Build → Realtime Database** → **Create Database**.
   - Choose any region.
   - Choose **Start in test mode** (fine for a hackathon demo — it just
     means anyone with the link can read/write, which is what we want for
     drivers logging hazards).
4. Go to **Build → Authentication** → **Get started** → under **Sign-in
   method**, enable **Email/Password** (the first option in the list). No
   other setup needed — no billing, no SMS provider.
5. Click the **gear icon** (top-left, next to "Project Overview") →
   **Project settings**.
6. Scroll down to **Your apps** → click the **`</>`** (web) icon → give the
   app any nickname → **Register app**.
7. Firebase will show you a code block that starts with `const firebaseConfig = {...}`.
   Copy those values into **`js/firebase-config.js`** in this repo, replacing
   the placeholder text (`YOUR_API_KEY`, etc). Keep the quotation marks.
8. Commit/save the change.

That's it — no backend server, no billing, nothing else to configure.

---

## 2. Publish it with GitHub Pages (free, ~2 minutes)

1. In this repository, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **Deploy from a branch**.
3. Set **Branch** to `main` (or `master`) and folder to `/ (root)`. Save.
4. GitHub will give you a live URL like
   `https://<your-username>.github.io/<repo-name>/` — this is your working
   app link for the "Demo/Deployment Link" submission field. It can take a
   minute or two to go live the first time.

---

## 3. Demo it

Open the GitHub Pages link **on your phone's browser** (Chrome on Android,
or Safari on iPhone):

1. Open `index.html` (the default page) → tap **Start Monitoring**.
   - Allow the location permission prompt.
   - On iPhone, you'll also get a motion-sensor permission prompt — allow it.
2. Tap **Simulate Pothole Hit** to log a hazard reliably on demand (useful
   for stage demos where you can't actually drive over a real pothole).
   Real accelerometer spikes while driving trigger the same thing
   automatically.
3. You'll hear a spoken alert and see a marker appear on the map.
4. Open `dashboard.html` (top nav) — the same hazard appears there too,
   with a live count.

To try offline mode specifically: turn on Airplane Mode, tap **Simulate
Pothole Hit** — it still logs locally and speaks the alert, with a banner
showing it's waiting to sync. Turn Airplane Mode off and it syncs within
seconds.

---

## Offline behavior

The Driver App works without a live connection for the parts that matter most:

- **Detection still works offline** — the accelerometer and GPS are on-device
  hardware, not internet-dependent, so a hazard is detected and saved the
  instant it happens, signal or no signal.
- **Hazards are queued locally** (`localStorage`) the moment they're
  detected, and synced to Firebase automatically once a connection is found
  — even if the app was closed and reopened in between. You'll see a small
  banner ("N hazards waiting to sync") while offline.
- **Voice alerts still work offline** for hazards already known on this
  phone, since text-to-speech is a built-in OS feature.
- **What does need a connection:** the live map *tiles* (OpenStreetMap
  images) and seeing hazards *other* drivers have logged, since that comes
  from the shared Firebase database.

This means SafePath AI is resilient on rural or low-network stretches —
nothing is lost, it just syncs later.

## Tech Stack

| Piece | Tool | Why |
|---|---|---|
| Impact detection | Browser `devicemotion` API | Real accelerometer/gyroscope access, no app install |
| Location | Browser `Geolocation` API | Real GPS, no extra hardware |
| Multilingual Voice Alerts | Browser `SpeechSynthesis` API | Built-in, 5 Indian languages (EN, HI, TA, TE, KN) |
| Multi-Language i18n | Custom Client i18n (`js/i18n.js`) | Instant toggle across 5 major Indian languages |
| Themes | Automotive Slate Dark / Daylight (`js/theme.js`) | Obsidian night HUD & high-contrast daytime mode |
| Privacy Face-Blurring | TensorFlow BlazeFace | On-device, fail-closed privacy protection |
| Map | Leaflet.js + OpenStreetMap | Free, no API key, no billing account required |
| Database | Firebase Realtime Database | Free tier, real-time sync between driver app and dashboard |
| Accounts | Firebase Authentication (email/password) | Free tier, ties flags/repair confirmations to real accounts |
| Hosting | GitHub Pages | Free static hosting, gives a public demo link |

## 🌐 Complete Multi-Language System (`js/i18n.js`)

Full client-side internationalization across 5 major Indian languages:
- **English**
- **Hindi (हिंदी)**
- **Tamil (தமிழ்)**
- **Telugu (తెలుగు)**
- **Kannada (ಕನ್ನಡ)**

**What gets translated:**
- All page titles, navigation pills, status badges, buttons, and login forms.
- Dynamic telemetry status (sensor calibration, GPS tracking, offline queue).
- **Spoken Voice Speech Alerts:** Road damage warnings speak automatically in the selected language using the browser's native text-to-speech engine (e.g. Hindi: *"सावधान! सड़क खराब पाई गई है। कृपया गति धीमी करें।"*).
- A globe icon (`🌐`) selector in the top header persists your choice across sessions via `localStorage`.

## 🌓 Dark & Light Mode Theme Toggle (`js/theme.js` & `style.css`)

- **Automotive Slate Dark Mode (Default):** Deep obsidian canvas (`#090d16`), elevated card surfaces (`#162032`), safety amber accents (`#f59e0b`), and an animated emerald radar pulse for live monitoring.
- **Daylight Mode:** Crisp slate/white surface (`#ffffff` / `#f8fafc`) with high-contrast text designed for bright daytime driving.
- Instant one-tap sun/moon switcher (`☀️` / `🌙`) in the header that remembers driver preference.

## 📸 Dedicated Photo Evidence & Stream Column

- **Driver App (`index.html`):**
  - Dedicated right-hand column with a "Snap / Upload Photo" dropzone.
  - Automatic on-device AI face-blurring with TensorFlow BlazeFace before upload.
  - Real-time Session Photo Stream displaying thumbnails of captured road hazards with coordinates, timestamps, and privacy badges.
- **City Dashboard (`dashboard.html`):**
  - Dedicated Reported Photo Gallery column displaying photos submitted across city sectors alongside coordinates.
  - Click-to-zoom modal preview for municipal engineers to inspect reported damage up close.

## 🚗 Demystified "Simulate Hit" & Cleaner Driver HUD

- Road damage and pothole detection is **100% automatic** using motion and gyroscope sensors while driving.
- The simulation trigger is placed inside an optional, collapsible **"Demo & Test Tools"** panel with an explanatory note so everyday drivers aren't confused by it during live vehicle operation.

## Accounts (Firebase Authentication)

Both pages now show a small sign-in bar under the nav (email/password only
— no phone/SMS, so it needs no extra setup beyond step 4 above and stays
on the free Spark plan).

- **Logging a hazard never requires signing in** — detection stays fully
  automatic, matching the "zero driver cost" pitch. If the driver *is*
  signed in, the report is tagged with their account (`reportedByUid`,
  `reportedByEmail`) for traceability; if not, it's still logged, just
  anonymously.
- **Flagging and confirming a repair now require signing in.** This is
  where accounts actually matter for anti-abuse: each hazard tracks
  *which accounts* flagged or confirmed it
  (`hazards/{id}/flaggedBy/{uid}`), not just a count — so the same person
  can't stack votes by switching browsers or clearing `localStorage`, which
  the old per-browser version couldn't prevent.
- Moderating the "Pending Review" queue (Restore / Dismiss) also requires
  sign-in, for the same reason.

**Not yet implemented:** soft account suspensions for repeat bad-faith
flagging (mentioned in the pitch deck) — right now a flagged/confirmed
account is tracked, but nothing acts on a pattern of abuse yet.

### Recommended: lock down the database rules

The setup above uses Firebase's default **test mode**, which allows
anyone — signed in or not — to read and write anything. That's fine for a
hackathon demo, but if you want the accounts to actually mean something
(e.g. before sharing the link widely), tighten the Realtime Database rules
under **Build → Realtime Database → Rules** to something like:

```json
{
  "rules": {
    "hazards": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

This keeps the map/dashboard publicly viewable (matches "free forever" for
drivers/municipalities) while requiring sign-in for every write — including
new hazard reports, which would mean removing the "log without signing in"
behavior described above if you want the strictest version.

## Community moderation (flagging + repair confirmation)

Every hazard on the dashboard now has two actions, matching the "Trust &
Safety" scope from the pitch deck:

- **Flag** — if a report is wrong, spam, or already gone, anyone can flag
  it. After **3 flags** it's automatically hidden from the driver app and
  the main map, and moved into a **"Flagged — Pending Review"** section on
  the dashboard until a moderator restores or dismisses it.
- **Mark Repaired** — once a pothole is actually fixed, anyone can confirm
  it. After **2 confirmations** it's marked `repaired`: it stays in the
  history (soft-archived, so dashboard stats stay accurate) but drops off
  the active map and stops triggering driver alerts.

Flagging and confirming repairs now require signing in — see **Accounts**
above for how that's tied to accounts rather than just a browser.

## Photos (optional, non-blocking)

After a hazard is logged, the driver app shows a dismissible "Add a Photo"
card — the driver can snap one when it's safe to, or just skip it. This is
deliberately non-blocking: detection and geotagging stay fully automatic
and don't wait on the photo, matching the "zero driver cost" pitch.

Photos are resized to 480px wide and re-encoded as JPEG (quality 0.5)
entirely in the browser before upload, then stored as a base64 string
directly on the hazard record in Realtime Database. This sidesteps Firebase
Storage (which needs the paid Blaze plan for public access), so the whole
app — photos included — stays on the free Spark plan.

Before a photo is attached, it's run through **BlazeFace** (TensorFlow.js,
loaded from a CDN, runs entirely on-device) to detect faces, which are then
pixelated directly on the canvas. This is a **fail-closed** privacy control:
if the model can't load (e.g. the driver is offline and the CDN script
never arrived), the photo is *not* attached — the app shows a message and
lets the driver retry once they have a connection, rather than silently
uploading an unblurred photo. License-plate blurring is still a Phase 2
item, as in the original pitch deck — plates are not detected or blurred
yet, so avoid demoing with photos that show them.

## Sensor fusion (accelerometer + gyroscope)

Acceleration alone can't reliably tell a real wheel-into-a-pothole impact
apart from hard braking or the phone getting jostled — both spike the
accelerometer. A pothole impact also rocks the car body (pitch/roll),
which the gyroscope's `rotationRate` picks up but braking mostly doesn't.

So detection now requires **both** signals when the gyroscope is available:
an acceleration spike above `IMPACT_THRESHOLD` *and* a rotation spike above
`ROTATION_THRESHOLD`. If a device or browser doesn't expose `rotationRate`
at all (some do not), the app automatically falls back to
accelerometer-only detection so it still works everywhere — it just tells
the driver via the status banner that it's running in that mode. Each
logged hazard records which method fired (`accel+gyro` vs `accel-only`),
visible in the session log.

## Notes for judges

- This is a **web app**, not an installed native app — it runs entirely in
  the phone's browser, using the same sensors a native app would use, with
  zero install friction for a hackathon demo.
- The accelerometer threshold (`IMPACT_THRESHOLD` in `js/app.js`) is tuned
  for demo reliability; a production version combines it with speed
  and gyroscope data to filter out false positives (sharp turns, phone drops).

---

## 🇮🇳 Real Indian Road Conditions Tailored Modifications

SafePath AI includes 5 top modifications engineered specifically for everyday Indian commutes and road conditions:

1. **Distinguish Between "Pothole" and "Unmarked Speed Breaker"**
   - **Indian Context:** Unmarked, illegal speed breakers (or table-top bumps without white stripes) cause just as many vehicle damages, scrapes, and accidents as potholes.
   - **Waveform Analysis:**
     - *Pothole:* Instant negative drop (-Z axis) followed by a violent upward hit (+Z axis).
     - *Speed Breaker:* Upward heave (+Z axis) followed by suspension compression (-Z axis).
   - Automatically categorizes detections as **"Pothole" (🕳️)** or **"Unmarked Speed Breaker" (🛑)** with distinct visual pins and spoken multilingual voice warnings.

2. **Speed-Gated Detection (Eliminating False Positives)**
   - **Problem Solved:** Picking up phone from cupholder, dropping it on passenger seats, or walking while "Monitoring" is on registered as false hits.
   - **The Fix:** Requires GPS speed **> 15 km/h** before logging accelerometer hits. If stationary or walking, jostles are safely ignored with live status telemetry feedback (`Speed Gate: Gated (<15 km/h)`). Demo testing tools bypass the speed gate for indoor evaluation.

3. **Hazard Severity Rating (Minor vs. Dangerous Crater)**
   - Impact force is categorized into 3 actionable tiers based on G-force acceleration:
     - 🟡 **Minor Bump (Yellow):** 22–28 m/s²
     - 🟠 **Moderate Pothole (Orange):** 28–36 m/s²
     - 🔴 **Severe Crater (Red):** > 36 m/s² (triggers urgent warning to slow down immediately).
   - Helps municipal authorities prioritize fixing severe road craters first via the City Dashboard filter.

4. **Pre-Alert Audio Chime (Tone Before Voice)**
   - Powered 100% offline by the browser's native **Web Audio API** (`AudioContext`).
   - Generates a pleasant, non-startling two-tone harmonic warning chime (D5 587Hz → A5 880Hz, or urgent 3-tone chime for severe craters) playing **0.5s before** the spoken multilingual voice alert begins, giving drivers an immediate subconscious cue to pay attention.

5. **Night / Cockpit HUD Mode**
   - Designed for zero-glare night driving without visual distraction.
   - Pure OLED Pitch Black (`#000000`) minimal interface displaying only:
     - **Current Speed (km/h):** Giant digital speedometer with live speed-gate status.
     - **Dynamic Proximity Radar:** Real-time distance countdown to nearest hazard (e.g., *"POTHOLE IN 60m"* or *"SPEED BREAKER IN 110m"*, pulsing red for severe craters).
     - Toggled with the `🚀 Cockpit HUD` header button or keyboard shortcut **`H`**.
