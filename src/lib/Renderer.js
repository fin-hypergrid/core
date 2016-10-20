/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var _ = require('object-iterators');

var Base = require('../Base');
var images = require('../../images');

/** @typedef {object} CanvasRenderingContext2D
 * @see [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */

/** @typedef {object} visibleColumnDescriptor
 * @property {number} index - Index into {@link Behavior#columns}, the subset of "active" columns. See {@link Renderer#visibleColumns} for details.
 * @property {number} left - Pixel coordinate of the left edge of this column, rounded to nearest integer.
 * @property {number} right - Pixel coordinate of the right edge of this column, rounded to nearest integer.
 * @property {number} width - Width of this column in pixels, rounded to nearest integer.
 */

/** @typedef {object} visibleRowDescriptor
 * @property {number} index - Physical vertical row coordinate, possibly adjusted for scrolling.
 * @property {number} rowIndex - Local vertical row coordinate within the subgrid to which the row belongs.
 * @property {DataModel} subgrid - A reference to the subgrid to which the row belongs.
 * @property {number} top - Pixel coordinate of the top edge of this row, rounded to nearest integer.
 * @property {number} bottom - Pixel coordinate of the bottom edge of this row, rounded to nearest integer.
 * @property {number} height - Height of this row in pixels, rounded to nearest integer.
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
        this.renderedColumnMinWidths = [];

        /**
         * Size: Always the exact number of visible columns, the last of which may be only partially visible.
         *
         * The `index` property of each object in the list dereferences {@link Behavior#columns} (the subset of "active" columns) specifying which column to show in that position. This list can take three forms, based on whether or not there are "fixed" columns on the left and whether or not the grid is horizontally scrolled:
         * * Unscrolled grid: These indexes are a zero-based sequence of integers.
         * * Scrolled grid:
         *   * Without fixed columns: These indexes are a sequence of integers beginning with the index of the first _visible_ column, _i.e.,_ based on the number of columns scrolled off to the left.
         *   * With fixed columns: These indexes are two concatenated sequences of consecutive integers:
         *     1. A zero-based list of consecutive of integers representing the fixed columns.
         *     2. A sequence of consecutive integers beginning with the index of the first visible column (which equals the number of columns scrolled off to the left).
         * @type {visibleColumnDescriptor}
         */
        this.visibleColumns = [];

        /**
         * Size: Always the exact number of visible rows.
         *
         * The `index` property of each object in the list is the zero-based row number:
         * 1. A zero-based list of consecutive integers representing all the rows of all the non-empty subgrids up to (but not including) the single scrollable data subgrid. These are therefore the vertical row coordinates for the rows in these subgrids.
         * 2. A subset of consecutive rows from the data source, which will either be unscrolled or scrolled. In both cases, the number of rows in this sequence is the maximum number of rows for which there is room, given the current height of the grid and the height of each row, with room reserved at the bottom for all rows of all remaining non-empty subgrids.
         *    * Unscrolled grid: The sequence begins with the next vertical row coordinate (which equals the total number of rows from all the subgrids so far).
         *    * Scrolled grid: The sequence begins with the first _visible_ data row, based on the next vertical row coordinate but adjusted upwards by adding in the number of rows scrolled off the top.
         * 3. A list of consecutive integers representing all the rows of all remaining non-empty subgrids, based on the p[hysical vertical row coordinate of the first of these remaining rows.
         *
         * `rowIndex` is the _local_ zero-based row number within the subgrid to which this row belongs.
         *
         * `subgrid` is a reference to the subgrid data model object to which this row belongs.
         * @type {visibleRowDescriptor}
         */
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

    /**
     * This function creates several data structures:
     * * {@link Renderer#visibleColumns}
     * Original comment:
     * "this function computes the grid coordinates used for extremely fast iteration over
     * painting the grid cells. this function is very fast, for thousand rows X 100 columns
     * on a modest machine taking usually 0ms and no more that 3 ms."
     */
    computeCellsBounds: function() {

        //var startTime = Date.now();

        var scrollTop = this.getScrollTop(),
            scrollLeft = this.getScrollLeft(),

            fixedColumnCount = this.getFixedColumnCount(),
            fixedRowCount = this.getFixedRowCount(),

            numRows = this.getRowCount(),
            bounds = this.getBounds(),
            grid = this.grid,
            behavior = grid.behavior,

            insertionBoundsCursor = 0,
            previousInsertionBoundsCursorValue = 0,

            lineWidth = grid.properties.lineWidth,

            start,
            x, X, // horizontal pixel loop index and limit
            y, Y, // vertical pixel loop index and limit
            c, C, // column loop index and limit
            g, G, // subgrid loop index and limit
            r, R, // row loop index and limitrows in current subgrid
            subrows, // rows in subgrid g
            base, // sum of rows for all subgrids so far
            subgrids = behavior.subgrids,
            subgrid,
            scrollableSubgrid,
            footerHeight,
            vx, vy,
            vr,
            width, height,
            firstVX, lastVX,
            firstVY, lastVY,
            topR,
            xSpaced, widthSpaced, heightSpaced; // adjusted for cell spacing

        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this.visibleColumnsByIndex = []; // array because number of columns will always be reasonable
        this.visibleRowsByDataRowIndex = {}; // hash because keyed by both fixed and scrolled row indexes

        this.insertionBounds = [];

        start = this.grid.isShowRowNumbers() ? -1 : 0;

        for (
            x = 0, c = start, C = this.getColumnCount(), X = bounds.width || grid.canvas.width;
            c < C && x <= X;
            c++
        ) {
            vx = c;
            if (c >= fixedColumnCount) {
                lastVX = vx += scrollLeft;
                if (firstVX === undefined) {
                    firstVX = lastVX;
                }
            }
            if (vx >= C) {
                break; // scrolled beyond last column
            }

            width = grid.getColumnWidth(vx);

            xSpaced = x ? x + lineWidth : x;
            widthSpaced = x ? width - lineWidth : width;
            this.visibleColumns[c] = this.visibleColumnsByIndex[vx] = {
                index: vx,
                left: xSpaced,
                width: widthSpaced,
                right: xSpaced + widthSpaced
            };

            x += width;

            insertionBoundsCursor += Math.round(width / 2) + previousInsertionBoundsCursorValue;
            this.insertionBounds.push(insertionBoundsCursor);
            previousInsertionBoundsCursorValue = Math.round(width / 2);
        }

        footerHeight = behavior.getDefaultRowHeight() * subgrids.reduce(function(rows, subgrid) {
            if (scrollableSubgrid) {
                rows += subgrid.getRowCount();
            } else {
                scrollableSubgrid = !subgrid.type;
            }
            return rows;
        }, 0);

        for (
            base = r = g = y = 0, G = subgrids.length, Y = bounds.height - footerHeight;
            g < G;
            g++, base += subrows
        ) {
            subgrid = subgrids[g];
            subrows = subgrid.getRowCount();
            scrollableSubgrid = !subgrid.type;
            topR = r;

            // For each row of each subgrid...
            for (R = Math.min(numRows, r + subrows); r < R && y < Y; r++) {
                vy = r;
                if (scrollableSubgrid && r >= fixedRowCount) {
                    vy += scrollTop;
                    lastVY = vy - base;
                    if (firstVY === undefined) {
                        firstVY = lastVY;
                    }
                    if (vy >= R) {
                        break; // scrolled beyond last row
                    }
                }

                height = grid.getRowHeight(vy);

                heightSpaced = height - lineWidth;
                this.visibleRows[r] = vr = {
                    index: vy,
                    subgrid: subgrid,
                    rowIndex: vy - base,
                    top: y,
                    height: heightSpaced,
                    bottom: y + heightSpaced
                };
                if (scrollableSubgrid) {
                    this.visibleRowsByDataRowIndex[vy - base] = vr;
                }

                y += height;
            }

            if (scrollableSubgrid) {
                subrows = r - topR;
                Y += footerHeight;
            }
        }

        this.viewHeight = Y;

        this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);
    },

    /**
     * Keep in place! Used by fin-canvas.
     * @memberOf Renderer.prototype
     * @returns {Object} a property value at a key, delegates to the grid
     */
    resolveProperty: function(key) {
        return this.grid.properties[key];
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Notify the fin-hypergrid everytime we've repainted.
     * @desc This is the entry point from fin-canvas.
     * @param {CanvasRenderingContext2D} gc
     */
    paint: function(gc) {
        if (this.grid) {
            if (!this.hasData()) {
                var message = this.grid.properties.noDataMessage;
                gc.font = '20px Arial';
                gc.fillText(message, 20, 30);
            } else {
                this.renderGrid(gc);
                this.grid.gridRenderedNotification();
            }
        }
    },

    hasData: function() {
        var data = this.grid.behavior.getData();
        if (data) {
            return data.length > 0;
        }
        return false;
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
        warn('getVisibleRows', 'The getVisibleRows() method has been deprecated as of v1.2.0 in favor of the getVisibleRows[*].index property and will be removed in a future version.');
        return this.visibleRows.map(function(vr) { return vr.index; });
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
        warn('visibleColumns', 'The getVisibleColumns() method has been deprecated as of v1.2.0 in favor of the visibleColumns[*].index property and will be removed in a future version.');
        return this.visibleColumns.map(function(vc) { return vc.index; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The column index when the mouseEvent coordinates are over a column divider.
     */
    overColumnDivider: function(x) {
        var vc = this.visibleColumns,
            xi = Math.round(x),
            x1 = xi - 3,
            x2 = xi + 1;

        for (var c = (-1 in vc ? -1 : 0), C = vc.length; c < C; ++c) {
            x = vc[c].right;
            if (x1 <= x && x <= x2) {
                return c + 1;
            }
        }

        return -1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row index when the mouseEvent coordinates are over a row divider.
     */
    overRowDivider: function(y) {
        var vr = this.visibleRows,
            yi = Math.round(y),
            y1 = yi - 3,
            y2 = yi + 1;

        for (var r = 0, R = vr.length; r < R; ++r) {
            y = vr[r].bottom;
            if (y1 <= y && y <= y2) {
                return r + 1;
            }
        }

        return -1;
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
     * @param {number} x - The horizontal grid coordinate.
     * @param {number} y - The vertical grid coordinate.
     * @returns {Rectangle} Bounding rect of cell with the given coordinates.
     */
    _getBoundsOfCell: function(x, y) {
        var vc = this.visibleColumns[x],
            vr = this.visibleRows[y],
            cell = this.cell;

        cell.x = vc.left;
        cell.y = vr.top;
        cell.wdith = vc.width;
        cell.height = vr.height;

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
            visibleColumns = this.visibleColumns;

        for (var c = 1; c < visibleColumns.length - 1; c++) {
            width = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
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

        var width, height,
            mx, my, // mouse pixels
            gx, gy, // grid cells
            previous,
            visibleRows = this.visibleRows,
            visibleColumns = this.visibleColumns,
            fixedColumnCount = this.getFixedColumnCount(), // + gridSize;
            fixedRowCount = this.getFixedRowCount();

        // var fixedColumnCount = this.getFixedColumnCount();
        // var fixedRowCount = this.getFixedRowCount();
        var scrollX = this.getScrollLeft();
        var scrollY = this.getScrollTop();

        if (point.x < 0) {
            gx = -1;
        } else {
            for (gx = previous = 0; gx < visibleColumns.length; gx++) {
                width = visibleColumns[gx].left;
                if (point.x < width) {
                    mx = Math.max(0, point.x - previous - 2);
                    break;
                }
                previous = width;
            }
            gx--;
        }

        if (point.y < 0) {
            gy = 0;
        } else {
            for (gy = previous = 0; gy < visibleRows.length; gy++) {
                height = visibleRows[gy].top;
                if (point.y < height) {
                    my = Math.max(0, point.y - previous - 2);
                    break;
                }
                previous = height;
            }
            gy--;
        }

        var unscrolled = this.grid.behavior.newCellEvent(gx, gy); // coordinates before scrolling applied

        //compensate if we are scrolled
        if (gx >= fixedColumnCount) {
            gx += scrollX;
        }
        if (gy >= fixedRowCount) {
            gy += scrollY;
        }

        var mousePoint = this.grid.newPoint(mx, my);

        return Object.defineProperties(
            this.grid.behavior.newCellEvent(gx, gy), // defines Point objects .gridCell, .dataCell
            {
                mousePoint: {
                    value: mousePoint
                },
                unscrolled: {
                    value: unscrolled  // defines Point objects .unscrolled.gridCell, .unscrolled.dataCell
                },
                viewPoint: {
                    get: function() {
                        warn('viewpoint', 'The .viewPoint property has been deprecated as of v1.2.0 in favor of .unscrolled.gridCell and may be removed in a future release.');
                        return this.unscrolled.gridCell;
                    }
                }
            }
        );
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines if a column is visible.
     * @param {number} colIndex - the column index*
     * @returns {boolean} The given column is fully visible.
     */
    isColumnVisible: function(colIndex) {
        return !!this.visibleColumns.find(function(vc) { return vc.index === colIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The width x coordinate of the last rendered column
     */
    getFinalVisableColumnBoundary: function() {
        var chop = this.isLastColumnVisible() ? 2 : 1;
        var colWall = this.visibleColumns[this.visibleColumns.length - chop].right;
        return Math.min(colWall, this.getBounds().width);
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines visibility of a row.
     * @param {number} rowIndex - the row index
     * @returns {boolean} The given row is fully visible.
     */
    isRowVisible: function(rowIndex) {
        return !!this.visibleRows.find(function(vr) { return vr.index === rowIndex; });
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
        this.renderOverrides(gc);
        this.renderLastSelection(gc);
        gc.closePath();
    },

    renderLastSelection: function(gc) {
        gc.beginPath();
        this._renderLastSelection(gc);
        gc.closePath();
    },

    _renderLastSelection: function(gc) {
        var selections = this.grid.selectionModel.getSelections();
        if (!selections || selections.length === 0) {
            return;
        }
        var selection = this.grid.selectionModel.getLastSelection();

        if (selection.origin.x === -1) {
            // no selected area, lets exit
            return;
        }

        var vci = this.visibleColumnsByIndex,
            vri = this.visibleRowsByDataRowIndex,
            lastColumn = this.visibleColumns[this.visibleColumns.length - 1],
            lastRow = vri[this.dataWindow.corner.y]; // last row in scrollable data section

        if (
            selection.origin.x > lastColumn.index ||
            selection.origin.y > lastRow.index
        ) {
            // selection area begins to right or below grid
            return;
        }

        var vcOrigin = vci[selection.origin.x],
            vcCorner = vci[selection.corner.x],
            vrOrigin = vri[selection.origin.y],
            vrCorner = vri[selection.corner.y];

        if (
            !(vcOrigin || vcCorner) || // entire selection scrolled out of view to left of scrollable region
            !(vrOrigin || vrCorner)    // entire selection scrolled out of view above scrollable region
        ) {
            return;
        }

        var props = this.grid.properties;
        vcOrigin = vcOrigin || lastColumn;
        vcCorner = vcCorner || selection.corner.x > lastColumn.index ? lastColumn.index : vci[props.fixedColumnCount - 1];
        vrOrigin = vrOrigin || lastRow;
        vrCorner = vrCorner || selection.corner.y > lastRow.index ? lastRow.index : vri[props.fixedRowCount - 1];

        // Render the selection model around the bounds
        var config = {
            bounds: {
                x: vcOrigin.left,
                y: vrOrigin.top,
                width: vcCorner.right - vcOrigin.left,
                height: vrCorner.bottom - vrOrigin.top
            },
            selectionRegionOverlayColor: this.grid.properties.selectionRegionOverlayColor,
            selectionRegionOutlineColor: this.grid.properties.selectionRegionOutlineColor
        };
        this.grid.cellRenderers.get('lastselection').paint(gc, config);
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
        var startX = override.startX; //hdpiRatio * edges[override.columnIndex];
        var width = override.width + 1;
        var height = override.height;
        var targetCTX = override.ctx;
        var imgData = gc.getImageData(startX, 0, Math.round(width * hdpiRatio), Math.round(height * hdpiRatio));
        targetCTX.putImageData(imgData, 0, 0);
        gc.fillStyle = this.grid.properties.backgroundColor2;
        gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);
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
        warn('columnEdges', 'The getColumnEdges() mehtod has been deprecated as of version 1.2.0 in favor of visibleColumns[*].top and will be removed in a future version. Note however that columnEdges had one additional element (representing the right edge of the last visible column) which visibleColumns lacks. Instead you can reference visibleColumns[*].bottom.');
        return this.visibleColumns.map(function(vc) { return vc.left; }).concat([this.visibleColumns[this.visibleColumns.length - 1].right]);
    },

    getRowEdges: function() {
        warn('rowEdges', 'The getRowEdges() method has been deprecated as of version 1.2.0 in favor of visibleRows[*].top and will be removed in a future version. Note however that rowEdges had one additional element (representing the bottom edge of the last visible row) which visibleRows lacks. Instead you can reference visibleRows[*].bottom.');
        return this.visibleRows.map(function(vr) { return vr.top; }).concat([this.visibleRows[this.visibleRows.length - 1].bottom]);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} The last col was rendered (is visible)
     */
    isLastColumnVisible: function() {
        var lastColumnIndex = this.getColumnCount() - 1;
        return !!this.visibleColumns.find(function(vc) { return vc.index === lastColumnIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered column width at index
     */
    getRenderedWidth: function(index) {
        var result,
            columns = this.visibleColumns;

        if (index >= columns.length) {
            result = columns[columns.length - 1].right;
        } else {
            result = columns[index].left;
        }

        return result;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The rendered row height at index
     */
    getRenderedHeight: function(index) {
        var result,
            rows = this.visibleRows;

        if (index >= rows.length) {
            var last = rows[rows.length - 1];
            result = last.bottom;
        } else {
            result = rows[index].top;
        }

        return result;
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
     * @returns {number} The row to go to for a page up.
     */
    getPageUpRow: function() {
        var grid = this.grid,
            scrollHeight = this.getVisibleScrollHeight(),
            top = this.dataWindow.origin.y - this.grid.properties.fixedRowCount - 1,
            scanHeight = 0;
        while (scanHeight < scrollHeight && top >= 0) {
            scanHeight = scanHeight + grid.getRowHeight(top);
            top--;
        }
        return top + 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The row to goto for a page down.
     */
    getPageDownRow: function() {
        return this.dataWindow.corner.y - this.grid.properties.fixedRowCount + 1;
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

    /** @summary Smart render the grid.
     * @desc Paint all the cells of a grid, including all "fixed" columns and rows.
     * We snapshot the context to insure against its pollution.
     * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
     * The error message is error-logged to console AND displayed in cell.
     *
     * For performance reasons, we do not create a new `CellEvent` on for each `_paintCell` call.
     * Rather, we create one for all the calls and maintain the instance variables in the loops
     * (which is why `CellEvent` uses `WritablePoint` instead of `Point` for `gridCell` and `dataCell`):
     * * Set in column loop:
     *   * `cellEvent.column`
     *   * `cellEvent.gridCell.x`
     *   * `cellEvent.dataCell.x`
     * * Set in subgrid loop:
     *   * `cellEvent.subgrid`
     * * Set in row loop:
     *   * `cellEvent.gridCell.y`
     *   * `cellEvent.dataCell.y`
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     */
    paintCells: function(gc) {
        var message,
            behavior = this.grid.behavior,
            c, C, // column loop index and limit
            r, R, // row loop index and limit
            cellEvent = new behavior.CellEvent(0, 0),
            bounds = cellEvent.bounds = { x: 0, y: 0, width: 0, height: 0 },
            gridCell = cellEvent.gridCell,
            dataCell = cellEvent.dataCell,
            vc, visibleColumns = this.visibleColumns,
            vr, visibleRows = this.visibleRows,
            clipHeight = this.getBounds().height;

        this.buttonCells = {};

        // For each column...
        for (
            c = this.grid.isShowRowNumbers() ? -1 : 0, C = visibleColumns.length;
            c < C;
            c++
        ) {
            vc = visibleColumns[c];
            cellEvent.column = behavior.getActiveColumn(vc.index);

            gridCell.x = vc.index;
            dataCell.x = cellEvent.column && cellEvent.column.index;

            bounds.x = vc.left;
            bounds.width = vc.width;

            this.renderedColumnMinWidths[gridCell.x] = 0;

            gc.save();

            // Clip to visible portion of column to prevent overflow to right. Previously we clipped to entire visible grid and dealt with overflow by overpainting with next column. However, this strategy fails when transparent background (no background color).
            // TODO: if extra clip() calls per column affect performance (not the clipping itself which was happening anyway, but the clip calls which set up the clipping), use previous strategy when there is a background color
            gc.beginPath();
            gc.rect(0, 0, bounds.x + bounds.width, clipHeight);
            gc.clip();

            // For each row of each subgrid (of each column)...
            for (
                r = 0, R = visibleRows.length;
                r < R;
                r++
            ) {
                vr = visibleRows[r];
                cellEvent.subgrid = vr.subgrid;

                bounds.y = vr.top;
                bounds.height = vr.height;

                gridCell.y = vr.index;
                dataCell.y = vr.rowIndex;

                try {
                    this._paintCell(gc, cellEvent);
                } catch (e) {
                    message = e && (e.message || e) || 'Unknown error.';

                    console.error(message);

                    var rawGc = gc.gc || gc, // Don't log these canvas calls
                        errX = vc.left, errWidth = vc.right,
                        errY = vr.top, errHeight = vr.bottom,
                        config = { bounds: { c: errX, y: errY, width: errWidth, height: errHeight } };

                    rawGc.save(); // define clipping region
                    rawGc.beginPath();
                    rawGc.rect(errX, errY, errWidth, errHeight);
                    rawGc.clip();

                    this.grid.cellRenderers.get('errorcell').paint(rawGc, config, message);

                    rawGc.restore(); // discard clipping region
                }
            }

            gc.restore(); // Remove column's clip region (and anything else renderCellError() might have set)
        }

        setNumberColumnWidth(gc, behavior, this.grid.getRowCount());
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     * @param x
     * @param y
     */
    paintCell: function(gc, x, y) {
        gc.moveTo(0, 0);

        var c = this.visibleColumns[x].index,
            r = this.visibleRows[y].index;

        if (c) { //something is being viewed at at the moment (otherwise returns undefined)
            this._paintCell(gc, c, r);
        }
    },

    _paintCell: function(gc, cellEvent) {

        var grid = this.grid,
            behavior = grid.behavior,
            x = cellEvent.gridCell.x,
            // y = cellEvent.gridCell.y,
            c = cellEvent.dataCell.x,
            r = cellEvent.dataCell.y,
            cellProperties = behavior.getCellOwnProperties(cellEvent),
            baseProperties,

            isHandleColumn = cellEvent.isHandleColumn,
            isHierarchyColumn = cellEvent.isHierarchyColumn,
            isColumnSelected = cellEvent.isColumnSelected,

            isShowRowNumbers = grid.isShowRowNumbers(),
            isRowHandleOrHierarchyColumn = isShowRowNumbers && isHandleColumn || isHierarchyColumn,

            isGridRow = cellEvent.isGridRow,
            isRowSelected = cellEvent.isRowSelected,
            isCellSelected = cellEvent.isCellSelected,

            isHeaderRow = cellEvent.isHeaderRow,
            isFilterRow = cellEvent.isFilterRow,

            config = this.config;

        if (cellProperties && cellProperties.applyCellProperties) {
            this.c = undefined;
            config = undefined;
            baseProperties = cellProperties;
        } else if (!config || c !== this.c) {
            this.c = c;
            config = undefined;
        }

        var configType;
        if (isRowHandleOrHierarchyColumn) {
            configType = isRowSelected ? 1 : 2;
        } else if (isGridRow) {
            configType = 3;
        } else if (isFilterRow) {
            configType = 4;
        } else if (isColumnSelected) {
            configType = 5;
        } else { // header or summary or other
            configType = 6;
        }

        if (!config || configType !== this.configType) {
            this.configType = configType;
            if (!baseProperties) {
                baseProperties = behavior.getColumnProperties(c);
                if (!baseProperties) {
                    this.config = undefined;
                    return;
                }
            }
            switch (configType) {
                case 1: config = Object.create(baseProperties.rowHeaderRowSelection); break;
                case 2: config = Object.create(baseProperties.rowHeader); break;
                case 3: config = Object.create(baseProperties); break;
                case 4: config = Object.create(baseProperties.filterProperties); break;
                case 5: config = Object.create(baseProperties.columnHeaderColumnSelection); break;
                case 6: config = Object.create(baseProperties.columnHeader); break;
            }
            this.config = config;
            this.baseProperties = baseProperties;
        }

        // Create `config` (render props) object
        // * with appropriate prototype
        // * set `isSelected` (added to `config` below as a read-only property)
        // * for row handle column, set `config.halign` to `'right'`
        // * for hierarchy column, set `config.halign` to `'left'`
        var isSelected;
        if (isRowHandleOrHierarchyColumn) {
            isSelected = isRowSelected || grid.isCellSelectedInRow(r);
            config.halign = isHierarchyColumn ? 'left' : 'right';
        } else if (isGridRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;
        } else if (isFilterRow) {
            isSelected = false;
        } else if (isColumnSelected) {
            isSelected = true;
        } else { // header or summary or other
            isSelected = grid.isCellSelectedInColumn(x);
        }

        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        if (!isHandleColumn) {
            config.dataRow = grid.getRow(r);
            config.value = cellEvent.value;
        } else if (isGridRow) {
            // row handle for a data row
            config.value = [images.checkbox(isRowSelected), r + 1, null]; // row number is 1-based
        } else if (isHeaderRow) {
            // row handle for header row: gets "master" checkbox
            config.value = [images.checkbox(grid.areAllRowsSelected()), '', null];
        } else if (isFilterRow) {
            // row handle for filter row: gets filter icon
            config.value = [images.filter(false), '', null];
        } else {
            // row handles for "summary" or other rows: empty
            config.value = '';
        }

        config.isSelected = isSelected;
        config.isGridColumn = !isRowHandleOrHierarchyColumn;
        config.isGridRow = isGridRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isUserDataArea = !isRowHandleOrHierarchyColumn && isGridRow;
        config.isColumnHovered = cellEvent.isColumnHovered;
        config.isRowHovered = cellEvent.isRowHovered;
        config.isCellHovered = cellEvent.isCellHovered;
        config.bounds = cellEvent.bounds;
        config.isCellSelected = isCellSelected;
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = grid.isInCurrentSelectionRectangle(x, r);

        if (grid.mouseDownState) {
            config.mouseDown = grid.mouseDownState.gridCell.equals(cellEvent.gridCell);
        }

        // This call's dataModel.getCell which developer can override to:
        // * mutate the (writable) properties of `config`
        // * mutate cell renderer choice (instance of which is returned)
        var cellRenderer = behavior.getCellRenderer(config, cellEvent);

        // Overwrite possibly mutated cell properties, if requested to do so by `getCell` override
        if (config.reapplyCellProperties) {
            _(config).extendOwn(cellProperties);
        }

        behavior.cellPropertiesPrePaintNotification(config);

        //allow the renderer to identify itself if it's a button
        config.buttonCells = this.buttonCells;

        config.formatValue = grid.getFormatter(config.isUserDataArea && config.format);

        cellRenderer.paint(gc, config);

        this.renderedColumnMinWidths[x] = Math.max(config.minWidth || 0, this.renderedColumnMinWidths[x]);
        this.baseProperties.preferredWidth = this.renderedColumnMinWidths[x];
    },

    isViewableButton: function(c, r) {
        var key = c + ',' + r;
        return this.buttonCells[key] === true;
    },

    startAnimator: function() {
        var self = this;
        requestAnimationFrame(function animate() {
            self.animate();
            requestAnimationFrame(animate);
        });
    },

    animate: function() {
        var ctx = this.getCanvas().canvasCTX;
        ctx.beginPath();
        ctx.save();
        this.renderLastSelection(ctx);
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

var warnings = {};
function warn(name, message) {
    if (!warnings[name]) {
        warnings[name] = true;
        console.warn(message);
    }
}

module.exports = Renderer;
