'use strict';

var Feature = require('./Feature.js');

var OnHover = Feature.extend({

    alias: 'OnHover',

    /**
     * @function
     * @instance
     * @desc Hhandle this event down the feature chain of responsibility.
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        var currentHoverCell = grid.getHoverCell();
        if (!event.gridCell.equals(currentHoverCell)) {
            if (currentHoverCell) {
                this.handleMouseExit(grid, currentHoverCell);
            }
            this.handleMouseEnter(grid, event);
            grid.setHoverCell(event.gridCell);
        } else {
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
        }
    }

});

module.exports = OnHover;