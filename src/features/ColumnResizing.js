'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnResizing = Feature.extend('ColumnResizing', {

    /**
     * the pixel location of the where the drag was initiated
     * @type {number}
     * @default
     * @memberOf ColumnResizing.prototype
     */
    dragStart: -1,

    /**
     * the starting width/height of the row/column we are dragging
     * @type {number}
     * @default -1
     * @memberOf ColumnResizing.prototype
     */
    dragStartWidth: -1,

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
     * @desc returns the index of which divider I'm over
     * @returns {number}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {
        var leftMostColumnIndex = grid.behavior.leftMostColIndex;
        return event.gridCell.x !== leftMostColumnIndex && event.mousePoint.x <= 3 ||
            event.mousePoint.x >= event.bounds.width - 3;
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
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragColumn) {
            var delta = this.getMouseValue(event) - this.dragStart,
                dragWidth = this.dragStartWidth + delta,
                nextWidth = this.nextStartWidth - delta;
            if (!this.nextColumn) { // nextColumn et al instance vars defined when resizeColumnInPlace (by handleMouseDown)
                grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
            } else {
                var np = this.nextColumn.properties, dp = this.dragColumn.properties;
                if (
                    0 < delta && delta <= (this.nextStartWidth - np.minimumColumnWidth) &&
                    (!dp.maximumColumnWidth || dragWidth <= dp.maximumColumnWidth)
                    ||
                    0 > delta && delta >= -(this.dragStartWidth - dp.minimumColumnWidth) &&
                    (!np.maximumColumnWidth || nextWidth < np.maximumColumnWidth)
                ) {
                    grid.behavior.setColumnWidth(this.dragColumn, dragWidth);
                    grid.behavior.setColumnWidth(this.nextColumn, nextWidth);
                }
            }
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            var gridColumnIndex = event.gridCell.x;

            if (event.mousePoint.x <= 3) {
                gridColumnIndex -= 1;
                var vc = grid.renderer.visibleColumns[gridColumnIndex] ||
                    grid.renderer.visibleColumns[gridColumnIndex - 1]; // get row number column if tree column undefined
                if (vc) {
                    this.dragColumn = vc.column;
                    this.dragStartWidth = vc.width;
                } else {
                    return; // can't drag left-most column boundary
                }
            } else {
                this.dragColumn = event.column;
                this.dragStartWidth = event.bounds.width;
            }

            this.dragStart = this.getMouseValue(event);

            if (this.dragColumn.properties.resizeColumnInPlace) {
                gridColumnIndex += 1;
                vc = grid.renderer.visibleColumns[gridColumnIndex] ||
                    grid.renderer.visibleColumns[gridColumnIndex + 1]; // get first data column if tree column undefined;
                if (vc) {
                    this.nextColumn = vc.column;
                    this.nextStartWidth = this.nextColumn.getWidth();
                } else {
                    this.nextColumn = undefined;
                }
            } else {
                this.nextColumn = undefined; // in case resizeColumnInPlace was previously on but is now off
            }
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragColumn) {
            this.cursor = null;
            this.dragColumn = false;

            event.primitiveEvent.stopPropagation();
            //delay here to give other events a chance to be dropped
            grid.behaviorShapeChanged();
        } else if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (!this.dragColumn) {
            this.cursor = null;

            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }

            this.cursor = event.isHeaderRow && this.overAreaDivider(grid, event) ? this.getCursorName() : null;
        }
    },

    /**
     * @param {Hypergrid} grid
     * @param {CellEvent} cellEvent
     * @memberOf ColumnResizing.prototype
     */
    handleDoubleClick: function(grid, event) {
        if (event.isHeaderRow && this.overAreaDivider(grid, event)) {
            var column = event.mousePoint.x <= 3
                ? grid.behavior.getActiveColumn(event.gridCell.x - 1)
                : event.column;
            column.addProperties({
                columnAutosizing: true,
                columnAutosized: false // todo: columnAutosizing should be a setter that automatically resets columnAutosized on state change to true
            });
            setTimeout(function() { // do after next render, which measures text now that auto-sizing is on
                grid.autosizeColumn(column);
            });
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    }

});

module.exports = ColumnResizing;
