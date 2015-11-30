'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 */
var ColumnResizing = Feature.extend('ColumnResizing', {

    alias: 'ColumnResizing',

    /**
     * the index of the column wall were currently dragging
     * @type {number}
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
    dragIndex: -2,

    /**
     * the pixel location of the where the drag was initiated
     * @type {number}
     * @default -1
     * @memberOf ColumnResizing.prototype
     */
    dragStart: -1,

    /**
     * the starting width/height of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf ColumnResizing.prototype
     */
    dragIndexStartingSize: -1,

    /**
     * @memberOf ColumnResizing.prototype
     * @desc get the mouse x,y coordinate
     * @returns {number}
     * @param {MouseEvent} event - the mouse event to query
     */
    getMouseValue: function(event) {
        return event.primitiveEvent.detail.mouse.x;
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc get the grid cell x,y coordinate
     * @returns {number}
     * @param {window.fin.rectangular.Point} gridCell
     */
    getGridCellValue: function(gridCell) {
        return gridCell.y;
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the grids x,y scroll value
     * @returns {number}
     * @param {Hypergrid} grid
     */
    getScrollValue: function(grid) {
        return grid.getHScrollValue();
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the width/height of the row/column of interest
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {number} index - the row/column index of interest
     */
    getAreaSize: function(grid, index) {
        return grid.getColumnWidth(index);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc set the width/height of the row/column at index
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {number} index - the row/column index of interest
     * @param {number} value - the width/height to set to
     */
    setAreaSize: function(grid, index, value) {
        grid.setColumnWidth(index, value);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the recently rendered area's width/height
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {number} index - the row/column index of interest
     */
    getPreviousAbsoluteSize: function(grid, index) {
        return grid.getRenderedWidth(index);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc returns the index of which divider I'm over
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {
        return grid.overColumnDivider(event);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc am I over the column/row area
     * @returns {boolean}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedOtherArea: function(grid, event) {
        return this.isFirstFixedRow(grid, event);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the cursor name
     * @returns {string}
     */
    getCursorName: function() {
        return 'col-resize';
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
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
     * @memberOf ColumnResizing.prototype
     * @desc get the width/height of a specific row/column
     * @param {Hypergrid} grid
     * @param {number} areaIndex - the row/column index of interest
     */
    getSize: function(grid, areaIndex) {
        return this.getAreaSize(grid, areaIndex);
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc return the fixed area rows/columns count
     * @returns {number}
     * @param {Hypergrid} grid
     */
    getOtherFixedAreaCount: function(grid) {
        return grid.getFixedRowCount();
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
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
     * @memberOf ColumnResizing.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
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
     * @memberOf ColumnResizing.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
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
     * @memberOf ColumnResizing.prototype
     * @desc fill this in
     * @param {Hypergrid} grid
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

    /**
     * @param {Hypergrid} grid
     * @returns {number}
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
    getFixedAreaCount: function(grid) {
        var count = grid.getFixedColumnCount() + (grid.isShowRowNumbers() ? 1 : 0) + (grid.hasHierarchyColumn() ? 1 : 0);
        return count;
    },

    /**
     * @param {Hypergrid} grid
     * @param event
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
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

    /**
     * @param {Hypergrid} grid
     * @returns {boolean}
     * @default -2
     * @memberOf ColumnResizing.prototype
     */
    isEnabled: function(grid) {
        return true;
    }

});

module.exports = ColumnResizing;
