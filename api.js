
// ==========================================
// WayAble API (STABLE & INTERACTIVE)
// ==========================================

const ACCESSIBILITY_CACHE_KEY = "wayable_user_reports";

// Global cache storage to handle dynamic map redrawing on status report click
let globalRawFeaturesCache = [];
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
    try {
        const fetchPromises = queryKeywords.map(async (keyword) => {
            const url = `https://photon.komoot.io/api/?q=${keyword}&lat=${lat}&lon=${lon}&limit=15`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.features || [];
        });

        const results = await Promise.all(fetchPromises);
        return results.flat();
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

        const displayName = props.name || `Unnamed ${establishmentType.charAt(0).toUpperCase() + establishmentType.slice(1)}`;
        const userReport = localAccessibilityRegistry[uniqueId];

        return {
            id: uniqueId,
            name: displayName,
            lat: coordinates[1],
            lon: coordinates[0],
            type: establishmentType,

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

// Global action called when users click pop-up edit tools
window.reportStatus = function(placeId, field, statusValue) {
    if (!localAccessibilityRegistry[placeId]) {
        localAccessibilityRegistry[placeId] = {};
    }
    
    localAccessibilityRegistry[placeId][field] = statusValue;
    localStorage.setItem(ACCESSIBILITY_CACHE_KEY, JSON.stringify(localAccessibilityRegistry));
    
    alert("Thank you! Your report has been saved.");
    
    // Refresh markers based on cache
    clearMarkers();
    const updatedPlaces = formatPlaces(globalRawFeaturesCache);
    updatedPlaces.forEach(p => addMarker(p));
    
    if (typeof displayPlaces === 'function') displayPlaces(updatedPlaces);
};

async function searchLocation(place) {
    const loader = document.getElementById("loader");
    loader?.classList.remove("hidden");
    try {
        const coords = await getCoordinates(place);
        if (!coords) return [];
        moveMap(coords.lat, coords.lon);

        const rawPlaces = await getAccessiblePlaces(coords.lat, coords.lon);
        globalRawFeaturesCache = rawPlaces; 

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
