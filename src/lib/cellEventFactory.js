'use strict';

var rectangular = require('rectangular');

// Variation of rectangular.Point but with writable x and y
function WritablePoint(x, y) {
    this.x = x;
    this.y = y;
}

WritablePoint.prototype = rectangular.Point.prototype;

// The nullSubgrid is for CellEvents representing clicks below last row.
var nullSubgrid = {};

// Create a new prototype based on `Point`'s prototype but with additional members mixed in.
var prototype = {

    // Following x, y, c, r are temporary bug-catchers:
    /* eslint-disable no-debugger */
    get x() { debugger; },
    get y() { debugger; },
    get c() { debugger; },
    get r() { debugger; },

    get value() { return this.subgrid.getValue(this.dataCell.x, this.dataCell.y); },
    set value(value) { this.subgrid.setValue(this.dataCell.x, this.dataCell.y, value); },

    get bounds() { return this._bounds || (this._bounds = this.renderer.getBoundsOfCell(this.gridCell.x, this.gridCell.y)); },

    getCellProperty: function(propName) { return this.column.getCellProperty(this, propName); },

    get isGridRow() { return !this.subgrid.type; },
    get isGridColumn() { return this.gridCell.x >= 0; },
    get isGridCell() { return this.isGridRow && this.isGridColumn; },

    get isRowSelected() { return this.isGridRow && this.selectionModel.isRowSelected(this.dataCell.y); },
    get isColumnSelected() { return this.isGridColumn && this.selectionModel.isColumnSelected(this.gridCell.x); },
    get isCellSelected() { return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y); },

    get isRowHovered() { return this.isGridRow && this.grid.hoverCell && this.grid.hoverCell.y === this.gridCell.y; },
    get isColumnHovered() { return this.isGridColumn && this.grid.hoverCell && this.grid.hoverCell.x === this.gridCell.x; },
    get isCellHovered() { return this.isRowHovered && this.isColumnHovered; },

    get isHandleColumn() { return !this.isGridColumn; },
    get isHandleCell() { return this.isHandleColumn && this.isGridRow; },

    get isHierarchyColumn() {
        return this.gridCell.x === 0 &&
            this.grid.properties.showTreeColumn &&
            this.dataModel.isDrillDown(this.behavior.getActiveColumn(this.gridCell.x).index);
    },

    get isHeaderRow() { return this.subgrid.type === 'header'; },
    get isHeaderHandle() { return this.isHeaderRow && this.isHandleColumn; },
    get isHeaderCell() { return this.isHeaderRow && this.isGridColumn; },

    get isFilterRow() { return this.subgrid.type === 'filter'; },
    get isFilterHandle() { return this.isFilterRow && this.isHandleColumn; },
    get isFilterCell() { return this.isFilterRow && this.isGridColumn; },

    get isSummaryRow() { return this.subgrid.type === 'summary'; },
    get isSummaryHandle() { return this.isSummaryRow && this.isHandleColumn; },
    get isSummaryCell() { return this.isSummaryRow && this.isGridColumn; },

    get isTopTotalsRow() { return this.subgrid === this.behavior.subgrids.topTotals; },
    get isTopTotalsHandle() { return this.isTopTotalsRow && this.isHandleColumn; },
    get isTopTotalsCell() { return this.isTopTotalsRow && this.isGridColumn; },

    get isBottomTotalsRow() { return this.subgrid === this.behavior.subgrids.bottomTotals; },
    get isBottomTotalsHandle() { return this.isBottomTotalsRow && this.isHandleColumn; },
    get isBottomTotalsCell() { return this.isBottomTotalsRow && this.isGridColumn; },

    plusXY: function(dx, dy) {
        return new this.constructor(this.gridCell.plusXY(dx, dy));
    }
};

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
     * * Excludes `this.gridCell`, `this.dataCell`, `this.subgrid` defined by constructor (as non-enumerable).
     * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
     * @param {number} x - grid cell coordinate (adjusted for horizontal scrolling after fixed columns)
     * @param {number} y - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     * @param {DataModel} subgrid
     * @param {number} rowIndex - zero-based offset within section (adjusted for vertical scrolling if data subgrid)
     * @constructor
     */
    function CellEvent(x, y, subgrid, rowIndex) {
        /**
         * @name column
         * @type {Column}
         * @memberOf CellEvent#
         */
        this.column = grid.behavior.getActiveColumn(x);

        Object.defineProperties(this, {
            /**
             * @name gridCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            gridCell: { value: new WritablePoint(x, y) },

            /**
             * @name dataCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            dataCell: { value: new WritablePoint(this.column && this.column.index, rowIndex) },

            /**
             * @name subgrid
             * @type {DataModel}
             * @memberOf CellEvent#
             */
            subgrid: { value: subgrid || nullSubgrid, writable: true }
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
