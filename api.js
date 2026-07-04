// ============================
// WayAble API (FIXED)
// ============================

// Convert location name to coordinates
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


// Fetch nearby places (WITH FALLBACK)
async function getAccessiblePlaces(lat, lon) {

    const radius = 3000;

    const query = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radius},${lat},${lon});
  node["amenity"="hospital"](around:${radius},${lat},${lon});
  node["amenity"="pharmacy"](around:${radius},${lat},${lon});
  node["tourism"="hotel"](around:${radius},${lat},${lon});
  node["amenity"="bank"](around:${radius},${lat},${lon});
  node["amenity"="toilets"](around:${radius},${lat},${lon});
);
out body;
`;

    const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];

    for (let url of endpoints) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                    "Accept": "application/json"
                },
                body: query
            });

            if (!response.ok) continue;

            const data = await response.json();
            return data.elements || [];

        } catch (err) {
            console.warn("Overpass failed:", url, err);
        }
    }

    alert("Unable to fetch nearby places.");
    return [];
}


// Convert API data to UI data
function formatPlaces(elements) {

    if (!elements) return [];

    return elements.map(item => {

        const tags = item.tags || {};

        return {
            id: item.id,
            name: tags.name || "Unnamed Place",
            lat: item.lat,
            lon: item.lon,
            type: tags.amenity || tags.tourism || "Unknown",

            wheelchair:
                tags.wheelchair === "yes"
                    ? "Accessible"
                    : tags.wheelchair === "limited"
                    ? "Limited"
                    : tags.wheelchair === "no"
                    ? "Not Accessible"
                    : "Not Verified",

            toilet:
                tags["toilets:wheelchair"] === "yes"
                    ? "Available"
                    : "Unknown",

            parking:
                tags["parking:disabled"] === "yes"
                    ? "Available"
                    : "Unknown",

            entrance:
                tags.entrance === "yes"
                    ? "Accessible"
                    : "Unknown"
        };
    });
}


// Search main function
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

        return places;

    } catch (err) {
        console.error(err);
        return [];
    } finally {
        loader?.classList.add("hidden");
    }
}


// Current location
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
            const places = formatPlaces(rawPlaces);

            places.forEach(p => addMarker(p));

            fitAllMarkers();

            allPlaces = places;
            displayPlaces(places);

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