// ============================================================
// SafePath AI — Driver App logic
// ============================================================

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const startBtn = document.getElementById("startBtn");
const simulateBtn = document.getElementById("simulateBtn");
const logList = document.getElementById("logList");
const queueBadge = document.getElementById("queueBadge");

// tunables — the accelerometer threshold for "this was a pothole hit"
const IMPACT_THRESHOLD = 22; // total acceleration magnitude (m/s^2)
const MIN_SECONDS_BETWEEN_HITS = 4; // cooldown so one bump isn't logged 10 times
const ALERT_RADIUS_METERS = 120; // warn the driver when this close to a known hazard

let map, driverMarker;
let currentPos = null; // { lat, lng }
let lastLogTime = 0;
let alertedHazardIds = new Set();
let sessionLogs = [];

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
// ---------------------------------------------------------------
function startMotionDetection() {
  window.addEventListener("devicemotion", (event) => {
    const a = event.accelerationIncludingGravity;
    if (!a) return;
    const magnitude = Math.sqrt(
      (a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2
    );
    if (magnitude > IMPACT_THRESHOLD) {
      handlePotholeDetected("sensor");
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
  const hazard = {
    lat,
    lng,
    timestamp: Date.now(),
    source, // "sensor" or "simulated"
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
}

function addSessionLogEntry(hazard) {
  sessionLogs.unshift(hazard);
  if (logList.querySelector(".empty-state")) logList.innerHTML = "";
  const el = document.createElement("div");
  el.className = "log-item";
  const time = new Date(hazard.timestamp).toLocaleTimeString();
  el.innerHTML = `<span>${hazard.source === "simulated" ? "Simulated hit" : "Impact detected"}</span><span class="time">${time}</span>`;
  logList.prepend(el);
}

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
  const queue = getQueue();
  queue.push({ ...hazard, _localId: `${hazard.timestamp}_${Math.random().toString(36).slice(2, 8)}` });
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
      await db.ref("hazards").push(hazard);
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
