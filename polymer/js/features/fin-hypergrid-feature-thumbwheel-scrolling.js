(function() {

    'use strict';

    Polymer({ /* jshint ignore:line */
        handleWheelMoved: function(grid, e) {
            var primEvent = e.primitiveEvent;
            if (primEvent.wheelDeltaY > 0) {
                grid.scrollBy(0, -1);
            } else if (primEvent.wheelDeltaY < -0) {
                grid.scrollBy(0, 1);
            } else if (primEvent.wheelDeltaX > 0) {
                grid.scrollBy(-1, 0);
            } else if (primEvent.wheelDeltaX < -0) {
                grid.scrollBy(1, 0);
            }
        }
    });

})(); /* jshint ignore:line */
