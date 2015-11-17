'use strict';

var Feature = require('./Feature.js');

var CellClick = Feature.extend({

    alias: 'CellClick',

    /**
     * @function
     * @instance
     * @desc Handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleTap: function(grid, event) {
        var gridCell = event.gridCell;
        var behavior = grid.getBehavior();
        var headerRowCount = behavior.getHeaderRowCount();
        var headerColumnCount = behavior.getHeaderColumnCount();
        if ((gridCell.y >= headerRowCount) &&
            (gridCell.x >= headerColumnCount)) {
            grid.cellClicked(event);
        } else if (this.next) {
            this.next.handleTap(grid, event);
        }
    }
});

module.exports = CellClick;