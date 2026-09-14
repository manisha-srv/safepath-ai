// ============================================================
// SafePath AI — City Dashboard logic
// ============================================================

const totalCountEl = document.getElementById("totalCount");
const todayCountEl = document.getElementById("todayCount");
const hazardListEl = document.getElementById("hazardList");

const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

let hazards = [];
let boundsSet = false;

function isToday(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function render() {
  totalCountEl.textContent = hazards.length;
  todayCountEl.textContent = hazards.filter((h) => isToday(h.timestamp)).length;

  if (hazards.length === 0) {
    hazardListEl.innerHTML = '<div class="empty-state">No hazards reported yet.</div>';
    return;
  }

  const sorted = [...hazards].sort((a, b) => b.timestamp - a.timestamp);
  hazardListEl.innerHTML = "";
  sorted.forEach((h) => {
    const el = document.createElement("div");
    el.className = "log-item";
    const time = new Date(h.timestamp).toLocaleString();
    el.innerHTML = `<span>${h.lat.toFixed(5)}, ${h.lng.toFixed(5)}</span><span class="time">${time}</span>`;
    hazardListEl.appendChild(el);
  });
}

function addMarker(hazard) {
  L.circleMarker([hazard.lat, hazard.lng], {
    radius: 8,
    color: "#2b2d33",
    fillColor: "#ffb800",
    fillOpacity: 0.9,
    weight: 2,
  })
    .addTo(map)
    .bindPopup(`Reported: ${new Date(hazard.timestamp).toLocaleString()}`);
}

if (typeof db !== "undefined") {
  db.ref("hazards").on("value", (snapshot) => {
    const data = snapshot.val() || {};
    hazards = Object.values(data);

    // redraw markers fresh each update (simple + fine for hackathon scale)
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) map.removeLayer(layer);
    });
    hazards.forEach(addMarker);

    if (!boundsSet && hazards.length > 0) {
      const group = L.featureGroup(
        hazards.map((h) => L.marker([h.lat, h.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.2));
      boundsSet = true;
    }

    render();
  });
} else {
  hazardListEl.innerHTML = '<div class="empty-state">Firebase is not configured yet — see README.md.</div>';
}
