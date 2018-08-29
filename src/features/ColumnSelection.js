'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnSelection = Feature.extend('ColumnSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {Point}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    currentDrag: null,

    /**
     * The horizontal cell coordinate of the where the mouse pointer is during a drag operation.
     * @type {Object}
     * @default null
     * @memberOf ColumnSelection.prototype
     */
    lastDragColumn: null,

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
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.doubleClickTimer) {
            return;
        }

        // todo: >= 5 depends on header being top-most row which is currently always true but we may allow header "section" to be arbitrary position within quadrant (see also handleMouseDown in ColumnMoving.js)
        if (
            grid.properties.columnSelection &&
            !event.primitiveEvent.detail.isRightClick &&
            (
                grid.properties.autoSelectColumns ||
                event.isHeaderCell && event.mousePoint.y >= 5
            )
        ) {
            // HOLD OFF WHILE WAITING FOR DOUBLE-CLICK
            this.doubleClickTimer = setTimeout(
                doubleClickTimerCallback.bind(this, grid, event),
                doubleClickDelay.call(this, grid, event)
            );
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (
            grid.properties.columnSelection &&
            !this.isColumnDragging(grid) &&
            !event.primitiveEvent.detail.isRightClick &&
            this.dragging
        ) {
            //if we are in the fixed area do not apply the scroll values
            this.lastDragColumn = event.gridCell.x;
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragColumn, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        var detail = event.detail,
            handler = grid.getLastSelectionType() === 'column' &&
                this['handle' + detail.char];

        if (handler) {
            handler.call(this, grid, detail);
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
    handleMouseDragCellSelection: function(grid, x, keys) {
        var mouseX = grid.getMouseDown().x;

        grid.clearMostRecentColumnSelection();

        grid.selectColumn(mouseX, x);
        grid.setDragExtent(grid.newPoint(x - mouseX, 0));

        grid.repaint();
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (
            grid.properties.scrollingEnabled &&
            grid.getDataBounds().contains(mouse)
        ) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else {
            if (!grid.isScrollingNow()) {
                grid.setScrollingNow(true);
                this.scrollDrag(grid);
            }
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

        var b = grid.getDataBounds(),
            xOffset;

        if (this.currentDrag.x < b.origin.x) {
            xOffset = -1;
        } else if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }

        if (xOffset) {
            if (this.lastDragColumn >= grid.getFixedColumnCount()) {
                this.lastDragColumn += xOffset;
            }
            grid.scrollBy(xOffset, 0);
        }

        this.handleMouseDragCellSelection(grid, this.lastDragColumn, []); // update the selection
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
    extendSelection: function(grid, x, keys) {
        if (!grid.abortEditing()) { return; }

        var mouseX = grid.getMouseDown().x,
            hasSHIFT = keys.indexOf('SHIFT') > 0;

        if (x < 0) { // outside of the grid?
            return; // do nothing
        }

        if (hasSHIFT) {
            grid.clearMostRecentColumnSelection();
            grid.selectColumn(x, mouseX);
            grid.setDragExtent(grid.newPoint(x - mouseX, 0));
        } else {
            grid.toggleSelectColumn(x, keys);
            grid.setMouseDown(grid.newPoint(x, 0));
            grid.setDragExtent(grid.newPoint(0, 0));
        }

        grid.repaint();
    },


    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUPSHIFT: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFTSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleRIGHTSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1);
    },

    /**
     * @memberOf ColumnSelection.prototype
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
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid) {},

    /**
     * @memberOf ColumnSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleLEFT: function(grid) {
        this.moveSingleSelect(grid, -1);
    },

    /**
     * @memberOf ColumnSelection.prototype
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
        var elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
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
        var origin = grid.getMouseDown(),
            extent = grid.getDragExtent(),
            newX = extent.x + offsetX,
            maxViewableColumns = grid.renderer.visibleColumns.length - 1,
            maxColumns = grid.getColumnCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

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
        var extent = grid.getDragExtent(),
            mouseCorner = grid.getMouseDown().plus(extent),
            newX = mouseCorner.x + offsetX,
            maxColumns = grid.getColumnCount() - 1,
            maxViewableColumns = grid.getVisibleColumnsCount() - 1;

        if (!grid.properties.scrollingEnabled) {
            maxColumns = Math.min(maxColumns, maxViewableColumns);
        }

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
        return dragger && (dragger.dragging || dragger.dragArmed); //&& !this.dragging;
    }

});

function doubleClickDelay(grid, event) {
    var columnProperties;

    return (
        event.isHeaderCell &&
        !(columnProperties = event.columnProperties).unsortable &&
        columnProperties.sortOnDoubleClick &&
        300
    );
}

function doubleClickTimerCallback(grid, event) {
    this.doubleClickTimer = undefined;
    this.dragging = true;
    this.extendSelection(grid, event.gridCell.x, event.primitiveEvent.detail.keys);
}

module.exports = ColumnSelection;
