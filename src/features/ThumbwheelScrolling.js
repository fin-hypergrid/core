'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var ThumbwheelScrolling = Feature.extend('ThumbwheelScrolling', {

    /**
     * @memberOf ThumbwheelScrolling.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleWheelMoved: function(grid, e) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }

        var primEvent = e.primitiveEvent,
            deltaX = Math.sign(primEvent.wheelDeltaX || -primEvent.deltaX),
            deltaY = Math.sign(primEvent.wheelDeltaY || -primEvent.deltaY);

        if (deltaX || deltaY) {
            grid.scrollBy(
                -deltaX || 0, // 0 if NaN
                -deltaY || 0
            );
        }
    }

});


module.exports = ThumbwheelScrolling;
