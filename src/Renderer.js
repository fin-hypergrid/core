/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var _ = require('object-iterators');
var Base = require('extend-me').Base;

/**
 * @constructor
 * @desc fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.
 *
 * It relies on two other external subprojects
 *
 * 1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
 * 2. rectangular: a small npm module providing Point and Rectangle objects
 *
 * The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
 * Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.
 *
 * Instances of this object have basically four main functions.
 *
 * 1. render fixed row headers
 * 2. render fixed col headers
 * 3. render main data cells
 * 4. render grid lines
 *
 * Same parameters as {@link Renderer#initialize|initialize}, which is called by this constructor.
 *
 */
var Renderer = Base.extend('Renderer', {

    //the shared single item "pooled" cell object for drawing each cell
    cell: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },

    scrollHeight: 0,

    viewHeight: 0,

    reset: function() {
        this.bounds = {
            width:0,
            height:0
        };
        this.columnEdges = [];
        this.columnEdgesIndexMap = {};
        this.renderedColumnMinWidths = [];
        this.renderedHeight = 0;
        this.rowEdges = [];
        this.rowEdgesIndexMap = {};
        this.visibleColumns = [];
        this.visibleRows = [];
        this.insertionBounds = [];
    },

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     * @memberOf Renderer.prototype
     */
    initialize: function(grid) {
        this.grid = grid;
        this.bounds = {
            width:0,
            height:0
        };
        this.columnEdges = [];
        this.columnEdgesIndexMap = {};
        this.renderedColumnMinWidths = [];
        this.renderedHeight = 0;
        this.rowEdges = [];
        this.rowEdgesIndexMap = {};
        this.visibleColumns = [];
        this.visibleRows = [];
        this.insertionBounds = [];
    },

    //this function computes the grid coordinates used for extremely fast iteration over
    //painting the grid cells. this function is very fast, for thousand rows X 100 columns
    //on a modest machine taking usually 0ms and no more that 3 ms.
    computeCellsBounds: function() {

        //var startTime = Date.now();

        var grid = this.getGrid();
        var scrollTop = this.getScrollTop();
        var scrollLeft = this.getScrollLeft();

        var numColumns = this.getColumnCount();
        var numFixedColumns = this.getFixedColumnCount();

        var numRows = this.getRowCount();
        var numFixedRows = this.getFixedRowCount();

        var bounds = this.getBounds();
        var viewWidth = bounds.width;

        //we must be in bootstrap
        if (viewWidth === 0) {
            //viewWidth = grid.sbHScroller.getClientRects()[0].width;
            viewWidth = grid.canvas.width;
        }
        var viewHeight = bounds.height;

        var x, y, c, r, vx, vy, width, height;

        this.getColumnEdges().length = 0;
        this.rowEdges.length = 0;

        this.columnEdges[0] = 0;
        this.rowEdges[0] = 0;
        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;
        this.columnEdgesIndexMap = {};
        this.rowEdgesIndexMap = {};

        this.insertionBounds = [];
        var insertionBoundsCursor = 0;
        var previousInsertionBoundsCursorValue = 0;

        x = 0;
        var start = 0;
        var firstVX, lastVX;
        var firstVY, lastVY;
        if (grid.isShowRowNumbers()) {
            start--;
            this.columnEdges[-1] = -1;
        }
        for (c = start; c < numColumns; c++) {
            vx = c;
            if (c >= numFixedColumns) {
                vx = vx + scrollLeft;
                if (firstVX === undefined) {
                    firstVX = vx;
                }
                lastVX = vx;
            }
            if (x > viewWidth || numColumns <= vx) {
                break;
            }
            width = this.getColumnWidth(vx);
            x = x + width;
            this.columnEdges[c + 1] = Math.round(x);
            this.visibleColumns[c] = vx;
            this.columnEdgesIndexMap[vx] = c;

            insertionBoundsCursor = insertionBoundsCursor + Math.round(width / 2) + previousInsertionBoundsCursorValue;
            this.insertionBounds.push(insertionBoundsCursor);
            previousInsertionBoundsCursorValue = Math.round(width / 2);
        }

        y = 0;
        for (r = 0; r < numRows; r++) {
            vy = r;
            if (r >= numFixedRows) {
                vy = vy + scrollTop;
                if (firstVY === undefined) {
                    firstVY = vy;
                }
                lastVY = vy;
            }
            if (y > viewHeight || numRows <= vy) {
                break;
            }
            height = this.getRowHeight(vy);
            y = y + height;
            this.rowEdges[r + 1] = Math.round(y);
            this.visibleRows[r] = vy;
            this.rowEdgesIndexMap[vy] = r;
        }
        this.viewHeight = viewHeight;
        this.dataWindow = grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {Object} a property value at a key, delegates to the grid
     */
    resolveProperty: function(key) {
        return this.getGrid().resolveProperty(key);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {Hypergrid} grid
     */
    getGrid: function() {
        return this.grid;
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Notify the fin-hypergrid everytime we've repainted.
     * @desc This is the entry point from fin-canvas.
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    _paint: function(gc) {
        if (this.grid) {
            this.renderGrid(gc);
            this.getGrid().gridRenderedNotification();
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Answer how many rows we rendered
     */
    getVisibleRowsCount: function() {
        return this.visibleRows.length - 1;
    },

    getVisibleScrollHeight: function() {
        var grid = this.getGrid(),
            frh = grid.getFixedRowsHeight();

        return this.viewHeight - frh;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number[]} Rows we just rendered.
     */
    getVisibleRows: function() {
        return this.visibleRows;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Numer of columns we just rendered.
     */
    getVisibleColumnsCount: function() {
        return this.visibleColumns.length - 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Columns we just rendered.
     */
    getVisibleColumns: function() {
        return this.visibleColumns;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The column index whne the mouseEvent coordinates are over a column divider.
     */
    overColumnDivider: function(x) {
        x = Math.round(x);
        var edges = this.getColumnEdges();
        var whichCol = edges.indexOf(x - 1);
        if (whichCol < 0) {
            whichCol = edges.indexOf(x);
        }
        if (whichCol < 0) {
            whichCol = edges.indexOf(x - 2);
        }
        if (whichCol < 0) {
            whichCol = edges.indexOf(x + 1);
        }
        if (whichCol < 0) {
            whichCol = edges.indexOf(x - 3);
        }

        return whichCol;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row index when the mouseEvent coordinates are over a row divider.
     */
    overRowDivider: function(y) {
        y = Math.round(y);
        var which = this.rowEdges.indexOf(y + 1);
        if (which < 0) {
            which = this.rowEdges.indexOf(y);
        }
        if (which < 0) {
            which = this.rowEdges.indexOf(y - 1);
        }
        return which;
    },

    /**
     * @memberOf Renderer.prototype
     * @param {Point} cell
     * @returns {Rectangle} Bounding rect of the given `cell`.
     */
    getBoundsOfCell: function(cell) {
        return this._getBoundsOfCell(cell.x, cell.y);
    },

    /**
     * @memberOf Renderer.prototype
     * @param {number} c - The horizontal coordinate.
     * @param {number} r - The vertical coordinate.
     * @returns {Rectangle} Bounding rect of cell with the given coordinates.
     */
    _getBoundsOfCell: function(c, r) {
        var xOutside = false;
        var yOutside = false;
        var columnEdges = this.getColumnEdges();
        var rowEdges = this.getRowEdges();

        var x = this.columnEdgesIndexMap[c];
        var y = this.rowEdgesIndexMap[r];
        if (x === undefined) {
            x = this.columnEdgesIndexMap[c - 1];
            xOutside = true;
        }

        if (y === undefined) {
            y = this.rowEdgesIndexMap[r - 1];
            yOutside = true;
        }

        var ox = columnEdges[x],
            oy = rowEdges[y],
            cx = columnEdges[x + 1],
            cy = rowEdges[y + 1],
            ex = cx - ox,
            ey = cy - oy;

        var cell = this.cell;
        cell.x = xOutside ? cx : ox;
        cell.y = yOutside ? cy : oy;
        cell.width = xOutside ? 0 : ex;
        cell.height = yOutside ? 0 : ey;

        return cell;

    },

    /**
     * @memberOf Renderer.prototype
     * @desc answer the column index under the coordinate at pixelX
     * @param {number} pixelX - The horizontal coordinate.
     * @returns {number} The column index under the coordinate at pixelX.
     */
    getColumnFromPixelX: function(pixelX) {
        var width = 0;
        var grid = this.getGrid();
        var fixedColumnCount = this.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();
        var c;
        var edges = this.getColumnEdges();
        for (c = 1; c < edges.length - 1; c++) {
            width = edges[c] - (edges[c] - edges[c - 1]) / 2;
            if (pixelX < width) {
                if (c > fixedColumnCount) {
                    c = c + scrollLeft;
                }
                return c - 1;
            }
        }
        if (c > fixedColumnCount) {
            c = c + scrollLeft;
        }
        return c - 1;
    },


    /**
     * @memberOf Renderer.prototype
     * @desc Answer specific data cell coordinates given mouse coordinates in pixels.
     * @param {Point} point
     * @returns {Point} Cell coordinates
     */
    getGridCellFromMousePoint: function(point) {

        var grid = this.getGrid();
        var behavior = grid.getBehavior();
        var width = 0;
        var height = 0;
        var x, y, c, r;
        var previous = 0;
        var columnEdges = this.getColumnEdges();
        var fixedColumnCount = this.getFixedColumnCount(); // + gridSize;
        var fixedRowCount = this.getFixedRowCount();

        // var fixedColumnCount = this.getFixedColumnCount();
        // var fixedRowCount = this.getFixedRowCount();
        var scrollX = this.getScrollLeft();
        var scrollY = this.getScrollTop();

        for (c = 0; c < columnEdges.length; c++) {
            width = columnEdges[c];
            if (point.x < width) {
                x = Math.max(0, point.x - previous - 2);
                break;
            }
            previous = width;
        }
        c--;
        previous = 0;
        for (r = 0; r < this.rowEdges.length; r++) {
            height = this.rowEdges[r];
            if (point.y < height) {
                y = Math.max(0, point.y - previous - 2);
                break;
            }
            previous = height;
        }
        r--;
        if (point.x < 0) {
            c = -1;
        }
        if (point.y < 0) {
            r = -1;
        }

        var viewPoint = grid.newPoint(c, r);

        //compensate if we are scrolled
        if (c >= fixedColumnCount) {
            c = c + scrollX;
        }
        if (r >= fixedRowCount) {
            r = r + scrollY;
        }

        var translatedIndex = -1;

        var column = behavior.getColumn(c);
        if (column) {
            translatedIndex = column.index;
        }

        return {
            gridCell: grid.newPoint(c, r),
            mousePoint: grid.newPoint(x, y),
            viewPoint: viewPoint,
            dataCell: grid.newPoint(translatedIndex, r),
        };
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines if a column is visible.
     * @param {number} colIndex - the column index*
     * @returns {boolean} The given column is fully visible.
     */
    isColumnVisible: function(colIndex) {
        var isVisible = this.visibleColumns.indexOf(colIndex) !== -1;
        return isVisible;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The width x coordinate of the last rendered column
     */
    getFinalVisableColumnBoundry: function() {
        var isMaxX = this.isLastColumnVisible();
        var chop = isMaxX ? 2 : 1;
        var colWall = this.getColumnEdges()[this.getColumnEdges().length - chop];
        var result = Math.min(colWall, this.getBounds().width - 200);
        return result;
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines visibility of a row.
     * @param {number} rowIndex - the row index
     * @returns {boolean} The given row is fully visible.
     */
    isRowVisible: function(rowIndex) {
        var isVisible = this.visibleRows.indexOf(rowIndex) !== -1;
        return isVisible;
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines if a cell is selected.
     * @param {number} x - the x cell coordinate
     * @param {number} y - the y cell coordinate*
     * @returns {boolean} The given cell is fully visible.
     */
    isSelected: function(x, y) {
        return this.getGrid().isSelected(x, y);
    },

    /**
     * @memberOf Renderer.prototype
     * @desc This is the main forking of the renderering task.
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    renderGrid: function(gc) {
        gc.beginPath();

        this.paintCells(gc);
        this.paintGridlines(gc);
        //this.blankOutOverflow(gc); // no longer needed
        this.renderOverrides(gc);
        this.renderFocusCell(gc);
        gc.closePath();
    },

    focusLineStep: [
        [5, 5],
        [0, 1, 5, 4],
        [0, 2, 5, 3],
        [0, 3, 5, 2],
        [0, 4, 5, 1],
        [0, 5, 5, 0],
        [1, 5, 4, 0],
        [2, 5, 3, 0],
        [3, 5, 2, 0],
        [4, 5, 1, 0]
    ],

    renderFocusCell: function(gc) {
        gc.beginPath();
        this._renderFocusCell(gc);
        gc.closePath();
    },

    _renderFocusCell: function(gc) {

        var grid = this.getGrid();
        var selections = grid.getSelectionModel().getSelections();
        if (!selections || selections.length === 0) {
            return;
        }
        var selection = selections[selections.length - 1];
        var mouseDown = selection.origin;
        if (mouseDown.x === -1) {
            //no selected area, lets exit
            return;
        }

        var visibleColumns = this.getVisibleColumns();
        var visibleRows = this.getVisibleRows();
        var lastVisibleColumn = visibleColumns[visibleColumns.length - 1];
        var lastVisibleRow = visibleRows[visibleRows.length - 1];

        var extent = selection.extent;

        var dpOX = Math.min(mouseDown.x, mouseDown.x + extent.x);
        var dpOY = Math.min(mouseDown.y, mouseDown.y + extent.y);

        //lets check if our selection rectangle is scrolled outside of the visible area
        if (dpOX > lastVisibleColumn) {
            return; //the top of our rectangle is below visible
        }
        if (dpOY > lastVisibleRow) {
            return; //the left of our rectangle is to the right of being visible
        }

        var dpEX = Math.max(mouseDown.x, mouseDown.x + extent.x) + 1;
        dpEX = Math.min(dpEX, 1 + lastVisibleColumn);

        var dpEY = Math.max(mouseDown.y, mouseDown.y + extent.y) + 1;
        dpEY = Math.min(dpEY, 1 + lastVisibleRow);

        var o = this._getBoundsOfCell(dpOX, dpOY);
        var ox = Math.round((o.x === undefined) ? grid.getFixedColumnsWidth() : o.x);
        var oy = Math.round((o.y === undefined) ? grid.getFixedRowsHeight() : o.y);
        // var ow = o.width;
        // var oh = o.height;
        var e = this._getBoundsOfCell(dpEX, dpEY);
        var ex = Math.round((e.x === undefined) ? grid.getFixedColumnsWidth() : e.x);
        var ey = Math.round((e.y === undefined) ? grid.getFixedRowsHeight() : e.y);
        // var ew = e.width;
        // var eh = e.height;
        var x = Math.min(ox, ex);
        var y = Math.min(oy, ey);
        var width = 1 + ex - ox;
        var height = 1 + ey - oy;
        if (x === ex) {
            width = ox - ex;
        }
        if (y === ey) {
            height = oy - ey;
        }
        if (width * height < 1) {
            //if we are only a skinny line, don't render anything
            return;
        }

        gc.rect(x, y, width, height);
        gc.fillStyle = this.resolveProperty('selectionRegionOverlayColor');
        gc.fill();
        gc.lineWidth = 1;
        gc.strokeStyle = this.resolveProperty('selectionRegionOutlineColor');

        // animate the dashed line a bit here for fun

        gc.stroke();

        //gc.rect(x, y, width, height);

        //gc.strokeStyle = 'white';

        // animate the dashed line a bit here for fun
        //gc.setLineDash(this.focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % this.focusLineStep.length]);

        //gc.stroke();
    },


    /**
     * @memberOf Renderer.prototype
     * @desc Paint the background color over the overflow from the final column paint
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    blankOutOverflow: function(gc) {
        var isMaxX = this.isLastColumnVisible();
        var chop = isMaxX ? 1 : 0;
        var x = this.getColumnEdges()[this.getColumnEdges().length - chop];
        var bounds = this.getBounds();
        var width = bounds.width - 200 - x;
        var height = bounds.height;
        gc.fillStyle = this.resolveProperty('backgroundColor2');
        gc.fillRect(x + 1, 0, width, height);
    },

    /**
     * @memberOf Renderer.prototype
     * @desc iterate the renderering overrides and manifest each
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    renderOverrides: function(gc) {
        var grid = this.getGrid();
        var cache = grid.renderOverridesCache;
        for (var key in cache) {
            if (cache.hasOwnProperty(key)) {
                var override = cache[key];
                if (override) {
                    this.renderOverride(gc, override);
                }
            }
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @desc copy each overrides specified area to it's target and blank out the source area
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     * @param {OverrideObject} override - an object with details contain an area and a target context
     */
    renderOverride: function(gc, override) {
        //lets blank out the drag row
        var hdpiRatio = override.hdpiratio;
        //var edges = this.getColumnEdges();
        var startX = override.startX; //hdpiRatio * edges[override.columnIndex];
        var width = override.width + 1;
        var height = override.height;
        var targetCTX = override.ctx;
        var imgData = gc.getImageData(startX, 0, Math.round(width * hdpiRatio), Math.round(height * hdpiRatio));
        targetCTX.putImageData(imgData, 0, 0);
        gc.fillStyle = this.resolveProperty('backgroundColor2');
        gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} mouse is currently over cell x, y
     * @param {number} offsetX - x coordinate
     * @param {number} offsetY - y coordinate
     */
    isHovered: function(x, y) {
        return this.getGrid().isHovered(x, y);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} mouse is currently over row y
     * @param {number} offsetY - y coordinate
     */
    isRowHovered: function(y) {
        return this.getGrid().isRowHovered(y);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} mouse is currently over column x
     * @param {number} offsetX - x coordinate
     */
    isColumnHovered: function(x) {
        return this.getGrid().isColumnHovered(x);
    },

    /**
     * @memberOf Renderer.prototype
     * @param {number} colIndex
     * @returns {boolean} The given column within the fixed row area is selected.
     */
    isCellSelectedInRow: function(colIndex) {
        return this.getGrid().isCellSelectedInRow(colIndex);
    },

    /**
     * @memberOf Renderer.prototype
     * @param {number} rowIndex
     * @returns {boolean} The given row within the fixed column area is selected.
     */
    isCellSelectedInColumn: function(rowIndex) {
        return this.getGrid().isCellSelectedInColumn(rowIndex);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current vertical scroll value.
     */
    getScrollTop: function() {
        var st = this.getGrid().getVScrollValue();
        return st;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current horizontal scroll value.
     */
    getScrollLeft: function() {
        var st = this.getGrid().getHScrollValue();
        return st;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {Behavior}
     */
    getBehavior: function() {
        return this.getGrid().getBehavior();
    },

    getColumnEdges: function() {
        return this.columnEdges;
    },

    getRowEdges: function() {
        return this.rowEdges;
    },
    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row height of the row at index rowIndex
     * @param {number} rowIndex
     */
    getRowHeight: function(rowIndex) {
        var height = this.getBehavior().getRowHeight(rowIndex);
        return height;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The columnWidth of the column at index columnIndex
     * @param {number} columnIndex
     */
    getColumnWidth: function(columnIndex) {
        var width = this.getGrid().getColumnWidth(columnIndex);
        return width;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} The last col was rendered (is visible)
     */
    isLastColumnVisible: function() {
        var lastColumnIndex = this.getColumnCount() - 1;
        var isMax = this.visibleColumns.indexOf(lastColumnIndex) !== -1;
        return isMax;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered column width at index
     */
    getRenderedWidth: function(index) {
        return this.getColumnEdges()[index];
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered row height at index
     */
    getRenderedHeight: function(index) {
        return this.rowEdges[index];
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {fin-canvas} my [fin-canvas](https://github.com/stevewirts/fin-canvas)
     */
    getCanvas: function() {
        return this.getGrid().getCanvas();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} User is currently dragging a column for reordering.
     */
    isDraggingColumn: function() {
        return this.getGrid().isDraggingColumn();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to goto for a page up.
     */
    getPageUpRow: function() {
        var behavior = this.getBehavior();
        var scrollHeight = this.getVisibleScrollHeight();
        var headerRows = this.getGrid().getFixedRowCount();
        var top = this.dataWindow.origin.y - headerRows;
        var scanHeight = 0;
        while (scanHeight < scrollHeight && top > -1) {
            scanHeight = scanHeight + behavior.getRowHeight(top);
            top--;
        }
        return top + 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to goto for a page down.
     */
    getPageDownRow: function() {
        var headerRows = this.getGrid().getFixedRowCount();
        var rowNum = this.dataWindow.corner.y - headerRows - 1;
        return rowNum;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of columns.
     */
    getColumnCount: function() {
        return this.getGrid().getColumnCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of rows.
     */
    getRowCount: function() {
        return this.getGrid().getRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.getGrid().getFixedColumnCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of fixed rows.
     */
    getFixedRowCount: function() {
        return this.getGrid().getFixedRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of header rows.
     */
    getHeaderRowCount: function() {
        return this.getGrid().getHeaderRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of header columns.
     */
    getHeaderColumnCount: function() {
        return this.getGrid().getHeaderColumnCount();
    },

    /** @summary Smart render the main cells.
     * @desc Paint all the cells of a grid, including the "fixed" columns and rows.
     * We snapshot the context to insure against its pollution.
     * try-catch surrounds cell paint in case a cell editor throws an error.
     * The error message is error-logged to console AND displayed in cell.
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    paintCells: function(gc) {
        var renderCellError,
            message,
            x, y,
            c, r,
            columnEdges = this.getColumnEdges(), rowEdges = this.rowEdges,
            visibleCols = this.getVisibleColumns(), visibleRows = this.getVisibleRows(),
            behavior = this.getBehavior(),
            clipX = 0, clipY = 0,
            clipWidth, clipHeight = rowEdges[rowEdges.length - 1],
            loopStart = -this.getGrid().isShowRowNumbers(), // yields 0 or -1
            loopLength = visibleCols.length; // regardless of loopStart (due to definition of .length)

        this.buttonCells = {};

        if (loopLength) { // this if prevents painting just the fixed columns when there are no visible columns
            for (x = loopStart; x < loopLength; x++, clipX += clipWidth) {
                c = visibleCols[x];
                this.renderedColumnMinWidths[c] = 0;
                renderCellError = behavior.getColumnProperties(c).renderCellError;

                gc.save();

                // clip to column
                clipWidth = columnEdges[x - loopStart] - clipX;
                gc.beginPath();
                gc.rect(clipX, clipY, clipWidth, clipHeight);
                gc.clip();

                for (y = 0; y < visibleRows.length; y++) {
                    r = visibleRows[y];
                    try {
                        this._paintCell(gc, c, r);
                        //if (r === 9 && c === 2) { throw Error('She sells sea shells by the sea shore.'); }
                    } catch (e) {
                        message = e && (e.message || e) || 'Unknown error.';

                        console.error(message);

                        if (renderCellError) {
                            var errY = rowEdges[y],
                                errHeight = rowEdges[y + 1] - errY;

                            gc.save();
                            gc.beginPath();
                            gc.rect(clipX, errY, clipWidth, errHeight);
                            gc.clip();

                            renderCellError(gc, message, clipX, errY, clipWidth, errHeight);

                            gc.restore();
                        }
                    }
                }

                gc.restore(); // remove column's clip region
            }
        }

        setNumberColumnWidth(gc, behavior, this.getGrid().getRowCount());
    },

    /**
     * @memberOf Renderer.prototype
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw gridlines here. Also we record the widths and heights for later.
     * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
     */
    paintGridlines: function(gc) {
        var x, y, c, r = 0;

        var colWidths = this.getColumnEdges();
        var rowHeights = this.rowEdges;

        var viewWidth = colWidths[colWidths.length - 1];
        var viewHeight = rowHeights[rowHeights.length - 1];

        var drawThemH = this.resolveProperty('gridLinesH');
        var drawThemV = this.resolveProperty('gridLinesV');
        var lineColor = this.resolveProperty('lineColor');

        gc.beginPath();
        gc.strokeStyle = lineColor;
        gc.lineWidth = this.resolveProperty('lineWidth');
        gc.moveTo(0, 0);

        if (drawThemV) {
            for (c = 0; c < colWidths.length + 1; c++) {
                x = colWidths[c] + 0.5;
                gc.moveTo(x, 0);
                gc.lineTo(x, viewHeight);
            }
        }

        if (drawThemH) {
            for (r = 0; r < rowHeights.length; r++) {
                y = rowHeights[r] + 0.5;
                gc.moveTo(0, y);
                gc.lineTo(viewWidth, y);
            }
        }
        gc.stroke();
        gc.closePath();
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     * @param x
     * @param y
     */
    paintCell: function(gc, x, y) {
        gc.moveTo(0, 0);

        var c = this.getVisibleColumns()[x],
            r = this.getVisibleRows()[y];

        if (c) { //something is being viewed at at the moment (otherwise returns undefined)
            this._paintCell(gc, c, r);
        }
    },

    _paintCell: function(gc, c, r) {

        var grid = this.getGrid();
        var behavior = this.getBehavior();
        var baseProperties = behavior.getColumnProperties(c);

        if (baseProperties.isNull) {
            return;
        }

        var columnProperties = baseProperties;
        var headerRowCount = behavior.getHeaderRowCount();
        //var headerColumnCount = behavior.getHeaderColumnCount();

        var isShowRowNumbers = grid.isShowRowNumbers();
        var isHeaderRow = r < headerRowCount;
        //var isHeaderColumn = c < headerColumnCount;
        var isFilterRow = grid.isFilterRow(r);
        var isHierarchyColumn = grid.isHierarchyColumn(c);
        var isRowSelected = grid.isRowSelected(r);
        var isColumnSelected = grid.isColumnSelected(c);
        var isCellSelected = grid.isCellSelected(c, r);
        var isCellSelectedInColumn = grid.isCellSelectedInColumn(c);
        var isCellSelectedInRow = grid.isCellSelectedInRow(r);
        var areAllRowsSelected = grid.areAllRowsSelected();

        var cellProperties;

        if ((isShowRowNumbers && c === -1) || isHierarchyColumn) {
            if (isRowSelected) {
                baseProperties = baseProperties.rowHeaderRowSelection;
                cellProperties = Object.create(baseProperties);
                cellProperties.isSelected = true;
            } else {
                baseProperties = baseProperties.rowHeader;
                cellProperties = Object.create(baseProperties);
                cellProperties.isSelected = isCellSelectedInRow;
            }
            cellProperties.isUserDataArea = false;
        } else if (isHeaderRow) {
            if (isFilterRow) {
                baseProperties = baseProperties.filterProperties;
                cellProperties = Object.create(baseProperties);
                cellProperties.isSelected = false;
            } else if (isColumnSelected) {
                baseProperties = baseProperties.columnHeaderColumnSelection;
                cellProperties = Object.create(baseProperties);
                cellProperties.isSelected = true;
            } else {
                baseProperties = baseProperties.columnHeader;
                cellProperties = Object.create(baseProperties);
                cellProperties.isSelected = isCellSelectedInColumn;
            }
            cellProperties.isUserDataArea = false;
        } else if (isHierarchyColumn) {
            baseProperties = baseProperties.rowHeader;
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = isCellSelectedInRow;
        } else {
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = isCellSelected || isRowSelected || isColumnSelected;
            cellProperties.isUserDataArea = true;
        }

        var rowNum = r - headerRowCount + 1;

        if (c === -1) {
            var checkedImage = isRowSelected ? 'checked' : 'unchecked';
            cellProperties.value = isHeaderRow ? '' : [behavior.getImage(checkedImage), rowNum, null];
            if (r === 0) {
                checkedImage = areAllRowsSelected ? 'checked' : 'unchecked';
                cellProperties.value = [behavior.getImage(checkedImage), '', null];
            } else if (isFilterRow) {
                cellProperties.value = [behavior.getImage('filter-off'), '', null];
            }
            cellProperties.halign = 'right';
        } else {
            cellProperties.value = grid.getValue(c, r);
            cellProperties.halign = grid.getColumnAlignment(c);
        }
        cellProperties.isColumnHovered = this.isRowHovered(c, r);
        cellProperties.isRowHovered = this.isColumnHovered(c, r);
        cellProperties.bounds = this._getBoundsOfCell(c, r);
        cellProperties.isCellSelected = isCellSelected;
        cellProperties.isRowSelected = isRowSelected;
        cellProperties.isColumnSelected = isColumnSelected;
        cellProperties.isInCurrentSelectionRectangle = grid.isInCurrentSelectionRectangle(c, r);

        var mouseDownState = grid.mouseDownState;
        if (mouseDownState) {
            var point = mouseDownState.gridCell;
            cellProperties.mouseDown = point.x === c && point.y === r;
        }

        cellProperties.x = c;
        cellProperties.y = r;

        behavior.cellPropertiesPrePaintNotification(cellProperties);

        var cell = behavior.getCellRenderer(cellProperties, c, r);
        var overrides = behavior.getCellProperties(c, r);

        //declarative cell properties
        _(cellProperties).extendOwn(overrides);

        //allow the renderer to identify itself if it's a button
        cellProperties.buttonCells = this.buttonCells;

        cell.paint(gc, cellProperties);

        this.renderedColumnMinWidths[c] = Math.max(cellProperties.minWidth || 0, this.renderedColumnMinWidths[c]);
        columnProperties.preferredWidth = this.renderedColumnMinWidths[c];
    },

    isViewableButton: function(c, r) {
        var key = c + ',' + r;
        return this.buttonCells[key] === true;
    },

    getRowNumbersWidth: function() {
        var colEdges = this.getColumnEdges();
        if (colEdges.length === 0) {
            return 0;
        }
        return colEdges[0];
    },

    startAnimator: function() {
        var animate;
        var self = this;
        animate = function() {
            self.animate();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    },

    animate: function() {
        var ctx = this.getCanvas().canvasCTX;
        ctx.beginPath();
        ctx.save();
        this.renderFocusCell(ctx);
        ctx.restore();
        ctx.closePath();
    },

    getBounds: function() {
        return this.bounds;
    },

    setBounds: function(bounds) {
        return (this.bounds = bounds);
    }

});

function setNumberColumnWidth(gc, behavior, maxRow) {
    var columnProperties = behavior.getColumnProperties(-1),
        cellProperties = columnProperties.rowHeader,
        icon = behavior.getImage('checked');

    gc.font = cellProperties.font;

    columnProperties.preferredWidth = icon.width + 7 + cellProperties.getTextWidth(gc, maxRow + 1);
}

module.exports = Renderer;
