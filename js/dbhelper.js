class DBHelper {

  /**
   * Database URL.
   */
  static DATABASE_URL(path) {
    return `https://chefrate.glitch.me/restaurants`;
  }


  static changeRestaurantFavoriteStatus(restaurant) {

    // Open up a transaction as usual
    var objectStore = db.transaction(["restaurants"], "readwrite").objectStore("restaurants");

    // Get the to-do list object that has this title as it's title
    var objectStoreTitleRequest = objectStore.get(restaurant.id);

    objectStoreTitleRequest.onsuccess = function () {
      // Grab the data object returned as the result
      var data = objectStoreTitleRequest.result;

      if (data.is_favorite) {
        data.is_favorite = false;
        let url = `https://chefrate.glitch.me/restaurants/${restaurant.id}/?is_favorite=false`
        let button = document.getElementById(`favBtn-${restaurant.id}`)
        button.innerHTML = 'Unfavorite';
        fetch(url, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        })
          .then(response => response.json()) // parses response to JSON
        button.backgroundColor = "orange";
      }
      else {
        data.is_favorite = true;
        let url = `https://chefrate.glitch.me/restaurants/${restaurant.id}/?is_favorite=false`
        let button = document.getElementById(`favBtn-${restaurant.id}`)
        button.innerHTML = 'Favorite';
        fetch(url, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        })
          .then(response => response.json()) // parses response to JSON
        button.backgroundColor = "red";
      }

      // Create another request that inserts the item back into the database
      var updateTitleRequest = objectStore.put(data);

      // Log the transaction that originated this request
      console.log("The transaction that originated this request is " + updateTitleRequest.transaction);

      // When this new request succeeds, run the displayData() function again to update the display
      updateTitleRequest.onsuccess = function () {
        updateRestaurants()
      };
    };
  }


  static changeReviewSuccessStatus(review) {

    // Open up a transaction as usual
    var objectStore = db.transaction("reviews", "readwrite").objectStore("reviews");

    // Get the to-do list object that has this title as it's title
    var objectStoreTitleRequest = objectStore.get(review.id);

    objectStoreTitleRequest.onsuccess = function () {
      // Grab the data object returned as the result
      var data = objectStoreTitleRequest.result;
      data.success = true;
      // Create another request that inserts the item back into the database
      var updateTitleRequest = objectStore.put(data);
      // Log the transaction that originated this request
      console.log("The transaction that originated this request is " + updateTitleRequest.transaction);
      // When this new request succeeds, run the displayData() function again to update the display
      updateTitleRequest.onsuccess = function () {
      };
    };
  }




  static addReviewToDB(review) {
    fetch('https://chefrate.glitch.me/reviews/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    })
      .then(res => res.json())
      .catch(error => {
        console.error(error)
      })
      .then(res => {
        console.log(res)
        // open a read/write db transaction, ready for adding the data
        var transaction = db.transaction(["reviews"], "readwrite");

        // report on the success of the transaction completing, when everything is done
        transaction.oncomplete = function (event) {
          console.log("complete")
        };

        transaction.onerror = function (event) {
          console.log("error")
        };

        // create an object store on the transaction
        var objectStore = transaction.objectStore("reviews");

        // Make a request to add our newItem object to the object store
        let valueForIndexedDB = res ? res : { ...review, success: false }
        var objectStoreRequest = objectStore.add(valueForIndexedDB);

        objectStoreRequest.onsuccess = function (event) {
          // report the success of our request
          console.log("success")
          fillReviewsHTML()

          if (!res) {
            window.addEventListener('online', function () {
              DBHelper.postReview(review)
                .then(res => {
                  console.log(res)
                  DBHelper.changeReviewSuccessStatus(res)
                })
              window.removeEventListener('online')
            });
          }
        };
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    var request = window.indexedDB.open("indexedDB", 1);
    request.onerror = function (event) {
      // Handle errors!
      let xhr = new XMLHttpRequest();
      xhr.open('GET', DBHelper.DATABASE_URL("restaurants"));
      xhr.onload = () => {
        if (xhr.status === 200) { // Got a success response from server!
          const json = JSON.parse(xhr.responseText);
          // const restaurants = json.restaurants;
          const restaurants = json;
          callback(null, restaurants);
        } else { // Oops!. Got an error from server.
          const error = (`Request failed. Returned status of ${xhr.status}`);
          callback(error, null);
        }
      };
      xhr.send();
    };
    request.onsuccess = function (event) {
      // Do something with the request.result!
      db.transaction("restaurants").objectStore("restaurants").getAll().onsuccess = function (event) {
        var restaurants = event.target.result;
        if (restaurants.length > 0) {
          callback(null, restaurants);
        }
        else {
          let xhr = new XMLHttpRequest();
          xhr.open('GET', DBHelper.DATABASE_URL("restaurants"));
          xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
              const json = JSON.parse(xhr.responseText);
              // const restaurants = json.restaurants;
              const restaurants = json;
              callback(null, restaurants);
            } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${xhr.status}`);
              callback(error, null);
            }
          };
          xhr.send();
        }
      };
    };
  }


  static fetchReviews(callback) {
    var request = window.indexedDB.open("indexedDB", 1);
    request.onerror = function (event) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', DBHelper.DATABASE_URL("reviews"));
      xhr.onload = () => {
        if (xhr.status === 200) { // Got a success response from server!
          const json = JSON.parse(xhr.responseText);
          const reviews = json;
          callback(null, reviews);
        } else { // Oops!. Got an error from server.
          const error = (`Request failed. Returned status of ${xhr.status}`);
          callback(error, null);
        }
      };
      xhr.send();
    };
    request.onsuccess = function (event) {
      // Do something with the request.result!
      db.transaction("reviews").objectStore("reviews").getAll().onsuccess = function (event) {
        var reviews = event.target.result;
        if (reviews.length > 0) {
          callback(null, reviews);
        }
        else {
          let xhr = new XMLHttpRequest();
          xhr.open('GET', DBHelper.DATABASE_URL("reviews"));
          xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
              const json = JSON.parse(xhr.responseText);
              const reviews = json;
              callback(null, reviews);
            } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${xhr.status}`);
              callback(error, null);
            }
          };
          xhr.send();
        }
      };
    };
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }
  
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }
  

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`./img/${restaurant.id}.jpg`);
    }

  static altForRestaurant(restaurant) {
    return (`${restaurant.name}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // icon color plugin came from this repo https://github.com/pointhi/leaflet-color-markers
    const blueIcon = new L.Icon({
      iconUrl: './img/marker-icon-2x-blue.png',
      shadowUrl: './img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    let marker = L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      icon: blueIcon,
      keyboard: false,
      bounceOnAdd: true,
      bounceOnAddOptions: { duration: 500, height: 100 },
    }).addTo(map);
    marker.bindPopup(`<a href="${DBHelper.urlForRestaurant(restaurant)}">${restaurant.name}</a>`);
    return marker;
  }

  static postReview(review) {
    return fetch('https://chefrate.glitch.me/reviews/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    })
      .then(res => res.json())
      .catch(error => {
        console.error(error)
      })
  }
}


//IndexedDB
var request = window.indexedDB.open("indexedDB", 1);

request.onerror = function (event) {
  // Generic error handler for all errors targeted at this database's
  // requests!
  alert("Database error: " + event.target.errorCode);
};
request.onsuccess = function (event) {
  // Do something with request.result!
  db = event.target.result;
};


// This event is only implemented in recent browsers   
request.onupgradeneeded = function (event) {

  // Save the IDBDatabase interface 
  var db = event.target.result;

  // Create an objectStore for this database
  var objectStoreRestaurants = db.createObjectStore("restaurants", {
    keyPath: "id", autoIncrement: true
  });
  var objectStoreReviews = db.createObjectStore("reviews", {
    keyPath: "id", autoIncrement: true
  });
  // Use transaction oncomplete to make sure the objectStore creation is 
  // finished before adding data into it.
  objectStoreRestaurants.transaction.addEventListener('complete', function (event) {
    // Store values in the newly created objectStore.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        var restaurantObjectStore = db.transaction("restaurants", "readwrite").objectStore("restaurants");
        restaurants.forEach(function (restaurant) {
          restaurantObjectStore.add(restaurant);
        });
      }
    });
  });


  objectStoreReviews.transaction.addEventListener('complete', function (event) {
    // Store values in the newly created objectStore.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        var reviewObjectStore = db.transaction("reviews", "readwrite").objectStore("reviews");
        reviews.forEach(function (reviews) {
          reviewObjectStore.add(reviews);
        });
      }
    });
  });
};
