'use strict';

var paintCellsByColumnsAndRows = require('./by-columns-and-rows');

/** @summary Render the grid only as needed ("partial render").
 * @desc Paints all the cells of a grid, one column at a time, but only as needed.
 *
 * Partial render is supported only by those cells whose cell renderer supports it by returning before rendering (based on `config.snapshot`).
 *
 * #### On reset
 *
 * Defers to {@link Renderer#paintCellsByColumnsAndRows|paintCellsByColumnsAndRows}, which clears the canvas, draws the grid, and draws the grid lines.
 *
 * #### On the next call (after reset)
 *
 * Each cell is drawn redrawn only when its appearance changes. This determination is made by the cell renderer by comparing with (and maintaining) `config.snapshot`. See {@link SimpleCell} for a sample implementation.
 *
 * `try...catch` surrounds each cell paint in case a cell renderer throws an error.
 * The error message is error-logged to console AND displayed in cell.
 *
 * #### On subsequent calls
 *
 * Iterates through each cell, calling `_paintCell` with `undefined` prefill color. This signifies partial render to the {@link SimpleCell} cell renderer, which only renders the cell when it's text, font, or colors have changed.
 *
 * Each cell to be rendered is described by a {@link CellEvent} object. For performance reasons, to avoid constantly instantiating these objects, we maintain a pool of these. When the grid shape changes, we reset their coordinates by setting {@link CellEvent#reset|reset} on each.
 *
 * See also the discussion of clipping in {@link Renderer#paintCellsByColumns|paintCellsByColumns}.
 * @this {Renderer}
 * @param {CanvasRenderingContext2D} gc
 * @memberOf Renderer.prototype
 */
function paintCellsAsNeeded(gc) {
    var cellEvent,
        visibleColumns = this.visibleColumns,
        visibleRows = this.visibleRows,
        C = visibleColumns.length, cLast = C - 1,
        r, R = visibleRows.length,
        p = 0, pool = this.cellEventPool,
        preferredWidth,
        columnClip,
        // clipToGrid,
        // viewWidth = C ? visibleColumns[cLast].right : 0,
        viewHeight = R ? visibleRows[R - 1].bottom : 0;


    if (!C || !R) { return; }

    if (this.gridRenderer.reset) {
        this.resetAllGridRenderers();
        paintCellsByColumnsAndRows.call(this, gc);
        this.gridRenderer.reset = false;
    }

    // gc.clipSave(clipToGrid, 0, 0, viewWidth, viewHeight);

    // For each column...
    this.visibleColumns.forEachWithNeg(function(vc, c) {
        cellEvent = pool[p]; // first cell in column c
        vc = cellEvent.visibleColumn;

        // Optionally clip to visible portion of column to prevent text from overflowing to right.
        columnClip = vc.column.properties.columnClip;
        gc.clipSave(columnClip || columnClip === null && c === cLast, 0, 0, vc.right, viewHeight);

        // For each row of each subgrid (of each column)...
        for (preferredWidth = r = 0; r < R; r++, p++) {
            cellEvent = pool[p]; // next cell down the column (redundant for first cell in column)

            try {
                // Partial render signaled by calling `_paintCell` with undefined 3rd param (formal `prefillColor`).
                preferredWidth = Math.max(preferredWidth, this._paintCell(gc, pool[p]));
            } catch (e) {
                this.renderErrorCell(e, gc, vc, pool[p].visibleRow);
            }
        }

        gc.clipRestore(columnClip);

        cellEvent.column.properties.preferredWidth = Math.round(preferredWidth);
    }, this);

    // gc.clipRestore(clipToGrid);

    if (this.grid.properties.boxSizing === 'border-box') {
        this.paintGridlines(gc);
    }
}

paintCellsAsNeeded.key = 'by-cells';

paintCellsAsNeeded.partial = true; // skip painting selectionRegionOverlayColor

module.exports = paintCellsAsNeeded;
