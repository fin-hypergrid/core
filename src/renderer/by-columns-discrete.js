'use strict';

var bundleColumns = require('./bundle-columns');

/** @summary Render the grid with discrete column rects.
 * @desc Paints all the cells of a grid, one column at a time.
 *
 * In this grid renderer, a background rect is _not_ drawn using the grid background color.
 *
 * Rather, all columns paint their own background rects, with color defaulting to grid background color.
 *
 * The idea of painting each column rect is to "clip" text that might have overflowed from the previous column by painting over it with the background from this column. Only the last column will show overflowing text, and only if the canvas width exceeds the grid width. If this is the case, you can turn on clipping for the last column only by setting `columnClip` to `true` for the last column.
 *
 * NOTE: As a convenience feature, setting `columnClip` to `null` will clip only the last column, so simply setting it on the grid (rather than the last column) will have the same effect. This is much more convenient because you don't have to worry about the last column being redefined (moved, hidden, etc).
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumnsDiscrete|paintCellsByColumnsDiscrete}.

 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsByColumnsDiscrete(gc) {
    var prefillColor,
        cellEvent,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        // viewWidth = C ? visibleColumns[C - 1].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;

    gc.clearRect(0, 0, this.bounds.width, this.bounds.height);

    if (!C || !R) { return; }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers(['by-columns']);
        this.gridRenderer.reset = false;
        bundleColumns.call(this, true);
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    var p = 0;
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        prefillColor = cellEvent.column.properties.backgroundColor;
        gc.clearFill(vc.left, 0, vc.width, viewHeight, prefillColor);

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

paintCellsByColumnsDiscrete.key = 'by-columns-discrete';

module.exports = paintCellsByColumnsDiscrete;
