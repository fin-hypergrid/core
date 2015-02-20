(function() {

    'use strict';

    Polymer({ /* jshint ignore:line */
        handleDoubleClick: function(grid, mouseEvent) {
            grid.activateEditor(mouseEvent);
        },

        handleHoldPulse: function(grid, mouseEvent) {
            var primEvent = mouseEvent.primitiveEvent;
            if (primEvent.detail.count < 2) {
                return;
            }
            grid.activateEditor(mouseEvent);
        },
    });

})(); /* jshint ignore:line */
