'use strict';

var Feature = require('./Feature.js');

var ColumnAutosizing = Feature.extend({

    alias: 'ColumnAutosizing',

    /**
     * @function
     * @instance
     * @desc handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        var headerRowCount = grid.getHeaderRowCount();
        //var headerColCount = grid.getHeaderColumnCount();
        var gridCell = event.gridCell;
        if (gridCell.y <= headerRowCount) {
            grid.autosizeColumn(gridCell.x);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

});

module.exports = ColumnAutosizing;