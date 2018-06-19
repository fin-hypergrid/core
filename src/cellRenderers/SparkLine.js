'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a sparkline.
 * @see [Edward Tufte sparkline](http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR)
 * @constructor
 * @extends CellRenderer
 */
var SparkLine = CellRenderer.extend('SparkLine', {
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
            gc.cache.fillStyle = config.isSelected ? config.backgroundSelectionColor : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }
        gc.cache.strokeStyle = fgColor;
        gc.cache.fillStyle = fgColor;
        gc.beginPath();
        var prev;
        for (var i = 0; i < val.length; i++) {
            var barheight = val[i] / 110 * height;
            if (!prev) {
                prev = barheight;
            }
            gc.lineTo(x + 5, y + height - barheight);
            gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
            x += eWidth;
        }
        config.minWidth = count * 10;
        gc.stroke();
        gc.closePath();
    }
});

module.exports = SparkLine;
