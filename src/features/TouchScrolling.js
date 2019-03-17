'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var TouchScrolling = Feature.extend('TouchScrolling', {
    handleTouchStart: function(grid, event) {
        this.lastTouch = this.getTouchedCell(grid, event);
    },

    handleTouchMove: function(grid, event) {
        var currentTouch = this.getTouchedCell(grid, event);
        var lastTouch = this.lastTouch;

        var xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
        var yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

        grid.sbHScroller.index = grid.sbHScroller.index + xOffset;
        grid.sbVScroller.index = grid.sbVScroller.index + yOffset;

        this.lastTouch = currentTouch;
    },

    getTouchedCell: function(grid, event) {
        var point = event.detail.touches[0];
        return grid.getGridCellFromMousePoint(point).cellEvent.bounds;
    }
});

module.exports = TouchScrolling;
