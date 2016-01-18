'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var CellClick = Feature.extend('CellClick', {

    alias: 'CellClick',

    /**
     * @memberOf CellClick.prototype
     * @desc Handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleTap: function(grid, event) {
        var gridCell = event.gridCell;
        var headerRowCount = grid.behavior.getHeaderRowCount();
        var headerColumnCount = grid.behavior.getHeaderColumnCount();
        if ((gridCell.y >= headerRowCount) &&
            (gridCell.x >= headerColumnCount)) {
            grid.cellClicked(event);
        } else if (this.next) {
            this.next.handleTap(grid, event);
        }
    }
});

module.exports = CellClick;
