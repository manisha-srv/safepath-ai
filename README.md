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
4. Click the **gear icon** (top-left, next to "Project Overview") →
   **Project settings**.
5. Scroll down to **Your apps** → click the **`</>`** (web) icon → give the
   app any nickname → **Register app**.
6. Firebase will show you a code block that starts with `const firebaseConfig = {...}`.
   Copy those values into **`js/firebase-config.js`** in this repo, replacing
   the placeholder text (`YOUR_API_KEY`, etc). Keep the quotation marks.
7. Commit/save the change.

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
| Voice alerts | Browser `SpeechSynthesis` API | Built-in, free, no library needed |
| Map | Leaflet.js + OpenStreetMap | Free, no API key, no billing account required |
| Database | Firebase Realtime Database | Free tier, real-time sync between driver app and dashboard |
| Hosting | GitHub Pages | Free static hosting, gives a public demo link |

## Notes for judges

- This is a **web app**, not an installed native app — it runs entirely in
  the phone's browser, using the same sensors a native app would use, with
  zero install friction for a hackathon demo.
- The accelerometer threshold (`IMPACT_THRESHOLD` in `js/app.js`) is tuned
  for demo reliability; a production version would combine it with speed
  and gyroscope data to filter out false positives (sharp turns, phone drops).
