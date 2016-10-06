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
        gc.rect(x + 1, y + 1, width - 2, height - 2);
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


