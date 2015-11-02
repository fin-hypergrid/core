'use strict';
/**
 *
 * @module .\renderer
 * @description
fin-hypergrid-renderer is the canvas enabled top level sub component that handles the renderering of the Grid.

It relies on two other external subprojects

1. fin-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
2. fin-rectangles: a small library providing Point and Rectangle objects

The fin-hypergrid-renderer is in a unique position to provide critical functionality to the fin-hypergrid in a hightly performant manner.
Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the fin-hypergrid component.

Instances of this object have basically four main functions.

1. render fixed row headers
2. render fixed col headers
3. render main data cells
4. render grid lines

**/

function Renderer() {
    this.columnEdges = [];
    this.columnEdgesIndexMap = {};
    this.renderedColumnMinWidths = [];
    this.renderedHeight = 0;
    this.rowEdges = [];
    this.rowEdgesIndexMap = {};
    this.visibleColumns = [];
    this.visibleRows = [];
    this.insertionBounds = [];
};

Renderer.prototype = {};

var noop = function() {};

var merge = function(target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
};


//the shared single item "pooled" cell object for drawing each cell
Renderer.prototype.cell = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

Renderer.prototype.scrollHeight = 0,
Renderer.prototype.viewHeight = 0,

//this function computes the grid coordinates used for extremely fast iteration over
//painting the grid cells. this function is very fast, for thousand rows X 100 columns
//on a modest machine taking usually 0ms and no more that 3 ms.
Renderer.prototype.computeCellsBounds = function() {

    //var startTime = Date.now();

    var grid = this.getGrid();
    var scrollTop = this.getScrollTop();
    var scrollLeft = this.getScrollLeft();

    var numColumns = this.getColumnCount();
    var numFixedColumns = this.getFixedColumnCount();

    var numRows = this.getRowCount();
    var numFixedRows = this.getFixedRowCount();

    var bounds = this.getBounds();
    var viewWidth = bounds.width();

    //we must be in bootstrap
    if (viewWidth === 0) {
        //viewWidth = grid.sbHScroller.getClientRects()[0].width;
        viewWidth = grid.canvas.width;
    }
    var viewHeight = bounds.height();

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
    this.dataWindow = grid.rectangles.rectangle.create(firstVX, firstVY, lastVX - firstVX, lastVY - firstVY);
};

/**
 * @function
 * @instance
 * @description
returns a property value at a key, delegates to the grid
 * #### returns: Object
 */
Renderer.prototype.resolveProperty = function(key) {
    return this.getGrid().resolveProperty(key);
};

/**
 * @function
 * @instance
 * @description
getter for the [fin-hypergrid](module-._fin-hypergrid.html)
 * #### returns: fin-hypergrid
 */
Renderer.prototype.getGrid = function() {
    return this.grid;
};

/**
 * @function
 * @instance
 * @description
setter for the [fin-hypergrid](module-._fin-hypergrid.html)
 *
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 */
Renderer.prototype.setGrid = function(grid) {
    var self = this;
    this.grid = grid;
    grid.canvas.getComponent = function() {
        return self;
    }
    //this.startAnimator();
    //lets make use of prototype inheritance for cell properties
};

/**
 * @function
 * @instance
 * @description
This is the entry point from fin-canvas.  Notify the fin-hypergrid everytime we've repainted.
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */
Renderer.prototype._paint = function(gc) {
    if (!this.grid) {
        return;
    }
    this.renderGrid(gc);
    this.getGrid().gridRenderedNotification();
};

/**
 * @function
 * @instance
 * @description
Answer how many rows we rendered
 * #### returns: integer
 */
Renderer.prototype.getVisibleRowsCount = function() {
    return this.visibleRows.length - 1;
};

Renderer.prototype.getVisibleScrollHeight = function() {
    var grid = this.getGrid();
    var frh = grid.getFixedRowsHeight();
    var height = this.viewHeight - frh;
    return height;
};

/**
 * @function
 * @instance
 * @description
Answer what rows we just rendered as an Array of integers
 * #### returns: Array
 */
Renderer.prototype.getVisibleRows = function() {
    return this.visibleRows;
};

/**
 * @function
 * @instance
 * @description
Answer how many columns we just rendered
 * #### returns: integer
 */
Renderer.prototype.getVisibleColumnsCount = function() {
    return this.visibleColumns.length - 1;
};

/**
 * @function
 * @instance
 * @description
Answer what columns we just rendered as an Array of indexes
 * #### returns: Array
 */
Renderer.prototype.getVisibleColumns = function() {
    return this.visibleColumns;
};

/**
 * @function
 * @instance
 * @description
answer with the column index if the mouseEvent coordinates are over a column divider
 * #### returns: integer
 */
Renderer.prototype.overColumnDivider = function(x) {
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
};

/**
 * @function
 * @instance
 * @description
answer with the row index if the mouseEvent coordinates are over a row divider
 * #### returns: integer
 */
Renderer.prototype.overRowDivider = function(y) {
    y = Math.round(y);
    var which = this.rowEdges.indexOf(y + 1);
    if (which < 0) {
        which = this.rowEdges.indexOf(y);
    }
    if (which < 0) {
        which = this.rowEdges.indexOf(y - 1);
    }
    return which;
};

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
Renderer.prototype.getBoundsOfCell = function(cell) {
    return this._getBoundsOfCell(cell.x, cell.y);
};

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
Renderer.prototype._getBoundsOfCell = function(c, r) {
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

};

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
Renderer.prototype.getColumnFromPixelX = function(pixelX) {
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
};


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
Renderer.prototype.getGridCellFromMousePoint = function(point) {

    var grid = this.getGrid();
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

    return {
        gridCell: grid.newPoint(c, r),
        mousePoint: grid.newPoint(x, y),
        viewPoint: viewPoint
    };
};

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
Renderer.prototype.isColumnVisible = function(colIndex) {
    var isVisible = this.visibleColumns.indexOf(colIndex) !== -1;
    return isVisible;
};

/**
 * @function
 * @instance
 * @description
Answer the width x coordinate of the last rendered column
 * #### returns: integer
 */
Renderer.prototype.getFinalVisableColumnBoundry = function() {
    var isMaxX = this.isLastColumnVisible();
    var chop = isMaxX ? 2 : 1;
    var colWall = this.getColumnEdges()[this.getColumnEdges().length - chop];
    var result = Math.min(colWall, this.getBounds().width() - 200);
    return result;
};

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
Renderer.prototype.isRowVisible = function(rowIndex) {
    var isVisible = this.visibleRows.indexOf(rowIndex) !== -1;
    return isVisible;
};

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
Renderer.prototype.isSelected = function(x, y) {
    return this.getGrid().isSelected(x, y);
};

/**
 * @function
 * @instance
 * @description
This is the main forking of the renderering task.
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 */
Renderer.prototype.renderGrid = function(gc) {
    gc.beginPath();

    this.paintCells(gc);
    this.paintGridlines(gc);
    //this.blankOutOverflow(gc); // no longer needed
    this.renderOverrides(gc);
    this.renderFocusCell(gc);
    gc.closePath();
};

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

Renderer.prototype.renderFocusCell = function(gc) {
    gc.beginPath();
    this._renderFocusCell(gc);
    gc.closePath();
};

Renderer.prototype._renderFocusCell = function(gc) {
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
    gc.fillStyle = 'rgba(0, 0, 0, 0.2)';
    gc.fill();
    gc.lineWidth = 1;
    gc.strokeStyle = 'black';

    // animate the dashed line a bit here for fun

    gc.stroke();

    //gc.rect(x, y, width, height);

    //gc.strokeStyle = 'white';

    // animate the dashed line a bit here for fun
    //gc.setLineDash(this.focusLineStep[Math.floor(10 * (Date.now() / 300 % 1)) % this.focusLineStep.length]);

    gc.stroke();
};


/**
 * @function
 * @instance
 * @description
Paint the background color over the overflow from the final column paint
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
*/
Renderer.prototype.blankOutOverflow = function(gc) {
    var isMaxX = this.isLastColumnVisible();
    var chop = isMaxX ? 1 : 0;
    var x = this.getColumnEdges()[this.getColumnEdges().length - chop];
    var bounds = this.getBounds();
    var width = bounds.width() - 200 - x;
    var height = bounds.height();
    gc.fillStyle = this.resolveProperty('backgroundColor2');
    gc.fillRect(x + 1, 0, width, height);
};

/**
 * @function
 * @instance
 * @description
iterate the renderering overrides and manifest each
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
*/
Renderer.prototype.renderOverrides = function(gc) {
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
};

/**
 * @function
 * @instance
 * @description
copy each overrides specified area to it's target and blank out the source area
 *
 * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
 * @param {OverrideObject} override - an object with details contain an area and a target context
*/
Renderer.prototype.renderOverride = function(gc, override) {
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
};

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
Renderer.prototype.isHovered = function(x, y) {
    return this.getGrid().isHovered(x, y);
};

/**
 * @function
 * @instance
 * @description
answers if row y is currently being hovered over
 * #### returns: boolean
 * @param {integer} offsetY - y coordinate
 *
*/
Renderer.prototype.isRowHovered = function(y) {
    return this.getGrid().isRowHovered(y);
};

/**
 * @function
 * @instance
 * @description
answers if column x is currently being hovered over
 * #### returns: boolean
 * @param {integer} offsetX - x coordinate
 *
*/
Renderer.prototype.isColumnHovered = function(x) {
    return this.getGrid().isColumnHovered(x);
};

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
Renderer.prototype.paintCells = function(gc) {
    try {
        gc.save();
        this._paintCells(gc);
    } catch (e) {
        console.error(e);
    } finally {
        gc.restore();
    }
};

/**
 * @function
 * @instance
 * @description
answers if a specfic column in the fixed row area is selected
 * @param {integer} colIndex - column index
 *
*/
Renderer.prototype.isCellSelectedInRow = function(colIndex) {
    return this.getGrid().isCellSelectedInRow(colIndex);
};

/**
 * @function
 * @instance
 * @description
answers if a specfic row in the fixed column area is selected
 * @param {integer} rowIndex - column index
 *
*/
Renderer.prototype.isCellSelectedInColumn = function(rowIndex) {
    return this.getGrid().isCellSelectedInColumn(rowIndex);
};

/**
 * @function
 * @instance
 * @description
answers current vertical scroll value
 * #### returns: integer
*/
Renderer.prototype.getScrollTop = function() {
    var st = this.getGrid().getVScrollValue();
    return st;
};

/**
 * @function
 * @instance
 * @description
answers current horizontal scroll value
 * #### returns: integer
*/
Renderer.prototype.getScrollLeft = function() {
    var st = this.getGrid().getHScrollValue();
    return st;
};

/**
 * @function
 * @instance
 * @description
getter for my behavior (model)
 * #### returns: [fin-hypergrid-behavior-base](module-behaviors_base.html)
*/
Renderer.prototype.getBehavior = function() {
    return this.getGrid().getBehavior();
};

Renderer.prototype.getColumnEdges = function() {
    return this.columnEdges;
};

Renderer.prototype.getRowEdges = function() {
    return this.rowEdges;
};
/**
 * @function
 * @instance
 * @description
answers the row height of the row at index rowIndex
 * #### returns: integer
 * @param {integer} rowIndex - the row index
*/
Renderer.prototype.getRowHeight = function(rowIndex) {
    var height = this.getBehavior().getRowHeight(rowIndex);
    return height;
};

/**
 * @function
 * @instance
 * @description
answers the columnWidth of the column at index columnIndex
 * #### returns: integer
 * @param {integer} columnIndex - the row index
*/
Renderer.prototype.getColumnWidth = function(columnIndex) {
    var width = this.getGrid().getColumnWidth(columnIndex);
    return width;
};

/**
 * @function
 * @instance
 * @description
answer true if the last col was rendered (is visible)
 * #### returns: boolean
*/
Renderer.prototype.isLastColumnVisible = function() {
    var lastColumnIndex = this.getColumnCount() - 1;
    var isMax = this.visibleColumns.indexOf(lastColumnIndex) !== -1;
    return isMax;
};

/**
 * @function
 * @instance
 * @description
answer the rendered column width at index
 * #### returns: integer
*/
Renderer.prototype.getRenderedWidth = function(index) {
    return this.getColumnEdges()[index];
};

/**
 * @function
 * @instance
 * @description
answer the rendered row height at index
 * #### returns: integer
*/
Renderer.prototype.getRenderedHeight = function(index) {
    return this.rowEdges[index];
};

/**
 * @function
 * @instance
 * @description
getter for my [fin-canvas](https://github.com/stevewirts/fin-canvas)
 * #### returns: [fin-canvas](https://github.com/stevewirts/fin-canvas)
*/
Renderer.prototype.getCanvas = function() {
    return this.getGrid().getCanvas();
};

/**
 * @function
 * @instance
 * @description
answer if the user is currently dragging a column for reordering
 * #### returns: boolean
*/
Renderer.prototype.isDraggingColumn = function() {
    return this.getGrid().isDraggingColumn();
};

/**
 * @function
 * @instance
 * @description
answer the row to goto for a page up
 * #### returns: integer
*/
Renderer.prototype.getPageUpRow = function() {
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
};

/**
 * @function
 * @instance
 * @description
answer the row to goto for a page down
 * #### returns: integer
*/
Renderer.prototype.getPageDownRow = function() {
    var headerRows = this.getGrid().getFixedRowCount();
    var rowNum = this.dataWindow.corner.y - headerRows - 1;
    return rowNum;
};

/**
 * @function
 * @instance
 * @description
return the number of columns
 *
 * #### returns: integer
 */
Renderer.prototype.getColumnCount = function() {
    return this.getGrid().getColumnCount();
};

/**
 * @function
 * @instance
 * @description
return the number of rows
 *
 * #### returns: integer
 */
Renderer.prototype.getRowCount = function() {
    return this.getGrid().getRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed columns
 *
 * #### returns: integer
 */
Renderer.prototype.getFixedColumnCount = function() {
    return this.getGrid().getFixedColumnCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getFixedRowCount = function() {
    return this.getGrid().getFixedRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getHeaderRowCount = function() {
    return this.getGrid().getHeaderRowCount();
};

/**
 * @function
 * @instance
 * @description
return the number of fixed rows
 *
 * #### returns: integer
 */
Renderer.prototype.getHeaderColumnCount = function() {
    return this.getGrid().getHeaderColumnCount();
};

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
Renderer.prototype._paintCells = function(gc) {
    var x, y, c, r = 0;

    var columnEdges = this.getColumnEdges();
    var rowEdges = this.rowEdges;
    this.buttonCells = {};
    var visibleCols = this.getVisibleColumns();
    var visibleRows = this.getVisibleRows();

    var width = columnEdges[columnEdges.length - 1];
    var height = rowEdges[rowEdges.length - 1];

    gc.moveTo(0, 0);
    gc.rect(0, 0, width, height);
    gc.stroke();
    gc.clip();

    var loopLength = visibleCols.length;
    var loopStart = 0;

    if (this.getGrid().isShowRowNumbers()) {
        //loopLength++;
        loopStart--;
    }

    for (x = loopStart; x < loopLength; x++) {
        c = visibleCols[x];
        this.renderedColumnMinWidths[c] = 0;
        for (y = 0; y < visibleRows.length; y++) {
            r = visibleRows[y];
            this._paintCell(gc, c, r);
        }
    }

};

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
Renderer.prototype.paintGridlines = function(gc) {
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
};

Renderer.prototype.paintCell = function(gc, x, y) {
    var c, r = 0;
    var visibleCols = this.getVisibleColumns();
    var visibleRows = this.getVisibleRows();
    gc.moveTo(0, 0);
    c = visibleCols[x];
    r = visibleRows[y];
    if (!c) {
        return; // were not being viewed at at the moment, nothing to paint
    }
    this._paintCell(gc, c, r);
};

Renderer.prototype._paintCell = function(gc, c, r) {

    var grid = this.getGrid();
    var behavior = this.getBehavior();
    var baseProperties = behavior.getColumnProperties(c);
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

    if ((isShowRowNumbers && c === -1) || (!isShowRowNumbers && c === 0)) {
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
    } else {
        cellProperties.value = grid.getValue(c, r);
    }
    cellProperties.halign = grid.getColumnAlignment(c);
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
    if (overrides) {
        merge(cellProperties, overrides);
    }

    //allow the renderer to identify itself if it's a button
    cellProperties.buttonCells = this.buttonCells;

    cell.paint(gc, cellProperties);

    this.renderedColumnMinWidths[c] = Math.max(cellProperties.minWidth || 0, this.renderedColumnMinWidths[c]);
    columnProperties.preferredWidth = this.renderedColumnMinWidths[c];
};
Renderer.prototype.isViewableButton = function(c, r) {
    var key = c + ',' + r;
    return this.buttonCells[key] === true;
};
Renderer.prototype.getRowNumbersWidth = function() {
    var colEdges = this.getColumnEdges();
    if (colEdges.length === 0) {
        return 0;
    }
    return colEdges[0];
};
Renderer.prototype.startAnimator = function() {
    var animate;
    var self = this;
    animate = function() {
        self.animate();
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
};
Renderer.prototype.animate = function() {
    var ctx = this.getCanvas().canvasCTX;
    ctx.beginPath();
    ctx.save();
    this.renderFocusCell(ctx);
    ctx.restore();
    ctx.closePath();
};

Renderer.prototype.getBounds = function() {
    return this.bounds;
};

Renderer.prototype.setBounds = function(bounds) {
    return this.bounds = bounds;
};

module.exports = Renderer;
