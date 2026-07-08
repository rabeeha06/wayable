
// ==========================================
// WayAble Map (INTERACTIVE UI FEATURES)
// ==========================================

let map;
let markers = [];
const DEFAULT_LAT = 20.5937;
const DEFAULT_LON = 78.9629;

function initMap() {
    map = L.map("map").setView([DEFAULT_LAT, DEFAULT_LON], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(map);

    setTimeout(() => { map.invalidateSize(); }, 500);
    window.addEventListener("resize", () => { map.invalidateSize(); });
}

function moveMap(lat, lon, zoom = 15) {
    if (!map) return;
    map.setView([lat, lon], zoom);
}

function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

function addMarker(place) {
    if (!place.lat || !place.lon) return;

    const marker = L.marker([place.lat, place.lon]).addTo(map);

    // Google Maps routing link for wheelchair navigation verification
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=walking`;

    // Dynamic color tags based on the current validation status
    const statusColor = place.wheelchair === "Accessible" ? "#0F766E" : (place.wheelchair === "Not Accessible" ? "#B91C1C" : "#6B7280");

    marker.bindPopup(`
        <b style="font-size: 1.15em;">${place.name}</b><br>
        <span style="text-transform: capitalize; color: #666;">Category: ${place.type}</span><br>
        <a href="${directionsUrl}" target="_blank" style="color:#0F766E; font-size:0.9em; text-decoration:underline; font-weight:bold;">♿ Get Directions Route</a>
        
        <div style="margin-top: 8px; padding: 6px; background:#f9fafb; border-left: 4px solid ${statusColor};">
            ♿ Wheelchair: <b style="color:${statusColor};">${place.wheelchair}</b><br>
            🚻 Accessible Toilet: <b>${place.toilet}</b><br>
            🅿 Disabled Parking: <b>${place.parking}</b>
        </div>

        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 6px;">
            <span style="font-size:0.85em; font-weight:bold; color:#374151;">Help the Community (Correct Data):</span><br>
            <div style="margin-top:4px; display:flex; gap:4px;">
                <button onclick="reportStatus('${place.id}', 'wheelchair', 'Accessible')" style="font-size:0.75em; padding:2px 6px; background:#0F766E; color:white; border:none; border-radius:3px; cursor:pointer;">Is Accessible</button>
                <button onclick="reportStatus('${place.id}', 'wheelchair', 'Not Accessible')" style="font-size:0.75em; padding:2px 6px; background:#B91C1C; color:white; border:none; border-radius:3px; cursor:pointer;">Not Accessible</button>
            </div>
            <div style="margin-top:4px; display:flex; gap:4px;">
                <button onclick="reportStatus('${place.id}', 'toilet', 'Available')" style="font-size:0.7em; padding:2px 4px; background:#E5E7EB; color:#1F2937; border:1px solid #9CA3AF; border-radius:3px; cursor:pointer;">Has Access Restroom</button>
            </div>
        </div>
    `);

    markers.push(marker);
}

function focusPlace(lat, lon) {
    map.setView([lat, lon], 18);
}

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

function fitAllMarkers() {
    if (markers.length === 0) return;
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

window.addEventListener("load", initMap);
