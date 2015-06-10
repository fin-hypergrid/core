'use strict';
/**
 *
 * @module features\column-resizing
 * @description
 this feature is responsible for being able to resize columns
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {integer} dragIndex - the index of the column wall were currently dragging
         * @instance
         */
        dragIndex: -1,

        /**
         * @property {integer} dragStart - the pixel location of the where the drag was initiated
         * @instance
         */
        dragStart: -1,

        /**
         * @property {integer} dragIndexStartingSize - the starting width/height of the row/column we are dragging
         * @instance
         */
        dragIndexStartingSize: -1,

        /**
        * @function
        * @instance
        * @description
        return the count of fixed rows/columns
        * #### returns: integer
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        */
        getFixedAreaCount: function(grid) {
            return grid.getFixedColumnCount();
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
            return event.primitiveEvent.detail.mouse.x;
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
            return gridCell.y;
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
            return grid.getHScrollValue();
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
            return grid.getColumnWidth(index);
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
            grid.setColumnWidth(index, value);
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
            return grid.getFixedRowCount();
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
            return grid.getFixedColumnWidth(index);
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
            return grid.getRenderedWidth(index);
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
            grid.setFixedColumnWidth(index, value);
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
            return grid.overColumnDivider(event);
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
            return this.isFixedRow(grid, event);
        },

        /**
        * @function
        * @instance
        * @description
        return the cursor name
        * #### returns: string
        */
        getCursorName: function() {
            return 'col-resize';
        },

        /**
        * @function
        * @instance
        * @description
        handle this event
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} event - the event details
        */
        handleMouseDrag: function(grid, event) {
            if (this.dragIndex > -1) {
                //var fixedAreaCount = this.getFixedAreaCount(grid);
                //var offset = this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
                var distance = this.getMouseValue(event) - this.getPreviousAbsoluteSize(grid, this.dragIndex);
                this.setSize(grid, this.dragIndex, distance);
            } else if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
        set the width/height of a specific row/column
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} areaIndex - the row/column index to affect
        * @param {integer} size - the width/height to set to
        */
        setSize: function(grid, areaIndex, size) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            var scrollValue = this.getScrollValue(grid);
            if (areaIndex < fixedAreaCount) {
                this.setFixedAreaSize(grid, areaIndex, size);
            } else {
                this.setAreaSize(grid, areaIndex - fixedAreaCount + scrollValue, size);
            }
        },

        /**
        * @function
        * @instance
        * @description
        get the width/height of a specific row/column
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {integer} areaIndex - the row/column index of interest
        */
        getSize: function(grid, areaIndex) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            if (areaIndex < 0) {
                return this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
            } else {
                return this.getAreaSize(grid, areaIndex);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleMouseDown: function(grid, event) {
            var gridCell = event.gridCell;
            var overArea = this.overAreaDivider(grid, event);
            if (overArea > -1 && this.getGridCellValue(gridCell) < this.getOtherFixedAreaCount(grid)) {
                var scrollValue = this.getScrollValue(grid);
                var fixedAreaCount = this.getFixedAreaCount(grid);
                this.dragIndex = overArea - 1;
                this.dragStart = this.getMouseValue(event);
                if (overArea < fixedAreaCount) {
                    scrollValue = 0;
                }
                this.dragIndexStartingSize = this.getAreaSize(grid, overArea - fixedAreaCount + scrollValue);
                this.detachChain();
            } else if (this.next) {
                this.next.handleMouseDown(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleMouseUp: function(grid, event) {
            if (this.dragIndex > -1) {
                this.cursor = null;
                this.dragIndex = -1;

                event.primitiveEvent.stopPropagation();
                //delay here to give other events a chance to be dropped
                var self = this;
                setTimeout(function() {
                    self.attachChain();
                }, 200);
            } else if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
        handle this event down the feature chain of responsibility
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} event - the event details
        */
        handleMouseMove: function(grid, event) {
            if (this.dragIndex > -1) {
                return;
            }
            this.cursor = null;
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
            this.checkForAreaResizeCursorChange(grid, event);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
        * @param {Object} event - the event details
        */
        checkForAreaResizeCursorChange: function(grid, event) {

            //var gridCell = event.gridCell;

            if (this.isFixedOtherArea(grid, event) && this.overAreaDivider(grid, event) > -1) {
                this.cursor = this.getCursorName();
            } else {
                this.cursor = null;
            }

        },
    });

})(); /* jshint ignore:line */
