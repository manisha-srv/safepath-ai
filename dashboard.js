// ============================================================
// SafePath AI — City Dashboard logic
// ============================================================

const totalCountEl = document.getElementById("totalCount");
const todayCountEl = document.getElementById("todayCount");
const reviewCountEl = document.getElementById("reviewCount");
const hazardListEl = document.getElementById("hazardList");
const reviewSection = document.getElementById("reviewSection");
const reviewListEl = document.getElementById("reviewList");

const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

// How many independent flags/confirmations are needed before a report is
// auto-hidden (pending review) or auto-marked repaired. Matches the pitch
// deck: "3+ flags hide a report pending review" / "2-3 confirmations
// before marking a hazard repaired".
const FLAGS_TO_HIDE = 3;
const CONFIRMATIONS_TO_REPAIR = 2;

let hazards = []; // [{ id, lat, lng, timestamp, source, status, flaggedBy, confirmedBy }, ...]
let boundsSet = false;

// ---------------------------------------------------------------
// Account-based anti-abuse: flags and repair confirmations are keyed
// by the signed-in user's uid (hazards/{id}/flaggedBy/{uid} = true),
// so one account can't stack multiple votes, and — unlike the old
// localStorage version — this holds even if someone switches browsers
// or clears their storage. Both actions require being signed in.
// ---------------------------------------------------------------
function isToday(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

// ---------------------------------------------------------------
// Flagging a hazard (report looks wrong / spam / already gone)
// ---------------------------------------------------------------
function flagHazard(id) {
  const user = window.currentUser;
  if (!user || typeof db === "undefined") return;

  db.ref(`hazards/${id}`).transaction((hazard) => {
    if (!hazard) return hazard;
    hazard.flaggedBy = hazard.flaggedBy || {};
    if (hazard.flaggedBy[user.uid]) return; // abort — already flagged by this account
    hazard.flaggedBy[user.uid] = true;
    const flagCount = Object.keys(hazard.flaggedBy).length;
    if (flagCount >= FLAGS_TO_HIDE && hazard.status === "active") {
      hazard.status = "flagged"; // hidden from the driver app + main map, pending review
    }
    return hazard;
  });
}

// ---------------------------------------------------------------
// Confirming a hazard has been repaired
// ---------------------------------------------------------------
function confirmRepair(id) {
  const user = window.currentUser;
  if (!user || typeof db === "undefined") return;

  db.ref(`hazards/${id}`).transaction((hazard) => {
    if (!hazard) return hazard;
    hazard.confirmedBy = hazard.confirmedBy || {};
    if (hazard.confirmedBy[user.uid]) return; // abort — already confirmed by this account
    hazard.confirmedBy[user.uid] = true;
    const confirmCount = Object.keys(hazard.confirmedBy).length;
    if (confirmCount >= CONFIRMATIONS_TO_REPAIR) {
      hazard.status = "repaired"; // soft-archived: stays in history, drops off the active map
    }
    return hazard;
  });
}

// A moderator action for the "pending review" queue: put a flagged
// report back into normal rotation (false alarm) or dismiss it for
// good (confirmed spam/duplicate — stays soft-archived, off the map).
// Also requires sign-in, same as flag/confirm.
function restoreHazard(id) {
  if (!window.currentUser || typeof db === "undefined") return;
  db.ref(`hazards/${id}`).update({ status: "active", flaggedBy: {} });
}
function dismissHazard(id) {
  if (!window.currentUser || typeof db === "undefined") return;
  db.ref(`hazards/${id}`).update({ status: "repaired" });
}

// ---------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------
function statusBadge(h) {
  if (h.status === "flagged") return '<span class="badge badge-review">Pending review</span>';
  if (h.status === "repaired") return '<span class="badge badge-repaired">Repaired</span>';
  return '<span class="badge badge-active">Active</span>';
}

function render() {
  const activeAndRepaired = hazards.filter((h) => h.status !== "flagged");
  const pendingReview = hazards.filter((h) => h.status === "flagged");

  totalCountEl.textContent = hazards.length;
  todayCountEl.textContent = hazards.filter((h) => isToday(h.timestamp)).length;
  reviewCountEl.textContent = pendingReview.length;

  // Main list: active + repaired hazards
  if (activeAndRepaired.length === 0) {
    hazardListEl.innerHTML = '<div class="empty-state">No hazards reported yet.</div>';
  } else {
    const sorted = [...activeAndRepaired].sort((a, b) => b.timestamp - a.timestamp);
    hazardListEl.innerHTML = "";
    sorted.forEach((h) => {
      const el = document.createElement("div");
      el.className = "log-item hazard-row";
      const time = new Date(h.timestamp).toLocaleString();
      const repaired = h.status === "repaired";
      const user = window.currentUser;
      const iFlaggedThis = !!(user && h.flaggedBy && h.flaggedBy[user.uid]);
      const iConfirmedThis = !!(user && h.confirmedBy && h.confirmedBy[user.uid]);
      const flagCount = Object.keys(h.flaggedBy || {}).length;
      const confirmCount = Object.keys(h.confirmedBy || {}).length;
      const flagDisabled = !user || iFlaggedThis || repaired;
      const confirmDisabled = !user || iConfirmedThis || repaired;
      const signInHint = user ? "" : ' title="Sign in above to flag or confirm repairs"';
      el.innerHTML = `
        <div class="hazard-row-main">
          <span>${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}</span>
          ${statusBadge(h)}
          <span class="time">${time}</span>
        </div>
        ${h.photo ? `<img class="hazard-photo" src="${h.photo}" alt="Hazard photo" />` : ""}
        <div class="hazard-row-actions"${signInHint}>
          <button class="mini" data-action="repair" data-id="${h.id}" ${confirmDisabled ? "disabled" : ""}>
            ${repaired ? "Repaired" : `Mark Repaired (${confirmCount}/${CONFIRMATIONS_TO_REPAIR})`}
          </button>
          <button class="mini ghost" data-action="flag" data-id="${h.id}" ${flagDisabled ? "disabled" : ""}>
            ${iFlaggedThis ? "Flagged" : `Flag (${flagCount})`}
          </button>
        </div>`;
      hazardListEl.appendChild(el);
    });
  }

  // Pending-review section: only shown when something needs a moderator look
  if (pendingReview.length === 0) {
    reviewSection.style.display = "none";
  } else {
    reviewSection.style.display = "block";
    reviewListEl.innerHTML = "";
    const moderationDisabled = !window.currentUser;
    pendingReview.forEach((h) => {
      const el = document.createElement("div");
      el.className = "log-item hazard-row";
      const time = new Date(h.timestamp).toLocaleString();
      const flagCount = Object.keys(h.flaggedBy || {}).length;
      el.innerHTML = `
        <div class="hazard-row-main">
          <span>${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}</span>
          <span class="badge badge-review">${flagCount} flags</span>
          <span class="time">${time}</span>
        </div>
        <div class="hazard-row-actions"${moderationDisabled ? ' title="Sign in above to moderate"' : ""}>
          <button class="mini" data-action="restore" data-id="${h.id}" ${moderationDisabled ? "disabled" : ""}>Restore (false alarm)</button>
          <button class="mini ghost" data-action="dismiss" data-id="${h.id}" ${moderationDisabled ? "disabled" : ""}>Dismiss for good</button>
        </div>`;
      reviewListEl.appendChild(el);
    });
  }
}

// Delegated click handling for all the buttons rendered above
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "flag") flagHazard(id);
  if (action === "repair") confirmRepair(id);
  if (action === "restore") restoreHazard(id);
  if (action === "dismiss") dismissHazard(id);
});

// Re-render whenever sign-in state changes, since button availability
// depends on it.
document.addEventListener("safepath-auth-changed", render);

function addMarker(hazard) {
  const repaired = hazard.status === "repaired";
  L.circleMarker([hazard.lat, hazard.lng], {
    radius: repaired ? 6 : 8,
    color: "#2b2d33",
    fillColor: repaired ? "#2ecc71" : "#ffb800",
    fillOpacity: repaired ? 0.6 : 0.9,
    weight: 2,
  })
    .addTo(map)
    .bindPopup(
      `${repaired ? "Repaired — " : ""}Reported: ${new Date(hazard.timestamp).toLocaleString()}` +
        (hazard.photo ? `<br><img src="${hazard.photo}" style="max-width:150px;border-radius:6px;margin-top:6px;">` : "")
    );
}

if (typeof db !== "undefined") {
  db.ref("hazards").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    hazards = Object.entries(data).map(([id, h]) => ({ id, ...h }));

    // Map only ever shows active + repaired pins — flagged (pending review)
    // reports are hidden from the public map until a moderator restores them.
    const mapWorthy = hazards.filter((h) => h.status !== "flagged");

    // redraw markers fresh each update (simple + fine for hackathon scale)
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });
    mapWorthy.forEach(addMarker);

    if (!boundsSet && mapWorthy.length > 0) {
      const group = L.featureGroup(mapWorthy.map((h) => L.marker([h.lat, h.lng])));
      map.fitBounds(group.getBounds().pad(0.2));
      boundsSet = true;
    }

    render();
  });
} else {
  hazardListEl.innerHTML = '<div class="empty-state">Firebase is not configured yet — see README.md.</div>';
}
