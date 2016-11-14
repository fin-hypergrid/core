'use strict';

var rectangular = require('rectangular');

// Variation of rectangular.Point but with writable x and y:
function WritablePoint(x, y) {
    this.x = x;
    this.y = y;
}

WritablePoint.prototype = rectangular.Point.prototype;

// The nullSubgrid is for CellEvents representing clicks below last row.
// var nullSubgrid = {};

var prototype = Object.defineProperties({}, {
    value: {
        get: function() { return this.visibleRow.subgrid.getValue(this.dataCell.x, this.dataCell.y); },
        set: function(value) { this.visibleRow.subgrid.setValue(this.dataCell.x, this.dataCell.y, value); }
    },

    row: {
        get: function() { return this.visibleRow.subgrid.getRow(this.dataCell.y); },
    },

    formattedValue: {
        get: function() { return this.grid.formatValue(this.getCellProperty('format'), this.value); }
    },

    bounds: { get: function() {
        return this._bounds || (this._bounds = {
            x: this.visibleColumn.left,
            y: this.visibleRow.top,
            width: this.visibleColumn.width,
            height: this.visibleRow.height
        });
    } },

    columnProperties: { get: function() {
        var cp = this._columnProperties;
        if (!cp) {
            cp = this.column.properties;
            if (this.isHandleColumn || this.isHierarchyColumn) {
                cp = this.isRowSelected ? cp.rowHeaderRowSelection : cp.rowHeader;
            } else if (this.isGridRow) {
                // cp already set to basic props
            } else if (this.isFilterRow) {
                cp = cp.filterProperties;
            } else if (this.isColumnSelected) { // selected header, summary, etc., all have save look as selected header
                cp = cp.columnHeaderColumnSelection;
            } else { // unselected header, summary, etc., all have save look as unselected header
                cp = cp.columnHeader;
            }
            this._columnProperties = cp;
        }
        return cp;
    } },
    cellOwnProperties: { get: function() {
        return (this._cellOwnProperties = this._cellOwnProperties || this.column.getCellOwnProperties(this.dataCell.y, this.visibleRow.subgrid));
    } },
    properties: { get: function() {
        return this.cellOwnProperties || this.columnProperties;
    } },
    getCellProperty: { value: function(propName) {
        return this.properties[propName];
    } },

    // special methods for use by renderer which reuses cellEvent object for performance reasons
    resetColumn: { value: function(visibleColumn) {
        this.visibleColumn = visibleColumn;
        this.column = this.behavior.getActiveColumn(visibleColumn.columnIndex);
        this.gridCell.x = visibleColumn.columnIndex;
        this.dataCell.x = this.column && this.column.index;
        this._columnProperties = undefined;
    } },
    resetRow: { value: function(visibleRow) {
        this.visibleRow = visibleRow;
        this.gridCell.y = visibleRow.index;
        this.dataCell.y = visibleRow.rowIndex;
        this._cellOwnProperties = this._properties = undefined;
    } },
    resetCell: { value: function() {
        // Resetting columnProperties causes columnProperties to be recalculated. Although this could have been done
        // in resetRow, for better performance can avoid this recalculation for a run of data cells, which is a
        // dominant use case as render progresses down each column. Therefore, renderer calls this function iff
        // either this is a non-data cell OR this is a data cell and the previous use was not.
        this._columnProperties = undefined;
    } },

    // "Visible" means scrolled into view.
    isRowVisible:    { get: function() { return !!this.visibleRow; } },
    isColumnVisible: { get: function() { return !!this.visibleColumn; } },
    isCellVisible:   { get: function() { return this.isRowVisible && this.isColumnVisible; } },

    isGridRow:    { get: function() { return !this.visibleRow.subgrid.type; } },
    isGridColumn: { get: function() { return this.gridCell.x >= 0; } },
    isGridCell:   { get: function() { return this.isGridRow && this.isGridColumn; } },

    isRowSelected:    { get: function() { return this.isGridRow && this.selectionModel.isRowSelected(this.dataCell.y); } },
    isColumnSelected: { get: function() { return this.isGridColumn && this.selectionModel.isColumnSelected(this.gridCell.x); } },
    isCellSelected:   { get: function() { return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y); } },

    isRowHovered:    { get: function() { return this.isGridRow && this.grid.hoverCell && this.grid.hoverCell.y === this.gridCell.y; } },
    isColumnHovered: { get: function() { return this.isGridColumn && this.grid.hoverCell && this.grid.hoverCell.x === this.gridCell.x; } },
    isCellHovered:   { get: function() { return this.isRowHovered && this.isColumnHovered; } },

    isRowFixed:    { get: function() { return this.isGridRow && this.dataCell.y < this.grid.properties.fixedRowCount; } },
    isColumnFixed: { get: function() { return this.isGridColumn && this.gridCell.x < this.grid.properties.fixedColumnCount; } },
    isCellFixed:   { get: function() { return this.isRowFixed && this.isColumnFixed; } },

    isHandleColumn: { get: function() { return !this.isGridColumn; } },
    isHandleCell:   { get: function() { return this.isHandleColumn && this.isGridRow; } },

    isHierarchyColumn: { get: function() { return this.gridCell.x === 0 && this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(this.dataCell.x); } },

    isHeaderRow:    { get: function() { return this.visibleRow.subgrid.type === 'header'; } },
    isHeaderHandle: { get: function() { return this.isHeaderRow && this.isHandleColumn; } },
    isHeaderCell:   { get: function() { return this.isHeaderRow && this.isGridColumn; } },

    isFilterRow:    { get: function() { return this.visibleRow.subgrid.type === 'filter'; } },
    isFilterHandle: { get: function() { return this.isFilterRow && this.isHandleColumn; } },
    isFilterCell:   { get: function() { return this.isFilterRow && this.isGridColumn; } },

    isSummaryRow:    { get: function() { return this.visibleRow.subgrid.type === 'summary'; } },
    isSummaryHandle: { get: function() { return this.isSummaryRow && this.isHandleColumn; } },
    isSummaryCell:   { get: function() { return this.isSummaryRow && this.isGridColumn; } },

    isTopTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.topTotals; } },
    isTopTotalsHandle: { get: function() { return this.isTopTotalsRow && this.isHandleColumn; } },
    isTopTotalsCell:   { get: function() { return this.isTopTotalsRow && this.isGridColumn; } },

    isBottomTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.bottomTotals; } },
    isBottomTotalsHandle: { get: function() { return this.isBottomTotalsRow && this.isHandleColumn; } },
    isBottomTotalsCell:   { get: function() { return this.isBottomTotalsRow && this.isGridColumn; } }
});

/**
 * @classdesc `CellEvent` is a very low-level object that needs to be super-efficient. JavaScript objects are well known to be light weight in general, but at this level we need to be careful.
 *
 * These objects were originally only being created on mouse events. This was no big deal as mouse events are few and far between. However, as of v1.2.0, the renderer now also creates one for each visible cell on each and every grid paint.
 *
 * For this reason, to maintain performance, each grid gets a custom definition of `CellEvent`, created by this class factory, with the following optimizations:
 *
 * * Use of `extend-me` is avoided because its `initialize` chain is a bit too heavy here.
 * * Custom versions of `CellEvent` for each grid lightens the load on the constructor.
 *
 * @summary Create a custom `CellEvent` class.
 *
 * @desc Create a custom definition of `CellEvent` for each grid instance, setting the `grid`, `behavior`, and `dataModel` properties on the prototype. As this happens once per grid instantiation, it avoids having to perform this set up work on every `CellEvent` instantiation.
 *
 * @param {HyperGrid} grid
 *
 * @returns {CellEvent}
 */
function CellEvent(grid) {

    /**
     * @summary Create a new CellEvent object.
     * @desc All own enumerable properties are mixed into cell editor:
     * * Includes `this.column` defined by constructor (as enumerable).
     * * Excludes `this.gridCell`, `this.dataCell`, `this.visibleRow.subgrid` defined by constructor (as non-enumerable).
     * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
     * @param {number} x - grid cell coordinate (adjusted for horizontal scrolling after fixed columns)
     * @param {number} y - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     * @constructor
     */
    function CellEvent(x, y) {
        var visibleRow = grid.renderer.visibleRows[y];

        /**
         * @summary Reference to column's {@link Column} object.
         * @desc Notes:
         * * Defined as enumerable so that `CellEditor` constructor mixes into itself.
         * * Defined as writable so it can be overwritten in `renderer.paintCells`.
         * @name column
         * @type {Column}
         * @memberOf CellEvent#
         */
        this.column = grid.behavior.getActiveColumn(x);


        // remaining instance vars are non-enumerable so `CellEditor` constructor won't mix them in (for mustache use).
        Object.defineProperties(this, {
            /**
             * @name visibleColumn
             * @type {visibleColumnDescriptor}
             * @memberOf CellEvent#
             */
            visibleColumn: {
                writable: true, // Allow to be overwritten in `renderer.paintCells` and `.computeCellsBounds`.
                value: this.grid.renderer.visibleColumns.find(function(vc) { return vc.columnIndex === x; })
            },

            /**
             * @name visibleRow
             * @type {visibleRowDescriptor}
             * @memberOf CellEvent#
             */
            visibleRow: {
                writable: true, // Allow to be overwritten in `renderer.paintCells` and `.computeCellsBounds`.
                value: visibleRow
            },

            /**
             * @name gridCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            gridCell: {
                value: new WritablePoint(x, y)
            },

            /**
             * @name dataCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            dataCell: {
                value: new WritablePoint(this.column && this.column.index, visibleRow.rowIndex)
            }
        });
    }

    CellEvent.prototype = Object.create(prototype);

    Object.defineProperties(CellEvent.prototype, {
        constructor: { value: CellEvent },
        grid: { value: grid },
        renderer: { value: grid.renderer },
        selectionModel: { value: grid.selectionModel },
        behavior: { value: grid.behavior },
        dataModel: { value: grid.behavior.dataModel }
    });

    return CellEvent;
}

module.exports = CellEvent;
