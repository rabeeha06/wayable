
// ============================
// WayAble Map (STABLE)
// ============================

let map;
let markers = [];

const DEFAULT_LAT = 20.5937;
const DEFAULT_LON = 78.9629;

// Initialize Leaflet map structure
function initMap() {
    map = L.map("map").setView([DEFAULT_LAT, DEFAULT_LON], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        maxZoom: 19
    }).addTo(map);

    // Dynamic viewport correction for mobile display rendering bug
    setTimeout(() => {
        map.invalidateSize();
    }, 500);

    window.addEventListener("resize", () => {
        map.invalidateSize();
    });
}

// Move map viewport
function moveMap(lat, lon, zoom = 15) {
    if (!map) return;
    map.setView([lat, lon], zoom);
}

// Clear active markers stack array
function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

// Bind markers and accessibility popup parameters to map instance
function addMarker(place) {
    if (!place.lat || !place.lon) return;

    const marker = L.marker([place.lat, place.lon]).addTo(map);

    marker.bindPopup(`
        <b style="font-size: 1.1em;">${place.name}</b><br>
        <span style="text-transform: capitalize; color: #555;">Category: ${place.type}</span><br><br>
        ♿ Wheelchair: <b>${place.wheelchair}</b><br>
        <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;">
        🚻 Accessible Toilet: ${place.toilet}<br>
        🅿 Disabled Parking: ${place.parking}<br>
        🚪 Accessible Entrance: ${place.entrance}
    `);

    markers.push(marker);
}

// Direct jump focus target point
function focusPlace(lat, lon) {
    map.setView([lat, lon], 18);
}

// Places a colored anchor dot marking user's position
function showCurrentLocation(lat, lon) {
    const marker = L.circleMarker([lat, lon], {
        radius: 8,
        color: "#0F766E",
        fillColor: "#0F766E",
        fillOpacity: 1
    }).addTo(map);

    marker.bindPopup("<b>You are here</b>");
    markers.push(marker);
}

// Automatically bound map window limits to view all pins
function fitAllMarkers() {
    if (markers.length === 0) return;

    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), {
        padding: [50, 50]
    });
}

// Fire initialization payload script when runtime DOM window loaded
window.addEventListener("load", initMap);
