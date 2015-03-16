//HypergridRenderer is the canvas enabled top level sub component that handles the renderering of the Grid.
// * It relies on two other external subprojects
//  * of-canvas: a wrapper to provide a simpler interface to the HTML5 canvas component
//  * rectangles: a small library providing Point and Rectangle objects

//The HypergridRenderer is in a unique position to provide critical functionality to the OFGrid in a hightly performant manner.  Because it MUST iterate over all the visible cells it can store various bits of information that can be encapsulated as a service for consumption by the OFGrid component.

//this object is basically four main functions
// * render fixed row headers
// * render fixed col headers
// * render main data cells
// * render grid lines

'use strict';

var noop = function() {};
var config = {};

(function() {

    // we need a reusable cellconfig object
    var cellConfig = function(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign, hoffset, voffset, properties) {
        config.x = x;
        config.y = y;
        config.value = value;
        config.fgColor = fgColor;
        config.bgColor = undefined; //properties.bgColor === bgColor ? null : bgColor; //
        config.fgSelColor = fgSelColor;
        config.bgSelColor = bgSelColor;
        config.font = font;
        config.isSelected = isSelected;
        config.halign = halign || 'center';
        config.hoffset = hoffset;
        config.voffset = voffset;
        config.properties = properties;
        return config;
    };

    Polymer({ /* jslint ignore:line */

        attached: function() {
            this.readyInit();
            this.renderedColumnWidths = [0];
            this.renderedRowHeights = [0];
            this.renderedColumns = [];
            this.renderedRows = [];
            this.insertionBounds = []; // this is the midpoint of each column, used
        },
        resolveProperty: function(key) {
            return this.hypergrid.resolveProperty(key);
        },
        cellConfig: function(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign, hoffset, voffset) {
            var config = cellConfig(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign, hoffset, voffset, this.hypergrid.lnfProperties);
            return config;
        },
        getGrid: function() {
            return this.hypergrid;
        },

        setGrid: function(grid) {
            this.hypergrid = grid;
        },
        //This is the entry point from OFCanvas.  Notify the OFGrid everytime we've repainted.
        paint: function(gc) {
            if (!this.hypergrid) {
                return;
            }
            this.renderGrid(gc);
            this.getGrid().gridRenderedNotification();
        },

        //Answer how many rows we rendered
        getViewableRows: function() {
            return this.renderedRows.length;
        },

        //Answer how many columns we just rendered
        getViewableColumns: function() {
            return this.renderedColumns.length;
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if the mouseEvent coordinates are over a column divider
         *
         * @method isOverColumnDivider(x)
         */
        overColumnDivider: function(x) {
            var whichCol = this.renderedColumnWidths.indexOf(x + 1);
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x);
            }
            if (whichCol < 0) {
                whichCol = this.renderedColumnWidths.indexOf(x - 1);
            }
            return whichCol;
        },

        /**
         *                                                                      .
         *                                                                      .
         * answer if the mouseEvent coordinates are over a column divider
         *
         * @method overRowDivider(y)
         */
        overRowDivider: function(y) {
            var which = this.renderedRowHeights.indexOf(y + 1);
            if (which < 0) {
                which = this.renderedRowHeights.indexOf(y);
            }
            if (which < 0) {
                which = this.renderedRowHeights.indexOf(y - 1);
            }
            return which;
        },

        //Answer the pixel bounds of specific data cell. It must have just been rendered
        getBoundsOfCell: function(cell) {
            var ox = this.renderedColumnWidths[cell.x],
                oy = this.renderedRowHeights[cell.y],
                cx = this.renderedColumnWidths[cell.x + 1],
                cy = this.renderedRowHeights[cell.y + 1],
                ex = cx - ox,
                ey = cy - oy;

            var bounds = this.g.rectangle.create(ox, oy, ex, ey);

            return bounds;
        },

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
        //Answer specific data cell coordinates given mouse coordinates in pixels.
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

        //Answer if a column is visible, must be fully visible
        isColVisible: function(c) {
            var isVisible = this.renderedColumns.indexOf(c) !== -1;
            return isVisible;
        },
        getFinalVisableColumnBoundry: function() {
            var isMaxX = this.isLastColumnVisible();
            var chop = isMaxX ? 2 : 1;
            var colWall = this.renderedColumnWidths[this.renderedColumnWidths.length - chop];
            var result = Math.min(colWall, this.getBounds().width() - 200);
            return result;
        },
        //Answer if a row is visible, must be fully visible
        isRowVisible: function(r) {
            var isVisible = this.renderedRows.indexOf(r) !== -1;
            return isVisible;
        },

        //Answer if a data cell is selected.
        isSelected: function(x, y) {
            return this.getGrid().isSelected(x, y);
        },

        //This is the main forking of the renderering task.  GC is a graphics context.
        //<br>[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
        renderGrid: function(gc) {
            var offsetX = this.getBehavior().getFixedColumnsWidth();
            var offsetY = this.getBehavior().getFixedRowsHeight();

            this.paintTopLeft(gc, offsetX, offsetY);
            this.paintHeaders(gc, 0, 0);
            this.paintCells(gc, offsetX, offsetY);
            this.paintGridlines(gc, offsetX, offsetY);
            this.blankOutOverflow(gc);
            this.renderOverrides(gc);
        },

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

        //We opted to not paint borders for each cell as that was extremely expensive.  Instead we draw gridlines here.  Also we record the widths and heights for later.
        paintGridlines: function(gc, offsetX, offsetY) {

            var drawThemH = this.resolveProperty('gridLinesH');
            var drawThemV = this.resolveProperty('gridLinesV');

            var behavior = this.getBehavior();
            var lineColor = this.resolveProperty('lineColor');

            var numColumns = behavior.getColumnCount();
            var numRows = behavior.getRowCount();
            var numFixedColumns = behavior.getFixedColumnCount();
            var numFixedRows = behavior.getFixedRowCount();

            var fixedColumnsWidth = behavior.getFixedColumnsWidth();
            var fixedRowsHeight = behavior.getFixedRowsHeight();

            this.renderedColumnWidths = [0];
            this.renderedRowHeights = [0];
            this.renderedColumns = [];
            this.renderedRows = [];
            this.insertionBounds = [];
            var insertionBoundsCursor = 0;

            var scrollTop = this.getScrollTop();
            var scrollLeft = this.getScrollLeft();
            var viewWidth = this.getBounds().width() - 200; // look in fin-hypergrid and initializtion of fin-canvas
            var viewHeight = this.getBounds().height();

            gc.strokeStyle = lineColor;
            gc.lineWidth = 1;
            var c, r, x, y, width, height;

            //fixedrow horiontal grid lines
            gc.beginPath();
            gc.moveTo(0, 0);
            y = 0;
            for (r = 0; r < numFixedRows; r++) {
                height = this.getFixedRowHeight(r);
                y = y + height;
                this.renderedRowHeights.push(y);
                if (drawThemH) {
                    gc.moveTo(fixedColumnsWidth, y + 0.5);
                    gc.lineTo(viewWidth, y + 0.5);
                    gc.stroke();
                }
            }

            //fixedcol vertical grid lines
            gc.beginPath();
            gc.moveTo(0, 0);
            x = 0;
            for (c = 0; c < numFixedColumns; c++) {
                width = this.getFixedColumnWidth(c);
                x = x + width;
                this.renderedColumnWidths.push(x);
                if (drawThemV) {
                    gc.moveTo(x + 0.5, fixedRowsHeight);
                    gc.lineTo(x + 0.5, viewHeight);
                    gc.stroke();
                }
            }

            //main area vertical grid lines
            gc.beginPath();
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
                    gc.stroke();
                }
                x = x + width;

                this.renderedColumnWidths.push(x);

                insertionBoundsCursor = insertionBoundsCursor + Math.round(width / 2) + previousInsertionBoundsCursorValue;
                this.insertionBounds.push(insertionBoundsCursor);
                previousInsertionBoundsCursorValue = Math.round(width / 2);
            }

            //main area horizontal grid lines
            gc.beginPath();
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
                    gc.stroke();
                }
                y = y + height;
                this.renderedRowHeights.push(y);
            }
        },

        paintHeaders: function(ctx, offsetX, offsetY) {

            this.paintFixedRows(
                ctx,
                offsetX + this.getBehavior().getFixedColumnsWidth(),
                offsetY,
                this.getBehavior().getColumnCount(),
                this.getBehavior().getFixedRowCount());

            this.paintFixedColumns(
                ctx,
                offsetX,
                offsetY + this.getBehavior().getFixedRowsHeight(),
                this.getBehavior().getFixedColumnCount(),
                this.getBehavior().getRowCount());

        },

        //Renderer the fixed header rows along the top
        paintFixedRows: function(ctx, offsetX, offsetY, numColumns, numRows) {
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
            var viewHeight = this.getBehavior().getFixedRowsHeight();
            for (var c = 0; c < numColumns; c++) {
                var width = this.getColumnWidth(c + scrollLeft);
                if (x > viewWidth || numColumns <= scrollLeft + c) {
                    return;
                }
                var isSelected = this.isFixedRowCellSelected(c + scrollLeft);
                var y = offsetY;

                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, x + width, viewHeight - y);

                for (var r = 0; r < numRows; r++) {

                    var height = this.getFixedRowHeight(r);
                    var align = behavior.getFixedRowAlignment(c + scrollLeft, r);
                    var value = behavior.getFixedRowValue(c + scrollLeft, r);

                    //translatedX allows us to reorder columns
                    var translatedX = behavior.translateColumnIndex(c + scrollLeft);
                    var cell = cellProvider.getFixedRowCell(this.cellConfig(translatedX, r, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, align, hoffset, voffset));
                    cell.paint(ctx, x, y, width, height);
                    y = y + height;
                }
                x = x + width;
            }
        },

        //Render the fixed columns along the left side
        paintFixedColumns: function(ctx, offsetX, offsetY, numColumns, numRows) {
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

                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, width, viewHeight - y);

                for (var r = 0; r < numRows; r++) {
                    var height = this.getRowHeight(r + scrollTop);
                    var isSelected = this.isFixedColumnCellSelected(r + scrollTop);
                    if (y > viewHeight || numRows <= scrollTop + r) {
                        break;
                    }
                    var value = behavior.getFixedColumnValue(c, r + scrollTop);
                    var cell = cellProvider.getFixedColumnCell(this.cellConfig(c, r + scrollTop, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, align, hoffset, voffset));
                    cell.paint(ctx, x, y, width, height);
                    y = y + height;
                }
                x = x + width;
            }
        },

        //Render the main cells.  We snapshot the context to insure against its polution.
        //<br>TODO:save/restore should be a general wrapper that we use here and for the other renderer, fixed rows/columns and gridlines as well.
        paintCells: function(ctx, offsetX, offsetY) {
            try {
                ctx.save();
                this._paintCells(ctx, offsetX, offsetY);
            } finally {
                ctx.restore();
            }
        },

        _paintCells: function(ctx, offsetX, offsetY) {
            var behavior = this.getBehavior();
            var numColumns = behavior.getColumnCount();
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

                var columnAlign = behavior.getColumnAlignment(translatedX);
                var columnProperties = behavior.getColumnProperties(translatedX);
                var overrideFGColor = columnProperties.fgColor || fgColor;
                var overrideFont = columnProperties.font || font;
                //fill background
                ctx.fillStyle = columnProperties.bgColor || bgColor;
                ctx.fillRect(x, y, x + width, viewHeight - y);

                for (var r = 0; r < numRows; r++) {
                    var isSelected = this.isSelected(c + scrollLeft, r + scrollTop);
                    var height = this.getRowHeight(r + scrollTop);
                    if (y > viewHeight || numRows <= scrollTop + r) {
                        break;
                    }

                    var value = behavior.getValue(c + scrollLeft, r + scrollTop);
                    // if (!value && value !== 0) { // edge condition if were scrolled all the way to the end
                    //     break;
                    // }

                    //translatedX allows us to reorder columns

                    var cell = cellProvider.getCell(this.cellConfig(translatedX, r + scrollTop, value, overrideFGColor, bgColor, fgSelColor, bgSelColor, overrideFont, isSelected, columnAlign, hoffset, voffset));

                    cell.paint(ctx, x, y, width, height);

                    y = y + height;
                }

                x = x + width;
            }
        },

        //This is the empty top left corner of the grid.
        paintTopLeft: function(ctx, offsetX, offsetY) {
            noop(offsetX, offsetY);
            // ctx.beginPath();
            // var fixedRowHeight = this.getBehavior().getFixedRowsHeight();
            // var fixedColumnWidth = this.getBehavior().getFixedColumnsWidth();
            // ctx.fillStyle = this.resolveProperty('topLeftBackgroundColor');
            // ctx.fillRect(offsetX, offsetY, fixedColumnWidth, fixedRowHeight);
            // ctx.stroke();

            try {
                ctx.save();
                this._paintTopLeft(ctx);
            } finally {
                ctx.restore();
            }


        },

        _paintTopLeft: function(ctx) {
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
                ctx.fillStyle = bgColor;
                ctx.fillRect(x, y, x + width, viewHeight - y);

                for (; r < numRows; r++) {
                    var height = this.getFixedRowHeight(r);
                    if (y > viewHeight || numRows <= r) {
                        break;
                    }

                    var value = behavior.getTopLeftValue(c, r);
                    // if (!value && value !== 0) { // edge condition if were scrolled all the way to the end
                    //     break;
                    // }

                    var cell = cellProvider.getTopLeftCell(this.cellConfig(x, r, value, fgColor, bgColor, fgSelColor, bgSelColor, font, false, columnAlign, hoffset, voffset));

                    cell.paint(ctx, x, y, width, height);

                    y = y + height;
                }

                x = x + width;
            }
        },



        isFixedRowCellSelected: function(col) {
            return this.getGrid().isFixedRowCellSelected(col);
        },

        isFixedColumnCellSelected: function(row) {
            return this.getGrid().isFixedColumnCellSelected(row);
        },

        getScrollTop: function() {
            var st = this.getGrid().getVScrollValue();
            return st;
        },

        getScrollLeft: function() {
            var st = this.getGrid().getHScrollValue();
            return st;
        },

        getBehavior: function() {
            return this.getGrid().getBehavior();
        },

        getFixedRowHeight: function(rowIndex) {
            var height = this.getBehavior().getFixedRowHeight(rowIndex);
            return height;
        },

        getRowHeight: function(rowIndex) {
            var height = this.getBehavior().getRowHeight(rowIndex);
            return height;
        },

        getColumnWidth: function(columnIndex) {
            var width = this.getBehavior().getColumnWidth(columnIndex);
            return width;
        },

        getFixedColumnWidth: function(rowIndex) {
            var height = this.getBehavior().getFixedColumnWidth(rowIndex);
            return height;
        },

        //answer true if the last col was rendered (is visible)
        isLastColumnVisible: function() {
            var lastColumnIndex = this.getColumnCount() - 1;
            var isMax = this.renderedColumns.indexOf(lastColumnIndex) !== -1;
            return isMax;
        },
        getColumnCount: function() {
            var count = this.getGrid().getColumnCount();
            return count;
        },
        getLeftSideSize: function(index) {
            return this.renderedColumnWidths[index];
        },
        getTopSideSize: function(index) {
            return this.renderedRowHeights[index];
        }

    });

})(); /* jslint ignore:line */
