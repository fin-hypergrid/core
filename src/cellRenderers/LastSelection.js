'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @desc A rendering of the last Selection Model
 * @extends CellRenderer
 */
var LastSelection = CellRenderer.extend('LastSelection', {
    paint: function(gc, config) {
        var visOverlay = gc.alpha(config.selectionRegionOverlayColor) > 0,
            visOutline = gc.alpha(config.selectionRegionOutlineColor) > 0;

        if (visOverlay || visOutline) {
            var x = config.bounds.x,
                y = config.bounds.y,
                width = config.bounds.width,
                height = config.bounds.height;

            gc.beginPath();

            gc.rect(x, y, width, height);

            if (visOverlay) {
                gc.cache.fillStyle = config.selectionRegionOverlayColor;
                gc.fill();
            }

            if (visOutline) {
                gc.cache.lineWidth = 1;
                gc.cache.strokeStyle = config.selectionRegionOutlineColor;
                gc.stroke();
            }

            gc.closePath();
        }
    }
});

module.exports = LastSelection;


