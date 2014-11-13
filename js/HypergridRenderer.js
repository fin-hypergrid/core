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
(function() {
    var root = this;

    var OFCanvasComponent = root.fin.wc.canvas.OFCanvasComponent;
    var constants = root.fin.wc.hypergrid.constants;

    function HypergridRenderer(hypergrid) {

        var rectangles = document.createElement('fin-rectangle');

        OFCanvasComponent.call(this);

        //
        this.renderedColWidths = [0];
        this.renderedRowHeights = [0];
        this.renderedCols = [];
        this.renderedRows = [];

        this.getGrid = function() {
            return hypergrid;
        };

        //This is the entry point from OFCanvas.  Notify the OFGrid everytime we've repainted.
        this.paint = function(gc) {
            this.renderGrid(gc);
            this.getGrid().gridRenderedNotification();
        };

        //Answer how many rows we rendered
        this.getViewableRows = function() {
            return this.renderedRows.length;
        };

        //Answer how many columns we just rendered
        this.getViewableCols = function() {
            return this.renderedCols.length;
        };

        //Answer the pixel bounds of specific data cell. It must have just been rendered
        this.getBoundsOfCell = function(cell) {
            var ox = this.renderedColWidths[cell.x],
                oy = this.renderedRowHeights[cell.y],
                cx = this.renderedColWidths[cell.x + 1],
                cy = this.renderedRowHeights[cell.y + 1],
                ex = cx - ox,
                ey = cy - oy;

            var bounds = new rectangles.create.Rectangle(ox, oy, ex, ey);

            return bounds;
        };

        //Answer specific data cell coordinates given mouse coordinates in pixels.
        this.getCellFromMousePoint = function(point) {

            var width = 0;
            var height = 0;
            var x, y;
            var c, r;
            var previous = 0;
            for (c = 1; c < this.renderedColWidths.length; c++) {
                width = this.renderedColWidths[c];
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
                cell: new rectangles.create.Point(c, r),
                location: new rectangles.create.Point(x, y)
            };
        };

        //Answer if a column is visible, must be fully visible
        this.isColVisible = function(c) {
            var isVisible = this.renderedCols.indexOf(c) !== -1;
            return isVisible;
        };

        //Answer if a row is visible, must be fully visible
        this.isRowVisible = function(r) {
            var isVisible = this.renderedRows.indexOf(r) !== -1;
            return isVisible;
        };

        this.setBackgroundColor(constants.gridBackgroundColor);
    }

    var proto = HypergridRenderer.prototype = Object.create(OFCanvasComponent.prototype);

    //Answer if a data cell is selected.
    proto.isSelected = function(x, y) {
        return this.getGrid().isSelected(x, y);
    };

    //This is the main forking of the renderering task.  GC is a graphics context.
    //<br>[CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
    proto.renderGrid = function(gc) {
        var offsetX = this.getBehavior().getFixedColsWidth();
        var offsetY = this.getBehavior().getFixedRowsHeight();

        this.paintCells(gc, offsetX, offsetY);
        this.paintHeaders(gc, 0, 0);
        this.paintGridlines(gc, offsetX, offsetY);
    };

    //We opted to not paint borders for each cell as that was extremely expensive.  Instead we draw gridlines here.  Also we record the widths and heights for later.
    proto.paintGridlines = function(gc, offsetX, offsetY) {
        var behavior = this.getBehavior();
        var lineColor = constants.lineColor; //draw horizontal grid line

        var numCols = behavior.getColCount();
        var numRows = behavior.getRowCount();
        var numFixedCols = behavior.getFixedColCount();
        var numFixedRows = behavior.getFixedRowCount();

        var fixedColsWidth = behavior.getFixedColsWidth();
        var fixedRowsHeight = behavior.getFixedRowsHeight();

        this.renderedColWidths = [0];
        this.renderedRowHeights = [0];
        this.renderedCols = [];
        this.renderedRows = [];

        var scrollTop = this.getScrollTop();
        var scrollLeft = this.getScrollLeft();
        var viewWidth = this.getBounds().width();
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
            gc.moveTo(fixedColsWidth, y);
            gc.lineTo(viewWidth, y);
            gc.stroke();
        }

        //fixedcol vertical grid lines
        gc.beginPath();
        gc.moveTo(0, 0);
        x = 0;
        for (c = 0; c < numFixedCols; c++) {
            width = this.getFixedColWidth(c);
            x = x + width;
            this.renderedColWidths.push(x);
            gc.moveTo(x, fixedRowsHeight);
            gc.lineTo(x, viewHeight);
            gc.stroke();
        }

        //main area vertical grid lines
        gc.beginPath();
        gc.moveTo(0, 0);
        x = offsetX;
        for (c = 0; c < numCols; c++) {
            width = this.getColWidth(c + scrollLeft);

            this.renderedCols.push(c + scrollLeft);

            if (x > viewWidth || numCols < scrollLeft + c) {
                this.renderedCols.length = Math.max(0, this.renderedCols.length - 2);
                break;
            }
            gc.moveTo(x, 0);
            gc.lineTo(x, viewHeight);
            gc.stroke();
            x = x + width;
            this.renderedColWidths.push(x);
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
            gc.moveTo(0, y);
            gc.lineTo(viewWidth, y);
            gc.stroke();
            y = y + height;
            this.renderedRowHeights.push(y);
        }

    };

    proto.paintHeaders = function(ctx, offsetX, offsetY) {

        this.paintFixedRows(
            ctx,
            offsetX + this.getBehavior().getFixedColsWidth(),
            offsetY,
            this.getBehavior().getColCount(),
            this.getBehavior().getFixedRowCount());

        this.paintFixedCols(
            ctx,
            offsetX,
            offsetY + this.getBehavior().getFixedRowsHeight(),
            this.getBehavior().getFixedColCount(),
            this.getBehavior().getRowCount());

        this.paintTopLeft(ctx, 0, 0);
    };

    //We have a reuseable cellConfig object that is repopulated for every cell renderering.  It should be attached to the cell inside of the getCell, getFixedColCell, and getFixedRowCell functions.
    var config = {};
    var cellConfig = function(x, y, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign) {
        config.x = x;
        config.y = y;
        config.value = value;
        config.fgColor = fgColor;
        config.bgColor = constants.backgroundColor === bgColor ? null : bgColor;
        config.fgSelColor = fgSelColor;
        config.bgSelColor = bgSelColor;
        config.font = font;
        config.isSelected = isSelected;
        config.halign = halign || 'center';
        return config;
    };

    //Renderer the fixed header rows along the top
    proto.paintFixedRows = function(ctx, offsetX, offsetY, numCols, numRows) {
        var behavior = this.getBehavior();
        var x = offsetX;
        var scrollLeft = this.getScrollLeft();
        var font = constants.defaultFont;
        var fgColor = constants.foregroundColor;
        var bgColor = constants.backgroundColor;
        var fgSelColor = constants.fixedRowFGSelColor;
        var bgSelColor = constants.fixedRowBGSelColor;
        var fixedRowBGColor = constants.fixedRowBGColor;
        var halign = constants.fixedRowAlign;
        var cellProvider = this.getGrid().getCellProvider();
        var viewWidth = this.getBounds().width();
        var viewHeight = this.getBehavior().getFixedRowsHeight();
        for (var c = 0; c < numCols; c++) {
            var width = this.getColWidth(c + scrollLeft);
            if (x > viewWidth || numCols <= scrollLeft + c) {
                return;
            }
            var isSelected = this.isFixedRowCellSelected(c + scrollLeft);
            var y = offsetY;

            ctx.fillStyle = fixedRowBGColor;
            ctx.fillRect(x, y, x + width, viewHeight - y);

            for (var r = 0; r < numRows; r++) {

                var height = this.getFixedRowHeight(r);
                var value = behavior.getFixedRowValue(c + scrollLeft, r);

                var cell = cellProvider.getFixedRowCell(cellConfig(c + scrollLeft, r, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign));
                cell.paint(ctx, x, y, width, height);
                y = y + height;
            }
            x = x + width;
        }
    };

    //Render the fixed columns along the left side
    proto.paintFixedCols = function(ctx, offsetX, offsetY, numCols, numRows) {
        var behavior = this.getBehavior();
        var x = offsetX;
        var font = constants.defaultFont;
        var fgColor = constants.foregroundColor;
        var bgColor = constants.backgroundColor;
        var fixedColBGColor = constants.fixedColBGColor;
        var fgSelColor = constants.fixedColFGSelColor;
        var bgSelColor = constants.fixedColBGSelColor;
        var halign = constants.fixedColAlign;
        var scrollTop = this.getScrollTop();
        var cellProvider = this.getGrid().getCellProvider();
        var viewHeight = this.getBounds().height();

        for (var c = 0; c < numCols; c++) {
            var width = this.getFixedColWidth(c);
            var y = offsetY;

            ctx.fillStyle = fixedColBGColor;
            ctx.fillRect(x, y, width, viewHeight - y);

            for (var r = 0; r < numRows; r++) {
                var height = this.getRowHeight(r + scrollTop);
                var isSelected = this.isFixedColCellSelected(r + scrollTop);
                if (y > viewHeight || numRows <= scrollTop + r) {
                    break;
                }
                var value = behavior.getFixedColValue(c, r + scrollTop);
                var cell = cellProvider.getFixedColCell(cellConfig(c, r + scrollTop, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, halign));
                cell.paint(ctx, x, y, width, height);
                y = y + height;
            }
            x = x + width;
        }
    };

    //Render the main cells.  We snapshot the context to insure against its polution.
    //<br>TODO:save/restore should be a general wrapper that we use here and for the other renderer, fixed rows/cols and gridlines as well.
    proto.paintCells = function(ctx, offsetX, offsetY) {
        try {
            ctx.save();
            this._paintCells(ctx, offsetX, offsetY);
        } finally {
            ctx.restore();
        }
    };
    proto._paintCells = function(ctx, offsetX, offsetY) {
        var behavior = this.getBehavior();
        var numCols = behavior.getColCount();
        var numRows = behavior.getRowCount();
        var x = offsetX;
        var startY = offsetY;
        var scrollTop = this.getScrollTop();
        var scrollLeft = this.getScrollLeft();
        var cellProvider = this.getGrid().getCellProvider();
        var font = constants.defaultFont;
        var fgColor = constants.foregroundColor;
        var bgColor = constants.backgroundColor;
        var fgSelColor = constants.foregroundSelColor;
        var bgSelColor = constants.backgroundSelColor;
        var viewWidth = this.getBounds().width();
        var viewHeight = this.getBounds().height();

        for (var c = 0; c < numCols; c++) {
            var width = this.getColWidth(c + scrollLeft);
            if (x > viewWidth || numCols <= scrollLeft + c) {
                return;
            }

            var y = startY;
            var colAlign = behavior.getColAlignment(c + scrollLeft);
            //fill background
            ctx.fillStyle = bgColor;
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
                var cell = cellProvider.getCell(cellConfig(c + scrollLeft, r + scrollTop, value, fgColor, bgColor, fgSelColor, bgSelColor, font, isSelected, colAlign));

                cell.paint(ctx, x, y, width, height);

                y = y + height;
            }

            x = x + width;
        }
    };

    //This is the empty top left corner of the grid.
    proto.paintTopLeft = function(ctx, offsetX, offsetY) {
        ctx.beginPath();
        //var border = this.getGrid().provider.require('borderprovider').getBorder('simple');
        var fixedRowHeight = this.getBehavior().getFixedRowsHeight();
        var fixedColWidth = this.getBehavior().getFixedColsWidth();
        ctx.fillStyle = constants.topLeftHeaderBGColor;
        ctx.fillRect(offsetX, offsetY, fixedColWidth, fixedRowHeight);
        //border.paint(ctx, offsetX, offsetY, fixedColWidth, fixedRowHeight, constants.lineColor);
        ctx.stroke();
    };

    proto.isFixedRowCellSelected = function(col) {
        return this.getGrid().isFixedRowCellSelected(col);
    };

    proto.isFixedColCellSelected = function(row) {
        return this.getGrid().isFixedColCellSelected(row);
    };

    proto.getScrollTop = function() {
        var st = this.getGrid().getVScrollValue();
        return st;
    };

    proto.getScrollLeft = function() {
        var st = this.getGrid().getHScrollValue();
        return st;
    };

    proto.getBehavior = function() {
        return this.getGrid().getBehavior();
    };

    proto.getConstants = function() {
        return this.getGrid().constants;
    };

    proto.getFixedRowHeight = function(rowIndex) {
        var height = this.getBehavior().getFixedRowHeight(rowIndex);
        return height;
    };

    proto.getRowHeight = function(rowIndex) {
        var height = this.getBehavior().getRowHeight(rowIndex);
        return height;
    };

    proto.getColWidth = function(colIndex) {
        var width = this.getBehavior().getColWidth(colIndex);
        return width;
    };

    proto.getFixedColWidth = function(rowIndex) {
        var height = this.getBehavior().getFixedColWidth(rowIndex);
        return height;
    };

    root.fin = root.fin || {};
    root.fin.wc = root.fin.wc || {};
    root.fin.wc.hypergrid = root.fin.wc.hypergrid || {};
    root.fin.wc.hypergrid.HypergridRenderer = HypergridRenderer;

}).call(this); /* jslint ignore:line */
