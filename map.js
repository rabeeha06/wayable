// ============================
// WayAble Map
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
            attribution:
                "&copy; OpenStreetMap Contributors",
            maxZoom: 19
        }
    ).addTo(map);
}

// Move map
function moveMap(
    lat,
    lon,
    zoom = 15
) {

    map.setView(
        [lat, lon],
        zoom
    );
}

// Remove markers
function clearMarkers() {

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];
}

// Add place marker
function addMarker(place) {

    const marker = L.marker(
        [place.lat, place.lon]
    ).addTo(map);

    marker.bindPopup(`
        <b>${place.name}</b><br>
        ${place.type}<br><br>

        ♿ Wheelchair:
        ${place.wheelchair}<br>

        🚻 Toilet:
        ${place.toilet}<br>

        🅿 Parking:
        ${place.parking}<br>

        🚪 Entrance:
        ${place.entrance}
    `);

    markers.push(marker);
}

// Focus place from card
function focusPlace(
    lat,
    lon
) {

    map.setView(
        [lat, lon],
        18
    );
}

// Show current location
function showCurrentLocation(
    lat,
    lon
) {

    const marker = L.circleMarker(
        [lat, lon],
        {
            radius: 8,
            color: "#0F766E",
            fillColor: "#0F766E",
            fillOpacity: 1
        }
    ).addTo(map);

    marker.bindPopup(
        "You are here"
    );

    markers.push(marker);
}

// Fit all markers
function fitAllMarkers() {

    if(markers.length === 0)
        return;

    const group =
        new L.featureGroup(
            markers
        );

    map.fitBounds(
        group.getBounds(),
        {
            padding: [50,50]
        }
    );
}

// Initialize map
window.addEventListener(
    "load",
    initMap
);