'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var OnHover = Feature.extend('OnHover', {

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf OnHover.prototype
     */
    handleMouseMove: function(grid, event) {
        var hoverCell = grid.hoverCell;
        if (!event.gridCell.equals(hoverCell)) {
            if (hoverCell) {
                this.handleMouseExit(grid, hoverCell);
            }
            this.handleMouseEnter(grid, event);
            grid.setHoverCell(event);
        } else if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

});

module.exports = OnHover;
