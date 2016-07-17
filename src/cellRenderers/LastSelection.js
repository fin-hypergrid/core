'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var LastSelection = CellRenderer.extend('LastSelection', {

    /**
     * @desc A rendering of the last Selection Model
     * @param {CanvasGraphicsContext} gc
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @param {number} config.x - the "translated" index into the `behavior.allColumns` array
     * @param {number} config.normalizedY - the vertical grid coordinate normalized to first data row
     * @param {number} config.untranslatedX - the horizontal grid coordinate measured from first data column
     * @param {number} config.y - the vertical grid coordinate measured from top header row
     * @memberOf LastSelection.prototype
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        // var focusLineStep =  [
        //     [5, 5],
        //     [0, 1, 5, 4],
        //     [0, 2, 5, 3],
        //     [0, 3, 5, 2],
        //     [0, 4, 5, 1],
        //     [0, 5, 5, 0],
        //     [1, 5, 4, 0],
        //     [2, 5, 3, 0],
        //     [3, 5, 2, 0],
        //     [4, 5, 1, 0]
        // ];
        gc.rect(x, y, width, height);
        gc.fillStyle = config.selectionRegionOverlayColor;
        gc.fill();
        gc.lineWidth = 1;
        gc.strokeStyle = config.selectionRegionOutlineColor;

        // animate the dashed line a bit here for fun

        gc.stroke();

        // gc.rect(x, y, width, height);
        //
        // gc.strokeStyle = 'white';
        //
        // //animate the dashed line a bit here for fun
        // gc.setLineDash(focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % focusLineStep.length]);
        //
        // gc.stroke();
    }
});

module.exports = LastSelection;


