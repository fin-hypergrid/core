'use strict';

(function() {
    var data = [
        { ID: 0, parentID: null, State: 'USA', Latitude: 36.2161472, Longitude: -113.6866279 },
        { ID: 1, parentID: 0, State: 'New York', Latitude: 40.7055651, Longitude: -74.118086 },
        { ID: 2, parentID: 1, State: 'Albany', Latitude: 42.6681345, Longitude: -73.846419 },
        { ID: 3, parentID: 1, State: 'Syracuse', Latitude: 43.0352286, Longitude: -76.1742994 },
        { ID: 4, parentID: 0, State: 'California',  Latitude: 37.1870791, Longitude: -123.762638 },
        { ID: 5, parentID: 4, State: 'Monterey', Latitude: 36.5943628, Longitude: -121.9025183 },
        { ID: 6, parentID: 4, State: 'Berkeley', Latitude: 37.8759458, Longitude: -122.2981316 },
        { ID: 7, parentID: 4, State: 'Laguna', Latitude: 33.5482634, Longitude: -117.8447927 },
        { ID: 8, parentID: 0, State: 'Massachusetts', Latitude: 42.6369691, Longitude: -71.3618803 },
        { ID: 9, parentID: 8, State: 'Lowell', Latitude: 42.6369691, Longitude: -71.3618803 },
        { ID: 10, parentID: null, State: 'France', Latitude: 46.1274793, Longitude: -2.288454 },
        { ID: 11, parentID: 10, State: 'Paris', Latitude: 48.8588376, Longitude: 2.2773459 },
    ];
    window.treedata = data;
})();
