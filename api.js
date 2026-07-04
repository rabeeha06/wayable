// ============================
// WayAble API
// ============================

// Convert location name to coordinates
async function getCoordinates(place) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`
        );

        if (!response.ok) {
            throw new Error("Unable to fetch location.");
        }

        const data = await response.json();

        if (data.length === 0) {
            alert("Location not found.");
            return null;
        }

        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };

    } catch (error) {
        console.error(error);
        alert(error.message);
        return null;
    }
}


// Fetch nearby places from Overpass
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

    try {

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain"
                },
                body: query
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        return data.elements || [];

    } catch (error) {

        console.error("Overpass Error:", error);

        alert("Unable to fetch nearby places.");

        return [];
    }
}


// Convert API data to UI data
function formatPlaces(elements) {

    return elements.map(item => {

        const tags = item.tags || {};

        let wheelchair = "Not Verified";

        if (tags.wheelchair === "yes") {
            wheelchair = "Accessible";
        } else if (tags.wheelchair === "limited") {
            wheelchair = "Limited Access";
        } else if (tags.wheelchair === "no") {
            wheelchair = "Not Accessible";
        }

        let toilet = "Unknown";

        if (tags["toilets:wheelchair"] === "yes") {
            toilet = "Available";
        }

        let parking = "Unknown";

        if (tags["parking:disabled"] === "yes") {
            parking = "Available";
        }

        let entrance = "Unknown";

        if (tags.entrance === "yes") {
            entrance = "Accessible";
        }

        return {

            id: item.id,

            name: tags.name || "Unnamed Place",

            lat: item.lat,

            lon: item.lon,

            type: tags.amenity || tags.tourism || "Unknown",

            wheelchair,

            toilet,

            parking,

            entrance

        };

    });

}


// Search by city
async function searchLocation(place) {

    const loader = document.getElementById("loader");

    loader.classList.remove("hidden");

    try {

        const coords = await getCoordinates(place);

        if (!coords) {

            loader.classList.add("hidden");

            return [];
        }

        moveMap(coords.lat, coords.lon);

        const rawPlaces = await getAccessiblePlaces(
            coords.lat,
            coords.lon
        );

        const places = formatPlaces(rawPlaces);

        clearMarkers();

        places.forEach(place => {
            addMarker(place);
        });

        fitAllMarkers();

        return places;

    } catch (error) {

        console.error(error);

        return [];

    } finally {

        loader.classList.add("hidden");

    }

}


// Current location
function getCurrentLocation() {

    if (!navigator.geolocation) {

        alert("Geolocation is not supported.");

        return;
    }

    document
        .getElementById("loader")
        .classList.remove("hidden");

    navigator.geolocation.getCurrentPosition(

        async position => {

            const lat = position.coords.latitude;

            const lon = position.coords.longitude;

            moveMap(lat, lon);

            clearMarkers();

            showCurrentLocation(lat, lon);

            const rawPlaces = await getAccessiblePlaces(lat, lon);

            const places = formatPlaces(rawPlaces);

            places.forEach(place => {
                addMarker(place);
            });

            fitAllMarkers();

            allPlaces = places;

            displayPlaces(places);

            document
                .getElementById("loader")
                .classList.add("hidden");

        },

        error => {

            console.error(error);

            alert("Location permission denied.");

            document
                .getElementById("loader")
                .classList.add("hidden");

        }

    );
            }        alert("Unable to fetch location.");

        return null;

    }

}


// Fetch nearby places from Overpass
async function getAccessiblePlaces(lat, lon){

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

    try{

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method:"POST",
                body:query
            }
        );

        const data = await response.json();

        return data.elements || [];

    }

    catch(error){

        console.error(error);

        alert("Unable to fetch nearby places.");

        return [];

    }

}


// Convert API data to UI data
function formatPlaces(elements){

    return elements.map(item => {

        const tags = item.tags || {};

        // Wheelchair
        let wheelchair = "Not Verified";

        if(tags.wheelchair === "yes"){
            wheelchair = "Accessible";
        }
        else if(tags.wheelchair === "limited"){
            wheelchair = "Limited Access";
        }
        else if(tags.wheelchair === "no"){
            wheelchair = "Not Accessible";
        }

        // Toilet
        let toilet = "Unknown";

        if(tags["toilets:wheelchair"] === "yes"){
            toilet = "Available";
        }

        // Parking
        let parking = "Unknown";

        if(tags["parking:disabled"] === "yes"){
            parking = "Available";
        }

        // Entrance
        let entrance = "Unknown";

        if(tags.entrance === "yes"){
            entrance = "Accessible";
        }

        return {

            id: item.id,

            name:
                tags.name ||
                "Unnamed Place",

            lat: item.lat,

            lon: item.lon,

            type:
                tags.amenity ||
                tags.tourism ||
                "Unknown",

            wheelchair,
            toilet,
            parking,
            entrance

        };

    });

}


// Search by city
async function searchLocation(place){

    const loader =
    document.getElementById("loader");

    loader.classList.remove("hidden");

    try{

        const coords =
        await getCoordinates(place);

        if(!coords){

            loader.classList.add("hidden");

            return [];
        }

        moveMap(
            coords.lat,
            coords.lon
        );

        const rawPlaces =
        await getAccessiblePlaces(
            coords.lat,
            coords.lon
        );

        const places =
        formatPlaces(rawPlaces);

        clearMarkers();

        places.forEach(place => {

            addMarker(place);

        });

        fitAllMarkers();

        return places;

    }

    catch(error){

        console.error(error);

        return [];

    }

    finally{

        loader.classList.add("hidden");

    }

}


// Current location
function getCurrentLocation(){

    if(!navigator.geolocation){

        alert(
            "Geolocation is not supported."
        );

        return;

    }

    document
    .getElementById("loader")
    .classList.remove("hidden");

    navigator.geolocation.getCurrentPosition(

        async position => {

            const lat =
            position.coords.latitude;

            const lon =
            position.coords.longitude;

            moveMap(
                lat,
                lon
            );

            clearMarkers();

            showCurrentLocation(
                lat,
                lon
            );

            const rawPlaces =
            await getAccessiblePlaces(
                lat,
                lon
            );

            const places =
            formatPlaces(
                rawPlaces
            );

            places.forEach(place => {

                addMarker(place);

            });

            fitAllMarkers();

            allPlaces = places;

            displayPlaces(
                places
            );

            document
            .getElementById("loader")
            .classList.add("hidden");

        },

        error => {

            console.error(error);

            alert(
                "Location permission denied."
            );

            document
            .getElementById("loader")
            .classList.add("hidden");

        }

    );

}
