'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var TouchScrolling = Feature.extend('TouchScrolling', {
    handleTouchStart: function(grid, event) {
        this.touches = [this.getTouchedCell(grid, event)];
    },

    handleTouchMove: function(grid, event) {
        var currentTouch = this.getTouchedCell(grid, event);
        var lastTouch = this.touches[this.touches.length - 1];

        var xOffset = (lastTouch.x - currentTouch.x) / lastTouch.width;
        var yOffset = (lastTouch.y - currentTouch.y) / lastTouch.height;

        grid.sbHScroller.index += xOffset;
        grid.sbVScroller.index += yOffset;

        if (this.touches.length >= TouchScrolling.MAX_TOUCHES) {
            this.touches.shift();
        }

        this.touches.push(currentTouch);
    },

    handleTouchEnd: function(grid, event) {
        var currentTouch = this.getTouchedCell(grid, event);
        var currentTime = Date.now();
        var timeOffset;
        var i = this.touches.length;

        do {
            timeOffset = (currentTime - this.touches[--i].timestamp);
        } while (timeOffset <= 100 && i > 0);

        var yOffset = (currentTouch.y - this.touches[i].y);
        var yVelocity = (Math.abs(yOffset) / timeOffset) * 100;
        var dir = -Math.sign(yOffset);

        var interval = yVelocity >= 50 ? 5 : 30;

        var decelerate = function() {
            var delta = yVelocity >= 180 ? 3 : yVelocity >= 75 ? 2 : 1;
            grid.sbVScroller.index += dir * delta;

            if (yVelocity) {
                yVelocity = Math.max(0, yVelocity - 5);

                setTimeout(decelerate, interval);

                if (interval < 200) {
                    interval += 5;
                }
            }
        };

        decelerate();
    },

    getTouchedCell: function(grid, event) {
        var point = event.detail.touches[0];
        var cell = grid.getGridCellFromMousePoint(point).cellEvent.bounds;
        cell.timestamp = Date.now();
        return cell;
    }
});

TouchScrolling.MAX_TOUCHES = 70;

module.exports = TouchScrolling;
