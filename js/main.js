let restaurants,
  neighborhoods,
  cuisines
let markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Leaflet map.
 */
const loc = {
  lat: 40.713829,
  lng: -73.989667
};
const mymap = L.map('mapid', {
  zoom: 12,
  center: loc,
  scrollWheelZoom: false,
});

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1IjoiYW5kY2hhZHR4IiwiYSI6ImNqampjczNrYzAyYnAzdm8xYnplMHFudWYifQ.y63-0Nu6yr0bUS3ZU6MsgQ', {
  maxZoom: 18,
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  id: 'mapbox.streets'
}).addTo(mymap);

let popup = L.popup();

function onMapClick(e) {
  popup
    .setLatLng(e.latlng)
    .setContent("You clicked the map at " + e.latlng.toString())
    .openOn(mymap);
}

mymap.on('click', onMapClick);

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

   const image = document.createElement('img');
   image.className = 'restaurant-img';
   image.alt = restaurant.name + ' photo';
   image.src = DBHelper.imageUrlForRestaurant(restaurant);
   li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  name.setAttribute('aria-label', restaurant.name);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  name.setAttribute('aria-label', restaurant.neighborhood);
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  name.setAttribute('aria-label', restaurant.address);
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('tabindex', 0);
  more.setAttribute('aria-label', 'Button link to View Details ' + restaurant.name);
  more.style.display = 'inline-block';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  const favoriteContainer = document.createElement('div');
  favoriteContainer.style.textAlign = 'center';
  const favorite = document.createElement('span');
  favorite.style.textAlign = 'right';
  favorite.style.transition = '450ms';
  favorite.setAttribute('role', 'img');
  favorite.setAttribute('aria-label', 'heart emoji');

  // Favorite is set to false as a default
  if (restaurant.is_favorite == null || restaurant.is_favorite == undefined) {
    restaurant.is_favorite = false;
  }

  favorite.dataset.liked = restaurant.is_favorite;

  if (favorite.dataset.liked == 'true') {
    favorite.innerText = '❤️ Favorite';
  } else {
    favorite.innerText = '🖤 Mark as Favorite';

  }

  favorite.addEventListener('click', e => {
    // Update the UI
    if (e.target.dataset.liked == 'false') {
      e.target.dataset.liked = true;
      e.target.innerText = '❤️ Favorite';

      e.target.parentNode.parentNode.classList.add('liked');
    } else {
      e.target.dataset.liked = false;
      e.target.innerText = '🖤 Mark as Favorite';

      e.target.parentNode.parentNode.classList.remove('liked');
    }

    restaurant.is_favorite = e.target.dataset.liked;

    // Update the API and IDB
    DBHelper.favoriteRestaurant(restaurant);
  });

  favoriteContainer.append(favorite);
  li.append(favoriteContainer);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {

  restaurants.forEach(restaurant => {
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, mymap);
    self.markers.push(marker);
  });
}
