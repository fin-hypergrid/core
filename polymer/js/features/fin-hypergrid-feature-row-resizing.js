'use strict';
/**
 *
 * @module features\row-resizing
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {integer} dragArea - the index of the row/column we are dragging
         * @instance
         */
        dragArea: -1,

        /**
         * @property {integer} dragStart - the pixel location of the where the drag was initiated
         * @instance
         */
        dragStart: -1,

        /**
         * @property {integer} dragAreaStartingSize - the starting width/height of the row/column we are dragging
         * @instance
         */
        dragAreaStartingSize: -1,

        /**
        * @function
        * @instance
        * @description
        return the count of fixed rows/columns
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        getFixedAreaCount: function(grid) {
            return grid.getFixedRowCount();
        },

        /**
        * @function
        * @instance
        * @description
        get the mouse x,y coordinate
        * #### returns: integer
        * @param {MouseEvent} event - the mouse event to query
        */
        getMouseValue: function(event) {
            return event.primitiveEvent.detail.mouse.y;
        },

        /**
        * @function
        * @instance
        * @description
        get the grid cell x,y coordinate
        * #### returns: integer
        * @param {rectangle.point} gridCell - [rectangle.point](https://github.com/stevewirts/fin-rectangle)
        */
        getGridCellValue: function(gridCell) {
            return gridCell.x;
        },

        /**
        * @function
        * @instance
        * @description
        return the grids x,y scroll value
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        getScrollValue: function(grid) {
            return grid.getVScrollValue();
        },

        /**
        * @function
        * @instance
        * @description
        return the width/height of the row/column of interest
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} index - the row/column index of interest
        */
        getAreaSize: function(grid, index) {
            return grid.getRowHeight(index);
        },

        /**
        * @function
        * @instance
        * @description
        set the width/height of the row/column at index
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} index - the row/column index of interest
        * @param {integer} value - the width/height to set to
        */
        setAreaSize: function(grid, index, value) {
            grid.setRowHeight(index, value);
        },

        /**
        * @function
        * @instance
        * @description
        return the fixed area rows/columns count
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        getOtherFixedAreaCount: function(grid) {
            return grid.getFixedColumnCount();
        },

        /**
        * @function
        * @instance
        * @description
        return the fixed area rows/columns width/height
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} index - the row/column index of interest
        */
        getFixedAreaSize: function(grid, index) {
            return grid.getFixedRowHeight(index);
        },

        /**
        * @function
        * @instance
        * @description
        set the row/column width/height at index to value
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} index - the row/column index of interest
        * @param {integer} value - the width/height to set to
        */
        setFixedAreaSize: function(grid, index, value) {
            grid.setFixedRowHeight(index, value);
        },

        /**
        * @function
        * @instance
        * @description
        returns the index of which divider I'm over
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
        * @description
        am I over the column/row area
        * #### returns: boolean
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} event - the event details
        */
        isFixedOtherArea: function(grid, event) {
            return this.isFixedColumn(grid, event);
        },

        /**
        * @function
        * @instance
        * @description
        return the cursor name
        * #### returns: string
        */
        getCursorName: function() {
            return 'row-resize';
        },

        /**
        * @function
        * @instance
        * @description
        return the recently rendered area's width/height
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} index - the row/column index of interest
        */
        getPreviousAbsoluteSize: function(grid, index) {
            return grid.getRenderedHeight(index);
        },

    });

})(); /* jshint ignore:line */
