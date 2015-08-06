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

var noop = function() {};

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

/**
 *
 * @property {Object} config - the shared singleton cell renderering config object, this gets passed into the cell renderer on every cell paint
 */
var config = {
    getTextWidth: function(gc, string) {
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
    },

    getTextHeight: function(font) {

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
    }

};

(function() {

    // we need a reusable cellconfig object
    var cellConfig = function(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, isColumnHovered, isRowHovered, halign, hoffset, voffset, properties) {
        config.x = x;
        config.y = y;
        config.value = value;
        config.fgColor = fgColor;
        config.bgColor = undefined;
        config.fgSelColor = fgSelColor;
        config.bgSelColor = bgSelColor;
        config.font = font;
        config.isSelected = isSelected;
        config.isColumnHovered = isColumnHovered || false;
        config.isRowHovered = isRowHovered || false;
        config.halign = halign || 'center';
        config.hoffset = hoffset;
        config.voffset = voffset;
        config.properties = properties;
        return config;
    };

    Polymer({ /* jslint ignore:line */


        /**
         * @function
         * @instance
         * @description
        a Polymer web-component life cycle event, called when an instance of this is plugged into the dom
         *
         */
        attached: function() {
            this.readyInit();
            this.renderedColumnWidths = [0];
            this.renderedColumnMinWidths = [];
            this.renderedFixedColumnMinWidths = [];
            this.renderedHeight = 0;
            this.renderedRowHeights = [0];
            this.renderedColumns = [];
            this.renderedRows = [];
            this.insertionBounds = []; // this is the midpoint of each column, used
        },

        /**
         * @function
         * @instance
         * @description
        returns a property value at a key, delegates to the grid
         * #### returns: Object
         */
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },

        /**
         * @function
         * @instance
         * @description
        this is a utility function for initializing the cellConfig
         * #### returns: Object
         */
        cellConfig: function(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, isColumnHovered, isRowHovered, halign, hoffset, voffset) {
            var config = cellConfig(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, isColumnHovered, isRowHovered, halign, hoffset, voffset, this.grid.lnfProperties);
            return config;
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
        getViewableRows: function() {
            return this.renderedRows.length;
        },

        /**
         * @function
         * @instance
         * @description
        Answer what rows we just rendered as an Array of integers
         * #### returns: Array
         */
        getVisibleRows: function() {
            return this.renderedRows;
        },

        /**
         * @function
         * @instance
         * @description
        Answer how many columns we just rendered
         * #### returns: integer
         */
        getViewableColumns: function() {
            return this.renderedColumns.length;
        },

        /**
         * @function
         * @instance
         * @description
        Answer what columns we just rendered as an Array of indexes
         * #### returns: Array
         */
        getVisibleColumns: function() {
            return this.renderedColumns;
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
            var whichCol = this.renderedColumnWidths.indexOf(x - 1);
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x);
            }
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x - 2);
            }
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x + 1);
            }
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x - 3);
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
            var which = this.renderedRowHeights.indexOf(y + 1);
            if (which < 0) {
                which = this.renderedRowHeights.indexOf(y);
            }
            if (which < 0) {
                which = this.renderedRowHeights.indexOf(y - 1);
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
        _getBoundsOfCell: function(x, y) {
            var ox = this.renderedColumnWidths[x],
                oy = this.renderedRowHeights[y],
                cx = this.renderedColumnWidths[x + 1],
                cy = this.renderedRowHeights[y + 1],
                ex = cx - ox,
                ey = cy - oy;

            var bounds = this.g.rectangle.create(ox, oy, ex, ey);

            return bounds;
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
            for (c = 1; c < this.renderedColumnWidths.length; c++) {
                width = this.renderedColumnWidths[c];
                if (point.x < width) {
                    x = Math.max(0, point.x - previous - 2);
                    break;
                }
                previous = width;
            }
            c--;
            previous = 0;
            for (r = 1; r < this.renderedRowHeights.length; r++) {
                height = this.renderedRowHeights[r];
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
            var isVisible = this.renderedColumns.indexOf(colIndex) !== -1;
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
            var colWall = this.renderedColumnWidths[this.renderedColumnWidths.length - chop];
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
            var isVisible = this.renderedRows.indexOf(rowIndex) !== -1;
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
            var offsetX = this.getBehavior().getFixedColumnsWidth();
            var offsetY = this.getBehavior().getFixedRowsHeight();

            gc.beginPath();
            this.paintTopLeft(gc, offsetX, offsetY);
            this.paintHeaders(gc, 0, 0);
            this.paintCells(gc, offsetX, offsetY);
            this.paintGridlines(gc, offsetX, offsetY);
            this.blankOutOverflow(gc);
            this.renderOverrides(gc);
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
            var x = this.renderedColumnWidths[this.renderedColumnWidths.length - chop];
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
            var columnStarts = this.renderedColumnWidths;
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
        We opted to not paint borders for each cell as that was extremely expensive.  Instead we draw gridlines here.  Also we record the widths and heights for later.
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
        */
        paintGridlines: function(gc, offsetX, offsetY) {

            var drawThemH = this.resolveProperty('gridLinesH');
            var drawThemV = this.resolveProperty('gridLinesV');

            var behavior = this.getBehavior();
            var lineColor = this.resolveProperty('lineColor');

            var numColumns = this.getColumnCount();
            var numRows = behavior.getRowCount();
            var numFixedColumns = behavior.getFixedColumnCount();
            var numFixedRows = behavior.getFixedRowCount();

            var fixedColumnsWidth = behavior.getFixedColumnsWidth();
            var fixedRowsHeight = behavior.getFixedRowsHeight();

            this.renderedColumnWidths = [0];
            this.renderedHeight = 0;
            this.renderedRowHeights = [0];
            this.renderedColumns = [];
            this.renderedRows = [];
            this.insertionBounds = [];
            var insertionBoundsCursor = 0;

            var scrollTop = this.getScrollTop();
            var scrollLeft = this.getScrollLeft();
            var viewWidth = this.getBounds().width() - 200; // look in fin-hypergrid and initializtion of fin-canvas
            var viewHeight = this.getBounds().height();

            gc.beginPath();
            gc.strokeStyle = lineColor;
            gc.lineWidth = 1;
            var c, r, x, y, width, height;

            //fixedrow horizontal grid lines
            //gc.beginPath();
            gc.moveTo(0, 0);
            y = 0;
            for (r = 0; r < numFixedRows; r++) {
                height = this.getFixedRowHeight(r);
                y = y + height;
                this.renderedRowHeights.push(Math.round(y));
                if (drawThemH) {
                    gc.moveTo(fixedColumnsWidth, y + 0.5);
                    gc.lineTo(viewWidth, y + 0.5);
                    //gc.stroke();
                }
            }

            //fixedcol vertical grid lines
            //gc.beginPath();
            gc.moveTo(0, 0);
            x = 0;
            for (c = 0; c < numFixedColumns; c++) {
                width = this.getFixedColumnWidth(c);
                x = x + width;
                this.renderedColumnWidths.push(Math.round(x));
                if (drawThemV) {
                    gc.moveTo(x + 0.5, fixedRowsHeight);
                    gc.lineTo(x + 0.5, viewHeight);
                    //gc.stroke();
                }
            }

            //main area vertical grid lines
            //gc.beginPath();
            gc.moveTo(0, 0);
            x = offsetX;
            var previousInsertionBoundsCursorValue = 0;
            //render the final line with numColumns + 1
            for (c = 0; c < numColumns + 1; c++) {
                width = this.getColumnWidth(c + scrollLeft);

                this.renderedColumns.push(c + scrollLeft);

                if (x > viewWidth || numColumns < scrollLeft + c) {
                    this.renderedColumns.length = Math.max(0, this.renderedColumns.length - 2);
                    break;
                }
                if (drawThemV) {
                    gc.moveTo(x + 0.5, 0);
                    gc.lineTo(x + 0.5, viewHeight);
                    //gc.stroke();
                }
                x = x + width;

                this.renderedColumnWidths.push(Math.round(x));

                insertionBoundsCursor = insertionBoundsCursor + Math.round(width / 2) + previousInsertionBoundsCursorValue;
                this.insertionBounds.push(insertionBoundsCursor);
                previousInsertionBoundsCursorValue = Math.round(width / 2);
            }

            //main area horizontal grid lines
            //gc.beginPath();
            gc.moveTo(0, 0);
            y = offsetY;
            for (r = 0; r < numRows; r++) {
                height = this.getRowHeight(r + scrollTop);

                this.renderedRows.push(r + scrollTop);

                if (y > viewHeight || numRows < scrollTop + r) {
                    this.renderedRows.length = Math.max(0, this.renderedRows.length - 2);
                    break;
                }

                if (drawThemH) {
                    gc.moveTo(0, y + 0.5);
                    gc.lineTo(viewWidth, y + 0.5);
                    //gc.stroke();
                }
                y = y + height;
                this.renderedHeight = this.renderedHeight + height;
                this.renderedRowHeights.push(Math.round(y));
            }
            gc.stroke();
            gc.closePath();
        },

        /**
         * @function
         * @instance
         * @description
        paint the fixed rows and columns areas
         *
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
        */
        paintHeaders: function(ctx, offsetX, offsetY) {

            this.paintFixedRows(
                ctx,
                offsetX + this.getBehavior().getFixedColumnsWidth(),
                offsetY,
                this.getColumnCount(),
                this.getBehavior().getFixedRowCount());

            this.paintFixedColumns(
                ctx,
                offsetX,
                offsetY + this.getBehavior().getFixedRowsHeight(),
                this.getBehavior().getFixedColumnCount(),
                this.getBehavior().getRowCount());

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
            return this.grid.isHovered(x, y);
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
            return this.grid.isRowHovered(y);
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
            return this.grid.isColumnHovered(x);
        },

        /**
         * @function
         * @instance
         * @description
        Renderer the fixed header rows along the top
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         * @param {integer} numColumns - the max columns to iterate through
         * @param {integer} numRows - the max rows to iterate through
         *
        */
        paintFixedRows: function(gc, offsetX, offsetY, numColumns, numRows) {
            var behavior = this.getBehavior();
            var x = offsetX;
            var scrollLeft = this.getScrollLeft();
            var font = this.resolveProperty('fixedRowFont');

            var voffset = this.resolveProperty('voffset');
            var hoffset = this.resolveProperty('hoffset');

            var fgColor = this.resolveProperty('fixedRowColor');
            var bgColor = this.resolveProperty('fixedRowBackgroundColor');

            var fgSelColor = this.resolveProperty('fixedRowFGSelColor');
            var bgSelColor = this.resolveProperty('fixedRowBGSelColor');

            var cellProvider = this.getGrid().getCellProvider();
            var viewWidth = this.getBounds().width() - 200; // look in fin-hypergrid and initializtion of fin-canvas
            var viewHeight = behavior.getFixedRowsHeight();

            for (var c = 0; c < numColumns; c++) {
                var width = this.getColumnWidth(c + scrollLeft);
                if (x > viewWidth || numColumns <= scrollLeft + c) {
                    return;
                }
                var isSelected = this.isFixedRowCellSelected(c + scrollLeft);
                var y = offsetY;

                gc.fillStyle = bgColor;
                gc.fillRect(x, y, x + width, viewHeight - y);

                //reset this for this pass..
                this.renderedColumnMinWidths[c + scrollLeft] = 0;

                for (var r = 0; r < numRows; r++) {

                    var height = this.getFixedRowHeight(r);
                    var align = behavior._getFixedRowAlignment(c + scrollLeft, r);
                    var value = behavior._getFixedRowValue(c + scrollLeft, r);
                    var isColumnHovered = this.isColumnHovered(c);
                    var isRowHovered = false; //this.isHovered(c, r);
                    //translatedX allows us to reorder columns
                    var translatedX = behavior.translateColumnIndex(c + scrollLeft);
                    var config = this.cellConfig(translatedX, r, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, isColumnHovered, isRowHovered, align, hoffset, voffset);
                    var cell = cellProvider.getFixedRowCell(config);
                    config.minWidth = 0;

                    behavior.cellFixedRowPrePaintNotification(cell);
                    cell.paint(gc, x, y, width, height);

                    //lets capture the col preferred widths for col autosizing
                    this.renderedColumnMinWidths[c + scrollLeft] = Math.max(config.minWidth || 0, this.renderedColumnMinWidths[c + scrollLeft]);

                    if (behavior.highlightCellOnHover(isColumnHovered, isRowHovered)) {
                        gc.beginPath();
                        var pre = gc.globalAlpha;
                        gc.globalAlpha = 0.2;
                        gc.fillRect(x + 2, y + 2, width - 3, height - 3);
                        gc.globalAlpha = pre;
                        gc.stroke();
                        gc.closePath();
                    }
                    y = y + height;
                }
                x = x + width;
            }
        },

        /**
         * @function
         * @instance
         * @description
        Render the fixed columns along the left side
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         * @param {integer} numColumns - the max columns to iterate through
         * @param {integer} numRows - the max rows to iterate through
         *
        */
        paintFixedColumns: function(gc, offsetX, offsetY, numColumns, numRows) {
            var behavior = this.getBehavior();
            var x = offsetX;

            var font = this.resolveProperty('fixedColumnFont');

            var voffset = this.resolveProperty('voffset');
            var hoffset = this.resolveProperty('hoffset');

            var fgColor = this.resolveProperty('fixedColumnColor');
            var bgColor = this.resolveProperty('fixedColumnBackgroundColor');

            var fgSelColor = this.resolveProperty('fixedColumnFGSelColor');
            var bgSelColor = this.resolveProperty('fixedColumnBGSelColor');


            var scrollTop = this.getScrollTop();
            var cellProvider = this.getGrid().getCellProvider();
            var viewHeight = this.getBounds().height();

            for (var c = 0; c < numColumns; c++) {
                var width = this.getFixedColumnWidth(c);
                var align = behavior.getFixedColumnAlignment(c);
                var y = offsetY;

                gc.fillStyle = bgColor;
                gc.fillRect(x, y, width, viewHeight - y);

                for (var r = 0; r < numRows; r++) {
                    var height = this.getRowHeight(r + scrollTop);
                    var isSelected = this.isFixedColumnCellSelected(r + scrollTop);
                    if (y > viewHeight || numRows <= scrollTop + r) {
                        break;
                    }
                    var value = behavior.getFixedColumnValue(c, r + scrollTop);
                    var isColumnHovered = false; //this.isHovered(c, r);
                    var isRowHovered = this.isRowHovered(r);
                    var config = this.cellConfig(c, r + scrollTop, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, isColumnHovered, isRowHovered, align, hoffset, voffset);
                    var cell = cellProvider.getFixedColumnCell(config);
                    config.minWidth = 0;

                    behavior.cellFixedColumnPrePaintNotification(cell);
                    cell.paint(gc, x, y, width, height);

                    this.renderedFixedColumnMinWidths[c] = Math.max(config.minWidth || 0, this.renderedFixedColumnMinWidths[c]);

                    if (behavior.highlightCellOnHover(isColumnHovered, isRowHovered)) {
                        gc.beginPath();
                        var pre = gc.globalAlpha;
                        gc.globalAlpha = 0.2;
                        gc.fillRect(x + 2, y + 2, width - 3, height - 3);
                        gc.globalAlpha = pre;
                        gc.stroke();
                        gc.closePath();
                    }

                    y = y + height;

                }
                x = x + width;
            }
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
        paintCells: function(gc, offsetX, offsetY) {
            try {
                gc.save();
                this._paintCells(gc, offsetX, offsetY);
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
        Unprotected rendering the fixed columns along the left side
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         * @param {integer} numColumns - the max columns to iterate through
         * @param {integer} numRows - the max rows to iterate through
         *
        */
        _paintCells: function(gc, offsetX, offsetY) {
            var behavior = this.getBehavior();
            var numColumns = this.getColumnCount();
            var numRows = behavior.getRowCount();
            var x = offsetX;
            var startY = offsetY;
            var scrollTop = this.getScrollTop();
            var scrollLeft = this.getScrollLeft();
            var cellProvider = this.getGrid().getCellProvider();
            var font = this.resolveProperty('font');

            var voffset = this.resolveProperty('voffset');
            var hoffset = this.resolveProperty('hoffset');

            var fgColor = this.resolveProperty('color');
            var bgColor = this.resolveProperty('backgroundColor');

            var fgSelColor = this.resolveProperty('foregroundSelColor');
            var bgSelColor = this.resolveProperty('backgroundSelColor');

            var viewWidth = this.getBounds().width() - 200; // look in fin-hypergrid and initializtion of fin-canvas
            var viewHeight = this.getBounds().height();

            for (var c = 0; c < numColumns; c++) {
                var width = this.getColumnWidth(c + scrollLeft);
                if (x > viewWidth || numColumns <= scrollLeft + c) {
                    return;
                }

                var y = startY;
                var translatedX = behavior.translateColumnIndex(c + scrollLeft);

                var columnAlign = behavior._getColumnAlignment(c + scrollLeft);
                var columnProperties = behavior.getColumnProperties(translatedX);
                var overrideFGColor = columnProperties.fgColor || fgColor;
                var overrideFont = columnProperties.font || font;
                //fill background
                gc.fillStyle = columnProperties.bgColor || bgColor;
                gc.fillRect(x, y, x + width, viewHeight - y);

                for (var r = 0; r < numRows; r++) {
                    var isSelected = this.isSelected(c + scrollLeft, r + scrollTop);
                    var height = this.getRowHeight(r + scrollTop);
                    if (y > viewHeight || numRows <= scrollTop + r) {
                        break;
                    }

                    var value = behavior._getValue(c + scrollLeft, r + scrollTop);
                    // if (!value && value !== 0) { // edge condition if were scrolled all the way to the end
                    //     break;
                    // }

                    //translatedX allows us to reorder columns

                    var isColumnHovered = this.isColumnHovered(c);
                    var isRowHovered = this.isRowHovered(r);

                    var config = this.cellConfig(translatedX, r + scrollTop, value, overrideFGColor, bgColor, fgSelColor, bgSelColor, overrideFont, isSelected, isColumnHovered, isRowHovered, columnAlign, hoffset, voffset);
                    behavior.cellPrePaintNotification(config);
                    var cell = cellProvider.getCell(config);

                    config.minWidth = 0;

                    cell.paint(gc, x, y, width, height);

                    //lets capture the col preferred widths for col autosizing
                    this.renderedColumnMinWidths[c + scrollLeft] = Math.max(config.minWidth || 0, this.renderedColumnMinWidths[c + scrollLeft]);

                    if (behavior.highlightCellOnHover(isColumnHovered, isRowHovered)) {
                        gc.beginPath();
                        var pre = gc.globalAlpha;
                        gc.globalAlpha = 0.2;
                        gc.fillRect(x + 2, y + 2, width - 3, height - 3);
                        gc.globalAlpha = pre;
                        gc.stroke();
                        gc.closePath();
                    }

                    y = y + height;
                }

                x = x + width;
            }
        },

        /**
         * @function
         * @instance
         * @description
        This is the empty top left corner of the grid. protected execution
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         *
        */
        paintTopLeft: function(gc, offsetX, offsetY) {
            noop(offsetX, offsetY);
            // gc.beginPath();
            // var fixedRowHeight = this.getBehavior().getFixedRowsHeight();
            // var fixedColumnWidth = this.getBehavior().getFixedColumnsWidth();
            // gc.fillStyle = this.resolveProperty('topLeftBackgroundColor');
            // gc.fillRect(offsetX, offsetY, fixedColumnWidth, fixedRowHeight);
            // gc.stroke();

            try {
                gc.save();
                this._paintTopLeft(gc);
            } finally {
                gc.restore();
            }


        },

        /**
         * @function
         * @instance
         * @description
        This is the empty top left corner of the grid. unprotected execution
         * @param {CanvasRenderingContext2D} gc - [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
         * @param {integer} offsetX - x coordinate to start at
         * @param {integer} offsetY - y coordinate to start at
         *
        */
        _paintTopLeft: function(gc) {
            var behavior = this.getBehavior();
            var numColumns = behavior.getFixedColumnCount();
            var numRows = behavior.getFixedRowCount();
            var x = 0;
            var startY = 0;
            var cellProvider = this.getGrid().getCellProvider();

            var font = this.resolveProperty('topLeftFont');

            var voffset = this.resolveProperty('voffset');
            var hoffset = this.resolveProperty('hoffset');

            var fgColor = this.resolveProperty('topLeftColor');
            var bgColor = this.resolveProperty('topLeftBackgroundColor');

            var fgSelColor = this.resolveProperty('topLeftFGSelColor');
            var bgSelColor = this.resolveProperty('topLeftBGSelColor');

            var viewWidth = behavior.getFixedColumnsWidth(); // look in fin-hypergrid and initializtion of fin-canvas
            var viewHeight = behavior.getFixedRowsHeight();

            for (var c = 0; c < numColumns; c++) {
                var width = this.getFixedColumnWidth(c);
                if (x > viewWidth || numColumns <= c) {
                    return;
                }

                var y = startY;
                var r = 0;
                var columnAlign = behavior.getTopLeftAlignment(c, r);
                //fill background
                gc.fillStyle = bgColor;
                gc.fillRect(x, y, x + width, viewHeight - y);

                this.renderedFixedColumnMinWidths[c] = 0;

                for (; r < numRows; r++) {
                    var height = this.getFixedRowHeight(r);
                    if (y > viewHeight || numRows <= r) {
                        break;
                    }

                    var value = behavior.getTopLeftValue(c, r);
                    // if (!value && value !== 0) { // edge condition if were scrolled all the way to the end
                    //     break;
                    // }

                    var isColumnHovered = this.isHovered(c);
                    var isRowHovered = this.isHovered(r);

                    var config = this.cellConfig(x, r, value, fgColor, bgColor, fgSelColor, bgSelColor, font, false, isColumnHovered, isRowHovered, columnAlign, hoffset, voffset);
                    var cell = cellProvider.getTopLeftCell(config);

                    config.minWidth = 0;

                    //minWidth should be set inside this function call
                    behavior.cellTopLeftPrePaintNotification(cell);
                    cell.paint(gc, x, y, width, height);

                    var minWidth = config.minWidth;
                    this.renderedFixedColumnMinWidths[c] = Math.max(minWidth || 0, this.renderedFixedColumnMinWidths[c]);

                    y = y + height;
                }


                x = x + width;
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

        /**
         * @function
         * @instance
         * @description
        answers the row height of the fixed row at index rowIndex
         * #### returns: integer
         * @param {integer} rowIndex - the row index
        */
        getFixedRowHeight: function(rowIndex) {
            var height = this.getBehavior().getFixedRowHeight(rowIndex);
            return height;
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
        answers the column width of the row in the fixedColumn area at index columnIndex
         * #### returns: integer
         * @param {integer} columnIndex - the column index
        */
        getFixedColumnWidth: function(columnIndex) {
            var height = this.getBehavior().getFixedColumnWidth(columnIndex);
            return height;
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
            var isMax = this.renderedColumns.indexOf(lastColumnIndex) !== -1;
            return isMax;
        },

        /**
         * @function
         * @instance
         * @description
        answer the total number of columns
         * #### returns: integer
        */
        getColumnCount: function() {
            var count = this.getGrid().getColumnCount();
            return count;
        },

        /**
         * @function
         * @instance
         * @description
        answer the rendered column width at index
         * #### returns: integer
        */
        getRenderedWidth: function(index) {
            return this.renderedColumnWidths[index];
        },

        /**
         * @function
         * @instance
         * @description
        answer the rendered row height at index
         * #### returns: integer
        */
        getRenderedHeight: function(index) {
            return this.renderedRowHeights[index];
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
        answer the row to goto for a page down
         *
         * @param {integer} x - the x cell coordinate
         * @param {integer} y - the y cell coordinate
         *
        */
        repaintCell: function(x, y) {
            if (this.isDraggingColumn()) {
                return;
            }
            var self = this;
            var behavior = this.getBehavior();

            var numFixedCols = behavior.getFixedColumnCount();
            var numFixedRows = behavior.getFixedRowCount();

            var scrollLeft = this.getScrollLeft();
            var unTranslatedX = behavior.unTranslateColumnIndex(x + scrollLeft);

            //it's not being viewed exit...
            if (!this.isRowVisible(y) || !this.isColumnVisible(unTranslatedX)) {
                return;
            }
            //var offsetX = behavior.getFixedColumnsWidth();
            //var offsetY = behavior.getFixedRowsHeight();

            var ox = this.renderedColumnWidths[numFixedCols + unTranslatedX],
                oy = this.renderedRowHeights[numFixedRows + y],
                cx = this.renderedColumnWidths[numFixedCols + unTranslatedX + 1],
                cy = this.renderedRowHeights[numFixedRows + y + 1],
                ex = cx - ox,
                ey = cy - oy;

            var func = function(gc) {
                self._repaintCell(gc, x, unTranslatedX, y, ox, oy, ex, ey);
            };

            this.getCanvas().safePaintImmediately(func);

        },
        _repaintCell: function(ctx, translatedX, x, y, startX, startY, width, height) {
            ctx.rect(startX + 1, startY + 1, width, height);
            ctx.clip();
            var behavior = this.getBehavior();
            var scrollTop = this.getScrollTop();
            var scrollLeft = this.getScrollLeft();
            var cellProvider = this.getGrid().getCellProvider();
            var font = this.resolveProperty('font');

            var voffset = this.resolveProperty('voffset');
            var hoffset = this.resolveProperty('hoffset');

            var fgColor = this.resolveProperty('color');
            var bgColor = this.resolveProperty('backgroundColor');

            var fgSelColor = this.resolveProperty('foregroundSelColor');
            var bgSelColor = this.resolveProperty('backgroundSelColor');

            //        var viewWidth = this.getBounds().width() - 200; // look in fin-hypergrid and initializtion of fin-canvas
            //        var viewHeight = this.getBounds().height();

            var columnAlign = behavior._getColumnAlignment(translatedX);
            var columnProperties = behavior.getColumnProperties(translatedX);
            var overrideFGColor = columnProperties.fgColor || fgColor;
            var overrideFont = columnProperties.font || font;
            //fill background
            ctx.fillStyle = columnProperties.bgColor || bgColor;
            ctx.fillRect(startX, startY, width, height);

            var isSelected = this.isSelected(x + scrollLeft, y + scrollTop);

            var value = behavior._getValue(x + scrollLeft, y + scrollTop);

            var isColumnHovered = this.isHovered(x, y);
            var isRowHovered = this.isHovered(x, y);

            var config = this.cellConfig(translatedX, y + scrollTop, value, overrideFGColor, bgColor, fgSelColor, bgSelColor, overrideFont, isSelected, isColumnHovered, isRowHovered, columnAlign, hoffset, voffset);
            behavior.cellPrePaintNotification(config);
            var cell = cellProvider.getCell(config);

            cell.paint(ctx, startX, startY, width, height);

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
            if (this.renderedRowHeights.length === 0) {
                return;
            }
            var behavior = this.getBehavior();
            var h = this.renderedHeight;
            var topRow = this.renderedRows[0];
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
        answer the row to goto for a page down
         * #### returns: integer
        */
        getPageDownRow: function() {
            if (this.renderedRowHeights.length === 0) {
                return;
            }
            var row = this.renderedRows[this.renderedRows.length - 1] + 1;
            return row;
        }
    });

})(); /* jslint ignore:line */
