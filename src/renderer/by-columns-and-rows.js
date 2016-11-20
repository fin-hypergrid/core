'use strict';

var bundleColumns = require('./bundle-columns');
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
function paintCellsByColumnWithRowRect(gc) {
    var width,
        grid = this.grid,
        gridProps = grid.properties,
        prefillColor, rowPrefillColors, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        rowBundle, rowBundles,
        columnBundle, columnBundles,
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

    if (paintCellsByColumnWithRowRect.reset) {
        paintCellsByColumnWithRowRect.reset = false;
        bundleRows.call(this, false);
        bundleColumns.call(this);
    }

    rowBundles = this.rowBundles;
    if (rowBundles.length) {
        rowPrefillColors = this.rowPrefillColors;
        for (r = rowBundles.length; r--;) {
            rowBundle = rowBundles[r];
            gc.clearFill(0, rowBundle.top, viewWidth, rowBundle.bottom - rowBundle.top + 1, rowBundle.backgroundColor);
        }
    } else {
        for (columnBundles = this.columnBundles, c = columnBundles.length; c--;) {
            columnBundle = columnBundles[c];
            gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
        }
    }

    gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    for (p = 0, c = c0; c < C; c++) {
        cellEvent = pool[p];
        vc = cellEvent.visibleColumn;

        if (!rowPrefillColors) {
            prefillColor = cellEvent.column.properties.backgroundColor;
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

paintCellsByColumnWithRowRect.key = 'by-columns-and-rows';

module.exports = paintCellsByColumnWithRowRect;
