
// ==========================================
// WayAble API (CROWDSOURCED & INDEPENDENT)
// ==========================================

// Local database key for saving user-reported data
const ACCESSIBILITY_CACHE_KEY = "wayable_user_reports";

// Load user reports from browser storage or start empty
let localAccessibilityRegistry = JSON.parse(localStorage.getItem(ACCESSIBILITY_CACHE_KEY)) || {};

// Convert location name to coordinates (Nominatim)
async function getCoordinates(place) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`,
            {
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "WayAble App (contact: your-email@example.com)"
                }
            }
        );
        if (!response.ok) throw new Error("Failed to fetch location.");
        const data = await response.json();
        if (!data || data.length === 0) {
            alert("Location not found.");
            return null;
        }
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (error) {
        console.error("Geocoding error:", error);
        alert("Unable to get location.");
        return null;
    }
}

// Fetch nearby places using Public Photon API (No Keys Required)
async function getAccessiblePlaces(lat, lon) {
    const queryKeywords = ["restaurant", "hospital", "pharmacy", "hotel", "bank", "toilets"];
    let allFeatures = [];

    try {
        const fetchPromises = queryKeywords.map(async (keyword) => {
            const url = `https://photon.komoot.io/api/?q=${keyword}&lat=${lat}&lon=${lon}&limit=15`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.features || [];
        });

        const results = await Promise.all(fetchPromises);
        allFeatures = results.flat();
        return allFeatures;
    } catch (err) {
        console.error("Photon API failed:", err);
        alert("Unable to fetch nearby places.");
        return [];
    }
}

// Convert data to UI structure, injecting user-crowdsourced overrides
function formatPlaces(features) {
    if (!features) return [];

    return features.map(feature => {
        const props = feature.properties || {};
        const coordinates = feature.geometry?.coordinates || [0, 0];
        const establishmentType = props.osm_value || props.osm_key || "place";
        const uniqueId = props.osm_id || `${coordinates[1]}_${coordinates[0]}`;

        // Establish fallback name formatting
        const displayName = props.name || `Unnamed ${establishmentType.charAt(0).toUpperCase() + establishmentType.slice(1)}`;

        // Check if our local crowdsourced registry has a user report for this specific place
        const userReport = localAccessibilityRegistry[uniqueId];

        return {
            id: uniqueId,
            name: displayName,
            lat: coordinates[1],
            lon: coordinates[0],
            type: establishmentType,

            // If a user updated it, use that! Otherwise fall back to the API's values
            wheelchair: userReport?.wheelchair || (
                props.wheelchair === "yes" ? "Accessible" :
                props.wheelchair === "limited" ? "Limited" :
                props.wheelchair === "no" ? "Not Accessible" : "Not Verified"
            ),
            toilet: userReport?.toilet || (props["toilets:wheelchair"] === "yes" ? "Available" : "Unknown"),
            parking: userReport?.parking || (props["parking:disabled"] === "yes" ? "Available" : "Unknown"),
            entrance: userReport?.entrance || (props.entrance === "yes" ? "Accessible" : "Unknown")
        };
    });
}

// Global window function allowing users to save data adjustments directly from the popup
window.reportStatus = function(placeId, field, statusValue) {
    if (!localAccessibilityRegistry[placeId]) {
        localAccessibilityRegistry[placeId] = {};
    }
    
    // Save the status updates locally
    localAccessibilityRegistry[placeId][field] = statusValue;
    localStorage.setItem(ACCESSIBILITY_CACHE_KEY, JSON.stringify(localAccessibilityRegistry));
    
    alert("Thank you! Your accessibility report has been saved locally.");
    
    // Refresh active markers instantly on screen to show adjustments
    if (typeof allPlaces !== 'undefined') {
        clearMarkers();
        const updatedPlaces = formatPlaces(globalRawFeaturesCache);
        updatedPlaces.forEach(p => addMarker(p));
    }
}

// Store a copy of recent fetches globally so we can redraw seamlessly on edit
let globalRawFeaturesCache = [];

async function searchLocation(place) {
    const loader = document.getElementById("loader");
    loader?.classList.remove("hidden");
    try {
        const coords = await getCoordinates(place);
        if (!coords) return [];
        moveMap(coords.lat, coords.lon);

        const rawPlaces = await getAccessiblePlaces(coords.lat, coords.lon);
        globalRawFeaturesCache = rawPlaces; // cache features copy

        const places = formatPlaces(rawPlaces);
        clearMarkers();
        places.forEach(p => addMarker(p));
        fitAllMarkers();

        if (typeof allPlaces !== 'undefined') allPlaces = places;
        if (typeof displayPlaces === 'function') displayPlaces(places);
        return places;
    } catch (err) {
        console.error(err);
        return [];
    } finally {
        loader?.classList.add("hidden");
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }
    document.getElementById("loader")?.classList.remove("hidden");
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            moveMap(lat, lon);
            clearMarkers();
            showCurrentLocation(lat, lon);

            const rawPlaces = await getAccessiblePlaces(lat, lon);
            globalRawFeaturesCache = rawPlaces;

            const places = formatPlaces(rawPlaces);
            places.forEach(p => addMarker(p));
            fitAllMarkers();

            if (typeof allPlaces !== 'undefined') allPlaces = places;
            if (typeof displayPlaces === 'function') displayPlaces(places);
            document.getElementById("loader")?.classList.add("hidden");
        },
        (err) => {
            console.error(err);
            alert("Location permission denied.");
            document.getElementById("loader")?.classList.add("hidden");
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}
