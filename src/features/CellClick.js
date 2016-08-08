'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 * @extends Feature
 */
var CellClick = Feature.extend('CellClick', {

    /**
     * @memberOf CellClick.prototype
     * @desc Handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleClick: function(grid, event) {
        var consumed;

        if (
            event.gridCell.y >= grid.behavior.getHeaderRowCount() &&
            event.gridCell.x >= grid.behavior.getHeaderColumnCount()
        ) {
            consumed = grid.cellClicked(event);
        }

        if (!consumed && this.next) {
            this.next.handleClick(grid, event);
        }
    }
});

module.exports = CellClick;
