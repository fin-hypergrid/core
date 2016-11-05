'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var LastSelection = CellRenderer.extend('LastSelection', {

    /**
     * @desc A rendering of the last Selection Model
     * @implements paintFunction
     * @memberOf LastSelection.prototype
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.rect(x + 1, y, width - 2, height - 2);

        gc.cache.fillStyle = config.selectionRegionOverlayColor;
        gc.fill();

        gc.cache.lineWidth = 1;
        gc.cache.strokeStyle = config.selectionRegionOutlineColor;
        gc.stroke();
    }
});

module.exports = LastSelection;


