'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    alias: 'Filters',

    handleTap: function(grid, event) {
        var gridCell = event.gridCell;
        if (grid.isFilterRow(gridCell.y) && gridCell.x !== -1) {
            grid.filterClicked(event);
        } else if (this.next) {
            this.next.handleTap(grid, event);
        }
    }

});

module.exports = Filters;
