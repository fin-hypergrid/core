/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var _ = require('object-iterators');
var Base = require('extend-me').Base;

var images = require('../images');

/** @typedef {object} CanvasRenderingContext2D
 * @see [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */

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
            width: 0,
            height: 0
        };
        this.columnEdges = [];
        this.columnEdgesIndexMap = [];
        this.renderedColumnMinWidths = [];
        this.rowEdges = [];
        this.rowEdgesIndexMap = [];
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
        this.reset();
    },

    //this function computes the grid coordinates used for extremely fast iteration over
    //painting the grid cells. this function is very fast, for thousand rows X 100 columns
    //on a modest machine taking usually 0ms and no more that 3 ms.
    computeCellsBounds: function() {

        //var startTime = Date.now();

        var scrollTop = this.getScrollTop(),
            scrollLeft = this.getScrollLeft(),

            numColumns = this.getColumnCount(),
            numFixedColumns = this.getFixedColumnCount(),

            numRows = this.getRowCount(),
            numFixedRows = this.getFixedRowCount(),

            bounds = this.getBounds(),
            numberOfBottomTotalsRows = this.grid.behavior.getDataModel().getBottomTotals().length,
            viewWidth = bounds.width || this.grid.canvas.width, // if 0, we must be in bootstrap
            viewHeight = bounds.height - numberOfBottomTotalsRows * this.grid.behavior.getDefaultRowHeight(),

            insertionBoundsCursor = 0,
            previousInsertionBoundsCursorValue = 0,

            start = 0,
            x = 0, y = 0,
            c, r,
            vx, vy,
            width, height,
            firstVX, lastVX,
            firstVY, lastVY;

        this.getColumnEdges().length = 0;
        this.rowEdges.length = 0;

        this.columnEdges[0] = 0;
        this.rowEdges[0] = 0;
        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;
        this.columnEdgesIndexMap = [];
        this.rowEdgesIndexMap = [];

        this.insertionBounds = [];

        if (this.grid.isShowRowNumbers()) {
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
        this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {Object} a property value at a key, delegates to the grid
     */
    resolveProperty: function(key) {
        return this.grid.resolveProperty(key);
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Notify the fin-hypergrid everytime we've repainted.
     * @desc This is the entry point from fin-canvas.
     * @param {CanvasRenderingContext2D} gc
     */
    _paint: function(gc) {
        if (this.grid) {
            this.renderGrid(gc);
            this.grid.gridRenderedNotification();
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
        return this.viewHeight - this.grid.getFixedRowsHeight();
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
        var xOutside = false,
            yOutside = false,
            cell = this.cell;

        var y, x = this.columnEdgesIndexMap[c];
        if (x === undefined) {
            x = this.columnEdgesIndexMap[c - 1];
            xOutside = true;
        }

        var oy, ox = this.columnEdges[x],
            cy, cx = this.columnEdges[x + 1],
            ey, ex = cx - ox;

        cell.x = xOutside ? cx : ox;
        cell.width = xOutside ? 0 : ex;

        if (r < 0) { // bottom totals rows
            var behavior = this.grid.behavior,
                bounds = this.getBounds();

            ey = behavior.getDefaultRowHeight();
            oy = bounds.height + r * ey;
            cy = oy + ey;
        } else {
            y = this.rowEdgesIndexMap[r];
            if (y === undefined) {
                y = this.rowEdgesIndexMap[r - 1];
                yOutside = true;
            }

            oy = this.rowEdges[y];
            cy = this.rowEdges[y + 1];
            ey = cy - oy;
        }

        cell.y = yOutside ? cy : oy;
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
        var width = 0,
            fixedColumnCount = this.getFixedColumnCount(),
            scrollLeft = this.grid.getHScrollValue(),
            edges = this.getColumnEdges();

        for (var c = 1; c < edges.length - 1; c++) {
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

        var behavior = this.grid.behavior;
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

        var viewPoint = this.grid.newPoint(c, r);

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
            gridCell: this.grid.newPoint(c, r),
            mousePoint: this.grid.newPoint(x, y),
            viewPoint: viewPoint,
            dataCell: this.grid.newPoint(translatedIndex, r),
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
    getFinalVisableColumnBoundary: function() {
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
        return this.grid.isSelected(x, y);
    },

    /**
     * @memberOf Renderer.prototype
     * @desc This is the main forking of the renderering task.
     * @param {CanvasRenderingContext2D} gc
     */
    renderGrid: function(gc) {
        gc.beginPath();

        this.paintCells(gc);
        this.paintGridlines(gc);
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

        var selections = this.grid.selectionModel.selections;
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
        var ox = Math.round((o.x === undefined) ? this.grid.getFixedColumnsWidth() : o.x);
        var oy = Math.round((o.y === undefined) ? this.grid.getFixedRowsHeight() : o.y);
        // var ow = o.width;
        // var oh = o.height;
        var e = this._getBoundsOfCell(dpEX, dpEY);
        var ex = Math.round((e.x === undefined) ? this.grid.getFixedColumnsWidth() : e.x);
        var ey = Math.round((e.y === undefined) ? this.grid.getFixedRowsHeight() : e.y);
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
     * @desc iterate the renderering overrides and manifest each
     * @param {CanvasRenderingContext2D} gc
     */
    renderOverrides: function(gc) {
        var cache = this.grid.renderOverridesCache;
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
     * @param {CanvasRenderingContext2D} gc
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
        return this.grid.isHovered(x, y) && this.grid.resolveProperty('hoverCellHighlight');
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} mouse is currently over row y
     * @param {number} offsetY - y coordinate
     */
    isRowHovered: function(y) {
        return this.grid.isRowHovered(y) && this.grid.resolveProperty('hoverRowHighlight');
     },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} mouse is currently over column x
     * @param {number} offsetX - x coordinate
     */
    isColumnHovered: function(x) {
        return this.grid.isColumnHovered(x) && this.grid.resolveProperty('hoverColumnHighlight');
    },

    /**
     * @memberOf Renderer.prototype
     * @param {number} colIndex
     * @returns {boolean} The given column within the fixed row area is selected.
     */
    isCellSelectedInRow: function(colIndex) {
        return this.grid.isCellSelectedInRow(colIndex);
    },

    /**
     * @memberOf Renderer.prototype
     * @param {number} rowIndex
     * @returns {boolean} The given row within the fixed column area is selected.
     */
    isCellSelectedInColumn: function(rowIndex) {
        return this.grid.isCellSelectedInColumn(rowIndex);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current vertical scroll value.
     */
    getScrollTop: function() {
        return this.grid.getVScrollValue();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Current horizontal scroll value.
     */
    getScrollLeft: function() {
        return this.grid.getHScrollValue();
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
        var height = this.grid.behavior.getRowHeight(rowIndex);
        return height;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The columnWidth of the column at index columnIndex
     * @param {number} columnIndex
     */
    getColumnWidth: function(columnIndex) {
        var width = this.grid.getColumnWidth(columnIndex);
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
        return this.grid.getCanvas();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} User is currently dragging a column for reordering.
     */
    isDraggingColumn: function() {
        return this.grid.isDraggingColumn();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to goto for a page up.
     */
    getPageUpRow: function() {
        var behavior = this.grid.behavior;
        var scrollHeight = this.getVisibleScrollHeight();
        var headerRows = this.grid.getFixedRowCount();
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
        var headerRows = this.grid.getFixedRowCount();
        var rowNum = this.dataWindow.corner.y - headerRows - 1;
        return rowNum;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of columns.
     */
    getColumnCount: function() {
        return this.grid.getColumnCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of rows.
     */
    getRowCount: function() {
        return this.grid.getRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.grid.getFixedColumnCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of fixed rows.
     */
    getFixedRowCount: function() {
        return this.grid.getFixedRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of header rows.
     */
    getHeaderRowCount: function() {
        return this.grid.getHeaderRowCount();
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The number of header columns.
     */
    getHeaderColumnCount: function() {
        return this.grid.getHeaderColumnCount();
    },

    /** @summary Smart render the grid.
     * @desc Paint all the cells of a grid, including all "fixed" columns and rows.
     * We snapshot the context to insure against its pollution.
     * `try...catch` surrounds each cell paint in case a cell editor throws an error.
     * The error message is error-logged to console AND displayed in cell.
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     */
    paintCells: function(gc) {
        var renderCellError,
            message,
            x, y,
            c, r,

            columnEdges = this.getColumnEdges(),
            rowEdges = this.rowEdges,

            visibleCols = this.getVisibleColumns(),
            visibleRows = this.getVisibleRows(),

            behavior = this.grid.behavior,

            clipX = 0,
            clipY = 0,
            clipWidth,
            clipHeight = this.getBounds().height,

            loopStart = this.grid.isShowRowNumbers() ? -1 : 0,
            loopLength = visibleCols.length; // regardless of loopStart, due to definition of .length

        this.buttonCells = {};

        if (loopLength) { // this if prevents painting just the fixed columns when there are no visible columns

            // For each column...
            for (x = loopStart; x < loopLength; x++, clipX += clipWidth) {

                c = visibleCols[x];
                this.renderedColumnMinWidths[c] = 0;
                renderCellError = behavior.getColumnProperties(c).renderCellError;

                gc.save();

                // Clip to visible portion of column to prevent overflow to right. Previously we clipped to entire visible grid and dealt with overflow by overpainting with next column. However, this strategy fails when transparent background (no background color).
                // TODO: if extra clip() calls per column affect performance (not the clipping itself which was happening anyway, but the clip calls which set up the clipping), use previous strategy when there is a background color
                clipWidth = columnEdges[x - loopStart] - clipX;
                gc.beginPath();
                gc.rect(clipX, clipY, clipWidth, clipHeight);
                gc.clip();

                // For each row (of each column)...
                for (y = 0; y < visibleRows.length; y++) {

                    r = visibleRows[y];

                    try {

                        this._paintCell(gc, c, r);

                        //if (r === 9 && c === 2) { throw Error('She sells sea shells by the sea shore.'); }

                    } catch (e) {

                        message = e && (e.message || e) || 'Unknown error.';

                        console.error(message);

                        if (renderCellError) {
                            var rawGc = gc.gc || gc, // Don't log these canvas calls
                                errY = rowEdges[y],
                                errHeight = rowEdges[y + 1] - errY;

                            rawGc.save(); // define clipping region
                            rawGc.beginPath();
                            rawGc.rect(clipX, errY, clipWidth, errHeight);
                            rawGc.clip();

                            renderCellError(rawGc, message, clipX, errY, clipWidth, errHeight);

                            rawGc.restore(); // discard clipping region
                        }

                    }
                }

                // Bottom totals rows...
                for (y = -behavior.getDataModel().getBottomTotals().length; y; y++) {
                    this._paintCell(gc, c, y);
                }

                gc.restore(); // Remove column's clip region (and anything else renderCellError() might have set)
            }
        }

        setNumberColumnWidth(gc, behavior, this.grid.getRowCount());
    },

    /**
     * @memberOf Renderer.prototype
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw gridlines here. Also we record the widths and heights for later.
     * @param {CanvasRenderingContext2D} gc
     */
    paintGridlines: function(gc) {
        var x, y, c, r = 0;

        var colWidths = this.getColumnEdges();
        var rowHeights = this.rowEdges;

        var viewWidth = colWidths[colWidths.length - 1];
        var viewHeight = this.getBounds().height; //rowHeights[rowHeights.length - 1];

        var drawThemH = this.resolveProperty('gridLinesH');
        var drawThemV = this.resolveProperty('gridLinesV');
        var lineColor = this.resolveProperty('lineColor');

        gc.beginPath();

        if (drawThemV) {
            for (c = 0; c < colWidths.length + 1; c++) {
                x = colWidths[c] + 0.5;
                gc.moveTo(x, 0);
                gc.lineTo(x, viewHeight);
            }
        }

        if (drawThemH) {
            for (r = 0; r < rowHeights.length - 1; r++) {
                y = rowHeights[r] + 0.5;
                gc.moveTo(0, y);
                gc.lineTo(viewWidth, y);
            }

            // Bottom totals rows...
            var behavior = this.grid.behavior,
                rowHeight = behavior.getDefaultRowHeight();
            for (r = -behavior.getDataModel().getBottomTotals().length, y = this.getBounds().height; r; r++) {
                y -= rowHeight;
                gc.moveTo(0, y);
                gc.lineTo(viewWidth, y);
            }
        }

        gc.closePath();

        gc.strokeStyle = lineColor;
        gc.lineWidth = this.resolveProperty('lineWidth');
        gc.stroke();
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

        var grid = this.grid,
            behavior = grid.behavior,
            baseProperties = behavior.getColumnProperties(c);

        if (baseProperties.isNull) {
            return;
        }

        var columnProperties = baseProperties,

            headerRowCount = behavior.getHeaderRowCount(),
            isGridRow = r >= headerRowCount,
            isFooterRow = r < 0,
            isHeaderRow = !isGridRow && !isFooterRow,
            isFilterRow = grid.isFilterRow(r),

            headerColumnCount = behavior.getHeaderColumnCount(),
            isGridColumn = c >= headerColumnCount,
            isShowRowNumbers = grid.isShowRowNumbers(),
            isHierarchyColumn = grid.isHierarchyColumn(c),

            isRowSelected = grid.isRowSelected(r),
            isColumnSelected = grid.isColumnSelected(c),
            isCellSelected = grid.isCellSelected(c, r),
            isCellSelectedInColumn = grid.isCellSelectedInColumn(c),
            isCellSelectedInRow = grid.isCellSelectedInRow(r),
            areAllRowsSelected = grid.areAllRowsSelected(),
            cellProperties;

        if ((isShowRowNumbers && c === -1) || isHierarchyColumn) {
            if (isRowSelected) {
                cellProperties = Object.create(baseProperties.rowHeaderRowSelection);
                cellProperties.isSelected = true;
            } else {
                cellProperties = Object.create(baseProperties.rowHeader);
                cellProperties.isSelected = isCellSelectedInRow;
            }
            cellProperties.isUserDataArea = false;
        } else if (isHeaderRow || isFooterRow) {
            if (isFilterRow) {
                cellProperties = Object.create(baseProperties.filterProperties);
                cellProperties.isSelected = false;
            } else if (isColumnSelected) {
                cellProperties = Object.create(baseProperties.columnHeaderColumnSelection);
                cellProperties.isSelected = true;
            } else {
                cellProperties = Object.create(baseProperties.columnHeader);
                cellProperties.isSelected = isCellSelectedInColumn;
            }
            cellProperties.isUserDataArea = false;
        } else if (isHierarchyColumn) {
            cellProperties = Object.create(baseProperties.rowHeader);
            cellProperties.isSelected = isCellSelectedInRow;
        } else {
            cellProperties = Object.create(baseProperties);
            cellProperties.isSelected = isCellSelected || isRowSelected || isColumnSelected;
            cellProperties.isUserDataArea = true;
        }

        var rowNum = r - headerRowCount + 1;

        if (c === -1) {
            if (r === 0) { // header label row gets "master" checkbox
                cellProperties.value = [images.checkbox(areAllRowsSelected), '', null];
            } else if (isFilterRow) { // no checkbox but show filter icon
                cellProperties.value = [images.filter(false), '', null];
            } else if (isHeaderRow || isFooterRow) { // no checkbox on "totals" rows
                cellProperties.value = '';
            } else {
                cellProperties.value = [images.checkbox(isRowSelected), rowNum, null];
            }
            cellProperties.halign = 'right';
        } else {
            cellProperties.value = grid.getValue(c, r);
            cellProperties.halign = grid.getColumnAlignment(c);
        }

        cellProperties.isGridColumn = isGridColumn;
        cellProperties.isGridRow = isGridRow;
        cellProperties.isColumnHovered = this.isColumnHovered(c) && isGridColumn;
        cellProperties.isRowHovered = this.isRowHovered(r) && isGridRow;
        cellProperties.isCellHovered = this.isHovered(c, r) && isGridColumn && isGridRow;
        cellProperties.bounds = this._getBoundsOfCell(c, r);
        cellProperties.isCellSelected = isCellSelected;
        cellProperties.isRowSelected = isRowSelected;
        cellProperties.isColumnSelected = isColumnSelected;
        cellProperties.isInCurrentSelectionRectangle = grid.isInCurrentSelectionRectangle(c, r);

        if (grid.mouseDownState) {
            var point = grid.mouseDownState.gridCell;
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
        var formatType = cellProperties.isUserDataArea ? cellProperties.format : 'default';
        cellProperties.formatter = grid.getFormatter(formatType);
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
        icon = images.checked;

    gc.font = cellProperties.font;

    columnProperties.preferredWidth = icon.width + 7 + cellProperties.getTextWidth(gc, maxRow + 1);
}

module.exports = Renderer;
