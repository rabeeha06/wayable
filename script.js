
// ==========================================
// WayAble Script (UI INTERACTIVE SYNC LAYER)
// ==========================================

const searchBtn = document.getElementById("searchBtn");
const currentBtn = document.getElementById("currentLocationBtn");
const input = document.getElementById("locationInput");
const container = document.getElementById("placesContainer");

const landingPage = document.getElementById("landingPage");
const resultsPage = document.getElementById("resultsPage");
const resultSearch = document.getElementById("resultSearch");

let activeCategoryFilter = "all";

function getPlaceIcon(type) {
    switch (type.toLowerCase()) {
        case "restaurant": return "🍽️";
        case "hospital":   return "🏥";
        case "pharmacy":   return "💊";
        case "hotel":      return "🏨";
        case "bank":       return "🏦";
        case "toilets":    return "🚻";
        default:           return "📍";
    }
}

// Attach event tracking hooks
searchBtn?.addEventListener("click", startSearch);
input?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startSearch();
});

resultSearch?.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
        const value = resultSearch.value.trim();
        if (value) {
            document.getElementById("loader")?.classList.remove("hidden");
            const places = await searchLocation(value);
            
            // Reset active filter button back to 'all' on new location search
            resetFilterUI();
            
            allPlaces = places || [];
            displayPlaces(allPlaces);
        }
    }
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
        if (typeof map !== 'undefined' && map) map.invalidateSize();
    }, 400);

    resetFilterUI();
    const places = await searchLocation(location);
    allPlaces = places || [];
    displayPlaces(allPlaces);
}

currentBtn?.addEventListener("click", () => {
    landingPage.classList.add("hidden");
    resultsPage.classList.remove("hidden");

    setTimeout(() => {
        if (typeof map !== 'undefined' && map) map.invalidateSize();
    }, 400);

    resetFilterUI();
    getCurrentLocation();
});

// Primary list rendering core engine logic
function displayPlaces(places) {
    if (!container) return;
    container.innerHTML = "";

    if (!places || places.length === 0) {
        container.innerHTML = `
            <div class="emptyState">
                <h3>No accessible places found</h3>
                <p>Try resetting filters or searching another city.</p>
            </div>
        `;
        return;
    }

    places.forEach(place => {
        const card = document.createElement("div");
        card.className = "place-card";

        card.innerHTML = `
            <div class="cardHeader">
                <div class="cardHeaderTitle">
                    <h3>${getPlaceIcon(place.type)} ${place.name}</h3>
                    <p>${place.type}</p>
                </div>
                <button class="favBtn" data-id="${place.id}">♡</button>
            </div>

            <div class="features">
                <p>♿ Wheelchair: <b>${place.wheelchair}</b></p>
                <p>🚪 Entrance: <b>${place.entrance}</b></p>
                <p>🚻 Restrooms: <b>${place.toilet}</b></p>
                <p>🅿 Parking: <b>${place.parking}</b></p>
            </div>

            <div class="action-box">
                <span>Data Verification Checkpoint:</span>
                <div class="action-buttons">
                    <button class="btn-acc" data-id="${place.id}">Is Accessible</button>
                    <button class="btn-not" data-id="${place.id}">Not Accessible</button>
                </div>
            </div>

            <button class="viewBtn targetViewBtn">View on Map</button>
        `;

        card.querySelector(".targetViewBtn").onclick = () => {
            focusPlace(place.lat, place.lon);
        };

        card.querySelector(".favBtn").onclick = () => {
            saveFavorite(place);
        };

        card.querySelector(".btn-acc").onclick = () => {
            if (typeof window.reportStatus === 'function') window.reportStatus(place.id, 'wheelchair', 'Accessible');
        };

        card.querySelector(".btn-not").onclick = () => {
            if (typeof window.reportStatus === 'function') window.reportStatus(place.id, 'wheelchair', 'Not Accessible');
        };

        container.appendChild(card);
    });
}

// Category filter bar click listeners
document.querySelectorAll(".filterBtn").forEach(button => {
    button.addEventListener("click", (e) => {
        document.querySelectorAll(".filterBtn").forEach(btn => btn.classList.remove("active"));
        
        const targetButton = e.currentTarget;
        targetButton.classList.add("active");
        
        activeCategoryFilter = targetButton.getAttribute("data-category");
        applyCategoryFilter();
    });
});

function applyCategoryFilter() {
    if (!allPlaces) return;

    const filteredPlaces = allPlaces.filter(place => {
        if (activeCategoryFilter === "all") return true;
        return place.type.toLowerCase() === activeCategoryFilter.toLowerCase();
    });

    displayPlaces(filteredPlaces);

    if (typeof clearMarkers === "function" && typeof addMarker === "function") {
        clearMarkers();
        filteredPlaces.forEach(p => addMarker(p));
        if (filteredPlaces.length > 0 && typeof fitAllMarkers === "function") {
            fitAllMarkers();
        }
    }
}

function resetFilterUI() {
    activeCategoryFilter = "all";
    document.querySelectorAll(".filterBtn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(".filterBtn[data-category='all']").classList.add("active");
}

function saveFavorite(place) {
    let favorites = [];
    try {
        favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    } catch (e) {
        favorites = [];
    }
    if (favorites.find(f => f.id === place.id)) {
        alert("Already inside saved favorites catalog.");
        return;
    }
    favorites.push(place);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert("Added successfully to favorites stack.");
}
