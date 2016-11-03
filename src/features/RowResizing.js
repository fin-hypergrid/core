'use strict';

var ColumnResizing = require('./ColumnResizing');

/**
 * @constructor
 * @extends ColumnResizing
 */
var RowResizing = ColumnResizing.extend('RowResizing', {

    /**
     * the index of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf RowResizing.prototype
     */
    dragArea: -1,

    /**
     * the pixel location of the where the drag was initiated
     * @type {number}
     * @default -1
     * @memberOf RowResizing.prototype
     */
    dragStart: -1,

    /**
     * the starting width/height of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf RowResizing.prototype
     */
    dragAreaStartingSize: -1,

    /**
     * @memberOf RowResizing.prototype
     * @desc get the mouse x,y coordinate
     * @returns {number}
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue: function(event) {
        return event.primitiveEvent.detail.mouse.y;
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc get the grid cell x,y coordinate
     * @returns {number}
     * @param {Point} gridCell
     */
    getGridCellValue: function(gridCell) {
        return gridCell.x;
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc return the grids x,y scroll value
     * @returns {number}
     * @param {Hypergrid} grid
     */
    getScrollValue: function(grid) {
        return grid.getVScrollValue();
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc return the width/height of the row/column of interest
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {number} index - the row/column index of interest
     */
    getAreaSize: function(grid, index) {
        return grid.getRowHeight(index);
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc set the width/height of the row/column at index
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {number} index - the row/column index of interest
     * @param {number} value - the width/height to set to
     */
    setAreaSize: function(grid, index, value) {
        grid.setRowHeight(index, value);
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc returns the index of which divider I'm over
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {

    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc am I over the column/row area
     * @returns {boolean}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedOtherArea: function(grid, event) {
        return this.isFirstFixedColumn(grid, event);
    },

    /**
     * @function
     * @memberOf RowResizing.prototype
     * @desc return the cursor name
     * @returns {string}
     */
    getCursorName: function() {
        return 'row-resize';
    },

    /**
     *
     * @param {Hypergrid} grid
     * @returns {number}
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
    getFixedAreaCount: function(grid) {
        return grid.getFixedRowCount() + grid.getHeaderRowCount();
    },

    /**
     *
     * @param {Hypergrid} grid
     * @returns {boolean}
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
    isEnabled: function(grid) {
        return grid.isRowResizeable();
    }

});

module.exports = RowResizing;
