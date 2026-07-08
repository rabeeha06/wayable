
// ============================
// WayAble API (PUBLIC & STABLE)
// ============================

// Convert location name to coordinates (Using Nominatim)
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

        if (!response.ok) {
            throw new Error("Failed to fetch location.");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            alert("Location not found.");
            return null;
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };

    } catch (error) {
        console.error("Geocoding error:", error);
        alert("Unable to get location.");
        return null;
    }
}


// Fetch nearby places using Photon Public API (No API keys needed!)
async function getAccessiblePlaces(lat, lon) {
    // Explicitly targets the amenity types from your original scope
    const queryKeywords = ["restaurant", "hospital", "pharmacy", "hotel", "bank", "toilets"];
    let allFeatures = [];

    try {
        // Query keywords in parallel for optimal performance
        const fetchPromises = queryKeywords.map(async (keyword) => {
            // Geographically bias the search based on user coordinates
            const url = `https://photon.komoot.io/api/?q=${keyword}&lat=${lat}&lon=${lon}&limit=15`;
            const response = await fetch(url);
            
            if (!response.ok) return [];
            
            const data = await response.json();
            return data.features || [];
        });

        const results = await Promise.all(fetchPromises);
        
        // Flatten the array of arrays into a unified list
        allFeatures = results.flat();
        return allFeatures;

    } catch (err) {
        console.error("Photon API failed:", err);
        alert("Unable to fetch nearby places from the public cluster.");
        return [];
    }
}


// Convert Photon's GeoJSON structure to WayAble UI structure
function formatPlaces(features) {
    if (!features) return [];

    return features.map(feature => {
        const props = feature.properties || {};
        const coordinates = feature.geometry?.coordinates || [0, 0];
        
        // Extract category types
        const establishmentType = props.osm_value || props.osm_key || "Unknown";

        return {
            id: props.osm_id || Math.random(),
            name: props.name || `Unnamed ${establishmentType}`,
            lat: coordinates[1], // GeoJSON uses [Longitude, Latitude]
            lon: coordinates[0],
            type: establishmentType,

            // Directly parsing OpenStreetMap core tags mapping
            wheelchair:
                props.wheelchair === "yes"
                    ? "Accessible"
                    : props.wheelchair === "limited"
                    ? "Limited"
                    : props.wheelchair === "no"
                    ? "Not Accessible"
                    : "Not Verified",

            toilet:
                props["toilets:wheelchair"] === "yes"
                    ? "Available"
                    : "Unknown",

            parking:
                props["parking:disabled"] === "yes"
                    ? "Available"
                    : "Unknown",

            entrance:
                props.entrance === "yes"
                    ? "Accessible"
                    : "Unknown"
        };
    });
}


// Search main function triggered via UI input form
async function searchLocation(place) {
    const loader = document.getElementById("loader");
    loader?.classList.remove("hidden");

    try {
        const coords = await getCoordinates(place);
        if (!coords) return [];

        moveMap(coords.lat, coords.lon);

        const rawPlaces = await getAccessiblePlaces(coords.lat, coords.lon);
        const places = formatPlaces(rawPlaces);

        clearMarkers();
        places.forEach(p => addMarker(p));
        fitAllMarkers();

        // Safe check global hooks if UI files require data array binding
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


// Fetch current location using native browser Geolocation
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser.");
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
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}
