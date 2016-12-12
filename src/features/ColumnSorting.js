'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSorting = Feature.extend('ColumnSorting', {

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */

    handleDoubleClick: function(grid, event) {
        var columnProperties;
        if (
            event.detail.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.detail.gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            grid.fireSyntheticColumnSortEvent(event.detail.gridCell.x, event.detail.keys);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        var columnProperties;
        if (
            event.detail.isRowFixed &&
            event.detail.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.detail.gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            this.cursor = 'pointer';
        } else {
            this.cursor = null;
        }
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

});

module.exports = ColumnSorting;
