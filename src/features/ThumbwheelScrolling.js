'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var ThumbwheelScrolling = Feature.extend('ThumbwheelScrolling', {

    alias: 'ThumbwheelScrolling',

    /**
     * @memberOf ThumbwheelScrolling.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleWheelMoved: function(grid, e) {
        if (!grid.resolveProperty('scrollingEnabled')) {
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
