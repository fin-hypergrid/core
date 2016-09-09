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
        var x = event.dataCell.x,
            y = event.gridCell.y,
            columnProperties;
        if (
            grid.isShowHeaderRow() &&
            y === 0 && // header cell
            x !== -1 &&
            (columnProperties = grid.behavior.getColumnProperties(x)) &&
            !columnProperties.unsortable
        ) {
            grid.toggleSort(x, event.primitiveEvent.detail.keys);
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
        var x = event.dataCell.x,
            y = event.gridCell.y,
            columnProperties;
        if (
            this.isFixedRow(grid, event) &&
            y === 0 && // header cell
            (columnProperties = grid.behavior.getColumnProperties(x)) &&
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
