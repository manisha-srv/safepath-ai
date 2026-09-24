// ============================================================
// SafePath AI — Driver App Logic
// Multi-Language Support, Automatic AI Face-Blurring,
// Real-Time Session Photo Stream & Demystified Indoor Testing
// ============================================================

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const simulateBtn = document.getElementById("simulateBtn");
const logList = document.getElementById("logList");
const queueBadge = document.getElementById("queueBadge");

// Dedicated Photo Dropzone & Stream Elements
const photoDropzone = document.getElementById("photoDropzone");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const photoStatus = document.getElementById("photoStatus");
const dropzoneHint = document.getElementById("dropzoneHint");
const sessionPhotoStream = document.getElementById("sessionPhotoStream");

// Tunables — accelerometer & gyroscope thresholds
const IMPACT_THRESHOLD = 22; // total acceleration magnitude (m/s^2)
const ROTATION_THRESHOLD = 50; // deg/s rotational jolt from pothole drop
const MIN_SECONDS_BETWEEN_HITS = 4; // cooldown seconds
const ALERT_RADIUS_METERS = 120; // proximity alert distance

let map, driverMarker;
let currentPos = null; // { lat, lng }
let lastLogTime = 0;
let alertedHazardIds = new Set();
let sessionLogs = [];
let sessionPhotos = []; // [{ localId, photo, lat, lng, timestamp, facesBlurred }]
let pendingPhotoLocalId = null; // latest hazard id to associate photo with
const syncedKeys = {}; // _localId -> Firebase key
let gyroscopeAvailable = null;
let lastDetectionMethod = "accel-only";
let currentStatusKey = "status_not_started";

// ---------------------------------------------------------------
// Map Setup & Theme Synchronization
// ---------------------------------------------------------------
function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5); // Default: India
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
      color: "#090d16",
      fillColor: "#f59e0b",
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    map.setView([lat, lng], 16);
  } else {
    driverMarker.setLatLng([lat, lng]);
  }
}

// ---------------------------------------------------------------
// Status Helper with i18n
// ---------------------------------------------------------------
function setStatus(live, key, fallbackText) {
  currentStatusKey = key;
  statusDot.classList.toggle("live", live);
  const text = window.i18n ? window.i18n.t(key) : fallbackText;
  statusText.textContent = text || fallbackText;
}

// ---------------------------------------------------------------
// GPS Tracking
// ---------------------------------------------------------------
function startGPS() {
  if (!navigator.geolocation) {
    setStatus(false, "status_gps_unavailable", "GPS is not available on this device/browser.");
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      updateDriverPosition(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      console.error("GPS error", err);
      setStatus(false, "status_gps_denied", "Location permission denied. Please allow location access.");
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

// ---------------------------------------------------------------
// Automatic Motion Detection (Sensor Fusion: Accel + Gyro)
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
      setStatus(
        true,
        "status_gyro_unavailable",
        "Monitoring live (gyroscope not available on this device — using accelerometer only)."
      );
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
  return true;
}

// ---------------------------------------------------------------
// Handle Pothole Detection & Multilingual Voice Alerts
// ---------------------------------------------------------------
function handlePotholeDetected(source) {
  const now = Date.now();
  if (now - lastLogTime < MIN_SECONDS_BETWEEN_HITS * 1000) return;
  if (!currentPos) {
    setStatus(true, "status_waiting_gps", "Hazard felt, but waiting for GPS lock to log it...");
    return;
  }
  lastLogTime = now;
  logHazard(currentPos.lat, currentPos.lng, source);
}

function logHazard(lat, lng, source) {
  const localId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  pendingPhotoLocalId = localId;

  const hazard = {
    lat,
    lng,
    timestamp: Date.now(),
    source, // "sensor" or "simulated"
    detectionMethod: source === "sensor" ? lastDetectionMethod : "simulated",
    status: "active",
    flaggedBy: {},
    confirmedBy: {},
    reportedByUid: window.currentUser ? window.currentUser.uid : null,
    reportedByEmail: window.currentUser ? window.currentUser.email : null,
    _localId: localId,
  };

  // Offline queue save
  queueHazard(hazard);
  trySyncQueue();

  // Map pin
  L.circleMarker([lat, lng], {
    radius: 9,
    color: "#f59e0b",
    fillColor: "#090d16",
    fillOpacity: 1,
    weight: 3,
  })
    .addTo(map)
    .bindPopup("Pothole logged here");

  addSessionLogEntry(hazard);

  // Multilingual voice speech alert
  if (window.i18n) {
    window.i18n.speak("voice_detected");
  }

  // Update dropzone hint
  if (dropzoneHint) {
    const timeStr = new Date(hazard.timestamp).toLocaleTimeString();
    dropzoneHint.textContent = `Attached to hazard detected at ${timeStr}`;
  }
}

function addSessionLogEntry(hazard) {
  sessionLogs.unshift(hazard);
  const emptyState = logList.querySelector(".empty-state");
  if (emptyState) logList.innerHTML = "";

  const el = document.createElement("div");
  el.className = "log-item";
  el.dataset.localId = hazard._localId;
  const time = new Date(hazard.timestamp).toLocaleTimeString();

  const label =
    hazard.source === "simulated"
      ? (window.i18n ? window.i18n.t("simulated_hit") : "Simulated hit")
      : `${window.i18n ? window.i18n.t("impact_detected") : "Impact detected"}${
          hazard.detectionMethod === "accel+gyro" ? " (accel+gyro)" : " (accel-only)"
        }`;

  el.innerHTML = `<span><strong>${label}</strong><span class="photo-indicator" data-local-id="${hazard._localId}"></span></span><span class="time">${time}</span>`;
  logList.prepend(el);
}

// ---------------------------------------------------------------
// AI Face-Blurring & Photo Capture via TensorFlow BlazeFace
// ---------------------------------------------------------------
const MAX_PHOTO_WIDTH = 500;
const PHOTO_JPEG_QUALITY = 0.55;

let blazefaceModel = null;
let blazefaceLoadPromise = null;

function ensureBlazefaceModel() {
  if (blazefaceModel) return Promise.resolve(blazefaceModel);
  if (blazefaceLoadPromise) return blazefaceLoadPromise;
  if (typeof blazeface === "undefined") return Promise.resolve(null);

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
ensureBlazefaceModel(); // Warm up model early

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

function pixelateRegion(ctx, x, y, w, h) {
  const pad = Math.max(w, h) * 0.22;
  x = Math.max(0, x - pad);
  y = Math.max(0, y - pad);
  w = Math.min(ctx.canvas.width - x, w + pad * 2);
  h = Math.min(ctx.canvas.height - y, h + pad * 2);
  if (w <= 0 || h <= 0) return;

  const pixelSize = Math.max(4, Math.floor(Math.min(w, h) / 7));
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.floor(w / pixelSize));
  small.height = Math.max(1, Math.floor(h / pixelSize));
  const smallCtx = small.getContext("2d");
  smallCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, small.width, small.height);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
}

async function blurFacesOnCanvas(canvas) {
  const model = await ensureBlazefaceModel();
  if (!model) throw new Error("Face-blur model unavailable");
  const predictions = await model.estimateFaces(canvas, false);
  const ctx = canvas.getContext("2d");
  predictions.forEach((pred) => {
    const [x1, y1] = pred.topLeft;
    const [x2, y2] = pred.bottomRight;
    pixelateRegion(ctx, x1, y1, x2 - x1, y2 - y1);
  });
  return predictions.length;
}

async function compressAndBlurImage(file, maxWidth = MAX_PHOTO_WIDTH, quality = PHOTO_JPEG_QUALITY) {
  const rawDataUrl = await readFileAsDataURL(file);
  const img = await loadImage(rawDataUrl);
  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const facesBlurred = await blurFacesOnCanvas(canvas);
  return { dataUrl: canvas.toDataURL("image/jpeg", quality), facesBlurred };
}

// ---------------------------------------------------------------
// Attach Photo & Update Real-Time Session Stream
// ---------------------------------------------------------------
function attachPhotoToHazard(localId, dataUrl, facesBlurred) {
  const queue = getQueue();
  const idx = queue.findIndex((h) => h._localId === localId);
  let coords = currentPos || { lat: 20.5937, lng: 78.9629 };

  if (idx !== -1) {
    queue[idx].photo = dataUrl;
    queue[idx].facesBlurred = facesBlurred;
    coords = { lat: queue[idx].lat, lng: queue[idx].lng };
    saveQueue(queue);
  } else if (syncedKeys[localId] && typeof db !== "undefined") {
    db.ref(`hazards/${syncedKeys[localId]}`).update({ photo: dataUrl, facesBlurred });
  }

  // Update session hazard indicator
  const indicator = logList.querySelector(`.photo-indicator[data-local-id="${localId}"]`);
  if (indicator) indicator.textContent = " 📷";

  // Add to Session Photo Stream
  addPhotoToSessionStream({
    localId,
    photo: dataUrl,
    lat: coords.lat,
    lng: coords.lng,
    timestamp: Date.now(),
    facesBlurred,
  });
}

function addPhotoToSessionStream(entry) {
  sessionPhotos.unshift(entry);
  const emptyState = sessionPhotoStream.querySelector(".empty-state");
  if (emptyState) sessionPhotoStream.innerHTML = "";

  const card = document.createElement("div");
  card.className = "stream-card";
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const blurLabel = entry.facesBlurred > 0 ? `🛡️ ${entry.facesBlurred} Face(s) Blurred` : "🛡️ Privacy Verified";

  card.innerHTML = `
    <img class="stream-thumb" src="${entry.photo}" alt="Hazard snapshot" />
    <div class="stream-info">
      <div class="stream-coords">📍 ${entry.lat.toFixed(5)}, ${entry.lng.toFixed(5)}</div>
      <div class="stream-time">${time}</div>
      <span class="stream-tag">${blurLabel}</span>
    </div>
  `;

  sessionPhotoStream.prepend(card);
}

// ---------------------------------------------------------------
// Dedicated Dropzone Handlers (Click + Drag & Drop)
// ---------------------------------------------------------------
if (photoDropzone && photoInput) {
  photoDropzone.addEventListener("click", () => {
    photoInput.click();
  });

  photoDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    photoDropzone.classList.add("dragover");
  });

  photoDropzone.addEventListener("dragleave", () => {
    photoDropzone.classList.remove("dragover");
  });

  photoDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    photoDropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPhotoFile(e.dataTransfer.files[0]);
    }
  });

  photoInput.addEventListener("change", () => {
    if (photoInput.files && photoInput.files[0]) {
      processPhotoFile(photoInput.files[0]);
    }
  });
}

async function processPhotoFile(file) {
  if (!file) return;

  photoStatus.textContent = window.i18n
    ? window.i18n.t("photo_scanning")
    : "Scanning for civilian faces to blur...";

  try {
    const { dataUrl, facesBlurred } = await compressAndBlurImage(file);
    photoPreview.src = dataUrl;
    photoPreview.style.display = "block";

    // If no recent hazard was pending, create a local ID for this photo
    let targetId = pendingPhotoLocalId;
    if (!targetId) {
      if (sessionLogs.length > 0) {
        targetId = sessionLogs[0]._localId;
      } else {
        // Create an ad-hoc local hazard at current GPS coordinates
        const now = Date.now();
        const lat = currentPos ? currentPos.lat : 20.5937;
        const lng = currentPos ? currentPos.lng : 78.9629;
        logHazard(lat, lng, "photo_report");
        targetId = pendingPhotoLocalId;
      }
    }

    attachPhotoToHazard(targetId, dataUrl, facesBlurred);

    if (window.i18n) {
      photoStatus.textContent =
        facesBlurred > 0
          ? window.i18n.t("photo_blurred_count", { count: facesBlurred, plural: facesBlurred > 1 ? "s" : "" })
          : window.i18n.t("photo_no_faces");
    } else {
      photoStatus.textContent =
        facesBlurred > 0
          ? `${facesBlurred} face${facesBlurred > 1 ? "s" : ""} blurred. Photo attached.`
          : "No faces detected. Photo attached.";
    }

    setTimeout(() => {
      photoPreview.style.display = "none";
      photoStatus.textContent = "";
    }, 4000);
  } catch (err) {
    console.error("Photo processing failed:", err);
    photoStatus.textContent = window.i18n
      ? window.i18n.t("photo_filter_error")
      : "Couldn't load privacy filter — photo not attached.";
  }
}

// ---------------------------------------------------------------
// Offline Sync Queue
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
  const queue = getQueue();
  queue.push(hazard);
  saveQueue(queue);
}

function updateQueueBadge() {
  const pending = getQueue().length;
  if (pending > 0) {
    const text = window.i18n
      ? window.i18n.t("queue_badge_text", { count: pending, plural: pending > 1 ? "s" : "" })
      : `${pending} hazard${pending > 1 ? "s" : ""} waiting to sync (offline)`;
    queueBadge.textContent = text;
    queueBadge.style.display = "block";
  } else {
    queueBadge.style.display = "none";
  }
}

async function trySyncQueue() {
  if (syncing) return;
  if (typeof db === "undefined") return;
  if (!navigator.onLine) return;
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
      console.error("Sync failed for hazard, will retry", e);
      stillPending.push(item);
    }
  }

  saveQueue(stillPending);
  syncing = false;
}

window.addEventListener("online", () => {
  setStatus(true, "status_back_online", "Back online — syncing queued hazards...");
  trySyncQueue();
});
setInterval(trySyncQueue, 15000);

// ---------------------------------------------------------------
// Proximity Alerts & Known Hazards
// ---------------------------------------------------------------
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
    if (hazard.status === "flagged" || hazard.status === "repaired") return;

    L.circleMarker([hazard.lat, hazard.lng], {
      radius: 6,
      color: "#94a3b8",
      fillColor: "#64748b",
      fillOpacity: 0.5,
      weight: 1,
    }).addTo(map);

    setInterval(() => {
      if (!currentPos || alertedHazardIds.has(id)) return;
      const dist = haversineMeters(currentPos.lat, currentPos.lng, hazard.lat, hazard.lng);
      if (dist < ALERT_RADIUS_METERS) {
        alertedHazardIds.add(id);
        if (window.i18n) {
          window.i18n.speak("voice_ahead");
        }
      }
    }, 3000);
  });
}

// ---------------------------------------------------------------
// Button Listeners
// ---------------------------------------------------------------
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = window.i18n ? window.i18n.t("status_starting") : "Starting...";

  const granted = await requestMotionPermission();
  if (!granted) {
    setStatus(false, "status_motion_denied", "Motion sensor permission denied.");
    startBtn.disabled = false;
    startBtn.textContent = window.i18n ? window.i18n.t("start_monitoring_btn") : "Start Monitoring";
    return;
  }

  startGPS();
  startMotionDetection();
  listenForKnownHazards();

  setStatus(true, "status_monitoring", "Monitoring live. Drive normally — hazards log automatically.");
  startBtn.textContent = window.i18n ? window.i18n.t("status_active") : "Monitoring Active";
  simulateBtn.disabled = false;
});

// Demystified Simulate Hit (inside Demo & Test Tools panel)
simulateBtn.addEventListener("click", () => {
  handlePotholeDetected("simulated");
});

// React to language switch dynamically
document.addEventListener("safepath-lang-changed", () => {
  if (currentStatusKey) {
    setStatus(statusDot.classList.contains("live"), currentStatusKey, statusText.textContent);
  }
  updateQueueBadge();
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
initMap();
updateQueueBadge();
trySyncQueue();
