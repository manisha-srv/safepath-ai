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

// Dynamic Collaborative Vehicle Proximity Radar Pill
const vehicleRadarPill = document.getElementById("vehicleRadarPill");
const radarPillText = document.getElementById("radarPillText");
const radarPillDismiss = document.getElementById("radarPillDismiss");
const simulateNearbyVehicleBtn = document.getElementById("simulateNearbyVehicleBtn");

// 3-Way Alert System & Vibration Controls
const alertModeBtn = document.getElementById("alertModeBtn");
const alertModeIcon = document.getElementById("alertModeIcon");
const alertModeLabel = document.getElementById("alertModeLabel");
const vibrationToggleBtn = document.getElementById("vibrationToggleBtn");
const vibrationToggleIcon = document.getElementById("vibrationToggleIcon");
const vibrationToggleLabel = document.getElementById("vibrationToggleLabel");
const testHapticHazardBtn = document.getElementById("testHapticHazardBtn");
const testHapticSevereBtn = document.getElementById("testHapticSevereBtn");
const testHapticProximityBtn = document.getElementById("testHapticProximityBtn");

// Slide-out Sidebar Drawer Elements
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const appSidebar = document.getElementById("appSidebar");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const navLinkPhotoEvidence = document.getElementById("navLinkPhotoEvidence");
const sidebarModeSound = document.getElementById("sidebarModeSound");
const sidebarModeVibrate = document.getElementById("sidebarModeVibrate");
const sidebarModeSilent = document.getElementById("sidebarModeSilent");
const sidebarVibrationToggle = document.getElementById("sidebarVibrationToggle");
const sidebarLangSelector = document.getElementById("sidebarLangSelector");
const sidebarSpeedVal = document.getElementById("sidebarSpeedVal");
const sidebarRadarVehicles = document.getElementById("sidebarRadarVehicles");
const sidebarSensorsStatus = document.getElementById("sidebarSensorsStatus");
const sidebarGateStatus = document.getElementById("sidebarGateStatus");
const sidebarTotalHazards = document.getElementById("sidebarTotalHazards");

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
const SPEED_GATE_MIN_KMH = 12; // Speed gate: require >= 12 km/h to prevent phone pick-up/walking false hits

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

// ---------------------------------------------------------------
// 3-Way Alert System (Sound / Vibrate / Silent) & Web Vibration API
// 🔊 Sound: Spoken voice alerts + Web Audio chime + haptic vibration.
// 📳 Vibrate: Tactile physical pulses only, completely quiet (peaceful driving).
// 🔇 Silent: Visual screen & map notifications only, zero audio and zero vibration.
// ---------------------------------------------------------------
const ALERT_MODE_KEY = "safepath_alert_mode";
const VIBRATION_ENABLED_KEY = "safepath_vibration_enabled";

// Haptic tactile pulse patterns (navigator.vibrate)
const HAPTIC_PATTERNS = {
  hazard: [250, 100, 250],               // Hazard Alert: Two sharp, physical tactile pulses through the phone mount
  severe: [400, 120, 400, 120, 500],      // Severe Crater: Three heavy warning pulses
  proximity: [120, 80, 120],             // Vehicle Proximity Alert: Gentle double-tap buzz
  tap: [40],                             // Subtle UI toggle feedback
};

let currentAlertMode = localStorage.getItem(ALERT_MODE_KEY) || "sound"; // "sound" | "vibrate" | "silent"
let vibrationEnabled = localStorage.getItem(VIBRATION_ENABLED_KEY) !== "false";

function getAlertMode() {
  return currentAlertMode;
}

function setAlertMode(mode) {
  currentAlertMode = mode;
  localStorage.setItem(ALERT_MODE_KEY, mode);
  updateAlertModeUI();
  document.dispatchEvent(new CustomEvent("safepath-alert-mode-changed", { detail: { mode } }));

  // Immediate tactile or chime preview on mode change
  if (mode === "vibrate") {
    triggerHaptic("tap");
  } else if (mode === "sound") {
    playPreAlertChime("minor");
  }
}

function isVibrationEnabled() {
  return vibrationEnabled;
}

function setVibrationEnabled(enabled) {
  vibrationEnabled = !!enabled;
  localStorage.setItem(VIBRATION_ENABLED_KEY, vibrationEnabled ? "true" : "false");
  updateVibrationToggleUI();
  if (vibrationEnabled) {
    triggerHaptic("tap");
  }
}

function canPlayAudio() {
  return currentAlertMode === "sound";
}

function canVibrate() {
  return (
    (currentAlertMode === "sound" || currentAlertMode === "vibrate") &&
    vibrationEnabled &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}

function triggerHaptic(type) {
  if (!canVibrate()) return;
  try {
    const pattern = HAPTIC_PATTERNS[type] || type;
    navigator.vibrate(pattern);
  } catch (e) {
    console.warn("Haptic vibration error:", e);
  }
}

function updateAlertModeUI() {
  const btn = document.getElementById("alertModeBtn");
  const icon = document.getElementById("alertModeIcon");
  const label = document.getElementById("alertModeLabel");

  if (btn && icon && label) {
    btn.classList.remove("mode-sound", "mode-vibrate", "mode-silent");
    btn.classList.add(`mode-${currentAlertMode}`);

    if (currentAlertMode === "sound") {
      icon.textContent = "🔊";
      label.textContent = window.i18n ? window.i18n.t("alert_mode_sound") : "Sound";
      btn.setAttribute("title", "Alert Mode: Sound (Voice + Chime + Haptics)");
    } else if (currentAlertMode === "vibrate") {
      icon.textContent = "📳";
      label.textContent = window.i18n ? window.i18n.t("alert_mode_vibrate") : "Vibrate";
      btn.setAttribute("title", "Alert Mode: Vibrate (Tactile physical pulses only, completely quiet)");
    } else {
      icon.textContent = "🔇";
      label.textContent = window.i18n ? window.i18n.t("alert_mode_silent") : "Silent";
      btn.setAttribute("title", "Alert Mode: Silent (Visual screen & map only, zero audio/vibration)");
    }
  }

  // Sync sidebar drawer mode buttons
  const soundBtn = document.getElementById("sidebarModeSound");
  const vibBtn = document.getElementById("sidebarModeVibrate");
  const silentBtn = document.getElementById("sidebarModeSilent");
  if (soundBtn) soundBtn.classList.toggle("active", currentAlertMode === "sound");
  if (vibBtn) vibBtn.classList.toggle("active", currentAlertMode === "vibrate");
  if (silentBtn) silentBtn.classList.toggle("active", currentAlertMode === "silent");
}

function cycleAlertMode() {
  if (currentAlertMode === "sound") setAlertMode("vibrate");
  else if (currentAlertMode === "vibrate") setAlertMode("silent");
  else setAlertMode("sound");
}

function updateVibrationToggleUI() {
  const btn = document.getElementById("vibrationToggleBtn");
  const label = document.getElementById("vibrationToggleLabel");
  const sidebarCheck = document.getElementById("sidebarVibrationToggle");

  if (btn && label) {
    btn.classList.toggle("off", !vibrationEnabled);
    label.textContent = vibrationEnabled
      ? (window.i18n ? window.i18n.t("vibration_on") : "Haptics ON")
      : (window.i18n ? window.i18n.t("vibration_off") : "Haptics OFF");
  }
  if (sidebarCheck) {
    sidebarCheck.checked = vibrationEnabled;
  }
}

function playPreAlertChime(severity = "minor") {
  if (!canPlayAudio()) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        setTimeout(resolve, 300);
        return;
      }

      const now = ctx.currentTime;
      if (severity === "severe") {
        // Urgent 3-tone chime for severe craters (587Hz -> 880Hz -> 1174Hz)
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
        setTimeout(resolve, 810);
      }
    } catch (e) {
      console.warn("Audio chime error:", e);
      setTimeout(resolve, 300);
    }
  });
}

// Gentle Radar Proximity Chime for Collaborative Vehicle Radar (Double-ping)
function playRadarProximityChime() {
  if (!canPlayAudio()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const tones = [
      { freq: 784.0, start: 0, dur: 0.1 },
      { freq: 1046.5, start: 0.08, dur: 0.16 },
    ];
    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (e) {
    console.warn("Radar chime error:", e);
  }
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

  window.addEventListener("resize", () => {
    if (map) map.invalidateSize();
  });
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 250);
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
  if (statusDot) statusDot.classList.toggle("live", live);
  const brandDot = document.getElementById("topBrandStatusDot");
  if (brandDot) brandDot.classList.toggle("live", live);
  const text = window.i18n ? window.i18n.t(key) : fallbackText;
  if (statusText) statusText.textContent = text || fallbackText;
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
  const sbSpeed = document.getElementById("sidebarSpeedVal");
  if (sbSpeed) {
    sbSpeed.textContent = currentSpeedKmH;
  }

  const isArmed = currentSpeedKmH >= SPEED_GATE_MIN_KMH;
  const armedText = window.i18n ? window.i18n.t("speed_gate_armed") : "Speed Gate: Armed (>12 km/h)";
  const gatedText = window.i18n ? window.i18n.t("speed_gate_gated") : "Speed Gate: Gated (<12 km/h — filtering false jostles)";

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

  const sbGate = document.getElementById("sidebarGateStatus");
  if (sbGate) {
    sbGate.textContent = isArmed ? "ARMED (>12)" : "GATED (<12)";
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

  // Start Collaborative Beacon & Listeners
  startDriverBeacon();
  listenToActiveDrivers();

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

      // Broadcast ephemeral beacon & recalculate vehicle proximity
      broadcastDriverBeacon();
      updateNearbyVehicles();

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

  // SPEED-GATED FALSE POSITIVE FILTER (< 12 km/h)
  // Automatically filters out bumps caused by walking or picking up phone from a cupholder
  if (source === "sensor") {
    if (currentSpeedKmH < SPEED_GATE_MIN_KMH) {
      console.log(`[SafePath AI] Sensor hit filtered by speed gate: ${currentSpeedKmH} km/h < 12 km/h`);
      const ignoredMsg = window.i18n ? window.i18n.t("speed_gate_ignored") : "Jostle ignored: Vehicle speed below 12 km/h";
      setStatus(true, "speed_gate_ignored", ignoredMsg);

      // Flashing visual cue on speed gate badge
      if (speedGateIndicator) {
        speedGateIndicator.classList.add("gate-flash");
        setTimeout(() => speedGateIndicator.classList.remove("gate-flash"), 1500);
      }

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

  // 1. Play Pre-Alert Audio Chime (0.5s pause before voice alert) - only if sound enabled
  await playPreAlertChime(severity);

  // 2. Multilingual Voice Speech Alert - only if sound enabled
  if (canPlayAudio() && window.i18n) {
    if (severity === "severe") {
      window.i18n.speak("voice_severe_detected");
    } else if (hazardType === "speed_breaker") {
      window.i18n.speak("voice_speedbreaker_detected");
    } else {
      window.i18n.speak("voice_pothole_detected");
    }
  }

  // 3. Tactile Physical Pulses through Phone Mount - only if vibrate enabled
  if (canVibrate()) {
    triggerHaptic(severity === "severe" ? "severe" : "hazard");
  }

  // Update dropzone hint
  if (dropzoneHint) {
    const timeStr = new Date(hazard.timestamp).toLocaleTimeString();
    dropzoneHint.textContent = `Attached to ${typeLabel.toLowerCase()} detected at ${timeStr}`;
  }

  // Update HUD, Sidebar & Dock stats
  if (hudSessionHazards) {
    hudSessionHazards.textContent = sessionLogs.length;
  }
  const sbTotal = document.getElementById("sidebarTotalHazards");
  if (sbTotal) {
    sbTotal.textContent = sessionLogs.length;
  }
  const dockCount = document.getElementById("dockHazardsCount");
  if (dockCount) {
    dockCount.textContent = sessionLogs.length;
  }
  const sheetCount = document.getElementById("sheetHazardsCount");
  if (sheetCount) {
    sheetCount.textContent = sessionLogs.length;
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

        // 1. Play pre-alert audio chime (0.5s pause before voice) - only if sound enabled
        await playPreAlertChime(hazard.severity || "minor");

        // 2. Multilingual Voice Alert - only if sound enabled
        if (canPlayAudio() && window.i18n) {
          if (hazard.severity === "severe") {
            window.i18n.speak("voice_severe_ahead");
          } else if (hazard.hazardType === "speed_breaker") {
            window.i18n.speak("voice_speedbreaker_ahead");
          } else {
            window.i18n.speak("voice_pothole_ahead");
          }
        }

        // 3. Tactile Physical Haptic Pulses through Phone Mount - only if vibrate enabled
        if (canVibrate()) {
          triggerHaptic(hazard.severity === "severe" ? "severe" : "hazard");
        }
      }
    }, 2500);
  });
}

// ---------------------------------------------------------------
// Live Collaborative Vehicle Proximity Radar
// Active drivers broadcast ephemeral GPS beacons to Firebase (active_drivers/{id})
// with automatic cleanup on disconnect. Nearby drivers (<150m) trigger dynamic
// radar pill: "Vehicle Nearby (~85m away)", gentle radar chime, and double-tap buzz.
// ---------------------------------------------------------------
const DRIVER_ID_STORAGE_KEY = "safepath_driver_beacon_id";
let driverBeaconId = localStorage.getItem(DRIVER_ID_STORAGE_KEY);
if (!driverBeaconId) {
  driverBeaconId = "driver_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  localStorage.setItem(DRIVER_ID_STORAGE_KEY, driverBeaconId);
}

let activeDriverRef = null;
let beaconInterval = null;
const otherDriversMap = new Map(); // id -> { id, lat, lng, speed, updatedAt, marker }
let simulatedNearbyDriver = null;
let lastNearbyAlertTime = 0;

function startDriverBeacon() {
  if (typeof db === "undefined" || !db) return;
  activeDriverRef = db.ref(`active_drivers/${driverBeaconId}`);
  activeDriverRef.onDisconnect().remove();

  broadcastDriverBeacon();
  if (!beaconInterval) {
    beaconInterval = setInterval(broadcastDriverBeacon, 3500);
  }
}

function broadcastDriverBeacon() {
  if (!activeDriverRef || !currentPos) return;
  activeDriverRef.set({
    id: driverBeaconId,
    lat: currentPos.lat,
    lng: currentPos.lng,
    speed: currentSpeedKmH,
    email: window.currentUser ? window.currentUser.email : null,
    updatedAt: firebase.database.ServerValue.TIMESTAMP || Date.now(),
  });
}

function stopDriverBeacon() {
  if (beaconInterval) {
    clearInterval(beaconInterval);
    beaconInterval = null;
  }
  if (activeDriverRef) {
    activeDriverRef.remove().catch(() => {});
  }
}

window.addEventListener("beforeunload", stopDriverBeacon);
window.addEventListener("pagehide", stopDriverBeacon);

function listenToActiveDrivers() {
  if (typeof db === "undefined" || !db) return;
  const driversRef = db.ref("active_drivers");

  driversRef.on("child_added", (snap) => {
    const id = snap.key;
    if (id === driverBeaconId) return;
    const data = snap.val();
    if (data && data.lat && data.lng) {
      otherDriversMap.set(id, data);
      updateNearbyVehicles();
    }
  });

  driversRef.on("child_changed", (snap) => {
    const id = snap.key;
    if (id === driverBeaconId) return;
    const data = snap.val();
    if (data && data.lat && data.lng) {
      const existing = otherDriversMap.get(id);
      otherDriversMap.set(id, { ...existing, ...data });
      updateNearbyVehicles();
    }
  });

  driversRef.on("child_removed", (snap) => {
    const id = snap.key;
    const existing = otherDriversMap.get(id);
    if (existing && existing.marker && map) {
      map.removeLayer(existing.marker);
    }
    otherDriversMap.delete(id);
    updateNearbyVehicles();
  });
}

function updateNearbyVehicles() {
  if (!currentPos || !map) return;
  const now = Date.now();
  let nearestDist = Infinity;
  let nearestDriver = null;

  // Stale drivers cleanup (> 45s)
  const allDrivers = [];
  otherDriversMap.forEach((driver, id) => {
    if (now - (driver.updatedAt || 0) > 45000) {
      if (driver.marker) map.removeLayer(driver.marker);
      otherDriversMap.delete(id);
      return;
    }
    allDrivers.push(driver);
  });

  if (simulatedNearbyDriver) {
    allDrivers.push(simulatedNearbyDriver);
  }

  // Update sidebar nearby driver count
  const sbRadar = document.getElementById("sidebarRadarVehicles");
  if (sbRadar) {
    sbRadar.textContent = allDrivers.length;
  }

  for (const driver of allDrivers) {
    const dist = haversineMeters(currentPos.lat, currentPos.lng, driver.lat, driver.lng);
    updateVehicleMapMarker(driver, dist);

    if (dist < nearestDist) {
      nearestDist = dist;
      nearestDriver = driver;
    }
  }

  // Collaborative proximity radar threshold: 150 meters
  if (nearestDriver && nearestDist <= 150) {
    showVehicleRadarAlert(nearestDist);
  } else if (!nearestDriver || nearestDist > 165) {
    hideVehicleRadarAlert();
  }
}

function updateVehicleMapMarker(driver, dist) {
  if (!map) return;
  const rounded = Math.round(dist);
  if (!driver.marker) {
    const icon = L.divIcon({
      className: "radar-vehicle-marker-wrapper",
      html: `<div class="radar-vehicle-marker"><span class="radar-pulse-ring"></span><span class="car-badge">🚘</span></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
    driver.marker = L.marker([driver.lat, driver.lng], { icon }).addTo(map);
    driver.marker.bindPopup(
      `<strong>🚗 Collaborative Driver</strong><br>Distance: ~${rounded}m<br>Speed: ${driver.speed || 0} km/h`
    );
  } else {
    driver.marker.setLatLng([driver.lat, driver.lng]);
    driver.marker.setPopupContent(
      `<strong>🚗 Collaborative Driver</strong><br>Distance: ~${rounded}m<br>Speed: ${driver.speed || 0} km/h`
    );
  }
}

function showVehicleRadarAlert(dist) {
  const pill = document.getElementById("vehicleRadarPill");
  const pillText = document.getElementById("radarPillText");
  if (!pill || !pillText) return;

  const rounded = Math.round(dist);
  pillText.textContent = `Vehicle Nearby (~${rounded}m away)`;
  pill.style.display = "flex";

  // Trigger gentle radar chime & subtle double-tap haptic buzz (cooldown: 12 seconds)
  const now = Date.now();
  if (now - lastNearbyAlertTime > 12000) {
    lastNearbyAlertTime = now;
    playRadarProximityChime();
    triggerHaptic("proximity"); // Gentle double-tap buzz: [120, 80, 120]
  }
}

function hideVehicleRadarAlert() {
  const pill = document.getElementById("vehicleRadarPill");
  if (pill) pill.style.display = "none";
}

// ---------------------------------------------------------------
// Slide-out Sidebar Drawer Management
// ---------------------------------------------------------------
function openSidebar() {
  if (appSidebar) appSidebar.classList.add("open");
  if (sidebarBackdrop) sidebarBackdrop.style.display = "block";
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  if (appSidebar) appSidebar.classList.remove("open");
  if (sidebarBackdrop) sidebarBackdrop.style.display = "none";
  document.body.style.overflow = "";
}

if (hamburgerBtn) hamburgerBtn.addEventListener("click", openSidebar);
if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeSidebar);
if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeSidebar);
// ---------------------------------------------------------------
// Slide-Up Bottom Sheet Drawer Management
// (Photo Evidence & Session Hazards Log)
// ---------------------------------------------------------------
const bottomSheetDrawer = document.getElementById("bottomSheetDrawer");
const bottomSheetBackdrop = document.getElementById("bottomSheetBackdrop");
const sheetTabPhotos = document.getElementById("sheetTabPhotos");
const sheetTabHazards = document.getElementById("sheetTabHazards");
const sheetContentPhotos = document.getElementById("sheetContentPhotos");
const sheetContentHazards = document.getElementById("sheetContentHazards");
const sheetCloseBtn = document.getElementById("sheetCloseBtn");
const dockPhotoBtn = document.getElementById("dockPhotoBtn");
const dockLogBtn = document.getElementById("dockLogBtn");

function openBottomSheet(tab = "photos") {
  if (bottomSheetDrawer) bottomSheetDrawer.classList.add("open");
  if (bottomSheetBackdrop) bottomSheetBackdrop.style.display = "block";
  switchSheetTab(tab);
}

function closeBottomSheet() {
  if (bottomSheetDrawer) bottomSheetDrawer.classList.remove("open");
  if (bottomSheetBackdrop) bottomSheetBackdrop.style.display = "none";
}

function switchSheetTab(tab) {
  if (tab === "photos") {
    if (sheetTabPhotos) sheetTabPhotos.classList.add("active");
    if (sheetTabHazards) sheetTabHazards.classList.remove("active");
    if (sheetContentPhotos) sheetContentPhotos.classList.add("active");
    if (sheetContentHazards) sheetContentHazards.classList.remove("active");
  } else {
    if (sheetTabHazards) sheetTabHazards.classList.add("active");
    if (sheetTabPhotos) sheetTabPhotos.classList.remove("active");
    if (sheetContentHazards) sheetContentHazards.classList.add("active");
    if (sheetContentPhotos) sheetContentPhotos.classList.remove("active");
  }
}

if (sheetTabPhotos) sheetTabPhotos.addEventListener("click", () => switchSheetTab("photos"));
if (sheetTabHazards) sheetTabHazards.addEventListener("click", () => switchSheetTab("hazards"));
if (sheetCloseBtn) sheetCloseBtn.addEventListener("click", closeBottomSheet);
if (bottomSheetBackdrop) bottomSheetBackdrop.addEventListener("click", closeBottomSheet);

if (dockPhotoBtn) {
  dockPhotoBtn.addEventListener("click", () => openBottomSheet("photos"));
}
if (dockLogBtn) {
  dockLogBtn.addEventListener("click", () => openBottomSheet("hazards"));
}
if (navLinkPhotoEvidence) {
  navLinkPhotoEvidence.addEventListener("click", () => {
    closeSidebar();
    openBottomSheet("photos");
  });
}

// ---------------------------------------------------------------
// 3-Way Alert System & Vibration Listeners
// ---------------------------------------------------------------
if (alertModeBtn) {
  alertModeBtn.addEventListener("click", cycleAlertMode);
}
if (vibrationToggleBtn) {
  vibrationToggleBtn.addEventListener("click", () => {
    setVibrationEnabled(!isVibrationEnabled());
  });
}
if (sidebarVibrationToggle) {
  sidebarVibrationToggle.addEventListener("change", (e) => {
    setVibrationEnabled(e.target.checked);
  });
}
if (sidebarModeSound) {
  sidebarModeSound.addEventListener("click", () => setAlertMode("sound"));
}
if (sidebarModeVibrate) {
  sidebarModeVibrate.addEventListener("click", () => setAlertMode("vibrate"));
}
if (sidebarModeSilent) {
  sidebarModeSilent.addEventListener("click", () => setAlertMode("silent"));
}

// ---------------------------------------------------------------
// Cockpit HUD Mode Controller
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

  startBtn.textContent = window.i18n ? window.i18n.t("status_active") : "● Monitoring Live";
  startBtn.classList.add("active-monitoring");

  const sbSensors = document.getElementById("sidebarSensorsStatus");
  if (sbSensors) sbSensors.textContent = "ACTIVE";

  // Enable all demo simulation buttons
  if (simulateBtn) simulateBtn.disabled = false;
  if (simulatePotholeMinorBtn) simulatePotholeMinorBtn.disabled = false;
  if (simulatePotholeSevereBtn) simulatePotholeSevereBtn.disabled = false;
  if (simulateSpeedBreakerBtn) simulateSpeedBreakerBtn.disabled = false;
  if (simulateNearbyVehicleBtn) simulateNearbyVehicleBtn.disabled = false;
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

// Collaborative Vehicle Proximity Simulation (85m away)
if (simulateNearbyVehicleBtn) {
  simulateNearbyVehicleBtn.addEventListener("click", () => {
    const refPos = currentPos || { lat: 20.5937, lng: 78.9629 };
    // 85m offset (~0.00076 deg)
    simulatedNearbyDriver = {
      id: "sim_driver_85m",
      lat: refPos.lat + 0.00062,
      lng: refPos.lng + 0.00045,
      speed: 28,
      updatedAt: Date.now(),
    };
    if (!currentPos) {
      updateDriverPosition(refPos.lat, refPos.lng);
    }
    updateNearbyVehicles();
    showVehicleRadarAlert(85);
  });
}

if (radarPillDismiss) {
  radarPillDismiss.addEventListener("click", () => {
    hideVehicleRadarAlert();
    simulatedNearbyDriver = null;
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

// Web Vibration API Audition Buttons
if (testHapticHazardBtn) {
  testHapticHazardBtn.addEventListener("click", () => {
    if (navigator.vibrate) {
      navigator.vibrate(HAPTIC_PATTERNS.hazard);
    } else {
      alert("Web Vibration API is not supported on this device/browser.");
    }
  });
}
if (testHapticSevereBtn) {
  testHapticSevereBtn.addEventListener("click", () => {
    if (navigator.vibrate) {
      navigator.vibrate(HAPTIC_PATTERNS.severe);
    } else {
      alert("Web Vibration API is not supported on this device/browser.");
    }
  });
}
if (testHapticProximityBtn) {
  testHapticProximityBtn.addEventListener("click", () => {
    if (navigator.vibrate) {
      navigator.vibrate(HAPTIC_PATTERNS.proximity);
    } else {
      alert("Web Vibration API is not supported on this device/browser.");
    }
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

// Keyboard Shortcut: [H] toggles HUD, [Esc] exits HUD / drawers
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (e.key === "h" || e.key === "H") {
    toggleCockpitHud();
  } else if (e.key === "Escape") {
    if (hudActive) closeCockpitHud();
    if (appSidebar && appSidebar.classList.contains("open")) closeSidebar();
    if (bottomSheetDrawer && bottomSheetDrawer.classList.contains("open")) closeBottomSheet();
  }
});

// Sidebar Language Sync
if (sidebarLangSelector) {
  sidebarLangSelector.value = localStorage.getItem("safepath_lang") || "en";
  sidebarLangSelector.addEventListener("change", (e) => {
    if (window.i18n) window.i18n.setLanguage(e.target.value);
    const mainLang = document.getElementById("langSelector");
    if (mainLang) mainLang.value = e.target.value;
  });
}

// React to language switch dynamically
document.addEventListener("safepath-lang-changed", () => {
  if (currentStatusKey) {
    setStatus(statusDot.classList.contains("live"), currentStatusKey, statusText.textContent);
  }
  updateSpeedTelemetry(currentSpeedKmH);
  updateQueueBadge();
  updateAlertModeUI();
  updateVibrationToggleUI();
  if (hudActive) updateCockpitHud();
});

// ---------------------------------------------------------------
// Init
// ---------------------------------------------------------------
initMap();
updateSpeedTelemetry(0);
updateQueueBadge();
trySyncQueue();
updateAlertModeUI();
updateVibrationToggleUI();

