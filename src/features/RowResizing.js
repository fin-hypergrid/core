'use strict';

var ColumnResizing = require('./ColumnResizing');

var RowResizing = ColumnResizing.extend({

    alias: 'RowResizing',

    /**
     * @property {number} dragArea - the index of the row/column we are dragging
     * @instance
     */
    dragArea: -1,

    /**
     * @property {number} dragStart - the pixel location of the where the drag was initiated
     * @instance
     */
    dragStart: -1,

    /**
     * @property {number} dragAreaStartingSize - the starting width/height of the row/column we are dragging
     * @instance
     */
    dragAreaStartingSize: -1,

    /**
     * @function
     * @instance
     * @desc get the mouse x,y coordinate
     * #### returns: integer
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue: function(event) {
        return event.primitiveEvent.detail.mouse.y;
    },

    /**
     * @function
     * @instance
     * @desc get the grid cell x,y coordinate
     * #### returns: integer
     * @param {window.fin.rectangular.Point} gridCell
     */
    getGridCellValue: function(gridCell) {
        return gridCell.x;
    },

    /**
     * @function
     * @instance
     * @desc return the grids x,y scroll value
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    getScrollValue: function(grid) {
        return grid.getVScrollValue();
    },

    /**
     * @function
     * @instance
     * @desc return the width/height of the row/column of interest
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} index - the row/column index of interest
     */
    getAreaSize: function(grid, index) {
        return grid.getRowHeight(index);
    },

    /**
     * @function
     * @instance
     * @desc set the width/height of the row/column at index
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} index - the row/column index of interest
     * @param {number} value - the width/height to set to
     */
    setAreaSize: function(grid, index, value) {
        grid.setRowHeight(index, value);
    },

    /**
     * @function
     * @instance
     * @desc returns the index of which divider I'm over
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {
        return grid.overRowDivider(event);
    },

    /**
     * @function
     * @instance
     * @desc am I over the column/row area
     * #### returns: boolean
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    isFirstFixedOtherArea: function(grid, event) {
        return this.isFirstFixedColumn(grid, event);
    },

    /**
     * @function
     * @instance
     * @desc return the cursor name
     * #### returns: string
     */
    getCursorName: function() {
        return 'row-resize';
    },

    /**
     * @function
     * @instance
     * @desc return the recently rendered area's width/height
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} index - the row/column index of interest
     */
    getPreviousAbsoluteSize: function(grid, index) {
        return grid.getRenderedHeight(index);
    },

    /**
     * @function
     * @instance
     * @desc return the fixed area rows/columns count
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    getOtherFixedAreaCount: function(grid) {
        return grid.getFixedColumnCount();
    },

    getFixedAreaCount: function(grid) {
        return grid.getFixedRowCount() + grid.getHeaderRowCount();
    },

    isEnabled: function(grid) {
        return grid.isRowResizeable();
    }

});

module.exports = RowResizing;