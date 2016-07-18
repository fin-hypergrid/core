'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var Button = CellRenderer.extend('Button', {

    /**
     * @summary The default cell rendering function for a button cell.
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @param {number} config.x - the "translated" index into the `behavior.allColumns` array
     * @param {number} config.normalizedY - the vertical grid coordinate normalized to first data row
     * @param {number} config.untranslatedX - the horizontal grid coordinate measured from first data column
     * @param {number} config.y - the vertical grid coordinate measured from top header row
     */
    paint: function(gc, config) {
        var val = config.value;
        var c = config.x;
        var r = config.y;
        var bounds = config.bounds;
        var x = bounds.x + 2;
        var y = bounds.y + 2;
        var width = bounds.width - 3;
        var height = bounds.height - 3;
        var radius = height / 2;
        var arcGradient = gc.createLinearGradient(x, y, x, y + height);
        if (config.mouseDown) {
            arcGradient.addColorStop(0, '#B5CBED');
            arcGradient.addColorStop(1, '#4d74ea');
        } else {
            arcGradient.addColorStop(0, '#ffffff');
            arcGradient.addColorStop(1, '#aaaaaa');
        }
        gc.fillStyle = arcGradient;
        gc.strokeStyle = '#000000';
        this.roundRect(gc, x, y, width, height, radius, arcGradient, true);

        var ox = (width - config.getTextWidth(gc, val)) / 2;
        var oy = (height - config.getTextHeight(gc.font).descent) / 2;

        if (gc.textBaseline !== 'middle') {
            gc.textBaseline = 'middle';
        }

        gc.fillStyle = '#000000';

        config.backgroundColor = 'rgba(0,0,0,0)';
        gc.fillText(val, x + ox, y + oy);

        //identify that we are a button
        config.buttonCells[c + ',' + r] = true;
    }
});

module.exports = Button;


