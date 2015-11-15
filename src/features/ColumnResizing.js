'use strict';

var Feature = require('./Feature.js');

var ColumnResizing = Feature.extend({

    extendable: true, // makes ColumnResizing itself extensible with .extend() - used by RowResizing.js

    alias: 'ColumnResizing',

    /**
     * @property {number} dragIndex - the index of the column wall were currently dragging
     * @instance
     */
    dragIndex: -2,

    /**
     * @property {number} dragStart - the pixel location of the where the drag was initiated
     * @instance
     */
    dragStart: -1,

    /**
     * @property {number} dragIndexStartingSize - the starting width/height of the row/column we are dragging
     * @instance
     */
    dragIndexStartingSize: -1,

    /**
     * @function
     * @instance
     * @desc get the mouse x,y coordinate
     * #### returns: integer
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue: function(event) {
        return event.primitiveEvent.detail.mouse.x;
    },

    /**
     * @function
     * @instance
     * @desc get the grid cell x,y coordinate
     * #### returns: integer
     * @param {window.fin.rectangular.Point} gridCell
     */
    getGridCellValue: function(gridCell) {
        return gridCell.y;
    },

    /**
     * @function
     * @instance
     * @desc return the grids x,y scroll value
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    getScrollValue: function(grid) {
        return grid.getHScrollValue();
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
        return grid.getColumnWidth(index);
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
        grid.setColumnWidth(index, value);
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
        return grid.getRenderedWidth(index);
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
        return grid.overColumnDivider(event);
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
        return this.isFirstFixedRow(grid, event);
    },

    /**
     * @function
     * @instance
     * @desc return the cursor name
     * #### returns: string
     */
    getCursorName: function() {
        return 'col-resize';
    },

    /**
     * @function
     * @instance
     * @desc handle this event
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragIndex > -2) {
            //var fixedAreaCount = this.getFixedAreaCount(grid);
            //var offset = this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
            var mouse = this.getMouseValue(event);
            var scrollValue = this.getScrollValue(grid);
            if (this.dragIndex < this.getFixedAreaCount(grid)) {
                scrollValue = 0;
            }
            var previous = this.getPreviousAbsoluteSize(grid, this.dragIndex - scrollValue);
            var distance = mouse - previous;
            this.setAreaSize(grid, this.dragIndex, distance);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @function
     * @instance
     * @desc get the width/height of a specific row/column
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {number} areaIndex - the row/column index of interest
     */
    getSize: function(grid, areaIndex) {
        return this.getAreaSize(grid, areaIndex);
    },

    /**
     * @function
     * @instance
     * @desc return the fixed area rows/columns count
     * #### returns: integer
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     */
    getOtherFixedAreaCount: function(grid) {
        return grid.getFixedRowCount();
    },

    /**
     * @function
     * @instance
     * @desc handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        var isEnabled = this.isEnabled(grid);
        var overArea = this.overAreaDivider(grid, event);
        if (isEnabled && overArea > -1 && this.isFirstFixedOtherArea(grid, event)) {
            var scrollValue = this.getScrollValue(grid);
            if (overArea < this.getFixedAreaCount(grid)) {
                scrollValue = 0;
            }
            this.dragIndex = overArea - 1 + scrollValue;
            this.dragStart = this.getMouseValue(event);
            this.dragIndexStartingSize = 0;
            this.detachChain();
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @function
     * @instance
     * @desc handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        var isEnabled = this.isEnabled(grid);
        if (isEnabled && this.dragIndex > -2) {
            this.cursor = null;
            this.dragIndex = -2;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            var self = this;
            grid.synchronizeScrollingBoundries();
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
     * @desc handle this event down the feature chain of responsibility
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (this.dragIndex > -2) {
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
     * @desc fill this in
     * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
     * @param {Object} event - the event details
     */
    checkForAreaResizeCursorChange: function(grid, event) {
        var isEnabled = this.isEnabled(grid);
        if (isEnabled && this.overAreaDivider(grid, event) > -1 && this.isFirstFixedOtherArea(grid, event)) {
            this.cursor = this.getCursorName();
        } else {
            this.cursor = null;
        }

    },

    getFixedAreaCount: function(grid) {
        var count = grid.getFixedColumnCount() + (grid.isShowRowNumbers() ? 1 : 0) + (grid.hasHierarchyColumn() ? 1 : 0);
        return count;
    },

    handleDoubleClick: function(grid, event) {
        var isEnabled = this.isEnabled(grid);
        var hasCursor = this.overAreaDivider(grid, event) > -1; //this.cursor !== null;
        var headerRowCount = grid.getHeaderRowCount();
        //var headerColCount = grid.getHeaderColumnCount();
        var gridCell = event.gridCell;
        if (isEnabled && hasCursor && (gridCell.y <= headerRowCount)) {
            grid.autosizeColumn(gridCell.x - 1);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    isEnabled: function(grid) {
        return true;
    }

});

module.exports = ColumnResizing;