'use strict';

var bundleRows = require('./bundle-rows');

/** @summary Render the grid.
 * @desc Paint all the cells of a grid, one row at a time.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by calling {@link CellEvent#reset|reset} on each.
 *
 * See discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByRows(gc) {
    var width,
        grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles = this.rowBundles,
        vc, visibleColumns = this.visibleColumns,
        vr, visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = grid.isShowRowNumbers() ? -1 : 0,
        r, R = visibleRows.length,
        p, pool = this.cellEventPool,
        preferredWidth = Array(C - c0).fill(0),
        columnClip = gridProps.columnClip,
        clipToGrid = columnClip === null,
        viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0,
        lineWidth = gridProps.lineWidth,
        lineColor = gridProps.lineColor;

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (paintCellsByRows.reset) {
        paintCellsByRows.reset = false;
        bundleRows.call(this, true);
    }

    for (r = rowBundles.length; r--;) {
        rowBundle = rowBundles[r];
        gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top + 1, rowBundle.backgroundColor);
    }

    rowPrefillColors = this.rowPrefillColors;

    gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each row of each subgrid...
    for (p = 0, r = 0; r < R; r++) {
        prefillColor = rowPrefillColors[r];

        if (gridProps.gridLinesH) {
            gc.cache.fillStyle = lineColor;
            gc.fillRect(0, pool[p].visibleRow.bottom, viewWidth, lineWidth);
        }

        // For each column (of each row)...
        for (c = c0; c < C; c++, p++) {
            cellEvent = pool[p]; // next cell across the row (redundant for first cell in row)
            vc = cellEvent.visibleColumn;

            // Optionally clip to visible portion of column to prevent text from overflowing to right.
            gc.clipSave(columnClip, 0, 0, vc.right, viewHeight);

            try {
                width = this._paintCell(gc, cellEvent, prefillColor);
                preferredWidth[c] = Math.max(width, preferredWidth[c]);
            } catch (e) {
                this.renderErrorCell(e, gc, vc, vr);
            }

            gc.clipRestore(columnClip);
        }
    }

    gc.clipRestore(clipToGrid);

    for (c = c0; c < C; c++) {
        visibleColumns[c].column.properties.preferredWidth = preferredWidth[c];
    }
}

paintCellsByRows.key = 'by-rows';

module.exports = paintCellsByRows;
