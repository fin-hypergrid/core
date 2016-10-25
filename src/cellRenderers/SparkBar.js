'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var SparkBar = CellRenderer.extend('SparkBar', {

    /**
     * @desc A simple implementation of a sparkline, because it's a barchart we've changed the name ;).
     * @implements paintFunction
     * @memberOf SparkBar.prototype
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        gc.beginPath();
        var val = config.value;
        if (!val || !val.length) {
            return;
        }
        var count = val.length;
        var eWidth = width / count;
        var fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
        if (config.backgroundColor || config.isSelected) {
            gc.fillStyle = config.isSelected ? 'blue' : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.fillStyle = fgColor;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
            x += eWidth;
        }
        gc.closePath();
        config.minWidth = count * 10;
    }
});

module.exports = SparkBar;
