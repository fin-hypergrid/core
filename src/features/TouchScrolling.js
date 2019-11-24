'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var TouchScrolling = Feature.extend('TouchScrolling', {
    handleTouchStart: function(grid, event) {
        this.stopDeceleration();
        this.touches = [this.getTouchedCell(grid, event)];
    },

    handleClick: function() {},

    handleDoubleClick: function() {},

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
        var timeOffset;
        var i = -1;

        do {
            timeOffset = (currentTouch.timestamp - this.touches[++i].timestamp);
        } while (timeOffset > 100 && i < this.touches.length - 1);

        var startTouch = this.touches[i];

        this.decelerateY(grid, startTouch, currentTouch);
        this.decelerateX(grid, startTouch, currentTouch);
    },

    getTouchedCell: function(grid, event) {
        var point = event.detail.touches[0];
        var cell = grid.getGridCellFromMousePoint(point).cellEvent.bounds;
        cell.timestamp = Date.now();
        return cell;
    },

    decelerateY: function(grid, startTouch, endTouch) {
        var offset = endTouch.y - startTouch.y;
        var timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(grid.sbVScroller, offset, timeOffset);
    },

    decelerateX: function(grid, startTouch, endTouch) {
        var offset = endTouch.x - startTouch.x;
        var timeOffset = endTouch.timestamp - startTouch.timestamp;
        this.decelerate(grid.sbHScroller, offset, timeOffset);
    },

    decelerate: function(scroller, offset, timeOffset) {
        var velocity = (Math.abs(offset) / timeOffset) * 100;
        var dir = -Math.sign(offset);
        var interval = this.getInitialInterval(velocity);

        var step = function() {
            if (velocity > 0) {
                var delta = this.getDelta(velocity);
                var index = scroller.index + (dir * delta);
                scroller.index = index;

                if (index > scroller.range.max || index < 0) {
                    return;
                }

                velocity -= TouchScrolling.DEC_STEP_SIZE;

                this.timer = setTimeout(step, interval);

                interval = this.updateInterval(interval, velocity);
            }
        }.bind(this);

        step();
    },

    getDelta: function(velocity) {
        if (velocity >= 180) {
            return 10;
        } else if (velocity >= 100) {
            return 5;
        } else if (velocity >= 50) {
            return 2;
        } else if (velocity >= 25) {
            return 1;
        } else {
            return 0.5;
        }
    },

    getInitialInterval: function(velocity) {
        if (velocity >= 50) {
            return 5;
        } else if (velocity >= 25) {
            return 15;
        } else {
            return 30;
        }
    },

    updateInterval: function(interval, velocity) {
        if (interval >= TouchScrolling.MAX_INTERVAL) {
            return interval;
        }

        var offset = 0;

        if (velocity < 25) {
            offset = 10;
        } else if (velocity < 75) {
            offset = 5;
        } else if (velocity < 150) {
            offset = 2;
        }

        return interval + offset;
    },

    stopDeceleration: function() {
        clearTimeout(this.timer);
    }
});

TouchScrolling.MAX_INTERVAL = 200;

TouchScrolling.MAX_TOUCHES = 70;

TouchScrolling.DEC_STEP_SIZE = 5;

module.exports = TouchScrolling;
