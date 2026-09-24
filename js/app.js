// ============================================================
// SafePath AI — Driver App Logic
// Real Indian Road Conditions Tailored Edition:
// 1. Pothole vs Unmarked Speed Breaker Z-Waveform Classification
// 2. Speed-Gated Detection (Filters false positives when < 15 km/h)
// 3. Hazard Severity Rating (Minor: 22-28, Moderate: 28-36, Severe Crater: >36 m/s²)
// 4. Pre-Alert Audio Chime (Web Audio API 2-tone warning before voice)
// 5. Night / Cockpit HUD Mode (High-contrast OLED, zero-glare, distance radar)
// ============================================================

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const simulateBtn = document.getElementById("simulateBtn"); // legacy fallback
const simulatePotholeMinorBtn = document.getElementById("simulatePotholeMinorBtn");
const simulatePotholeSevereBtn = document.getElementById("simulatePotholeSevereBtn");
const simulateSpeedBreakerBtn = document.getElementById("simulateSpeedBreakerBtn");
const testChimeBtn = document.getElementById("testChimeBtn");
const logList = document.getElementById("logList");
const queueBadge = document.getElementById("queueBadge");

// Speedometer & Speed Gate UI Elements
const currentSpeedDisplay = document.getElementById("currentSpeedDisplay");
const speedGateIndicator = document.getElementById("speedGateIndicator");

// Cockpit HUD Elements
const cockpitHudOverlay = document.getElementById("cockpitHudOverlay");
const hudToggleBtn = document.getElementById("hudToggleBtn");
const hudLaunchBtn = document.getElementById("hudLaunchBtn");
const hudExitBtn = document.getElementById("hudExitBtn");
const hudChimeTestBtn = document.getElementById("hudChimeTestBtn");
const hudSpeedVal = document.getElementById("hudSpeedVal");
const hudSpeedGateBadge = document.getElementById("hudSpeedGateBadge");
const hudRadarCard = document.getElementById("hudRadarCard");
const hudRadarIcon = document.getElementById("hudRadarIcon");
const hudRadarHeadline = document.getElementById("hudRadarHeadline");
const hudRadarSub = document.getElementById("hudRadarSub");
const hudSessionHazards = document.getElementById("hudSessionHazards");
const hudSensorState = document.getElementById("hudSensorState");

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
const SPEED_GATE_MIN_KMH = 15; // Speed gate: require > 15 km/h to prevent phone pick-up false hits

let map, driverMarker;
let currentPos = null; // { lat, lng }
let lastGpsPos = null;
let lastGpsTime = 0;
let currentSpeedKmH = 0;
let lastLogTime = 0;
let alertedHazardIds = new Set();
let sessionLogs = [];
let sessionPhotos = []; // [{ localId, photo, lat, lng, timestamp, facesBlurred }]
let pendingPhotoLocalId = null; // latest hazard id to associate photo with
const syncedKeys = {}; // _localId -> Firebase key
const knownHazardsMap = new Map(); // id -> hazard object
let gyroscopeAvailable = null;
let lastDetectionMethod = "accel-only";
let currentStatusKey = "status_not_started";
let hudActive = false;
let hudUpdateInterval = null;

// Accelerometer Z-Axis Waveform Ring Buffer for Pothole vs Speed Breaker Detection
let zSamples = []; // Array of { z, t }
let meanZ = 9.8;   // Baseline gravity EMA
const EMA_ALPHA = 0.04;
let lastCalculatedMagnitude = 24.0;

// ---------------------------------------------------------------
// Web Audio API: Pre-Alert Warning Chime (Tone Before Voice)
// Pure client-side synthesis — works 100% offline, zero assets
// ---------------------------------------------------------------
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playPreAlertChime(severity = "minor") {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        setTimeout(resolve, 500);
        return;
      }

      const now = ctx.currentTime;
      if (severity === "severe") {
        // Urgent, attention-demanding 3-tone chime for severe craters (587Hz -> 880Hz -> 1174Hz)
        const tones = [
          { freq: 587.33, start: 0, dur: 0.1 },
          { freq: 880.00, start: 0.09, dur: 0.1 },
          { freq: 1174.66, start: 0.18, dur: 0.18 },
        ];
        tones.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.35, now + start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        // 0.36s tone duration + 500ms pre-alert silence cue = ~860ms
        setTimeout(resolve, 860);
      } else {
        // Pleasant two-tone warning chime (D5: 587.33 Hz -> A5: 880 Hz)
        const tones = [
          { freq: 587.33, start: 0, dur: 0.12 },
          { freq: 880.00, start: 0.11, dur: 0.2 },
        ];
        tones.forEach(({ freq, start, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.28, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });
        // 0.31s tone duration + 500ms pre-alert silence cue = ~810ms
        setTimeout(resolve, 810);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
      setTimeout(resolve, 500);
    }
  });
}

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
// Status & Speed Gate Telemetry Helpers
// ---------------------------------------------------------------
function setStatus(live, key, fallbackText) {
  currentStatusKey = key;
  statusDot.classList.toggle("live", live);
  const text = window.i18n ? window.i18n.t(key) : fallbackText;
  statusText.textContent = text || fallbackText;
  if (hudSensorState) {
    hudSensorState.textContent = live ? "ACTIVE" : "STANDBY";
  }
}

function updateSpeedTelemetry(speedKmh) {
  currentSpeedKmH = Math.max(0, speedKmh);

  if (currentSpeedDisplay) {
    currentSpeedDisplay.textContent = currentSpeedKmH;
  }
  if (hudSpeedVal) {
    hudSpeedVal.textContent = currentSpeedKmH;
  }

  const isArmed = currentSpeedKmH >= SPEED_GATE_MIN_KMH;
  const armedText = window.i18n ? window.i18n.t("speed_gate_armed") : "Speed Gate: Armed (>15 km/h)";
  const gatedText = window.i18n ? window.i18n.t("speed_gate_gated") : "Speed Gate: Gated (<15 km/h — filtering false jostles)";

  if (speedGateIndicator) {
    speedGateIndicator.textContent = isArmed ? armedText : gatedText;
    speedGateIndicator.classList.toggle("armed", isArmed);
    speedGateIndicator.classList.toggle("gated", !isArmed);
  }

  if (hudSpeedGateBadge) {
    hudSpeedGateBadge.textContent = isArmed ? armedText : gatedText;
    hudSpeedGateBadge.classList.toggle("armed", isArmed);
    hudSpeedGateBadge.classList.toggle("gated", !isArmed);
  }
}

// ---------------------------------------------------------------
// GPS Tracking with Live Speedometer & Gate Calculation
// ---------------------------------------------------------------
function startGPS() {
  if (!navigator.geolocation) {
    setStatus(false, "status_gps_unavailable", "GPS is not available on this device/browser.");
    return;
  }
  navigator.geolocation.watchPosition(
    (pos) => {
      const now = Date.now();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      updateDriverPosition(lat, lng);

      let speedKmh = 0;
      if (typeof pos.coords.speed === "number" && !isNaN(pos.coords.speed) && pos.coords.speed >= 0) {
        speedKmh = Math.round(pos.coords.speed * 3.6);
      } else if (lastGpsPos && lastGpsTime) {
        const dt = (now - lastGpsTime) / 1000;
        if (dt > 0.5 && dt < 15) {
          const dist = haversineMeters(lastGpsPos.lat, lastGpsPos.lng, lat, lng);
          speedKmh = Math.round((dist / dt) * 3.6);
        }
      }
      lastGpsPos = { lat, lng };
      lastGpsTime = now;
      updateSpeedTelemetry(speedKmh);

      // Trigger radar update for HUD
      if (hudActive) {
        updateCockpitHud();
      }
    },
    (err) => {
      console.error("GPS error", err);
      setStatus(false, "status_gps_denied", "Location permission denied. Please allow location access.");
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

// ---------------------------------------------------------------
// Sensor Signal Processing: Z-Waveform Classification
// Distinguish between "Pothole" and "Unmarked Speed Breaker"
// Pothole: Instant negative drop (-Z) followed by upward hit (+Z)
// Speed Breaker: Upward heave (+Z) followed by suspension compression (-Z)
// ---------------------------------------------------------------
function classifyHazardWaveform() {
  if (zSamples.length < 3) return "pothole"; // default fallback

  // Find the earliest significant peak excursion from baseline (|deltaZ| > 3.0)
  let firstSignificantPeak = null;
  for (const sample of zSamples) {
    if (Math.abs(sample.z) >= 3.0) {
      firstSignificantPeak = sample;
      break;
    }
  }

  if (firstSignificantPeak) {
    // If the earliest deflection was negative, vehicle dipped into pothole first
    if (firstSignificantPeak.z < 0) {
      return "pothole";
    }
    // If the earliest deflection was positive, vehicle hit elevated speed breaker ridge
    if (firstSignificantPeak.z > 0) {
      return "speed_breaker";
    }
  }

  // Secondary analysis: compare timestamp of min peak vs max peak
  let minPeak = zSamples[0];
  let maxPeak = zSamples[0];
  for (const s of zSamples) {
    if (s.z < minPeak.z) minPeak = s;
    if (s.z > maxPeak.z) maxPeak = s;
  }

  if (minPeak.t < maxPeak.t) {
    return "pothole"; // drop precedes impact
  } else {
    return "speed_breaker"; // heave precedes compression
  }
}

// Hazard Severity Rating: Minor (22-28), Moderate (28-36), Severe Crater (>36 m/s²)
function getSeverityRating(magnitude) {
  if (magnitude >= 36) return "severe";
  if (magnitude >= 28) return "moderate";
  return "minor";
}

// ---------------------------------------------------------------
// Automatic Motion Detection (Sensor Fusion: Accel + Gyro)
// ---------------------------------------------------------------
function startMotionDetection() {
  window.addEventListener("devicemotion", (event) => {
    const a = event.accelerationIncludingGravity || event.acceleration;
    if (!a) return;
    const magnitude = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
    lastCalculatedMagnitude = magnitude;

    // Maintain running gravity baseline EMA & Z-axis sample buffer
    const rawZ = a.z || 0;
    meanZ = EMA_ALPHA * rawZ + (1 - EMA_ALPHA) * meanZ;
    const deltaZ = rawZ - meanZ;

    const now = Date.now();
    zSamples.push({ z: deltaZ, t: now });
    const cutoff = now - 400; // keep last 400ms
    while (zSamples.length > 0 && zSamples[0].t < cutoff) {
      zSamples.shift();
    }

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
        const detectedType = classifyHazardWaveform();
        handleHazardDetected("sensor", detectedType, magnitude);
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
// Handle Hazard Detection with Speed Gate & Severity
// ---------------------------------------------------------------
function handleHazardDetected(source, overrideType = null, overrideMag = null) {
  const now = Date.now();
  if (now - lastLogTime < MIN_SECONDS_BETWEEN_HITS * 1000) return;

  const hazardType = overrideType || classifyHazardWaveform();
  const magnitude = overrideMag !== null ? overrideMag : lastCalculatedMagnitude;
  const severity = getSeverityRating(magnitude);

  // SPEED-GATED DETECTION (Modification #2)
  // Prevent false positives from phone handling, walking, or cupholder jostles
  if (source === "sensor") {
    if (currentSpeedKmH < SPEED_GATE_MIN_KMH) {
      console.log(`[SafePath AI] Sensor hit filtered by speed gate: ${currentSpeedKmH} km/h < 15 km/h`);
      const ignoredMsg = window.i18n ? window.i18n.t("speed_gate_ignored") : "Jostle ignored: Vehicle speed below 15 km/h";
      setStatus(true, "speed_gate_ignored", ignoredMsg);
      setTimeout(() => {
        setStatus(true, "status_monitoring", "Monitoring live. Drive normally — hazards log automatically.");
      }, 3500);
      return;
    }
  }

  if (!currentPos) {
    setStatus(true, "status_waiting_gps", "Hazard felt, but waiting for GPS lock to log it...");
    return;
  }

  lastLogTime = now;
  logHazard(currentPos.lat, currentPos.lng, source, hazardType, severity, magnitude);
}

async function logHazard(lat, lng, source, hazardType = "pothole", severity = "minor", magnitude = 24.0) {
  const localId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  pendingPhotoLocalId = localId;

  const hazard = {
    lat,
    lng,
    timestamp: Date.now(),
    source, // "sensor" or "simulated"
    hazardType, // "pothole" or "speed_breaker"
    severity, // "minor", "moderate", "severe"
    magnitude: Math.round(magnitude * 10) / 10,
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

  // Color code map pins:
  // Pothole: Amber (#f59e0b) or Crimson (#ef4444) for severe crater
  // Speed Breaker: Purple (#a855f7)
  const pinColor = severity === "severe" ? "#ef4444" : hazardType === "speed_breaker" ? "#a855f7" : "#f59e0b";
  const typeLabel = hazardType === "speed_breaker" ? "Speed Breaker" : (severity === "severe" ? "Severe Crater" : "Pothole");

  L.circleMarker([lat, lng], {
    radius: severity === "severe" ? 11 : 9,
    color: pinColor,
    fillColor: "#090d16",
    fillOpacity: 1,
    weight: 3,
  })
    .addTo(map)
    .bindPopup(`<strong>${typeLabel}</strong><br>Severity: ${severity.toUpperCase()} (${hazard.magnitude} m/s²)`);

  addSessionLogEntry(hazard);

  // 1. Play Pre-Alert Audio Chime (0.5s pause before voice alert)
  await playPreAlertChime(severity);

  // 2. Multilingual Voice Speech Alert
  if (window.i18n) {
    if (severity === "severe") {
      window.i18n.speak("voice_severe_detected");
    } else if (hazardType === "speed_breaker") {
      window.i18n.speak("voice_speedbreaker_detected");
    } else {
      window.i18n.speak("voice_pothole_detected");
    }
  }

  // Update dropzone hint
  if (dropzoneHint) {
    const timeStr = new Date(hazard.timestamp).toLocaleTimeString();
    dropzoneHint.textContent = `Attached to ${typeLabel.toLowerCase()} detected at ${timeStr}`;
  }

  // Update HUD
  if (hudSessionHazards) {
    hudSessionHazards.textContent = sessionLogs.length;
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

  const isSpeedBreaker = hazard.hazardType === "speed_breaker";
  const typeIcon = isSpeedBreaker ? "🛑" : "🕳️";
  const typeKey = isSpeedBreaker ? "hazard_speed_breaker" : "hazard_pothole";
  const typeName = window.i18n ? window.i18n.t(typeKey) : (isSpeedBreaker ? "Speed Breaker" : "Pothole");

  const sevKey = `severity_${hazard.severity || "minor"}`;
  const sevName = window.i18n ? window.i18n.t(sevKey) : hazard.severity;
  const sevClass = `badge-sev-${hazard.severity || "minor"}`;

  const sourceLabel = hazard.source === "simulated"
    ? `(${window.i18n ? window.i18n.t("simulated_hit") : "simulated"})`
    : `(${hazard.detectionMethod === "accel+gyro" ? "accel+gyro" : "accel-only"})`;

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span class="badge-type ${isSpeedBreaker ? 'badge-type-speedbreaker' : 'badge-type-pothole'}">${typeIcon} ${typeName}</span>
        <span class="badge-severity ${sevClass}">${sevName} (${hazard.magnitude || IMPACT_THRESHOLD} m/s²)</span>
        <span class="photo-indicator" data-local-id="${hazard._localId}"></span>
      </div>
      <span style="font-size:11px; color:var(--text-muted);">${sourceLabel}</span>
    </div>
    <span class="time">${time}</span>
  `;
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
    hazard.id = id;
    if (hazard.status === "flagged" || hazard.status === "repaired") return;

    knownHazardsMap.set(id, hazard);

    const isSpeedBreaker = hazard.hazardType === "speed_breaker";
    const isSevere = hazard.severity === "severe";
    const pinColor = isSevere ? "#ef4444" : isSpeedBreaker ? "#a855f7" : "#94a3b8";

    L.circleMarker([hazard.lat, hazard.lng], {
      radius: isSevere ? 7 : 5,
      color: pinColor,
      fillColor: isSevere ? "#ef4444" : isSpeedBreaker ? "#a855f7" : "#64748b",
      fillOpacity: 0.6,
      weight: 1,
    }).addTo(map);

    setInterval(async () => {
      if (!currentPos || alertedHazardIds.has(id)) return;
      const dist = haversineMeters(currentPos.lat, currentPos.lng, hazard.lat, hazard.lng);
      if (dist < ALERT_RADIUS_METERS) {
        alertedHazardIds.add(id);

        // Play pre-alert audio chime (0.5s pause before voice)
        await playPreAlertChime(hazard.severity || "minor");

        if (window.i18n) {
          if (hazard.severity === "severe") {
            window.i18n.speak("voice_severe_ahead");
          } else if (hazard.hazardType === "speed_breaker") {
            window.i18n.speak("voice_speedbreaker_ahead");
          } else {
            window.i18n.speak("voice_pothole_ahead");
          }
        }
      }
    }, 2500);
  });
}

// ---------------------------------------------------------------
// Cockpit HUD Mode Controller (Modification #5)
// Ultra-High Contrast OLED Night View, Digital Speedometer, Proximity Radar
// ---------------------------------------------------------------
function openCockpitHud() {
  if (!cockpitHudOverlay) return;
  hudActive = true;
  cockpitHudOverlay.style.display = "flex";
  cockpitHudOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updateCockpitHud();
  if (!hudUpdateInterval) {
    hudUpdateInterval = setInterval(updateCockpitHud, 800);
  }
}

function closeCockpitHud() {
  if (!cockpitHudOverlay) return;
  hudActive = false;
  cockpitHudOverlay.style.display = "none";
  cockpitHudOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (hudUpdateInterval) {
    clearInterval(hudUpdateInterval);
    hudUpdateInterval = null;
  }
}

function toggleCockpitHud() {
  if (hudActive) closeCockpitHud();
  else openCockpitHud();
}

function updateCockpitHud() {
  if (!hudActive) return;

  // 1. Update Speedometer & Speed Gate Pill
  if (hudSpeedVal) {
    hudSpeedVal.textContent = currentSpeedKmH;
  }

  // 2. Find Nearest Active Hazard from Known Hazards and Session Logs
  const allActiveHazards = [];
  knownHazardsMap.forEach((h) => {
    if (h.status !== "flagged" && h.status !== "repaired") {
      allActiveHazards.push(h);
    }
  });
  sessionLogs.forEach((h) => {
    if (h.status === "active") {
      allActiveHazards.push(h);
    }
  });

  let nearestDist = Infinity;
  let nearestHazard = null;

  if (currentPos && allActiveHazards.length > 0) {
    for (const h of allActiveHazards) {
      const d = haversineMeters(currentPos.lat, currentPos.lng, h.lat, h.lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestHazard = h;
      }
    }
  }

  // 3. Render Nearest Hazard Distance Radar Banner
  if (hudRadarCard && hudRadarHeadline && hudRadarSub && hudRadarIcon) {
    if (nearestHazard && nearestDist <= 300) {
      const roundedDist = Math.max(5, Math.round(nearestDist / 5) * 5);
      const isSpeedBreaker = nearestHazard.hazardType === "speed_breaker";
      const isSevere = nearestHazard.severity === "severe";
      const typeLabel = isSpeedBreaker
        ? (window.i18n ? window.i18n.t("hazard_speed_breaker") : "Speed Breaker")
        : (isSevere
          ? (window.i18n ? window.i18n.t("severity_severe") : "Severe Crater")
          : (window.i18n ? window.i18n.t("hazard_pothole") : "Pothole"));

      hudRadarIcon.textContent = isSpeedBreaker ? "🛑" : "🕳️";
      hudRadarHeadline.textContent = `${typeLabel.toUpperCase()} IN ${roundedDist}m`;

      const sevText = nearestHazard.severity
        ? `Impact: ${nearestHazard.severity.toUpperCase()} (${nearestHazard.magnitude || 24} m/s²)`
        : "Approach with caution — slow down";
      hudRadarSub.textContent = sevText;

      hudRadarCard.classList.remove("clear", "warning", "severe");
      if (isSevere || roundedDist <= 75) {
        hudRadarCard.classList.add("severe");
      } else {
        hudRadarCard.classList.add("warning");
      }
    } else {
      // Road Clear Ahead
      hudRadarIcon.textContent = "🛡️";
      hudRadarHeadline.textContent = window.i18n ? window.i18n.t("hud_road_clear") : "ROAD CLEAR AHEAD";
      hudRadarSub.textContent = window.i18n ? window.i18n.t("hud_road_clear_sub") : "No hazards within 300 meters";
      hudRadarCard.classList.remove("warning", "severe");
      hudRadarCard.classList.add("clear");
    }
  }

  if (hudSessionHazards) {
    hudSessionHazards.textContent = sessionLogs.length;
  }
}

// ---------------------------------------------------------------
// Button Listeners & Keyboard Shortcuts
// ---------------------------------------------------------------
startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  startBtn.textContent = window.i18n ? window.i18n.t("status_starting") : "Starting...";

  // Warm up Web Audio API context on user gesture
  getAudioContext();

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

  // Enable all demo simulation buttons
  if (simulateBtn) simulateBtn.disabled = false;
  if (simulatePotholeMinorBtn) simulatePotholeMinorBtn.disabled = false;
  if (simulatePotholeSevereBtn) simulatePotholeSevereBtn.disabled = false;
  if (simulateSpeedBreakerBtn) simulateSpeedBreakerBtn.disabled = false;
});

// Simulation Handlers (Bypasses Speed Gate for indoor demonstration)
if (simulatePotholeMinorBtn) {
  simulatePotholeMinorBtn.addEventListener("click", () => {
    handleHazardDetected("simulated", "pothole", 24.5);
  });
}

if (simulatePotholeSevereBtn) {
  simulatePotholeSevereBtn.addEventListener("click", () => {
    handleHazardDetected("simulated", "pothole", 41.2);
  });
}

if (simulateSpeedBreakerBtn) {
  simulateSpeedBreakerBtn.addEventListener("click", () => {
    handleHazardDetected("simulated", "speed_breaker", 31.8);
  });
}

if (simulateBtn) {
  simulateBtn.addEventListener("click", () => {
    handleHazardDetected("simulated", "pothole", 26.0);
  });
}

// Audio Chime Audition Buttons
if (testChimeBtn) {
  testChimeBtn.addEventListener("click", () => {
    playPreAlertChime("moderate");
  });
}
if (hudChimeTestBtn) {
  hudChimeTestBtn.addEventListener("click", () => {
    playPreAlertChime("severe");
  });
}

// Cockpit HUD Toggle Listeners
if (hudToggleBtn) {
  hudToggleBtn.addEventListener("click", openCockpitHud);
}
if (hudLaunchBtn) {
  hudLaunchBtn.addEventListener("click", openCockpitHud);
}
if (hudExitBtn) {
  hudExitBtn.addEventListener("click", closeCockpitHud);
}

// Keyboard Shortcut: [H] toggles HUD, [Esc] exits HUD
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "h" || e.key === "H") {
    toggleCockpitHud();
  } else if (e.key === "Escape" && hudActive) {
    closeCockpitHud();
  }
});

// React to language switch dynamically
document.addEventListener("safepath-lang-changed", () => {
  if (currentStatusKey) {
    setStatus(statusDot.classList.contains("live"), currentStatusKey, statusText.textContent);
  }
  updateSpeedTelemetry(currentSpeedKmH);
  updateQueueBadge();
  if (hudActive) updateCockpitHud();
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
initMap();
updateSpeedTelemetry(0);
updateQueueBadge();
trySyncQueue();
