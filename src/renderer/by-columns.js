'use strict';

var bundleColumns = require('./bundle-columns');

/** @summary Render the grid with consolidated column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * First, a background rect is drawn using the grid background color.
 *
 * Then, if there are any columns with their own background color _that differs from the grid background color,_ these are consolidated and the consolidated groups of column backgrounds are all drawn before iterating through cells. Note that these column rects are _not_ suitable for clipping overflow text from previous columns. If you have overflow text, either turn on clipping (`grid.properties.columnClip = true` but big performance hit) or turn on one of the `truncateTextWithEllipsis` options.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * **Regading clipping.** The reason for clipping is to prevent text from overflowing into the next column. However there is a serious performance cost.
 *
 * For performance reasons {@link Renderer#_paintCell|_paintCell} does not set up a clipping region for each cell. However, iff grid property `columnClip` is truthy, this grid renderer will set up a clipping region to prevent text overflow to right. If `columnClip` is `null`, a clipping region will only be set up on the last column. Otherwise, there will be no clipping region.
 *
 * The idea of clipping just the last column is because in addition to the optional graphics clipping, we also clip ("truncate") text. Text can be truncated conservatively so it will never overflow. The problem with this is that characters vanish as they hit the right cell boundary, which may or may be obvious depending on font size. Alternatively, text can be truncated so that the overflow will be a maximum of 1 character. This allows partial characters to be rendered. But this is where graphics clipping is required.
 *
 * When renderering column by column as this particular renderer does, _and_ when the background color _of the next cell to the right_ is opaque (alpha = 1), clipping can be turned off because each column will _overpaint_ any text that overflowed from the one before. However, any text that overflows the last column will paint into unused canvas region to the right of the grid. This is the _raison d'être_ for "clip last column only" option mentioned above (when `columnClip` is set to `null`). To avoid even this performance cost (of clipping just the last column), column widths can be set to fill the available canvas.
 *
 * Note that text never overflows to left because text starting point is never < 0. The reason we don't clip to the left is for cell renderers that need to re-render to the left to produce a merged cell effect, such as grouped column header.

 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByColumns(gc) {
    var grid = this.grid,
        gridProps = grid.properties,
        prefillColor, gridPrefillColor = gridProps.backgroundColor,
        cellEvent,
        columnBundle, columnBundles,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        c, C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        viewWidth = C ? visibleColumns[cLast].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;


    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (gc.alpha(gridPrefillColor) > 0) {
        gc.cache.fillStyle = gridPrefillColor;
        gc.fillRect(0, 0, viewWidth, viewHeight);
    }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers(['by-columns-discrete']);
        this.gridRenderer.reset = false;
        bundleColumns.call(this, true);
    } else if (this.gridRenderer.rebundle) {
        this.gridRenderer.rebundle = false;
        bundleColumns.call(this);
    }

    for (columnBundles = this.columnBundles, c = columnBundles.length; c--;) {
        columnBundle = columnBundles[c];
        gc.clearFill(columnBundle.left, 0, columnBundle.right - columnBundle.left, viewHeight, columnBundle.backgroundColor);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    var p = 0;
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        prefillColor = cellEvent.column.properties.backgroundColor;

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            cellEvent = pool[p]; // next cell down the column (redundant for first cell in column)

            try {
                preferredWidth = Math.max(preferredWidth, this._paintCell(gc, cellEvent, prefillColor));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, cellEvent.visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }, this);

    // gc.clipRestore(clipToGrid);

    this.paintGridlines(gc);
}

paintCellsByColumns.key = 'by-columns';
paintCellsByColumns.rebundle = true; // see rebundleGridRenderers

module.exports = paintCellsByColumns;
