/* global SimpleLRU */

/**
 *
 * @module .\renderer
 * @description
fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.

It relies on two other external subprojects

1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
2. fin-rectangles: a small library providing Point and Rectangle objects

The fin-ypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.

Instances of this object have basically four main functions.

1. render fixed row headers
2. render fixed col headers
3. render main data cells
4. render grid lines

**/

'use strict';

//var noop = function() {};

/**
 *
 * @property {object} fontData - the cached font heights
 */
var fontData = {};

/**
 *
 * @property {SimpleLRU} textWidthCache - a LRU cache of 10000 of text widths
 */
var textWidthCache = new SimpleLRU(10000);


var getTextWidth = function(gc, string) {
    if (string === null || string === undefined) {
        return 0;
    }
    string = string + '';
    if (string.length === 0) {
        return 0;
    }
    var key = gc.font + string;
    var width = textWidthCache.get(key);
    if (!width) {
        width = gc.measureText(string).width;
        textWidthCache.set(key, width);
    }
    return width;
};

var getTextHeight = function(font) {

    var result = fontData[font];
    if (result) {
        return result;
    }
    result = {};
    var text = document.createElement('span');
    text.textContent = 'Hg';
    text.style.font = font;

    var block = document.createElement('div');
    block.style.display = 'inline-block';
    block.style.width = '1px';
    block.style.height = '0px';

    var div = document.createElement('div');
    div.appendChild(text);
    div.appendChild(block);

    div.style.position = 'absolute';
    document.body.appendChild(div);

    try {

        block.style.verticalAlign = 'baseline';

        var blockRect = block.getBoundingClientRect();
        var textRect = text.getBoundingClientRect();

        result.ascent = blockRect.top - textRect.top;

        block.style.verticalAlign = 'bottom';
        result.height = blockRect.top - textRect.top;

        result.descent = result.height - result.ascent;

    } finally {
        document.body.removeChild(div);
    }
    if (result.height !== 0) {
        fontData[font] = result;
    }
    return result;
};

// var clearObjectProperties = function(obj) {
//     for (var prop in obj) {
//         if (obj.hasOwnProperty(prop)) {
//             delete obj[prop];
//         }
//     }
// };

var merge = function(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
};

(function() {

    Polymer({ /* jslint ignore:line */

        //the shared single item "pooled" cell object for drawing each cell
        cell: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },

        /**
         * @function
         * @instance
         * @description
        a Polymer web-component life cycle event, called when an instance of this is plugged into the dom
         *
         */
        attached: function() {
            this.readyInit();
            this.columnEdges = [];
            this.columnEdgesIndexMap = {};
            this.renderedColumnMinWidths = [];
            this.renderedHeight = 0;
            this.rowEdges = [];
            this.rowEdgesIndexMap = {};
            this.viewableColumns = [];
            this.viewableRows = [];
            this.insertionBounds = []; // this is the midpoint of each column, used for dnd
        },


        //this function computes the grid coordinates used for extremely fast iteration over
        //painting the grid cells. this function is extremely fast, for thousand rows X columns
        //on a modest machine taking usually 0ms and no more that 3 ms.
        computeCellsBounds: function() {

            //var startTime = Date.now();

            var scrollTop = this.getScrollTop();
            var scrollLeft = this.getScrollLeft();

            var numColumns = this.getColumnCount();
            var numFixedColumns = this.getFixedColumnCount();

            var numRows = this.getRowCount();
            var numFixedRows = this.getFixedRowCount();

            var bounds = this.getGrid().getBoundingClientRect();
            var viewWidth = bounds.width;
            var viewHeight = bounds.height;

            var x, y, c, r, vx, vy, width, height;

            this.getColumnEdges().length = 0;
            this.rowEdges.length = 0;

            this.columnEdges[0] = 0;
            this.rowEdges[0] = 0;

            this.viewableColumns.length = 0;
            this.viewableRows.length = 0;
            this.columnEdgesIndexMap = {};
            this.rowEdgesIndexMap = {};

            x = 0;
            for (c = 0; c < numColumns; c++) {
                vx = c;
                if (c >= numFixedColumns) {
                    vx = vx + scrollLeft;
                }
                if (x > viewWidth || numColumns <= vx) {
                    break;
                }
                width = this.getColumnWidth(vx);
                x = x + width;
                this.columnEdges[c + 1] = Math.round(x);
                this.viewableColumns[c] = vx;
                this.columnEdgesIndexMap[vx] = c;
            }

            y = 0;
            for (r = 0; r < numRows; r++) {
                vy = r;
                if (r >= numFixedRows) {
                    vy = vy + scrollTop;
                }
                if (y > viewHeight || numRows <= vy) {
                    break;
                }
                height = this.getRowHeight(vy);
                y = y + height;
                this.rowEdges[r + 1] = Math.round(y);
                this.viewableRows[r] = vy;
                this.rowEdgesIndexMap[vy] = r;
            }
            // console.log('cols', this.getColumnEdges());
            // console.log('rows', this.rowEdges);
            // console.log('col#', this.viewableColumns);
            // console.log('row#', this.viewableRows);
            //console.log('ms', Date.now() - startTime);
        },

        /**
         * @function
         * @instance
         * @description
        returns a property value at a key, delegates to the grid
         * #### returns: Object
         */
        resolveProperty: function(key) {
            return this.getGrid().resolveProperty(key);
        },

        /**
         * @function
         * @instance
         * @description
        getter for the [fin-hypergrid](module-._fin-hypergrid.html)
         * #### returns: fin-hypergrid
         */
        getGrid: function() {
            return this.grid;
        },

        /**
         * @function
         * @instance
         * @description
        setter for the [fin-hypergrid](module-._fin-hypergrid.html)
         *
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setGrid: function(grid) {

            this.grid = grid;

            //lets make use of prototype inheritance for cell properties
            this.initializeProperties();
        },

        initializeProperties: function() {
            var grid = this.getGrid();
            this.columnProperties = Object.create(grid.lnfProperties);
            this.cellProperties = Object.create(this.columnProperties);
            this.cellProperties.getTextWidth = getTextWidth;
            this.cellProperties.getTextHeight = getTextHeight;
        },

        /**
         * @function
         * @instance
         * @description
        This is the entry point from fin-canvas.  Notify the fin-hypergrid everytime we've repainted.
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         */
        paint: function(gc) {
            if (!this.grid) {
                return;
            }
            this.renderGrid(gc);
            this.getGrid().gridRenderedNotification();
        },

        /**
         * @function
         * @instance
         * @description
        Answer how many rows we rendered
         * #### returns: integer
         */
        getVisibleRowsCount: function() {
            return this.viewableRows.length;
        },

        /**
         * @function
         * @instance
         * @description
        Answer what rows we just rendered as an Array of integers
         * #### returns: Array
         */
        getVisibleRows: function() {
            return this.viewableRows;
        },

        /**
         * @function
         * @instance
         * @description
        Answer how many columns we just rendered
         * #### returns: integer
         */
        getVisibleColumnsCount: function() {
            return this.viewableColumns.length;
        },

        /**
         * @function
         * @instance
         * @description
        Answer what columns we just rendered as an Array of indexes
         * #### returns: Array
         */
        getVisibleColumns: function() {
            return this.viewableColumns;
        },

        /**
         * @function
         * @instance
         * @description
        answer with the column index if the mouseEvent coordinates are over a column divider
         * #### returns: integer
         */
        overColumnDivider: function(x) {
            x = Math.round(x);
            var whichCol = this.getColumnEdges().indexOf(x - 1);
            if (whichCol < 0) {
                whichCol = this.getColumnEdges().indexOf(x);
            }
            if (whichCol < 0) {
                whichCol = this.getColumnEdges().indexOf(x - 2);
            }
            if (whichCol < 0) {
                whichCol = this.getColumnEdges().indexOf(x + 1);
            }
            if (whichCol < 0) {
                whichCol = this.getColumnEdges().indexOf(x - 3);
            }

            return whichCol;
        },

        /**
         * @function
         * @instance
         * @description
        answer with the row index if the mouseEvent coordinates are over a row divider
         * #### returns: integer
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
         * @function
         * @instance
         * @description
        answer with a rectangle the bounds of a specific cell
         *
         * @param {fin-rectangle.point} cell - [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @description
         * #### returns: [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        getBoundsOfCell: function(cell) {
            return this._getBoundsOfCell(cell.x, cell.y);
        },

        /**
         * @function
         * @instance
         * @description
        answer with a rectangle the bounds of a specific cell
         *
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         *
         * @description
         * #### returns: [fin-rectangle](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        _getBoundsOfCell: function(c, r) {
            var columnEdges = this.getColumnEdges();
            var x = this.columnEdgesIndexMap[c];
            var y = this.rowEdgesIndexMap[r];
            var ox = columnEdges[x],
                oy = this.rowEdges[y],
                cx = columnEdges[x + 1],
                cy = this.rowEdges[y + 1],
                ex = cx - ox,
                ey = cy - oy;

            var cell = this.cell;
            cell.x = ox;
            cell.y = oy;
            cell.width = ex;
            cell.height = ey;

            return cell;

        },

        /**
         * @function
         * @instance
         * @description
        answer the column index under the coordinate at pixelX
         *
         * @param {pixelX} x - x coordinate
         * @description
         * #### returns: integer
         */
        getColumnFromPixelX: function(pixelX) {
            pixelX = pixelX - this.getBehavior().getFixedColumnsWidth();
            var width = 0;
            var c;
            for (c = 0; c < this.insertionBounds.length; c++) {
                width = this.insertionBounds[c];
                if (pixelX < width) {
                    return c;
                }
            }
            return c;
        },

        /**
         * @function
         * @instance
         * @description
        Answer specific data cell coordinates given mouse coordinates in pixels.
         *
         * @param {fin-rectangle.point} point - [fin-rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         * @description
         * #### returns: Object
         */
        getGridCellFromMousePoint: function(point) {

            var width = 0;
            var height = 0;
            var x, y;
            var c, r;
            var previous = 0;
            for (c = 1; c < this.getColumnEdges().length; c++) {
                width = this.getColumnEdges()[c];
                if (point.x < width) {
                    x = Math.max(0, point.x - previous - 2);
                    break;
                }
                previous = width;
            }
            c--;
            previous = 0;
            for (r = 1; r < this.rowEdges.length; r++) {
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
            return {
                gridCell: this.g.point.create(c, r),
                mousePoint: this.g.point.create(x, y)
            };
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a column is visible, must be fully visible
         *
         * @param {integer} colIndex - the column index
         * @description
         * #### returns: boolean
         */
        isColumnVisible: function(colIndex) {
            var isVisible = this.viewableColumns.indexOf(colIndex) !== -1;
            return isVisible;
        },

        /**
         * @function
         * @instance
         * @description
        Answer the width x coordinate of the last rendered column
         * #### returns: integer
         */
        getFinalVisableColumnBoundry: function() {
            var isMaxX = this.isLastColumnVisible();
            var chop = isMaxX ? 2 : 1;
            var colWall = this.getColumnEdges()[this.getColumnEdges().length - chop];
            var result = Math.min(colWall, this.getBounds().width() - 200);
            return result;
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a row is visible, must be fully visible
         *
         * @param {integer} rowIndex - the row index
         *
         * @description
         * #### returns: boolean
         */
        isRowVisible: function(rowIndex) {
            var isVisible = this.viewableRows.indexOf(rowIndex) !== -1;
            return isVisible;
        },

        /**
         * @function
         * @instance
         * @description
        Answer if a data cell is selected.
         *
         * @param {integer} x - the x cell coordinate
         * @param {integer} y - the y cell coordinate
         *
         * @description
         * #### returns: boolean
         */
        isSelected: function(x, y) {
            return this.getGrid().isSelected(x, y);
        },

        /**
         * @function
         * @instance
         * @description
        This is the main forking of the renderering task.
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         */
        renderGrid: function(gc) {
            gc.beginPath();

            this.paintCells(gc);
            this.paintGridlines(gc);
            //this.blankOutOverflow(gc);
            //this.renderOverrides(gc);
            gc.closePath();
        },

        /**
         * @function
         * @instance
         * @description
        clear out the LRU cache of text widths
         *
         */
        resetTextWidthCache: function() {
            textWidthCache = new SimpleLRU(10000);
        },

        /**
         * @function
         * @instance
         * @description
        Paint the background color over the overflow from the final column paint
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
        */
        blankOutOverflow: function(gc) {
            var isMaxX = this.isLastColumnVisible();
            var chop = isMaxX ? 2 : 1;
            var x = this.getColumnEdges()[this.getColumnEdges().length - chop];
            var bounds = this.getGrid().getBoundingClientRect();
            var width = bounds.width - x;
            var height = bounds.height;
            gc.fillStyle = this.resolveProperty('backgroundColor2');
            gc.fillRect(x, 0, width, height);
        },

        /**
         * @function
         * @instance
         * @description
        iterate the renderering overrides and manifest each
         *
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
         * @function
         * @instance
         * @description
        copy each overrides specified area to it's target and blank out the source area
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {OverrideObject} override - an object with details contain an area and a target context
        */
        renderOverride: function(gc, override) {
            //lets blank out the drag row
            var behavior = this.getBehavior();
            var columnStarts = this.getColumnEdges();
            var fixedColCount = behavior.getFixedColumnCount();
            var hdpiRatio = override.hdpiratio;
            var startX = hdpiRatio * columnStarts[override.columnIndex + fixedColCount];
            var width = override.width;
            var height = override.height;
            var targetCTX = override.ctx;
            var imgData = gc.getImageData(startX, 0, width * hdpiRatio, height * hdpiRatio);
            targetCTX.putImageData(imgData, 0, 0);
            gc.fillStyle = this.resolveProperty('backgroundColor2');
            gc.fillRect(Math.round(startX / hdpiRatio), 0, width, height);

        },

        /**
         * @function
         * @instance
         * @description
        answers if x, y is currently being hovered over
         * #### returns: boolean
         * @param {integer} offsetX - x coordinate
         * @param {integer} offsetY - y coordinate
         *
        */
        isHovered: function(x, y) {
            return this.getGrid().isHovered(x, y);
        },

        /**
         * @function
         * @instance
         * @description
        answers if row y is currently being hovered over
         * #### returns: boolean
         * @param {integer} offsetY - y coordinate
         *
        */
        isRowHovered: function(y) {
            return this.getGrid().isRowHovered(y);
        },

        /**
         * @function
         * @instance
         * @description
        answers if column x is currently being hovered over
         * #### returns: boolean
         * @param {integer} offsetX - x coordinate
         *
        */
        isColumnHovered: function(x) {
            return this.getGrid().isColumnHovered(x);
        },

        /**
         * @function
         * @instance
         * @description
        Protected render the main cells.  We snapshot the context to insure against its polution.
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         *
        */
        paintCells: function(gc) {
            try {
                gc.save();
                this._paintCells(gc);
            } catch (e) {
                console.error(e);
            } finally {
                gc.restore();
            }
        },

        /**
         * @function
         * @instance
         * @description
        answers if a specfic column in the fixed row area is selected
         * @param {integer} colIndex - column index
         *
        */
        isFixedRowCellSelected: function(colIndex) {
            return this.getGrid().isFixedRowCellSelected(colIndex);
        },

        /**
         * @function
         * @instance
         * @description
        answers if a specfic row in the fixed column area is selected
         * @param {integer} rowIndex - column index
         *
        */
        isFixedColumnCellSelected: function(rowIndex) {
            return this.getGrid().isFixedColumnCellSelected(rowIndex);
        },

        /**
         * @function
         * @instance
         * @description
        answers current vertical scroll value
         * #### returns: integer
        */
        getScrollTop: function() {
            var st = this.getGrid().getVScrollValue();
            return st;
        },

        /**
         * @function
         * @instance
         * @description
        answers current horizontal scroll value
         * #### returns: integer
        */
        getScrollLeft: function() {
            var st = this.getGrid().getHScrollValue();
            return st;
        },

        /**
         * @function
         * @instance
         * @description
        getter for my behavior (model)
         * #### returns: [fin-hypergrid-behavior-base](module-behaviors_base.html)
        */
        getBehavior: function() {
            return this.getGrid().getBehavior();
        },

        getColumnEdges: function() {
            return this.columnEdges;
        },

        /**
         * @function
         * @instance
         * @description
        answers the row height of the row at index rowIndex
         * #### returns: integer
         * @param {integer} rowIndex - the row index
        */
        getRowHeight: function(rowIndex) {
            var height = this.getBehavior().getRowHeight(rowIndex);
            return height;
        },

        /**
         * @function
         * @instance
         * @description
        answers the columnWidth of the column at index columnIndex
         * #### returns: integer
         * @param {integer} columnIndex - the row index
        */
        getColumnWidth: function(columnIndex) {
            var width = this.getBehavior()._getColumnWidth(columnIndex);
            return width;
        },

        /**
         * @function
         * @instance
         * @description
        answer true if the last col was rendered (is visible)
         * #### returns: boolean
        */
        isLastColumnVisible: function() {
            var lastColumnIndex = this.getColumnCount() - 1;
            var isMax = this.viewableColumns.indexOf(lastColumnIndex) !== -1;
            return isMax;
        },

        /**
         * @function
         * @instance
         * @description
        answer the rendered column width at index
         * #### returns: integer
        */
        getRenderedWidth: function(index) {
            return this.getColumnEdges()[index];
        },

        /**
         * @function
         * @instance
         * @description
        answer the rendered row height at index
         * #### returns: integer
        */
        getRenderedHeight: function(index) {
            return this.rowEdges[index];
        },

        /**
         * @function
         * @instance
         * @description
        getter for my [fin-canvas](https://github.com/stevewirts/fin-canvas)
         * #### returns: [fin-canvas](https://github.com/stevewirts/fin-canvas)
        */
        getCanvas: function() {
            return this.getGrid().getCanvas();
        },

        /**
         * @function
         * @instance
         * @description
        answer if the user is currently dragging a column for reordering
         * #### returns: boolean
        */
        isDraggingColumn: function() {
            return this.getGrid().isDraggingColumn();
        },

        /**
         * @function
         * @instance
         * @description
        answer the row to goto for a page up
         * #### returns: integer
        */
        getPageUpRow: function() {
            if (this.rowEdges.length === 0) {
                return;
            }
            var behavior = this.getBehavior();
            var h = this.renderedHeight;
            var topRow = this.viewableRows[0];
            while (h > 0 && topRow >= 1) {
                topRow--;
                var eachHeight = behavior.getRowHeight(topRow);
                h = h - eachHeight;
            }
            if (topRow === 0) {
                return 0;
            }
            return topRow + 1;

        },

        /**
         * @function
         * @instance
         * @description
        return the number of columns
         *
         * #### returns: integer
         */
        getColumnCount: function() {
            return this.getGrid().getColumnCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of rows
         *
         * #### returns: integer
         */
        getRowCount: function() {
            return this.getGrid().getRowCount();
        },

        /**
         * @function
         * @instance
         * @description
        answer the row to goto for a page down
         * #### returns: integer
        */
        getPageDownRow: function() {
            if (this.rowEdges.length === 0) {
                return;
            }
            var row = this.viewableRows[this.viewableRows.length - 1] + 1;
            return row;
        },

        /**
         * @function
         * @instance
         * @description
        return the number of fixed columns
         *
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            return this.getGrid().getFixedColumnCount();
        },

        /**
         * @function
         * @instance
         * @description
        return the number of fixed rows
         *
         * #### returns: integer
         */
        getFixedRowCount: function() {
            return this.getGrid().getFixedRowCount();
        },

        /**
         * @function
         * @instance
         * @description
        Unprotected rendering the fixed columns along the left side
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         * @param {integer} numColumns - the max columns to iterate through
         * @param {integer} numRows - the max rows to iterate through
         *
        */
        _paintCells: function(gc) {
            var x, y, c, r = 0;
            var behavior = this.getBehavior();
            var visibleCols = this.getVisibleColumns();
            var visibleRows = this.getVisibleRows();
            gc.moveTo(0, 0);
            for (x = 0; x < visibleCols.length; x++) {
                c = visibleCols[x];
                var columnProperties = behavior.getColumnProperties(c);
                this.resetColumnProperties(columnProperties);
                for (y = 0; y < visibleRows.length; y++) {
                    r = visibleRows[y];
                    this._paintCell(gc, c, r);
                }
            }

        },

        /**
         * @function
         * @instance
         * @description
        We opted to not paint borders for each cell as that was extremely expensive.  Instead we draw gridlines here.  Also we record the widths and heights for later.
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
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
            gc.lineWidth = 1;
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

        //lets clear out and then repopulate the column properties
        //with new values
        resetColumnProperties: function(columnProperties) {
            //clearObjectProperties(this.columnProperties);
            merge(this.columnProperties, columnProperties);
        },

        //lets clear out and then repopulate the column properties
        //with new values
        resetCellProperties: function(cellProperties) {
            //clearObjectProperties(this.cellProperties);
            merge(this.cellProperties, cellProperties);
        },

        paintCell: function(gc, x, y) {
            var c, r = 0;
            var behavior = this.getBehavior();
            var visibleCols = this.getVisibleColumns();
            var visibleRows = this.getVisibleRows();
            gc.moveTo(0, 0);
            c = visibleCols[x];
            r = visibleRows[y];
            if (!c) {
                return; // were not being viewed at at the moment, nothing to paint
            }
            var columnProperties = behavior.getColumnProperties(c);
            this.resetColumnProperties(columnProperties);
            this._paintCell(gc, c, r);
        },

        _paintCell: function(gc, c, r) {

            var cellProperties = this.cellProperties;
            var behavior = this.getBehavior();

            var cellProvider = this.getGrid().getCellProvider();

            cellProperties.value = behavior.getValue(c, r);
            cellProperties.isSelected = this.isSelected(c, r);
            cellProperties.halign = behavior.getColumnAlignment(c);
            cellProperties.isColumnHovered = this.isHovered(c, r);
            cellProperties.isRowHovered = this.isHovered(c, r);
            cellProperties.bounds = this._getBoundsOfCell(c, r);

            var cell = cellProvider.getCell(cellProperties);

            behavior.cellPrePaintNotification(cell);
            cell.paint(gc, cellProperties);
        }
    });

})(); /* jslint ignore:line */
