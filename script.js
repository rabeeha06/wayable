// ==========================
// WayAble Script (FIXED)
// ==========================

const searchBtn = document.getElementById("searchBtn");
const currentBtn = document.getElementById("currentLocationBtn");
const input = document.getElementById("locationInput");
const container = document.getElementById("placesContainer");

const landingPage = document.getElementById("landingPage");
const resultsPage = document.getElementById("resultsPage");
const resultSearch = document.getElementById("resultSearch");

let allPlaces = [];

function getPlaceIcon(type) {
    switch (type) {
        case "restaurant":
            return "🍽️";
        case "hospital":
            return "🏥";
        case "pharmacy":
            return "💊";
        case "hotel":
            return "🏨";
        case "bank":
            return "🏦";
        case "toilets":
            return "🚻";
        default:
            return "📍";
    }
}

// Search
searchBtn?.addEventListener("click", startSearch);

input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startSearch();
});

async function startSearch() {

    const location = input.value.trim();

    if (!location) {
        alert("Please enter a location.");
        return;
    }

    landingPage.classList.add("hidden");
    resultsPage.classList.remove("hidden");

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 800);

    const places = await searchLocation(location);

    allPlaces = places || [];
    displayPlaces(allPlaces);
}

// Current location
currentBtn?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    resultsPage.classList.remove("hidden");

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 800);

    getCurrentLocation();
});

// Display places
function displayPlaces(places) {

    container.innerHTML = "";

    if (!places || places.length === 0) {
        container.innerHTML = `
            <div class="emptyState">
                <h3>No places found</h3>
                <p>Try another location.</p>
            </div>
        `;
        return;
    }

    places.forEach(place => {

        const card = document.createElement("div");
        card.className = "place-card";

        card.innerHTML = `
            <div class="cardHeader">
                <div>
                    <h3>${getPlaceIcon(place.type)} ${place.name}</h3>
                    <p>${place.type}</p>
                </div>
                <button class="favBtn">♡</button>
            </div>

            <div class="features">
                <p>♿ ${place.wheelchair}</p>
                <p>🚻 ${place.toilet}</p>
                <p>🅿 ${place.parking}</p>
                <p>🚪 ${place.entrance}</p>
            </div>

            <button class="viewBtn">View on Map</button>
        `;

        card.querySelector(".viewBtn").onclick = () => {
            focusPlace(place.lat, place.lon);
        };

        card.querySelector(".favBtn").onclick = () => {
            saveFavorite(place);
        };

        container.appendChild(card);
    });
}

// Favorites safe
function saveFavorite(place) {

    let favorites = [];

    try {
        favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    } catch (e) {
        favorites = [];
    }

    if (favorites.find(f => f.id === place.id)) {
        alert("Already in favorites.");
        return;
    }

    favorites.push(place);

    localStorage.setItem("favorites", JSON.stringify(favorites));

    alert("Added to favorites.");
}

// back
window.addEventListener("popstate", () => {
    resultsPage.classList.add("hidden");
    landingPage.classList.remove("hidden");
});