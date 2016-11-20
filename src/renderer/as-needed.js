'use strict';

var bundleRows = require('./bundle-rows');

/** @summary Render the grid.
 * @desc Paint all the cells of a grid, one column at a time.
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
function paintCellsByColumnsWithRowRects(gc) {
    var width,
        grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, columnPrefillColor, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles,
        vc, visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        c, C = visibleColumns.length, c0 = grid.isShowRowNumbers() ? -1 : 0,
        r, R = visibleRows.length,
        p, pool = this.cellEventPool,
        preferredWidth,
        columnClip = gridProps.columnClip,
        clipToGrid = columnClip === null,
        viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (paintCellsByColumnsWithRowRects.reset) {
        paintCellsByColumnsWithRowRects.reset = false;

        for (p = 0, c = c0; c < C; c++) {
            for (r = 0; r < R; r++, p++) {
                // reset pool members to reflect coordinates of cells in newly shaped grid
                pool[p].reset(visibleColumns[c], visibleRows[r]);
            }
        }

        bundleRows.call(this, false);
    }

    for (rowBundles = this.rowBundles, r = rowBundles.length; r--;) {
        rowBundle = rowBundles[r];
        gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top + 1, rowBundle.backgroundColor);
    }

    rowPrefillColors = rowBundles.length && this.rowPrefillColors;

    gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    for (p = 0, c = c0; c < C; c++) {
        cellEvent = pool[p];
        vc = cellEvent.visibleColumn;

        if (!rowPrefillColors) {
            if ((columnPrefillColor = cellEvent.column.properties.backgroundColor) === gridPrefillColor) {
                prefillColor = gridPrefillColor;
            } else {
                prefillColor = columnPrefillColor;
                gc.clearFill(vc.left, 0, vc.width, viewHeight, prefillColor);
            }
        }

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        gc.clipSave(columnClip, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            if (rowPrefillColors) {
                prefillColor = rowPrefillColors[r];
            }

            try {
                width = this._paintCell(gc, pool[p], prefillColor);
                preferredWidth = Math.max(width, preferredWidth);
            } catch (e) {
                this.renderErrorCell(e, gc, vc, pool[p].visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = preferredWidth;
    }

    gc.clipRestore(clipToGrid);
}

paintCellsByColumnsWithRowRects.key = 'by-columns-and-rows';

module.exports = paintCellsByColumnsWithRowRects;
