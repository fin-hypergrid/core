'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 * @extends Feature
 */
var ColumnAutosizing = Feature.extend('ColumnAutosizing', {

    /**
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf ColumnAutosizing.prototype
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
