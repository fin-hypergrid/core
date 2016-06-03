'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 */
var LastSelection = CellRenderer.extend('LastSelection', {

    /**
     * @desc A rendering of the last Selection Model
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        var focusLineStep =  [
            [5, 5],
            [0, 1, 5, 4],
            [0, 2, 5, 3],
            [0, 3, 5, 2],
            [0, 4, 5, 1],
            [0, 5, 5, 0],
            [1, 5, 4, 0],
            [2, 5, 3, 0],
            [3, 5, 2, 0],
            [4, 5, 1, 0]
        ];
        gc.rect(x, y, width, height);
        gc.fillStyle = this.grid.resolveProperty('selectionRegionOverlayColor');
        gc.fill();
        gc.lineWidth = 1;
        gc.strokeStyle = this.grid.resolveProperty('selectionRegionOutlineColor');

        // animate the dashed line a bit here for fun

        gc.stroke();

        gc.rect(x, y, width, height);

        gc.strokeStyle = 'white';

        //animate the dashed line a bit here for fun
        gc.setLineDash(focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % focusLineStep.length]);

        gc.stroke();
    }
});

module.exports = LastSelection;


