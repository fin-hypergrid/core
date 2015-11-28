'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var OnHover = Feature.extend('OnHover', {

    alias: 'OnHover',

    /**
     * @desc Hhandle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf OnHover.prototype
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
