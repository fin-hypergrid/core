'use strict';

var Base = require('./../lib/Base');

/** @constructor
 * @desc Instances of CellRenderers are used to render the 2D graphics context within the bound of a cell. Extend this base class to implement your own cell renderer
 *
 *
 * See {@link CellRenderer#initialize|initialize} which is called by the constructor.
 * See also {@tutorial cell-renderer}.
 */
var CellRenderer = Base.extend('CellRenderer', {

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     * @memberOf CellRenderer.prototype
     */
    initialize: function(grid) {
        this.grid = grid;
    },

    /**
     * @desc An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     * @memberOf CellRenderer.prototype
     */
    paint: function(gc, config) {},

    /**
     * @desc A simple implementation of rounding a cell.
     * @param {CanvasGraphicsContext} gc
     * @param {number} x - the x screen coordinate of my origin
     * @param {number} y - the y screen coordinate of my origin
     * @param {number} width - the width I'm allowed to draw within
     * @param {number} height - the height I'm allowed to draw within
     * @param {number} radius
     * @param {number} fill
     * @param {number} stroke
     * @memberOf CellRenderer.prototype
     */
    roundRect: function(gc, x, y, width, height, radius, fill, stroke) {

        if (!stroke) {
            stroke = true;
        }
        if (!radius) {
            radius = 5;
        }
        gc.beginPath();
        gc.moveTo(x + radius, y);
        gc.lineTo(x + width - radius, y);
        gc.quadraticCurveTo(x + width, y, x + width, y + radius);
        gc.lineTo(x + width, y + height - radius);
        gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        gc.lineTo(x + radius, y + height);
        gc.quadraticCurveTo(x, y + height, x, y + height - radius);
        gc.lineTo(x, y + radius);
        gc.quadraticCurveTo(x, y, x + radius, y);
        gc.closePath();
        if (stroke) {
            gc.stroke();
        }
        if (fill) {
            gc.fill();
        }
        gc.closePath();
    }
});

module.exports = CellRenderer;
