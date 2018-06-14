'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var Tag = CellRenderer.extend('Tag', {

    /**
     * @memberOf Tag.prototype
     */
    paint: function(gc, config) {
        if (config.tagbands) {
            var tagband = config.tagbands.find(function(tagband) {
                return config.value >= tagband.floor;
            });
            var fillStyle = tagband && tagband.fillStyle;

            if (fillStyle) {
                var b = config.bounds,
                    x = b.x + b.width - 1,
                    y = b.y;

                gc.beginPath();
                gc.moveTo(x, y);
                gc.lineTo(x, y + 8);
                gc.lineTo(x - 8, y);
                // gc.lineTo(x, y);
                gc.closePath();
                gc.cache.fillStyle = fillStyle;
                gc.fill();
            }
        }
    }
});

module.exports = Tag;
