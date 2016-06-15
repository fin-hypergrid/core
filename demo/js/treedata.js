'use strict';

(function() {
    var data = [
        { ID: 0, parentID: null, name: 'USA', latitude: 36.2161472, longitude: -113.6866279 },
        { ID: 1, parentID: 0, name: 'New York', latitude: 40.7055651, longitude: -74.118086 },
        { ID: 2, parentID: 1, name: 'Albany', latitude: 42.6681345, longitude: -73.846419 },
        { ID: 3, parentID: 1, name: 'Syracuse', latitude: 43.0352286, longitude: -76.1742994 },
        { ID: 4, parentID: 0, name: 'California',  latitude: 37.1870791, longitude: -123.762638 },
        { ID: 5, parentID: 4, name: 'Monterey', latitude: 36.5943628, longitude: -121.9025183 },
        { ID: 6, parentID: 4, name: 'Berkeley', latitude: 37.8759458, longitude: -122.2981316 },
        { ID: 7, parentID: 4, name: 'Laguna', latitude: 33.5482634, longitude: -117.8447927 },
        { ID: 8, parentID: 0, name: 'Massachusetts', latitude: 42.6369691, longitude: -71.3618803 },
        { ID: 9, parentID: 8, name: 'Lowell', latitude: 42.6369691, longitude: -71.3618803 },
        { ID: 10, parentID: null, name: 'France', latitude: 46.1274793, longitude: -2.288454 },
        { ID: 11, parentID: 10, name: 'Paris', latitude: 48.8588376, longitude: 2.2773459 },
    ];
    window.people3 = data;
})();
