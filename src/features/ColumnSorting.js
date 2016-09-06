'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSorting = Feature.extend('ColumnSorting', {

    /**
     * @memberOf ColumnSorting.prototype
     * @desc Handle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */

    handleDoubleClick: function(grid, event) {
        var gridCell = event.gridCell,
            columnProperties;
        if (
            grid.isShowHeaderRow() &&
            gridCell.y === 0 &&
            gridCell.x !== -1 &&
            (columnProperties = grid.behavior.getColumnProperties(gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            var keys = event.primitiveEvent.detail.keys;
            grid.toggleSort(gridCell.x, keys);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf ColumnSorting.prototype
     * @desc Handle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        var gridCell = event.gridCell,
            columnProperties;
        if (
            this.isFixedRow(grid, event) &&
            gridCell.y === 0 &&
            (columnProperties = grid.behavior.getColumnProperties(gridCell.x)) &&
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
