'use strict';

var bundleRows = require('./bundle-rows');

/** @summary Render the grid.
 * @desc _**NOTE:** This grid renderer is not as performant as the others and it's use is not recommended if you care about performance. The reasons for the wanting performance are unclear, possibly having to do with the way Chrome optimizes access to the column objects?_
 *
 * Paints all the cells of a grid, one row at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any rows with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of row backgrounds are all drawn before iterating through cells.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByRows(gc) {
    var grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles = this.rowBundles,
        visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = 0, cLast = C - 1,
        r, R = visibleRows.length,
        p, pool = this.cellEventPool,
        preferredWidth = Array(C - c0).fill(0),
        columnClip,
        // clipToGrid,
        viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0,
        drawLines = gridProps.gridLinesH,
        lineWidth = gridProps.gridLinesHWidth,
        lineColor = gridProps.gridLinesHColor;

    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers();
        this.gridRenderer.reset = false;
        bundleRows.call(this, true);
    }

    rowPrefillColors = this.rowPrefillColors;

    for (r = rowBundles.length; r--;) {
        rowBundle = rowBundles[r];
        gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top, rowBundle.backgroundColor);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each row of each subgrid...
    for (p = 0, r = 0; r < R; r++) {
        prefillColor = rowPrefillColors[r];

        if (drawLines) {
            gc.cache.fillStyle = lineColor;
            gc.fillRect(0, pool[p].visibleRow.bottom, viewWidth, lineWidth);
        }

        // For each column (of each row)...
        this.visibleColumns.forEachWithNeg(function(vc) {  // eslint-disable-line no-loop-func
            p++;
            cellEvent = pool[p]; // next cell across the row (redundant for first cell in row)
            vc = cellEvent.visibleColumn;

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            columnClip = vc.column.properties.columnClip;
            gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

            try {
                preferredWidth[c] = Math.max(preferredWidth[c], this._paintCell(gc, cellEvent, prefillColor));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, vr);
            }

            gc.clipRestore(columnClip);
        }, this);
    }

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);

    this.visibleColumns.forEachWithNeg(function(vc, c) {
        vc.column.properties.preferredWidth = Math.round(preferredWidth[c]);
    });
}

paintCellsByRows.key = 'by-rows';

module.exports = paintCellsByRows;
