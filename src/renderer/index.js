/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var Base = require('../Base');
var images = require('../../images/index');


var visibleColumnPropertiesDescriptor = {
    find: {
        // Like Array.prototype.find except searches negative indexes as well.
        value: function(iteratee, context) {
            for (var i = -1; i in this; --i); // eslint-disable-line curly
            while (++i) {
                if (iteratee.call(context, this[i], i, this)) {
                    return this[i];
                }
            }
            return Array.prototype.find.call(this, iteratee, context);
        }
    }
};


/** @typedef {object} CanvasRenderingContext2D
 * @see [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */

/** @typedef {object} visibleColumnDescriptor
 * @property {number} index - A back reference to the element's array index in {@link Renderer#visibleColumns}.
 * @property {number} columnIndex - Dereferences {@link Behavior#columns}, the subset of _active_ columns, specifying which column to show in that position.
 * @property {number} left - Pixel coordinate of the left edge of this column, rounded to nearest integer.
 * @property {number} right - Pixel coordinate of the right edge of this column, rounded to nearest integer.
 * @property {number} width - Width of this column in pixels, rounded to nearest integer.
 */

/** @typedef {object} visibleRowDescriptor
 * @property {number} index - A back reference to the element's array index in {@link Renderer#visibleRows}.
 * @property {number} rowIndex - Local vertical row coordinate within the subgrid to which the row belongs, adjusted for scrolling.
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

        /**
         * Represents the ordered set of visible columns. Array size is always the exact number of visible columns, the last of which may only be partially visible.
         *
         * This sequence of elements' `columnIndex` values assumes one of three patterns. Which pattern is base on the following two questions:
         * * Are there "fixed" columns on the left?
         * * Is the grid horizontally scrolled?
         *
         * The set of `columnIndex` values consists of:
         * 1. The first element will be -1 if the row handle column is being rendered.
         * 2. A zero-based list of consecutive of integers representing the fixed columns (if any).
         * 3. An n-based list of consecutive of integers representing the scrollable columns (where n = number of fixed columns + the number of columns scrolled off to the left).
         * @type {visibleColumnDescriptor}
         */
        this.visibleColumns = Object.defineProperties([], visibleColumnPropertiesDescriptor);

        /**
         * Represents the ordered set of visible rows. Array size is always the exact number of visible rows.
         *
         * The sequence of elements' `rowIndex` values is local to each subgrid.
         * * **For each non-scrollable subgrid:** The sequence is a zero-based list of consecutive integers.
         * * **For the scrollable subgrid:**
         *   1. A zero-based list of consecutive of integers representing the fixed rows (if any).
         *   2. An n-based list of consecutive of integers representing the scrollable rows (where n = number of fixed rows + the number of rows scrolled off the top).
         *
         * Note that non-scrollable subgrids can come both before _and_ after the scrollable subgrid.
         * @type {visibleRowDescriptor}
         */
        this.visibleRows = [];

        this.insertionBounds = [];

        this.cellEventPool = [];
    },

    /**
     * @summary Constructor logic
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     * @memberOf Renderer.prototype
     */
    initialize: function(grid) {
        this.grid = grid;

        // typically grid properties won't exist yet
        this.setGridRenderer(grid.properties && grid.properties.gridRenderer || 'by-columns-and-rows');

        this.reset();
    },

    gridRenderers: {},

    registerGridRenderer: function(gridRenderer, name) {
        this.gridRenderers[name || gridRenderer.key] = gridRenderer;
    },

    setGridRenderer: function(key) {
        var paintCells = this.gridRenderers[key];

        if (!paintCells) {
            throw new this.HypergridError('Unregistered grid renderer "' + key + '"');
        }

        if (paintCells !== this.paintCells) {
            this.paintCells = paintCells;
            this.paintCells.reset = true;
        }
    },

    resetAllGridRenderers: function(blackList) {
        // Notify renderers that grid shape has changed
        Object.keys(this.gridRenderers).forEach(function(key) {
            this.gridRenderers[key].reset = !blackList || blackList.indexOf(key) < 0;
        }, this);
    },

    /**
     * Certain renderers that pre-bundle column rects based on columns' background colors need to re-bundle when columns' background colors change. This method sets the `rebundle` property to `true` for those renderers that have that property.
     */
    rebundleGridRenderers: function() {
        Object.keys(this.gridRenderers).forEach(function(key) {
            if ('rebundle' in this.gridRenderers[key]) {
                this.gridRenderers[key].rebundle = true;
            }
        }, this);
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

            fixedColumnCount = this.grid.getFixedColumnCount(),
            fixedRowCount = this.grid.getFixedRowCount(),

            numRows = this.grid.getRowCount(),
            bounds = this.getBounds(),
            grid = this.grid,
            behavior = grid.behavior,
            editorCellEvent = grid.cellEditor && grid.cellEditor.event,
            dx = editorCellEvent && editorCellEvent.gridCell.x,
            dy = editorCellEvent && editorCellEvent.dataCell.y,
            vcEd,
            vrEd,

            insertionBoundsCursor = 0,
            previousInsertionBoundsCursorValue = 0,

            lineWidth = grid.properties.lineWidth,

            start = grid.properties.showRowNumbers ? -1 : 0,
            x, X, // horizontal pixel loop index and limit
            y, Y, // vertical pixel loop index and limit
            c, C, // column loop index and limit
            g, G, // subgrid loop index and limit
            r, R, // row loop index and limitrows in current subgrid
            subrows, // rows in subgrid g
            base, // sum of rows for all subgrids so far
            subgrids = behavior.subgrids,
            subgrid,
            rowIndex,
            scrollableSubgrid,
            footerHeight,
            vx, vy,
            vr, vc,
            width, height,
            firstVX, lastVX,
            firstVY, lastVY,
            topR,
            xSpaced, widthSpaced, heightSpaced; // adjusted for cell spacing

        this.scrollHeight = 0;

        this.visibleColumns.length = 0;
        this.visibleRows.length = 0;

        this.visibleColumnsByIndex = []; // array because number of columns will always be reasonable
        this.visibleRowsByDataRowIndex = {}; // hash because keyed by (fixed and) scrolled row indexes

        this.insertionBounds = [];

        for (
            x = 0, c = start, C = this.grid.getColumnCount(), X = bounds.width || grid.canvas.width;
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

            width = Math.ceil(behavior.getColumnWidth(vx));

            xSpaced = x ? x + lineWidth : x;
            widthSpaced = x ? width - lineWidth : width;
            this.visibleColumns[c] = this.visibleColumnsByIndex[vx] = vc = {
                index: c,
                columnIndex: vx,
                column: behavior.getActiveColumn(vx),
                left: xSpaced,
                width: widthSpaced,
                right: xSpaced + widthSpaced
            };
            if (dx === vx) {
                vcEd = vc;
            }

            x += width;

            insertionBoundsCursor += Math.round(width / 2) + previousInsertionBoundsCursorValue;
            this.insertionBounds.push(insertionBoundsCursor);
            previousInsertionBoundsCursorValue = Math.round(width / 2);
        }

        // get height of total number of rows in all subgrids that follow the data subgrid
        footerHeight = grid.properties.defaultRowHeight * subgrids.reduce(function(rows, subgrid) {
            if (scrollableSubgrid) {
                rows += subgrid.getRowCount();
            } else {
                scrollableSubgrid = subgrid.isData;
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
            scrollableSubgrid = subgrid.isData;
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

                rowIndex = vy - base;
                height = Math.ceil(behavior.getRowHeight(rowIndex, subgrid));

                heightSpaced = height - lineWidth;
                this.visibleRows[r] = vr = {
                    index: r,
                    subgrid: subgrid,
                    rowIndex: rowIndex,
                    top: y,
                    height: heightSpaced,
                    bottom: y + heightSpaced
                };
                if (scrollableSubgrid) {
                    this.visibleRowsByDataRowIndex[vy - base] = vr;
                    if (dy === rowIndex) {
                        vrEd = vr;
                    }
                }

                y += height;
            }

            if (scrollableSubgrid) {
                subrows = r - topR;
                Y += footerHeight;
            }
        }

        if (editorCellEvent) {
            editorCellEvent.visibleColumn = vcEd;
            editorCellEvent.visibleRow = vrEd;
            editorCellEvent.gridCell.y = vrEd && vrEd.index;
            editorCellEvent._bounds = null;
        }

        this.viewHeight = Y;

        this.dataWindow = this.grid.newRectangle(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);

        // Create an "info" column that stretches from column 0 to column n
        var info = behavior.subgrids.info;
        if (info) {
            if (C) {
                this.visibleColumns.info = {
                    index: vc.index,
                    columnIndex: vc.columnIndex,
                    column: vc.column,
                    left: this.visibleColumns[0].left,
                    width: vc.right - this.visibleColumns[0].left,
                    right: vc.right
                };
            }
            // Pad all info rows sufficiently to reach bottom of canvas
            // This code will work for a multi-row info subgrid.
            // (InfoSubgrid currently only supports a single row.)
            // todo: assumes foot subgrids are empty when info subgrid is not
            // todo: assumes there is at most one info subgrid
            var infoRowCount = info.getRowCount();
            if (infoRowCount) {
                y = bounds.height - y;
                if (y > 0) {
                    Y = Math.floor(y / infoRowCount);
                    y = y % infoRowCount;
                    var i = 0, k = 0;
                    this.visibleRows.forEach(function(vr) {
                        if (vr.subgrid.isInfo) {
                            var j = Y + (i++ < y ? 1 : 0);
                            vr.top += k;
                            vr.height += j;
                            vr.bottom += j;
                            k += j;
                        }
                    });
                }
            }
        }

        // Resize CellEvent pool
        var pool = this.cellEventPool,
            previousLength = pool.length,
            P = (this.visibleColumns.length - start) * this.visibleRows.length;

        if (P > previousLength) {
            pool.length = P; // grow pool to accommodate more cells
        }
        for (var p = previousLength; p < P; p++) {
            pool[p] = new behavior.CellEvent; // instantiate new members
        }

        this.resetAllGridRenderers();
    },

    /**
     * CAUTION: Keep in place! Used by {@link Canvas}.
     * @memberOf Renderer.prototype
     * @returns {Object} The current grid properties object.
     */
    get properties() {
        return this.grid.properties;
    },

    /**
     * Previously used by fin-canvas.
     * @memberOf Renderer.prototype
     * @returns {Object} a property value at a key, delegates to the grid
     * @deprecated
     */
    resolveProperty: function(key) {
        this.deprecated('resolveProperty', 'The .resolveProperty(key) method is deprecated as of v1.2.10 in favor of the .grid.properties object dereferenced with [key]. (Will be removed in a future release.)');
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
                gc.cache.font = '20px Arial';
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
        this.deprecated('getVisibleRows', 'The getVisibleRows() method has been deprecated as of v1.2.0. (Will be removed in a future version.) Previously returned the this.visibleRows array but because this.visibleRows is no longer a simple array of integers but is now an array of objects, it now returns an array mapped to this.visibleRows[*].rowIndex. Note however that this mapping is not equivalent to what this method previously returned because while each object\'s .rowIndex property is still adjusted for scrolling within the data subgrid, the index is now local to (zero-based within) each subgrid');
        return this.visibleRows.map(function(vr) { return vr.rowIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Number of columns we just rendered.
     */
    getVisibleColumnsCount: function() {
        return this.visibleColumns.length - 1;
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} Columns we just rendered.
     */
    getVisibleColumns: function() {
        this.deprecated('visibleColumns', 'The getVisibleColumns() method has been deprecated as of v1.2.0. (Will be removed in a future version.) Previously returned the this.visibleColumns but because this.visibleColumns is no longer a simple array of integers but is now an array of objects, it now returns an array mapped to the equivalent visibleColumns[*].columnIndex.');
        return this.visibleColumns.map(function(vc) { return vc.columnIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CellEvent|number} x - CellEvent object or grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @returns {Rectangle} Bounding rect of cell with the given coordinates.
     */
    getBoundsOfCell: function(x, y) {
        var vc = this.visibleColumns[x],
            vr = this.visibleRows[y];

        return {
            x: vc.left,
            y: vr.top,
            width: vc.width,
            height: vr.height
        };
    },

    /**
     * @memberOf Renderer.prototype
     * @desc answer the column index under the coordinate at pixelX
     * @param {number} pixelX - The horizontal coordinate.
     * @returns {number} The column index under the coordinate at pixelX.
     */
    getColumnFromPixelX: function(pixelX) {
        var width = 0,
            fixedColumnCount = this.grid.getFixedColumnCount(),
            scrollLeft = this.grid.getHScrollValue(),
            visibleColumns = this.visibleColumns;

        for (var c = 1; c < visibleColumns.length - 1; c++) {
            width = visibleColumns[c].left - (visibleColumns[c].left - visibleColumns[c - 1].left) / 2;
            if (pixelX < width) {
                if (c > fixedColumnCount) {
                    c += scrollLeft;
                }
                return c - 1;
            }
        }
        if (c > fixedColumnCount) {
            c += scrollLeft;
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
        var x = point.x,
            y = point.y,
            vrs = this.visibleRows,
            vcs = this.visibleColumns,
            firstColumn = vcs[this.grid.properties.showRowNumbers ? -1 : 0],
            inFirstColumn = x < firstColumn.right,
            vc = inFirstColumn ? firstColumn : vcs.find(function(vc) { return x < vc.right; }) || vcs[vcs.length - 1],
            vr = vrs.find(function(vr) { return y < vr.bottom; }) || vrs[vrs.length - 1],
            mousePoint = this.grid.newPoint(x - vc.left, y - vr.top),
            cellEvent = new this.grid.behavior.CellEvent(vc.columnIndex, vr.index);

        // cellEvent.visibleColumn = vc;
        // cellEvent.visibleRow = vr;

        return Object.defineProperty(cellEvent, 'mousePoint', { value: mousePoint });
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines if a column is visible.
     * @param {number} colIndex - the column index*
     * @returns {boolean} The given column is fully visible.
     */
    isColumnVisible: function(columnIndex) {
        return !!this.visibleColumns.find(function(vc) { return vc.columnIndex === columnIndex; });
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {number} The width x coordinate of the last rendered column
     */
    getFinalVisibleColumnBoundary: function() {
        var chop = this.isLastColumnVisible() ? 2 : 1;
        var colWall = this.visibleColumns[this.visibleColumns.length - chop].right;
        return Math.min(colWall, this.getBounds().width);
    },

    /**
     * @memberOf Renderer.prototype
     * @summary Determines visibility of a row.
     * @param {number} y - The physical (unscrolled) grid row index.
     * @returns {boolean} The given row is fully visible.
     */
    isRowVisible: function(y) {
        return !!this.visibleRows[y];
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

        this.buttonCells = {};
        this.paintCells(gc);
        resetNumberColumnWidth(gc, this.grid.behavior);

        this.renderOverrides(gc);

        this.renderLastSelection(gc);

        gc.closePath();
    },

    renderLastSelection: function(gc) {
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
            lastColumn = this.visibleColumns[this.visibleColumns.length - 1], // last column in scrollable section
            lastRow = vri[this.dataWindow.corner.y]; // last row in scrollable data section
        if (
            !lastColumn || !lastRow ||
            selection.origin.x > lastColumn.columnIndex ||
            selection.origin.y > lastRow.rowIndex
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

        var gridProps = this.grid.properties;
        vcOrigin = vcOrigin || this.visibleColumns[gridProps.fixedColumnCount];
        vrOrigin = vrOrigin || this.visibleRows[gridProps.fixedRowCount];
        vcCorner = vcCorner || (selection.corner.x > lastColumn.columnIndex ? lastColumn : vci[gridProps.fixedColumnCount - 1]);
        vrCorner = vrCorner || (selection.corner.y > lastRow.rowIndex ? lastRow : vri[gridProps.fixedRowCount - 1]);

        // Render the selection model around the bounds
        var config = {
            bounds: {
                x: vcOrigin.left,
                y: vrOrigin.top,
                width: vcCorner.right - vcOrigin.left,
                height: vrCorner.bottom - vrOrigin.top
            },
            selectionRegionOverlayColor: gridProps.selectionRegionOverlayColor,
            selectionRegionOutlineColor: gridProps.selectionRegionOutlineColor
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
        gc.cache.fillStyle = this.grid.properties.backgroundColor2;
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
        this.deprecated('columnEdges', 'The getColumnEdges() mehtod has been deprecated as of version 1.2.0 in favor of visibleColumns[*].top. (Will be removed in a future version.) Note however that columnEdges had one additional element (representing the right edge of the last visible column) which visibleColumns lacks. Instead you can reference visibleColumns[*].bottom.');
        return this.visibleColumns.map(function(vc) { return vc.left; }).concat([this.visibleColumns[this.visibleColumns.length - 1].right]);
    },

    getRowEdges: function() {
        this.deprecated('rowEdges', 'The getRowEdges() method has been deprecated as of version 1.2.0 in favor of visibleRows[*].top. (Will be removed in a future version.) Note however that rowEdges had one additional element (representing the bottom edge of the last visible row) which visibleRows lacks. Instead you can reference visibleRows[*].bottom.');
        return this.visibleRows.map(function(vr) { return vr.top; }).concat([this.visibleRows[this.visibleRows.length - 1].bottom]);
    },

    /**
     * @memberOf Renderer.prototype
     * @returns {boolean} The last col was rendered (is visible)
     */
    isLastColumnVisible: function() {
        var lastColumnIndex = this.grid.getColumnCount() - 1;
        return !!this.visibleColumns.find(function(vc) { return vc.columnIndex === lastColumnIndex; });
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
        return this.deprecated('getCanvas()', 'grid.canvas', '1.2.2');
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
            scanHeight += grid.getRowHeight(top);
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

    renderErrorCell: function(err, gc, vc, vr) {
        var message = err && (err.message || err) || 'Unknown error.',
            bounds = { x: vc.left, y: vr.top, width: vc.width, height: vr.height },
            config = { bounds: bounds };

        console.error(message);

        gc.cache.save(); // define clipping region
        gc.beginPath();
        gc.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        gc.clip();

        this.grid.cellRenderers.get('errorcell').paint(gc, config, message);

        gc.cache.restore(); // discard clipping region
    },

    /**
     * @memberOf Renderer.prototype
     * @desc We opted to not paint borders for each cell as that was extremely expensive. Instead we draw gridlines here. Also we record the widths and heights for later.
     * @param {CanvasRenderingContext2D} gc
     */
    paintGridlines: function(gc) {
        var visibleColumns = this.visibleColumns, C = visibleColumns.length,
            visibleRows = this.visibleRows, R = visibleRows.length;

        if (C && R) {
            var gridProps = this.grid.properties,
                lineWidth = gridProps.lineWidth,
                lineColor = gridProps.lineColor;

            if (gridProps.gridLinesV) {
                gc.cache.fillStyle = lineColor;
                var viewHeight = visibleRows[R - 1].bottom;
                for (var c = gridProps.showRowNumbers ? 0 : 1; c < C; c++) {
                    gc.fillRect(visibleColumns[c].left - lineWidth, 0, lineWidth, viewHeight);
                }
            }

            if (gridProps.gridLinesH) {
                gc.cache.fillStyle = lineColor;
                var viewWidth = visibleColumns[C - 1].right;
                for (var r = 0; r < R; r++) {
                    gc.fillRect(0, visibleRows[r].bottom, viewWidth, lineWidth);
                }
            }
        }
    },

    /**
     * @memberOf Renderer.prototype
     * @param {CanvasRenderingContext2D} gc
     * @param x
     * @param y
     */
    paintCell: function(gc, x, y) {
        gc.moveTo(0, 0);

        var c = this.visibleColumns[x].index, // todo refac
            r = this.visibleRows[y].index;

        if (c) { //something is being viewed at at the moment (otherwise returns undefined)
            this._paintCell(gc, c, r);
        }
    },

    _paintCell: function(gc, cellEvent, prefillColor) {
        var grid = this.grid,
            selectionModel = grid.selectionModel,
            behavior = grid.behavior,
            x = cellEvent.gridCell.x,
            // y = cellEvent.gridCell.y,
            // c = cellEvent.dataCell.x,
            r = cellEvent.dataCell.y,

            isHandleColumn = cellEvent.isHandleColumn,
            isHierarchyColumn = cellEvent.isHierarchyColumn,
            isColumnSelected = cellEvent.isColumnSelected,

            isDataRow = cellEvent.isDataRow,
            isRowSelected = cellEvent.isRowSelected,
            isCellSelected = cellEvent.isCellSelected,

            isHeaderRow = cellEvent.isHeaderRow,
            isFilterRow = cellEvent.isFilterRow,

            isRowHandleOrHierarchyColumn = isHandleColumn || isHierarchyColumn,
            isUserDataArea = !isRowHandleOrHierarchyColumn && isDataRow,

            config = Object.create(cellEvent.properties), // cell props || specific column props object (wrapped)
            isSelected;

        if (isHandleColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'right';
        } else if (isHierarchyColumn) {
            isSelected = isRowSelected || selectionModel.isCellSelectedInRow(r);
            config.halign = 'left';
        } else if (isDataRow) {
            isSelected = isCellSelected || isRowSelected || isColumnSelected;

            // Iff we have a defined rowProperties array, apply it to config, treating it as a repeating pattern, keyed to row index.
            // Note that Object.assign will ignore undefined.
            var row = cellEvent.columnProperties.rowProperties;
            Object.assign(config, row && row[cellEvent.dataCell.y % row.length]);
        } else if (isFilterRow) {
            isSelected = false;
        } else if (isColumnSelected) {
            isSelected = true;
        } else { // header or summary or other
            isSelected = selectionModel.isCellSelectedInColumn(x);
        }

        // Set cell contents:
        // * For all cells: set `config.value` (writable property)
        // * For cells outside of row handle column: also set `config.dataRow` for use by valOrFunc
        if (!isHandleColumn) {
            config.dataRow = cellEvent.row;
            config.value = cellEvent.value;
        } else {
            config.isHandleColumn = true;
            if (isDataRow) {
                // row handle for a data row
                config.value = r + 1; // row number is 1-based
            } else if (isHeaderRow) {
                // row handle for header row: gets "master" checkbox
                config.allRowsSelected = selectionModel.areAllRowsSelected();
            }
        }

        config.isSelected = isSelected;
        config.isDataColumn = !isRowHandleOrHierarchyColumn;
        config.isDataRow = isDataRow;
        config.isHeaderRow = isHeaderRow;
        config.isFilterRow = isFilterRow;
        config.isInfoRow = cellEvent.isInfoRow;
        config.isUserDataArea = isUserDataArea;
        config.isColumnHovered = cellEvent.isColumnHovered;
        config.isRowHovered = cellEvent.isRowHovered;
        config.isCellHovered = cellEvent.isCellHovered;
        config.bounds = cellEvent.bounds;
        config.isCellSelected = isCellSelected;
        config.isRowSelected = isRowSelected;
        config.isColumnSelected = isColumnSelected;
        config.isInCurrentSelectionRectangle = selectionModel.isInCurrentSelectionRectangle(x, r);
        config.prefillColor = prefillColor;

        if (grid.mouseDownState) {
            config.mouseDown = grid.mouseDownState.gridCell.equals(cellEvent.gridCell);
        }

        // This call's dataModel.getCell which developer can override to:
        // * mutate the (writable) properties of `config`
        // * mutate cell renderer choice (instance of which is returned)
        var cellRenderer = behavior.getCellRenderer(config, cellEvent);

        if (!isHandleColumn && config.value) {
            if (config.value.constructor === Array) {
                config.value[1] = config.exec(config.value[1]);
            } else {
                config.value = config.exec(config.value);
            }
        }

        // Overwrite possibly mutated cell properties, if requested to do so by `getCell` override
        if (cellEvent.cellOwnProperties && config.reapplyCellProperties) {
            Object.assign(config, cellEvent.cellOwnProperties);
        }

        behavior.cellPropertiesPrePaintNotification(config);

        //allow the renderer to identify itself if it's a button
        config.buttonCells = this.buttonCells;

        config.formatValue = grid.getFormatter(config.isDataColumn && config.format);

        // Following supports partial render (when `paint` aborts before setting `minWidth`)
        config.snapshot = cellEvent.snapshot;
        config.minWidth = cellEvent.minWidth;

        // Render the cell
        cellRenderer.paint(gc, config);

        // Following supports partial render:
        cellEvent.snapshot = config.snapshot;
        cellEvent.minWidth = config.minWidth;

        return config.minWidth;
    },

    isViewableButton: function(c, r) {
        var key = c + ',' + r;
        return this.buttonCells[key] === true;
    },

    getBounds: function() {
        return this.bounds;
    },

    setBounds: function(bounds) {
        return (this.bounds = bounds);
    }
});

function resetNumberColumnWidth(gc, behavior) {
    var rowCount = behavior.dataModel.getRowCount(),
        columnProperties = behavior.getColumnProperties(-1),
        cellProperties = columnProperties.rowHeader,
        padding = 2 * columnProperties.cellPadding;

    gc.cache.font = cellProperties.font;
    columnProperties.preferredWidth = images.checked.width + padding + gc.getTextWidth(rowCount);
    if (columnProperties.width === undefined) {
        columnProperties.width = columnProperties.preferredWidth;
    }
}

Renderer.prototype.registerGridRenderer(require('./by-cells'));
Renderer.prototype.registerGridRenderer(require('./by-columns'));
Renderer.prototype.registerGridRenderer(require('./by-columns-discrete'));
Renderer.prototype.registerGridRenderer(require('./by-columns-and-rows'));
Renderer.prototype.registerGridRenderer(require('./by-rows'));

module.exports = Renderer;
