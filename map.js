// ============================
// WayAble Map (FIXED)
// ============================

let map;
let markers = [];

const DEFAULT_LAT = 20.5937;
const DEFAULT_LON = 78.9629;

// Initialize map
function initMap() {

    map = L.map("map").setView(
        [DEFAULT_LAT, DEFAULT_LON],
        5
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 19
        }
    ).addTo(map);

    // IMPORTANT: mobile fix
    setTimeout(() => {
        map.invalidateSize();
    }, 500);

    window.addEventListener("resize", () => {
        map.invalidateSize();
    });
}

// Move map
function moveMap(lat, lon, zoom = 15) {
    if (!map) return;
    map.setView([lat, lon], zoom);
}

// Clear markers
function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

// Add marker
function addMarker(place) {

    const marker = L.marker([place.lat, place.lon]).addTo(map);

    marker.bindPopup(`
        <b>${place.name}</b><br>
        ${place.type}<br><br>
        ♿ ${place.wheelchair}<br>
        🚻 ${place.toilet}<br>
        🅿 ${place.parking}<br>
        🚪 ${place.entrance}
    `);

    markers.push(marker);
}

// Focus place
function focusPlace(lat, lon) {
    map.setView([lat, lon], 18);
}

// Current location marker
function showCurrentLocation(lat, lon) {

    const marker = L.circleMarker([lat, lon], {
        radius: 8,
        color: "#0F766E",
        fillColor: "#0F766E",
        fillOpacity: 1
    }).addTo(map);

    marker.bindPopup("You are here");

    markers.push(marker);
}

// Fit all markers
function fitAllMarkers() {

    if (markers.length === 0) return;

    const group = L.featureGroup(markers);

    map.fitBounds(group.getBounds(), {
        padding: [50, 50]
    });
}

// init
window.addEventListener("load", initMap);