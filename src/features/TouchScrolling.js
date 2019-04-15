'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var TouchScrolling = Feature.extend('TouchScrolling', {
    handleTouchStart: function(grid, event) {
        this.lastTouch = this.getTouchedCell(grid, event);
        this.touches = [this.lastTouch];
    },

    handleTouchMove: function(grid, event) {
        var currentTouch = this.getTouchedCell(grid, event);
        var lastTouch = this.lastTouch;

        var xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
        var yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

        grid.sbHScroller.index += xOffset;
        grid.sbVScroller.index += yOffset;

        this.lastTouch = currentTouch;

        this.touches.push(currentTouch);
    },

    getTouchedCell: function(grid, event) {
        var point = event.detail.touches[0];
        var cell = grid.getGridCellFromMousePoint(point).cellEvent.bounds;
        cell.timestamp = Date.now();
        return cell;
    }
});

module.exports = TouchScrolling;
