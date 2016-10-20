'use strict';

var Feature = require('./Feature.js');

/**
 * Extra msecs to avoid race condition with fincanvas's double click timer.
 * @type {number}
 * @defaultvalue 50
 * NOTE: 50 msecs seems to work well. 10 and even 25 proved insufficient in Chrome.
 * @private
 */
var RACE_TIME = 50;

/**
 * @constructor
 * @extends Feature
 */
var ColumnSelection = Feature.extend('ColumnSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {window.fin.rectangular.Point}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    currentDrag: null,

    /**
     * The cell coordinates of the where the mouse pointer is during a drag operation.
     * @type {Object}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    lastDragCell: null,

    /**
     * a millisecond value representing the previous time an autoscroll started
     * @type {number}
     * @default 0
     * @memberOf ColumnSelection.prototype
     */
    sbLastAuto: 0,

    /**
     * a millisecond value representing the time the current autoscroll started
     * @type {number}
     * @default 0
     * @memberOf ColumnSelection.prototype
     */
    sbAutoStart: 0,


    /**
     * @memberOf ColumnSelection.prototype
     * @desc Handle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    handleDoubleClick: function(grid, event) {
        if (this.doubleClickTimer) {
            clearTimeout(this.doubleClickTimer); // prevent mouseDown from continuing
            this.doubleClickTimer = undefined;
        }
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc * @desc Handle this event down the feature chain of responsibility.
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.doubleClickTimer) {
            return;
        }

        if ((!grid.isColumnSelection() || event.mousePoint.y < 5) && this.next) {
            this.next.handleMouseDown(grid, event);
            return;
        }

        var isRightClick = event.primitiveEvent.detail.isRightClick;
        var cell = event.gridCell;
        var viewCell = event.viewPoint;
        var dx = cell.x;
        var dy = cell.y;

        var isHeader = grid.isShowHeaderRow() && dy === 0 && dx !== -1;

        if (isRightClick || !isHeader) {
            if (this.next) {
                this.next.handleMouseDown(grid, event);
            }
        } else {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this.doubleClickTimer = setTimeout(function() {
                this.doubleClickTimer = undefined;
                var numFixedColumns = grid.getFixedColumnCount();

                //if we are in the fixed area do not apply the scroll values
                //check both x and y values independently
                if (viewCell.x < numFixedColumns) {
                    dx = viewCell.x;
                }

                var dCell = grid.newPoint(dx, 0);

                var primEvent = event.primitiveEvent;
                var keys = primEvent.detail.keys;
                this.dragging = true;
                this.extendSelection(grid, dCell, keys);
            }.bind(this), grid.properties.doubleClickDelay + RACE_TIME);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {

        if ((!grid.isColumnSelection() || this.isColumnDragging(grid)) && this.next) {
            this.next.handleMouseDrag(grid, event);
            return;
        }

        var isRightClick = event.primitiveEvent.detail.isRightClick;

        if (isRightClick || !this.dragging) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
        } else {

            var numFixedColumns = grid.getFixedColumnCount();

            var cell = event.gridCell;
            var viewCell = event.viewPoint;
            var dx = cell.x;
            var dy = cell.y;

            //if we are in the fixed area do not apply the scroll values
            //check both x and y values independently
            if (viewCell.x < numFixedColumns) {
                dx = viewCell.x;
            }

            var dCell = grid.newPoint(dx, dy);

            var primEvent = event.primitiveEvent;
            this.currentDrag = primEvent.detail.mouse;
            this.lastDragCell = dCell;

            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, dCell, primEvent.detail.keys);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        var handler;
        if (
            grid.getLastSelectionType() === 'column' &&
            (handler = this['handle' + event.detail.char])
        ) {
            handler.call(this, grid, event.detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Handle a mousedrag selection
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection: function(grid, gridCell, keys) {
        var x = gridCell.x;
        //            var previousDragExtent = grid.getDragExtent();
        var mouseDown = grid.getMouseDown();

        var newX = x - mouseDown.x;
        //var newY = y - mouseDown.y;

        // if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
        //     return;
        // }

        grid.clearMostRecentColumnSelection();

        grid.selectColumn(mouseDown.x, x);
        grid.setDragExtent(grid.newPoint(newX, 0));

        grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }
        var b = grid.getDataBounds();
        var inside = b.contains(mouse);
        if (inside) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else if (!grid.isScrollingNow()) {
            grid.setScrollingNow(true);
            this.scrollDrag(grid);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we srcroll accordingly
     * @param {Hypergrid} grid
     */
    scrollDrag: function(grid) {

        if (!grid.isScrollingNow()) {
            return;
        }

        var lastDragCell = this.lastDragCell;
        var b = grid.getDataBounds();
        var xOffset = 0;
        var yOffset = 0;

        var numFixedColumns = grid.getFixedColumnCount();
        var numFixedRows = grid.getFixedRowCount();

        var dragEndInFixedAreaX = lastDragCell.x < numFixedColumns;
        var dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        }

        if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }

        var dragCellOffsetX = xOffset;
        var dragCellOffsetY = yOffset;

        if (dragEndInFixedAreaX) {
            dragCellOffsetX = 0;
        }

        if (dragEndInFixedAreaY) {
            dragCellOffsetY = 0;
        }

        this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
        grid.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc extend a selection or create one if there isnt yet
     * @param {Hypergrid} grid
     * @param {Object} gridCell - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection: function(grid, gridCell, keys) {
        grid.stopEditing();
        //var hasCTRL = keys.indexOf('CTRL') !== -1;
        var hasSHIFT = keys.indexOf('SHIFT') !== -1;

        // var scrollTop = grid.getVScrollValue();
        // var scrollLeft = grid.getHScrollValue();

        // var numFixedColumns = 0;//grid.getFixedColumnCount();
        // var numFixedRows = 0;//grid.getFixedRowCount();

        var mousePoint = grid.getMouseDown();
        var x = gridCell.x; // - numFixedColumns + scrollLeft;
        var y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        //we have repeated a click in the same spot deslect the value from last time
        // if (mousePoint && x === mousePoint.x && y === mousePoint.y) {
        //     grid.clearSelections();
        //     grid.popMouseDown();
        //     grid.repaint();
        //     return;
        // }

        // if (!hasCTRL && !hasSHIFT) {
        //     grid.clearSelections();
        // }

        if (hasSHIFT) {
            grid.clearMostRecentColumnSelection();
            grid.selectColumn(x, mousePoint.x);
            grid.setDragExtent(grid.newPoint(x - mousePoint.x, 0));
        } else {
            grid.toggleSelectColumn(x, keys);
            grid.setMouseDown(grid.newPoint(x, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }
        grid.repaint();
    },


    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUPSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFTSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHTSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDOWN: function(grid) {

        // var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());
        // var maxRows = grid.getRowCount() - 1;

        // var newX = mouseCorner.x;
        // var newY = grid.getHeaderRowCount() + grid.getVScrollValue();

        // newY = Math.min(maxRows, newY);

        // grid.clearSelections();
        // grid.select(newX, newY, 0, 0);
        // grid.setMouseDown(new grid.rectangular.Point(newX, newY));
        // grid.setDragExtent(new grid.rectangular.Point(0, 0));

        // grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFT: function(grid) {
        this.moveSingleSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc handle this event
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHT: function(grid) {
        this.moveSingleSelect(grid, 1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     * #### returns: integer
     */
    getAutoScrollAcceleration: function() {
        var count = 1;
        var elapsed = this.getAutoScrollDuration() / 2000;
        count = Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
        return count;
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime: function() {
        this.sbAutoStart = Date.now();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll: function() {
        var now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc answer how long we have been auto scrolling
     * #### returns: integer
     */
    getAutoScrollDuration: function() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveShiftSelect: function(grid, offsetX) {

        var maxColumns = grid.getColumnCount() - 1;

        var maxViewableColumns = grid.getVisibleColumns() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        var origin = grid.getMouseDown();
        var extent = grid.getDragExtent();

        var newX = extent.x + offsetX;
        //var newY = grid.getRowCount();

        newX = Math.min(maxColumns - origin.x, Math.max(-origin.x, newX));

        grid.clearMostRecentColumnSelection();
        grid.selectColumn(origin.x, origin.x + newX);

        grid.setDragExtent(grid.newPoint(newX, 0));

        if (grid.insureModelColIsVisible(newX + origin.x, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();

    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc Replace the most recent selection with a single cell selection that is moved (offsetX,offsetY) from the previous selection extent.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveSingleSelect: function(grid, offsetX) {

        var maxColumns = grid.getColumnCount() - 1;

        var maxViewableColumns = grid.getVisibleColumnsCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

        var mouseCorner = grid.getMouseDown().plus(grid.getDragExtent());

        var newX = mouseCorner.x + offsetX;
        //var newY = grid.getRowCount();

        newX = Math.min(maxColumns, Math.max(0, newX));

        grid.clearSelections();
        grid.selectColumn(newX);
        grid.setMouseDown(grid.newPoint(newX, 0));
        grid.setDragExtent(grid.newPoint(0, 0));

        if (grid.insureModelColIsVisible(newX, offsetX)) {
            this.pingAutoScroll();
        }

        grid.repaint();

    },

    isColumnDragging: function(grid) {
        var dragger = grid.lookupFeature('ColumnMoving');
        if (!dragger) {
            return false;
        }
        var isActivated = dragger.dragging && !this.dragging;
        return isActivated;
    }

});

module.exports = ColumnSelection;
