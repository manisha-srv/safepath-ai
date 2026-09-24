// ============================================================
// SafePath AI — City Dashboard Logic
// Multi-Language Support, Dedicated Reported Photo Gallery & Click-to-Zoom Modal
// ============================================================

const totalCountEl = document.getElementById("totalCount");
const todayCountEl = document.getElementById("todayCount");
const severeCountEl = document.getElementById("severeCount");
const reviewCountEl = document.getElementById("reviewCount");
const hazardListEl = document.getElementById("hazardList");
const reviewSection = document.getElementById("reviewSection");
const reviewListEl = document.getElementById("reviewList");
const reportedGallery = document.getElementById("reportedGallery");

const filterTypeSelect = document.getElementById("filterTypeSelect");
const filterSeveritySelect = document.getElementById("filterSeveritySelect");

// Click-to-Zoom Modal Elements
const photoModal = document.getElementById("photoModal");
const modalImg = document.getElementById("modalImg");
const modalCoords = document.getElementById("modalCoords");
const modalTime = document.getElementById("modalTime");
const modalStatus = document.getElementById("modalStatus");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

const FLAGS_TO_HIDE = 3;
const CONFIRMATIONS_TO_REPAIR = 2;

let hazards = [];
let boundsSet = false;
let currentTypeFilter = "all";
let currentSeverityFilter = "all";

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
// Modal Preview Management
// ---------------------------------------------------------------
function openPhotoModal(hazard) {
  if (!photoModal || !hazard || !hazard.photo) return;
  modalImg.src = hazard.photo;
  modalCoords.textContent = `${hazard.lat.toFixed(5)}, ${hazard.lng.toFixed(5)}`;
  modalTime.textContent = new Date(hazard.timestamp).toLocaleString();

  const isSpeedBreaker = hazard.hazardType === "speed_breaker";
  const typeText = isSpeedBreaker ? "Unmarked Speed Breaker" : "Pothole";
  const sevText = hazard.severity ? hazard.severity.toUpperCase() : "STANDARD";

  const statusLabel =
    hazard.status === "flagged"
      ? (window.i18n ? window.i18n.t("badge_review") : "Pending review")
      : hazard.status === "repaired"
      ? (window.i18n ? window.i18n.t("badge_repaired") : "Repaired")
      : (window.i18n ? window.i18n.t("badge_active") : "Active");

  modalStatus.textContent = `${statusLabel} • ${typeText} (${sevText})`;
  photoModal.classList.add("active");
}

function closePhotoModal() {
  if (photoModal) {
    photoModal.classList.remove("active");
  }
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closePhotoModal);
}
if (photoModal) {
  photoModal.addEventListener("click", (e) => {
    if (e.target === photoModal) closePhotoModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePhotoModal();
});

// ---------------------------------------------------------------
// Anti-Abuse Flagging & Repair Confirmations
// ---------------------------------------------------------------
function flagHazard(id) {
  const user = window.currentUser;
  if (!user || typeof db === "undefined") return;

  db.ref(`hazards/${id}`).transaction((hazard) => {
    if (!hazard) return hazard;
    hazard.flaggedBy = hazard.flaggedBy || {};
    if (hazard.flaggedBy[user.uid]) return;
    hazard.flaggedBy[user.uid] = true;
    const flagCount = Object.keys(hazard.flaggedBy).length;
    if (flagCount >= FLAGS_TO_HIDE && hazard.status === "active") {
      hazard.status = "flagged";
    }
    return hazard;
  });
}

function confirmRepair(id) {
  const user = window.currentUser;
  if (!user || typeof db === "undefined") return;

  db.ref(`hazards/${id}`).transaction((hazard) => {
    if (!hazard) return hazard;
    hazard.confirmedBy = hazard.confirmedBy || {};
    if (hazard.confirmedBy[user.uid]) return;
    hazard.confirmedBy[user.uid] = true;
    const confirmCount = Object.keys(hazard.confirmedBy).length;
    if (confirmCount >= CONFIRMATIONS_TO_REPAIR) {
      hazard.status = "repaired";
    }
    return hazard;
  });
}

function restoreHazard(id) {
  if (!window.currentUser || typeof db === "undefined") return;
  db.ref(`hazards/${id}`).update({ status: "active", flaggedBy: {} });
}

function dismissHazard(id) {
  if (!window.currentUser || typeof db === "undefined") return;
  db.ref(`hazards/${id}`).update({ status: "repaired" });
}

// ---------------------------------------------------------------
// Badges with i18n
// ---------------------------------------------------------------
function statusBadge(h) {
  if (h.status === "flagged") {
    const text = window.i18n ? window.i18n.t("badge_review") : "Pending review";
    return `<span class="badge badge-review">${text}</span>`;
  }
  if (h.status === "repaired") {
    const text = window.i18n ? window.i18n.t("badge_repaired") : "Repaired";
    return `<span class="badge badge-repaired">${text}</span>`;
  }
  const text = window.i18n ? window.i18n.t("badge_active") : "Active";
  return `<span class="badge badge-active">${text}</span>`;
}

function hazardTypeBadge(h) {
  const isSpeedBreaker = h.hazardType === "speed_breaker";
  const icon = isSpeedBreaker ? "🛑" : "🕳️";
  const key = isSpeedBreaker ? "hazard_speed_breaker" : "hazard_pothole";
  const label = window.i18n ? window.i18n.t(key) : (isSpeedBreaker ? "Speed Breaker" : "Pothole");
  const cls = isSpeedBreaker ? "badge-type-speedbreaker" : "badge-type-pothole";
  return `<span class="badge-type ${cls}">${icon} ${label}</span>`;
}

function severityBadge(h) {
  const sev = h.severity || "minor";
  const key = `severity_${sev}`;
  const label = window.i18n ? window.i18n.t(key) : sev;
  const magText = h.magnitude ? ` (${h.magnitude} m/s²)` : "";
  return `<span class="badge-severity badge-sev-${sev}">${label}${magText}</span>`;
}

// ---------------------------------------------------------------
// Render Main Lists & Dedicated Photo Gallery
// ---------------------------------------------------------------
function render() {
  const activeAndRepaired = hazards.filter((h) => h.status !== "flagged");
  const pendingReview = hazards.filter((h) => h.status === "flagged");
  const severeHazards = hazards.filter((h) => h.severity === "severe" && h.status !== "repaired");

  const loggedToday = hazards.filter((h) => isToday(h.timestamp));
  totalCountEl.textContent = hazards.length;
  todayCountEl.textContent = loggedToday.length;
  if (severeCountEl) severeCountEl.textContent = severeHazards.length;
  reviewCountEl.textContent = pendingReview.length;

  // Sync Sidebar Drawer Stats
  const sbTotal = document.getElementById("sidebarTotalHazards");
  const sbTotalLog = document.getElementById("sidebarTotalLogged");
  const sbTodayLog = document.getElementById("sidebarTodayLogged");
  const sbSevereLog = document.getElementById("sidebarSevereLogged");
  const sbReviewLog = document.getElementById("sidebarReviewLogged");
  if (sbTotal) sbTotal.textContent = hazards.length;
  if (sbTotalLog) sbTotalLog.textContent = hazards.length;
  if (sbTodayLog) sbTodayLog.textContent = loggedToday.length;
  if (sbSevereLog) sbSevereLog.textContent = severeHazards.length;
  if (sbReviewLog) sbReviewLog.textContent = pendingReview.length;

  const t = (k, p) => (window.i18n ? window.i18n.t(k, p) : k);

  // Apply filters
  let filteredHazards = activeAndRepaired;
  if (currentTypeFilter !== "all") {
    filteredHazards = filteredHazards.filter((h) => (h.hazardType || "pothole") === currentTypeFilter);
  }
  if (currentSeverityFilter !== "all") {
    filteredHazards = filteredHazards.filter((h) => (h.severity || "minor") === currentSeverityFilter);
  }

  // 1. Main list: active + repaired hazards
  if (filteredHazards.length === 0) {
    hazardListEl.innerHTML = `<div class="empty-state">${t("no_hazards_dashboard")}</div>`;
  } else {
    const sorted = [...filteredHazards].sort((a, b) => b.timestamp - a.timestamp);
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
      const signInHint = user ? "" : ` title="${t("signin_hint_actions")}"`;

      const repairBtnText = repaired
        ? t("btn_repaired")
        : `${t("btn_mark_repaired")} (${confirmCount}/${CONFIRMATIONS_TO_REPAIR})`;
      const flagBtnText = iFlaggedThis ? t("btn_flagged") : `${t("btn_flag")} (${flagCount})`;

      el.innerHTML = `
        <div class="hazard-row-main">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span><strong>${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}</strong></span>
            ${hazardTypeBadge(h)}
            ${severityBadge(h)}
            ${statusBadge(h)}
          </div>
          <span class="time">${time}</span>
        </div>
        ${
          h.photo
            ? `<img class="hazard-photo" src="${h.photo}" alt="Hazard photo" style="cursor:pointer;" data-zoom-id="${h.id}" title="${t("photo_zoom_hint")}" />`
            : ""
        }
        <div class="hazard-row-actions"${signInHint}>
          <button class="mini" data-action="repair" data-id="${h.id}" ${confirmDisabled ? "disabled" : ""}>
            ${repairBtnText}
          </button>
          <button class="mini ghost" data-action="flag" data-id="${h.id}" ${flagDisabled ? "disabled" : ""}>
            ${flagBtnText}
          </button>
        </div>`;
      hazardListEl.appendChild(el);
    });
  }

  // 2. Pending-review section
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
          <span><strong>${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}</strong></span>
          <span class="badge badge-review">${flagCount} flags</span>
          <span class="time">${time}</span>
        </div>
        ${
          h.photo
            ? `<img class="hazard-photo" src="${h.photo}" alt="Hazard photo" style="cursor:pointer;" data-zoom-id="${h.id}" title="${t("photo_zoom_hint")}" />`
            : ""
        }
        <div class="hazard-row-actions"${moderationDisabled ? ` title="${t("signin_hint_moderate")}"` : ""}>
          <button class="mini" data-action="restore" data-id="${h.id}" ${moderationDisabled ? "disabled" : ""}>${t("btn_restore")}</button>
          <button class="mini ghost" data-action="dismiss" data-id="${h.id}" ${moderationDisabled ? "disabled" : ""}>${t("btn_dismiss")}</button>
        </div>`;
      reviewListEl.appendChild(el);
    });
  }

  // 3. Dedicated Reported Photo Gallery Column
  renderPhotoGallery();
}

function renderPhotoGallery() {
  if (!reportedGallery) return;
  const photoHazards = hazards.filter((h) => !!h.photo);
  const t = (k) => (window.i18n ? window.i18n.t(k) : k);

  if (photoHazards.length === 0) {
    reportedGallery.innerHTML = `<div class="empty-state">${t("no_photos_gallery")}</div>`;
    return;
  }

  const sorted = [...photoHazards].sort((a, b) => b.timestamp - a.timestamp);
  reportedGallery.innerHTML = "";

  sorted.forEach((h) => {
    const card = document.createElement("div");
    card.className = "gallery-card";
    card.dataset.id = h.id;
    card.title = t("photo_zoom_hint");

    const time = new Date(h.timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    card.innerHTML = `
      <img src="${h.photo}" alt="Reported road evidence" loading="lazy" />
      <div class="gallery-card-body">
        <div class="gallery-card-coords">📍 ${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}</div>
        <div class="gallery-card-time">${time}</div>
        <div style="margin-top:2px;">${statusBadge(h)}</div>
      </div>
    `;

    card.addEventListener("click", () => openPhotoModal(h));
    reportedGallery.appendChild(card);
  });
}

// Delegated click handling
document.addEventListener("click", (e) => {
  const zoomImg = e.target.closest("img[data-zoom-id]");
  if (zoomImg) {
    const targetHazard = hazards.find((h) => h.id === zoomImg.dataset.zoomId);
    if (targetHazard) openPhotoModal(targetHazard);
    return;
  }

  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "flag") flagHazard(id);
  if (action === "repair") confirmRepair(id);
  if (action === "restore") restoreHazard(id);
  if (action === "dismiss") dismissHazard(id);
});

document.addEventListener("safepath-auth-changed", render);
document.addEventListener("safepath-lang-changed", render);

if (filterTypeSelect) {
  filterTypeSelect.addEventListener("change", (e) => {
    currentTypeFilter = e.target.value;
    render();
  });
}
if (filterSeveritySelect) {
  filterSeveritySelect.addEventListener("change", (e) => {
    currentSeverityFilter = e.target.value;
    render();
  });
}

function addMarker(hazard) {
  const repaired = hazard.status === "repaired";
  const isSpeedBreaker = hazard.hazardType === "speed_breaker";
  const isSevere = hazard.severity === "severe";

  let markerColor = "#f59e0b"; // amber for pothole
  if (repaired) markerColor = "#10b981";
  else if (isSevere) markerColor = "#ef4444";
  else if (isSpeedBreaker) markerColor = "#a855f7";

  const typeLabel = isSpeedBreaker ? "Unmarked Speed Breaker" : (isSevere ? "Severe Crater" : "Pothole");
  const sevLabel = (hazard.severity || "minor").toUpperCase();
  const magText = hazard.magnitude ? ` • ${hazard.magnitude} m/s²` : "";

  L.circleMarker([hazard.lat, hazard.lng], {
    radius: isSevere ? 10 : (repaired ? 6 : 8),
    color: "#090d16",
    fillColor: markerColor,
    fillOpacity: repaired ? 0.6 : 0.95,
    weight: 2,
  })
    .addTo(map)
    .bindPopup(
      `<div style="font-family:inherit; min-width:160px;">
        <strong style="color:${markerColor};">${typeLabel}</strong> (${sevLabel}${magText})<br>
        <span style="font-size:11px; color:#94a3b8;">${new Date(hazard.timestamp).toLocaleString()}</span>
        ${hazard.photo ? `<br><img src="${hazard.photo}" style="max-width:180px;border-radius:6px;margin-top:6px;cursor:pointer;" onclick="window.openPhotoModalById && window.openPhotoModalById('${hazard.id}')">` : ""}
      </div>`
    );
}

window.openPhotoModalById = (id) => {
  const target = hazards.find((h) => h.id === id);
  if (target) openPhotoModal(target);
};

if (typeof db !== "undefined") {
  db.ref("hazards").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    hazards = Object.entries(data).map(([id, h]) => ({ id, ...h }));

    const mapWorthy = hazards.filter((h) => h.status !== "flagged");

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

// ---------------------------------------------------------------
// Sidebar Drawer Management
// ---------------------------------------------------------------
const hamburgerBtn = document.getElementById("hamburgerBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const appSidebar = document.getElementById("appSidebar");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarLangSelector = document.getElementById("sidebarLangSelector");

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
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && appSidebar && appSidebar.classList.contains("open")) {
    closeSidebar();
  }
});

// Sync sidebar language selector with header language selector
if (sidebarLangSelector) {
  sidebarLangSelector.value = localStorage.getItem("safepath_lang") || "en";
  sidebarLangSelector.addEventListener("change", (e) => {
    if (window.i18n) window.i18n.setLanguage(e.target.value);
    const mainLangSelect = document.getElementById("langSelector");
    if (mainLangSelect) mainLangSelect.value = e.target.value;
  });
}

