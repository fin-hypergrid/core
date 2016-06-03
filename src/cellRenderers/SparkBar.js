'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 */
var SparkBar = CellRenderer.extend('SparkBar', {

    /**
     * @desc A simple implementation of a sparkline, because it's a barchart we've changed the name ;).
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The bounding rect of the cell to be rendered.
     * @param config.x - The cell column position
     * @param config.y - The cell row position
     * @memberOf SparkBar.prototype
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = this.config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;
        //var selColor = this.grid.resolveProperty('selectionRegionOverlayColor')

        var fgColor = this.config.isSelected ? 'blue' : 'red';
        if (this.config.backgroundColor || this.config.isSelected) {
            gc.fillStyle = this.config.isSelected ? 'blue' : this.config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.fillStyle = fgColor;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
            x = x + eWidth;
        }
        gc.closePath();
        this.config.minWidth = count * 10;

    },
});

module.exports = SparkBar;
