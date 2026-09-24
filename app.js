// ============================================================
// SafePath AI — Driver App logic
// ============================================================

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const simulateBtn = document.getElementById("simulateBtn");
const logList = document.getElementById("logList");
const queueBadge = document.getElementById("queueBadge");
const photoCard = document.getElementById("photoCard");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoStatus = document.getElementById("photoStatus");
const skipPhotoBtn = document.getElementById("skipPhotoBtn");

// tunables — the accelerometer threshold for "this was a pothole hit"
const IMPACT_THRESHOLD = 22; // total acceleration magnitude (m/s^2)
const ROTATION_THRESHOLD = 50; // deg/s — the rotational jolt from a wheel dropping into/out of a pothole
const MIN_SECONDS_BETWEEN_HITS = 4; // cooldown so one bump isn't logged 10 times
const ALERT_RADIUS_METERS = 120; // warn the driver when this close to a known hazard

let map, driverMarker;
let currentPos = null; // { lat, lng }
let lastLogTime = 0;
let alertedHazardIds = new Set();
let sessionLogs = [];
let pendingPhotoLocalId = null; // which hazard the photo prompt is currently offering to attach to
const syncedKeys = {}; // _localId -> Firebase key, for hazards that have already synced (so a late photo can still find them)
let gyroscopeAvailable = null; // null = not yet determined, then true/false once real devicemotion data arrives
let lastDetectionMethod = "accel-only";

// ---------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------
function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5); // default: India, zooms in once GPS is found
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
}

function updateDriverPosition(lat, lng) {
  currentPos = { lat, lng };
  if (!driverMarker) {
    driverMarker = L.circleMarker([lat, lng], {
      radius: 8,
      color: "#2b2d33",
      fillColor: "#ffb800",
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    map.setView([lat, lng], 16);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
}

// ---------------------------------------------------------------
// Status helper
// ---------------------------------------------------------------
function setStatus(live, text) {
  statusDot.classList.toggle("live", live);
  statusText.textContent = text;
}

// ---------------------------------------------------------------
// GPS tracking
// ---------------------------------------------------------------
function startGPS() {
  if (!navigator.geolocation) {
    setStatus(false, "GPS is not available on this device/browser.");
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      updateDriverPosition(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      console.error("GPS error", err);
      setStatus(false, "Location permission denied. Please allow location access.");
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

// ---------------------------------------------------------------
// Accelerometer / motion detection
//
// Sensor fusion: acceleration alone can't tell a real wheel-into-a-
// pothole impact apart from hard braking or the phone just being
// jostled — both spike acceleration. A pothole impact also rocks the
// car body (pitch/roll), which the gyroscope's rotationRate picks up
// but braking mostly doesn't. So when the gyroscope is available, we
// require both signals; if a device/browser doesn't expose
// rotationRate at all, we fall back to accelerometer-only so
// detection still works everywhere.
// ---------------------------------------------------------------
function startMotionDetection() {
  window.addEventListener("devicemotion", (event) => {
    const a = event.accelerationIncludingGravity;
    if (!a) return;
    const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);

    const r = event.rotationRate;
    let rotationMagnitude = 0;
    if (r && (r.alpha !== null || r.beta !== null || r.gamma !== null)) {
      gyroscopeAvailable = true;
      rotationMagnitude = Math.sqrt((r.alpha || 0) ** 2 + (r.beta || 0) ** 2 + (r.gamma || 0) ** 2);
    } else if (gyroscopeAvailable === null) {
      gyroscopeAvailable = false;
      setStatus(true, "Monitoring live (gyroscope not available on this device — using accelerometer only).");
    }

    if (magnitude > IMPACT_THRESHOLD) {
      if (!gyroscopeAvailable || rotationMagnitude > ROTATION_THRESHOLD) {
        lastDetectionMethod = gyroscopeAvailable ? "accel+gyro" : "accel-only";
        handlePotholeDetected("sensor");
      }
    }
  });
}

async function requestMotionPermission() {
  // iOS 13+ requires an explicit user-gesture permission request
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      return result === "granted";
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  return true; // Android / desktop browsers don't need explicit permission
}

// ---------------------------------------------------------------
// Handle a detected (or simulated) pothole hit
// ---------------------------------------------------------------
function handlePotholeDetected(source) {
  const now = Date.now();
  if (now - lastLogTime < MIN_SECONDS_BETWEEN_HITS * 1000) return; // cooldown
  if (!currentPos) {
    setStatus(true, "Hazard felt, but waiting for GPS lock to log it...");
    return;
  }
  lastLogTime = now;
  logHazard(currentPos.lat, currentPos.lng, source);
}

function logHazard(lat, lng, source) {
  const localId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const hazard = {
    lat,
    lng,
    timestamp: Date.now(),
    source, // "sensor" or "simulated"
    detectionMethod: source === "sensor" ? lastDetectionMethod : "simulated", // "accel+gyro" | "accel-only" | "simulated"
    status: "active", // "active" | "flagged" (pending review) | "repaired"
    flaggedBy: {},
    confirmedBy: {},
    reportedByUid: window.currentUser ? window.currentUser.uid : null,
    reportedByEmail: window.currentUser ? window.currentUser.email : null,
    _localId: localId,
  };

  // Always save locally first — this is what makes it work offline.
  // If there's no signal right now, it just waits in the queue.
  queueHazard(hazard);
  trySyncQueue();

  // local marker + session log (these don't need the network at all)
  L.circleMarker([lat, lng], {
    radius: 9,
    color: "#ffb800",
    fillColor: "#1a1a1a",
    fillOpacity: 1,
    weight: 3,
  })
    .addTo(map)
    .bindPopup("Pothole logged here");

  addSessionLogEntry(hazard);
  speak("Caution. Road damage detected. Slow down.");

  // Offer an optional photo, but never block driving on it — the driver
  // can attach one whenever it's safe, or just skip it.
  showPhotoPrompt(localId);
}

function addSessionLogEntry(hazard) {
  sessionLogs.unshift(hazard);
  if (logList.querySelector(".empty-state")) logList.innerHTML = "";
  const el = document.createElement("div");
  el.className = "log-item";
  el.dataset.localId = hazard._localId;
  const time = new Date(hazard.timestamp).toLocaleTimeString();
  const label =
    hazard.source === "simulated"
      ? "Simulated hit"
      : `Impact detected${hazard.detectionMethod === "accel+gyro" ? " (accel+gyro)" : " (accel-only)"}`;
  el.innerHTML = `<span>${label}<span class="photo-indicator" data-local-id="${hazard._localId}"></span></span><span class="time">${time}</span>`;
  logList.prepend(el);
}

// ---------------------------------------------------------------
// Optional photo capture
//
// Compressed client-side (resized + re-encoded as JPEG) and stored
// as a base64 string directly on the hazard record in Realtime
// Database — this avoids needing Firebase Storage (which requires
// the paid Blaze plan for outside access), keeping the whole app on
// Firebase's free tier as promised in the pitch deck. Face-blurring
// before upload is the next step, not yet implemented here.
// ---------------------------------------------------------------
const MAX_PHOTO_WIDTH = 480;
const PHOTO_JPEG_QUALITY = 0.5;

// The face-blur model is heavy-ish to load, so kick it off in the
// background as soon as the page opens rather than waiting for the
// driver to actually take a photo.
let blazefaceModel = null;
let blazefaceLoadPromise = null;
function ensureBlazefaceModel() {
  if (blazefaceModel) return Promise.resolve(blazefaceModel);
  if (blazefaceLoadPromise) return blazefaceLoadPromise;
  if (typeof blazeface === "undefined") return Promise.resolve(null); // CDN script blocked/offline
  blazefaceLoadPromise = blazeface
    .load()
    .then((model) => {
      blazefaceModel = model;
      return model;
    })
    .catch((e) => {
      console.error("Failed to load face-blur model", e);
      blazefaceLoadPromise = null;
      return null;
    });
  return blazefaceLoadPromise;
}
ensureBlazefaceModel(); // fire and forget, warms up the model early

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Pixelates a region in place — simple, fast, and doesn't need any
// extra libraries beyond canvas itself.
function pixelateRegion(ctx, x, y, w, h) {
  const pad = Math.max(w, h) * 0.2; // a little margin so blur covers hair/ears too
  x = Math.max(0, x - pad);
  y = Math.max(0, y - pad);
  w = Math.min(ctx.canvas.width - x, w + pad * 2);
  h = Math.min(ctx.canvas.height - y, h + pad * 2);
  if (w <= 0 || h <= 0) return;

  const pixelSize = Math.max(4, Math.floor(Math.min(w, h) / 8));
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.floor(w / pixelSize));
  small.height = Math.max(1, Math.floor(h / pixelSize));
  const smallCtx = small.getContext("2d");
  smallCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, small.width, small.height);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
}

// Detects faces on the canvas and pixelates each one in place.
// Throws if the model isn't available, so the caller can decide not
// to upload an unblurred photo rather than silently skipping privacy
// protection.
async function blurFacesOnCanvas(canvas) {
  const model = await ensureBlazefaceModel();
  if (!model) throw new Error("face-blur model unavailable");
  const predictions = await model.estimateFaces(canvas, false);
  const ctx = canvas.getContext("2d");
  predictions.forEach((pred) => {
    const [x1, y1] = pred.topLeft;
    const [x2, y2] = pred.bottomRight;
    pixelateRegion(ctx, x1, y1, x2 - x1, y2 - y1);
  });
  return predictions.length;
}

// Resizes + re-encodes the photo (keeps it small for the free Firebase
// plan) and blurs any faces before it's ever attached to a hazard.
async function compressAndBlurImage(file, maxWidth = MAX_PHOTO_WIDTH, quality = PHOTO_JPEG_QUALITY) {
  const rawDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(rawDataUrl);
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const facesBlurred = await blurFacesOnCanvas(canvas); // throws if model unavailable
  return { dataUrl: canvas.toDataURL("image/jpeg", quality), facesBlurred };
}

function showPhotoPrompt(localId) {
  pendingPhotoLocalId = localId;
  photoInput.value = "";
  photoInput.disabled = false;
  photoPreview.style.display = "none";
  photoStatus.textContent = "";
  photoCard.style.display = "block";
}

function hidePhotoPrompt() {
  photoCard.style.display = "none";
  pendingPhotoLocalId = null;
}

// A hazard may already be synced to Firebase (has a real key) or may
// still be sitting in the offline queue — this attaches the photo to
// whichever place it currently lives.
function attachPhotoToHazard(localId, dataUrl) {
  const queue = getQueue();
  const idx = queue.findIndex((h) => h._localId === localId);
  if (idx !== -1) {
    queue[idx].photo = dataUrl;
    saveQueue(queue);
  } else if (syncedKeys[localId] && typeof db !== "undefined") {
    db.ref(`hazards/${syncedKeys[localId]}`).update({ photo: dataUrl });
  } else {
    return; // page was reloaded since this hazard synced — can't reattach in this MVP
  }

  const indicator = logList.querySelector(`.photo-indicator[data-local-id="${localId}"]`);
  if (indicator) indicator.textContent = " 📷";
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files[0];
  if (!file || !pendingPhotoLocalId) return;

  photoInput.disabled = true;
  photoStatus.textContent = "Scanning for faces to blur...";

  try {
    const { dataUrl, facesBlurred } = await compressAndBlurImage(file);
    photoPreview.src = dataUrl;
    photoPreview.style.display = "block";
    attachPhotoToHazard(pendingPhotoLocalId, dataUrl);
    photoStatus.textContent =
      facesBlurred > 0
        ? `${facesBlurred} face${facesBlurred > 1 ? "s" : ""} blurred. Photo attached.`
        : "No faces detected. Photo attached.";
    setTimeout(hidePhotoPrompt, 1500);
  } catch (e) {
    // Fail closed: if the privacy filter couldn't run, don't attach an
    // unblurred photo. The driver can retry once they have a connection
    // (the model loads from a CDN the first time).
    console.error("Photo not attached — face-blur unavailable", e);
    photoStatus.textContent =
      "Couldn't load the privacy filter (check your connection) — photo not attached. You can try again.";
    photoInput.disabled = false;
  }
});

skipPhotoBtn.addEventListener("click", hidePhotoPrompt);

// ---------------------------------------------------------------
// Offline sync queue
//
// Every detected hazard is written to localStorage immediately,
// regardless of network status. That queue is what actually gets
// synced to Firebase — so a hazard detected with zero signal (e.g.
// a rural stretch of road) is never lost; it just waits until the
// phone finds a connection again, even if the app was closed and
// reopened in between.
// ---------------------------------------------------------------
const QUEUE_KEY = "safepath_pending_hazards";
let syncing = false;

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  updateQueueBadge();
}

function queueHazard(hazard) {
  // hazard already carries its own _localId (set in logHazard), so the
  // photo-attach flow and the sync flow can both refer to the same id.
  const queue = getQueue();
  queue.push(hazard);
  saveQueue(queue);
}

function updateQueueBadge() {
  const pending = getQueue().length;
  if (pending > 0) {
    queueBadge.textContent = `${pending} hazard${pending > 1 ? "s" : ""} waiting to sync (offline)`;
    queueBadge.style.display = "block";
  } else {
    queueBadge.style.display = "none";
  }
}

async function trySyncQueue() {
  if (syncing) return;
  if (typeof db === "undefined") return;
  if (!navigator.onLine) return; // don't even try — no point, saves battery/retries
  const queue = getQueue();
  if (queue.length === 0) return;

  syncing = true;
  const stillPending = [];

  for (const item of queue) {
    try {
      const { _localId, ...hazard } = item;
      const ref = await db.ref("hazards").push(hazard);
      syncedKeys[_localId] = ref.key;
    } catch (e) {
      console.error("Sync failed for one hazard, will retry later", e);
      stillPending.push(item);
    }
  }

  saveQueue(stillPending);
  syncing = false;
}

// retry automatically when the browser regains a connection...
window.addEventListener("online", () => {
  setStatus(true, "Back online — syncing queued hazards...");
  trySyncQueue();
});

// ...and also on a timer, since 'online' events aren't always reliable on mobile
setInterval(trySyncQueue, 15000);


function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function listenForKnownHazards() {
  if (typeof db === "undefined") return;
  db.ref("hazards").on("child_added", (snapshot) => {
    const id = snapshot.key;
    const hazard = snapshot.val();

    // Skip hazards that are flagged (pending community review) or already
    // repaired — drivers shouldn't see markers or get alerts for either.
    // status is undefined on older/legacy records, which counts as "active".
    if (hazard.status === "flagged" || hazard.status === "repaired") return;

    // draw every known hazard on the map (in gray, distinct from this-session amber pins)
    L.circleMarker([hazard.lat, hazard.lng], {
      radius: 6,
      color: "#6b6f76",
      fillColor: "#6b6f76",
      fillOpacity: 0.5,
      weight: 1,
    }).addTo(map);

    // proximity check on an interval, since currentPos keeps changing
    setInterval(() => {
      if (!currentPos || alertedHazardIds.has(id)) return;
      const dist = haversineMeters(currentPos.lat, currentPos.lng, hazard.lat, hazard.lng);
      if (dist < ALERT_RADIUS_METERS) {
        alertedHazardIds.add(id);
        speak("Caution. Road damage ahead. Slow down.");
      }
    }, 3000);
  });
}

// ---------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = "Starting...";

  const granted = await requestMotionPermission();
  if (!granted) {
    setStatus(false, "Motion sensor permission denied.");
    startBtn.disabled = false;
    startBtn.textContent = "Start Monitoring";
    return;
  }

  startGPS();
  startMotionDetection();
  listenForKnownHazards();

  setStatus(true, "Monitoring live. Drive normally — hazards log automatically.");
  startBtn.textContent = "Monitoring Active";
  simulateBtn.disabled = false;
});

simulateBtn.addEventListener("click", () => {
  handlePotholeDetected("simulated");
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
initMap();
updateQueueBadge(); // show any hazards left over from a previous offline session
trySyncQueue(); // and try to flush them right away if we're online now
