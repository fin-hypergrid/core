'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSorting = Feature.extend('ColumnSorting', {

    /**
     * was the header on this grid clicked?
     * @type {boolean}
     * @default false
     * @memberOf ColumnSorting.prototype
     */
    headerClicked: false,

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function (grid, event) {
        // mouse down is tracked at the grid level, mouse up at the document level
        // track the fact that we've clicked in this grid
        var columnProperties;
        if (
            event.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            this.headerClicked = true;
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnSorting.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */

    handleMouseUp: function (grid, event) {
        var columnProperties;
        if (this.headerClicked == true &&
            event.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.gridCell.x)) &&
            !columnProperties.unsortable
        ) {
            this.headerClicked = false;
            var column = grid.behavior.getActiveColumn(event.gridCell.x);
            grid.fireSyntheticColumnSortEvent(column.index, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
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
            event.isRowFixed &&
            event.isHeaderCell &&
            (columnProperties = grid.behavior.getColumnProperties(event.gridCell.x)) &&
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
