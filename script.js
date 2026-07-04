// ==========================
// WayAble Script
// ==========================

const searchBtn =
document.getElementById("searchBtn");

const currentBtn =
document.getElementById("currentLocationBtn");

const input =
document.getElementById("locationInput");

const container =
document.getElementById("placesContainer");

const landingPage =
document.getElementById("landingPage");

const resultsPage =
document.getElementById("resultsPage");

const resultSearch =
document.getElementById("resultSearch");

let allPlaces = [];
function getPlaceIcon(type){

    switch(type){

        case "restaurant":
            return '<i class="fa-solid fa-utensils placeIcon restaurantIcon"></i>';

        case "hospital":
            return '<i class="fa-solid fa-hospital placeIcon hospitalIcon"></i>';

        case "pharmacy":
            return '<i class="fa-solid fa-pills placeIcon pharmacyIcon"></i>';

        case "hotel":
            return '<i class="fa-solid fa-hotel placeIcon hotelIcon"></i>';

        case "bank":
            return '<i class="fa-solid fa-building-columns placeIcon bankIcon"></i>';

        case "toilets":
            return '<i class="fa-solid fa-restroom placeIcon toiletIcon"></i>';

        default:
            return '<i class="fa-solid fa-location-dot placeIcon defaultIcon"></i>';
    }
}


// ==========================
// Search Button
// ==========================

searchBtn.addEventListener(
    "click",
    startSearch
);


// ==========================
// Enter Key Search
// ==========================

input.addEventListener(
    "keypress",
    function(e){

        if(e.key === "Enter"){
            startSearch();
        }

    }
);


// ==========================
// Search Function
// ==========================

async function startSearch(){

    const location =
    input.value.trim();

    if(!location){

        alert(
            "Please enter a location."
        );

        return;
    }

    // Hide first page
    landingPage.classList.add(
        "hidden"
    );

    // Show results page
    resultsPage.classList.remove(
        "hidden"
    );

    // Fix leaflet map rendering
    setTimeout(()=>{

        if(map){
            map.invalidateSize();
        }

    },300);

    const places =
    await searchLocation(
        location
    );

    allPlaces = places || [];

    displayPlaces(
        allPlaces
    );
}


// ==========================
// Current Location Button
// ==========================

currentBtn.addEventListener(
    "click",
    ()=>{

        landingPage.classList.add(
            "hidden"
        );

        resultsPage.classList.remove(
            "hidden"
        );

        setTimeout(()=>{

            if(map){
                map.invalidateSize();
            }

        },300);

        getCurrentLocation();

    }
);


// ==========================
// Search Again From Results
// ==========================

if(resultSearch){

    resultSearch.addEventListener(
        "keypress",
        async function(e){

            if(
                e.key === "Enter"
            ){

                const location =
                resultSearch.value
                .trim();

                if(!location)
                    return;

                const places =
                await searchLocation(
                    location
                );

                allPlaces =
                places || [];

                displayPlaces(
                    allPlaces
                );
            }

        }
    );

}


// ==========================
// Display Cards
// ==========================

function displayPlaces(
    places
){

    container.innerHTML = "";

    if(
        !places ||
        places.length === 0
    ){

        container.innerHTML = `
            <div class="emptyState">

                <h3>
                    No places found
                </h3>

                <p>
                    Try another location.
                </p>

            </div>
        `;

        return;
    }

    places.forEach(place=>{

        const card =
        document.createElement(
            "div"
        );

        card.className =
        "place-card";

        card.innerHTML = `

            <div class="cardHeader">

                <div>

                  <h3 class="placeTitle">
    ${getPlaceIcon(place.type)}
    ${place.name}
</h3>

                    <p class="type">
                        ${place.type}
                    </p>

                </div>

                <button
                    class="favBtn"
                >
                    ♡
                </button>

            </div>

            <div class="features">

                <p>
                    ♿ Wheelchair:
                    <strong>
                    ${place.wheelchair}
                    </strong>
                </p>

                <p>
                    🚻 Toilet:
                    <strong>
                    ${place.toilet}
                    </strong>
                </p>

                <p>
                    🅿 Parking:
                    <strong>
                    ${place.parking}
                    </strong>
                </p>

                <p>
                    🚪 Entrance:
                    <strong>
                    ${place.entrance}
                    </strong>
                </p>

            </div>

            <button
                class="viewBtn"
            >
                View on Map
            </button>

        `;

        // View on map
        card.querySelector(
            ".viewBtn"
        ).onclick = ()=>{

            focusPlace(
                place.lat,
                place.lon
            );

        };

        // Favorites
        card.querySelector(
            ".favBtn"
        ).onclick = ()=>{

            saveFavorite(
                place
            );

        };

        container.appendChild(
            card
        );

    });

}


// ==========================
// Save Favorites
// ==========================

function saveFavorite(
    place
){

    let favorites =
    JSON.parse(

        localStorage.getItem(
            "favorites"
        )

    ) || [];

    const exists =
    favorites.find(

        item =>
        item.id === place.id

    );

    if(exists){

        alert(
            "Already in favorites."
        );

        return;
    }

    favorites.push(
        place
    );

    localStorage.setItem(

        "favorites",

        JSON.stringify(
            favorites
        )

    );

    alert(
        "Added to favorites."
    );

}


// ==========================
// Back Button Support
// ==========================

window.addEventListener(
    "popstate",
    ()=>{

        resultsPage.classList.add(
            "hidden"
        );

        landingPage.classList.remove(
            "hidden"
        );

    }
);