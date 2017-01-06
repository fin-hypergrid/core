'use strict';

var deprecated = require('./deprecated');
var WritablePoint = require('./WritablePoint');

var writableDescriptor = { writable: true };
var eumerableDescriptor = { writable: true, enumerable: true };

// The nullSubgrid is for CellEvents representing clicks below last row.
// var nullSubgrid = {};

var prototype = Object.defineProperties({}, {
    value: {
        get: function() { return this.visibleRow.subgrid.getValue(this.dataCell.x, this.dataCell.y); },
        set: function(value) { this.visibleRow.subgrid.setValue(this.dataCell.x, this.dataCell.y, value); }
    },

    dataRow: {
        get: function() { return this.visibleRow.subgrid.getRow(this.dataCell.y); }
    },

    formattedValue: {
        get: function() { return this.grid.formatValue(this.properties.format, this.value); }
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
                cp = cp.rowHeader;
            } else if (this.isDataRow) {
                // cp already set to basic props
            } else if (this.isFilterRow) {
                cp = cp.filterProperties;
            } else if (this.isInfoRow) {
                cp = cp.infoProperties;
            } else { // unselected header, summary, etc., all have save look as unselected header
                cp = cp.columnHeader;
            }
            this._columnProperties = cp;
        }
        return cp;
    } },
    cellOwnProperties: { get: function() { // do not use for get/set prop because may return null; instead use  .getCellProperty('prop') or .properties.prop (preferred) to get and setCellProperty('prop', value) to set
        if (this._cellOwnProperties === undefined) {
            this._cellOwnProperties = this.column.getCellOwnProperties(this.dataCell.y, this.visibleRow.subgrid);
        }
        return this._cellOwnProperties; // null return means there is no cell properties object
    } },
    properties: { get: function() {
        return this.cellOwnProperties || this.columnProperties;
    } },
    getCellProperty: { value: function(key) { // included for completeness but .properties[key] is preferred
        return this.properties[key];
    } },
    setCellProperty: { value: function(key, value) { // do not use .cellOwnProperties[key] = value because object may be null (this method creates object as needed)
        this._cellOwnProperties = this.column.setCellProperty(this.dataCell.y, key, value, this.visibleRow.subgrid);
    } },

    // special methods for use by renderer which reuses cellEvent object for performance reasons
    reset: { value: function(visibleColumn, visibleRow) {
        // getter caches
        this._columnProperties = undefined;
        this._cellOwnProperties = undefined;
        this._bounds = undefined;

        // partial render support
        this.snapshot = undefined;
        this.minWidth = undefined;
        this.disabled = undefined;

        this.visibleColumn = visibleColumn;
        this.visibleRow = visibleRow;

        this.column = visibleColumn.column; // enumerable so will be copied to cell renderer object

        this.gridCell.x = visibleColumn.columnIndex;
        this.gridCell.y = visibleRow.index;

        this.dataCell.x = this.column && this.column.index;
        this.dataCell.y = visibleRow.rowIndex;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridC - Horizontal grid cell coordinate adjusted for horizontal scrolling after fixed columns.
     * @param {number} gridY - Raw vertical grid cell coordinate.
     * @returns {boolean} Visibility.
     * @memberOf CellEvent#
     */
    resetGridCY: { value: function(gridC, gridY) {
        var vr, vc, visible = (vc = this.renderer.getVisibleColumn(gridC)) && (vr = this.renderer.getVisibleRow(gridY));
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridX - Raw horizontal grid cell coordinate.
     * @param {number} gridY - Raw vertical grid cell coordinate.
     * @returns {boolean} Visibility.
     * @memberOf CellEvent#
     */
    resetGridXY: { value: function(gridX, gridY) {
        var vr, vc, visible = (vc = this.renderer.visibleColumns[gridX]) && (vr = this.renderer.getVisibleRow(gridY));
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * @summary Set up this `CellEvent` instance to point to the cell at the given data coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view), the instance is not reset.
     * @param {number} dataX - Horizontal data cell coordinate.
     * @param {number} dataY - Vertical data cell coordinate.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @returns {boolean} Visibility.
     * @memberOf CellEvent#
     */
    resetDataXY: { value: function(dataX, dataY, subgrid) {
        var vr, vc, visible = (vc = this.renderer.getVisibleDataColumn(dataX)) && (vr = this.renderer.getVisibleDataRow(dataY, subgrid));
        if (visible) { this.reset(vc, vr); }
        return visible;
    } },

    /**
     * Set up this `CellEvent` instance to point to the cell at the given grid column and data row coordinates.
     * @desc If the requested cell is not be visible (due to being scrolled out of view or outside the bounds of the rendered grid), the instance is not reset.
     * @param {number} gridX - Horizontal grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param {number} dataY - Vertical data cell coordinate.
     * @param {dataModelAPI} [subgrid=this.behavior.subgrids.data]
     * @returns {boolean} Visibility.
     * @memberOf CellEvent#
     */
    resetGridXDataY: { value: function(gridX, dataY, subgrid) {
        var vr, vc, visible = (vc = this.renderer.getVisibleColumn(gridX)) && (vr = this.renderer.getVisibleDataRow(dataY, subgrid));
        if (visible) { this.reset(vc, vr); }
        return visible && this;
    } },

    /**
     * Copy self with or without own properties
     * @param {boolan} [assign=false] - Copy the own properties to the clone.
     * @returns {CellEvent}
     * @memberOf CellEvent#
     */
    clone: { value: function(assign) {
        var cellEvent = new this.constructor;

        cellEvent.resetGridXY(this.visibleColumn.index, this.visibleRow.index);

        if (assign) {
            // copy own props
            Object.assign(cellEvent, this);
        }

        return cellEvent;
    } },

    editPoint: {
        get: function() {
            throw 'The `.editPoint` property is no longer available as of v1.2.10. Use the following coordinates instead:\n' +
            '`.gridCell.x` - The active column index. (Adjusted for column scrolling after fixed columns.)\n' +
            '`.gridCell.y` - The vertical grid coordinate. (Unaffected by row scrolling.)\n' +
            '`.dataCell.x` - The data model\'s column index. (Unaffected by column scrolling.)\n' +
            '`.dataCell.y` - The data model\'s row index. (Adjusted for data row scrolling after fixed rows.)\n';
        }
    },

    subgrid: { get: function() { return this.visibleRow.subgrid; } },

    // "Visible" means scrolled into view.
    isRowVisible:    { get: function() { return !!this.visibleRow; } },
    isColumnVisible: { get: function() { return !!this.visibleColumn; } },
    isCellVisible:   { get: function() { return this.isRowVisible && this.isColumnVisible; } },

    isDataRow:    { get: function() { return this.visibleRow.subgrid.isData; } },
    isDataColumn: { get: function() { return this.gridCell.x >= 0; } },
    isDataCell:   { get: function() { return this.isDataRow && this.isDataColumn; } },

    isRowSelected:    { get: function() { return this.isDataRow && this.selectionModel.isRowSelected(this.dataCell.y); } },
    isColumnSelected: { get: function() { return this.isDataColumn && this.selectionModel.isColumnSelected(this.gridCell.x); } },
    isCellSelected:   { get: function() { return this.selectionModel.isCellSelected(this.gridCell.x, this.dataCell.y); } },

    isRowHovered:    { get: function() { return this.isDataRow && this.grid.hoverCell && this.grid.hoverCell.y === this.gridCell.y; } },
    isColumnHovered: { get: function() { return this.isDataColumn && this.grid.hoverCell && this.grid.hoverCell.x === this.gridCell.x; } },
    isCellHovered:   { get: function() { return this.isRowHovered && this.isColumnHovered; } },

    isRowFixed:    { get: function() { return this.isDataRow && this.dataCell.y < this.grid.properties.fixedRowCount; } },
    isColumnFixed: { get: function() { return this.isDataColumn && this.gridCell.x < this.grid.properties.fixedColumnCount; } },
    isCellFixed:   { get: function() { return this.isRowFixed && this.isColumnFixed; } },

    isHandleColumn: { get: function() { return !this.isDataColumn; } },
    isHandleCell:   { get: function() { return this.isHandleColumn && this.isDataRow; } },

    isHierarchyColumn: { get: function() { return this.gridCell.x === 0 && this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(this.dataCell.x); } },

    isInfoRow:      { get: function() { return this.visibleRow.subgrid.isInfo; } },

    isHeaderRow:    { get: function() { return this.visibleRow.subgrid.isHeader; } },
    isHeaderHandle: { get: function() { return this.isHeaderRow && this.isHandleColumn; } },
    isHeaderCell:   { get: function() { return this.isHeaderRow && this.isDataColumn; } },

    isFilterRow:    { get: function() { return this.visibleRow.subgrid.isFilter; } },
    isFilterHandle: { get: function() { return this.isFilterRow && this.isHandleColumn; } },
    isFilterCell:   { get: function() { return this.isFilterRow && this.isDataColumn; } },

    isSummaryRow:    { get: function() { return this.visibleRow.subgrid.isSummary; } },
    isSummaryHandle: { get: function() { return this.isSummaryRow && this.isHandleColumn; } },
    isSummaryCell:   { get: function() { return this.isSummaryRow && this.isDataColumn; } },

    isTopTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.lookup.topTotals; } },
    isTopTotalsHandle: { get: function() { return this.isTopTotalsRow && this.isHandleColumn; } },
    isTopTotalsCell:   { get: function() { return this.isTopTotalsRow && this.isDataColumn; } },

    isBottomTotalsRow:    { get: function() { return this.visibleRow.subgrid === this.behavior.subgrids.lookup.bottomTotals; } },
    isBottomTotalsHandle: { get: function() { return this.isBottomTotalsRow && this.isHandleColumn; } },
    isBottomTotalsCell:   { get: function() { return this.isBottomTotalsRow && this.isDataColumn; } },

    $$CLASS_NAME: { value: 'CellEvent' },
    deprecated: { value: deprecated },

    isGridRow: { get: function() {
        this.deprecated('isGridRow', '.isGridRow is deprecated as of v1.2.10 in favor of .isDataRow. (Will be removed in a future release.)');
        return this.isDataRow;
    } },
    isGridColumn: { get: function() {
        this.deprecated('isGridColumn', '.isGridColumn is deprecated as of v1.2.10 in favor of .isDataColumn. (Will be removed in a future release.)');
        return this.isDataColumn;
    } },
    isGridCell: { get: function() {
        this.deprecated('isGridCell', '.isGridCell is deprecated as of v1.2.10 in favor of .isDataCell. (Will be removed in a future release.)');
        return this.isDataCell;
    } },
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
function factory(grid) {

    /**
     * @summary Create a new CellEvent object.
     * @desc All own enumerable properties are mixed into cell editor:
     * * Includes `this.column` defined by constructor (as enumerable).
     * * Excludes `this.gridCell`, `this.dataCell`, `this.visibleRow.subgrid` defined by constructor (as non-enumerable).
     * * Any additional (enumerable) members mixed in by application's `getCellEditorAt` override.
     *
     * Omit params to defer the convenience call to {CellEvent#resetGridCY}.
     * (See also the alternative {@link CellEvent#resetGridXY}; and {@link CellEvent#resetDataXY} which accepts `dataX`, `dataY`.)
     *
     * @param {number} [gridX] - grid cell coordinate (adjusted for horizontal scrolling after fixed columns).
     * @param {number} [gridY] - grid cell coordinate, adjusted (adjusted for vertical scrolling if data subgrid)
     * @constructor
     */
    function CellEvent(gridX, gridY) {
        // remaining instance vars are non-enumerable so `CellEditor` constructor won't mix them in (for mustache use).
        Object.defineProperties(this, {
            /**
             * @name visibleColumn
             * @type {visibleColumnDescriptor}
             * @memberOf CellEvent#
             */
            visibleColumn: writableDescriptor,

            /**
             * @name visibleRow
             * @type {visibleRowDescriptor}
             * @memberOf CellEvent#
             */
            visibleRow: writableDescriptor,

            /**
             * @name gridCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            gridCell: {
                value: new WritablePoint
            },

            /**
             * @name dataCell
             * @type {WritablePoint}
             * @memberOf CellEvent#
             */
            dataCell: {
                value: new WritablePoint
            },

            // column is enumerable so it will be copied to cell event on CellEvent.prototype.initialize.
            column: eumerableDescriptor,

            // getter caches
            _columnProperties: writableDescriptor,
            _cellOwnProperties: writableDescriptor,
            _bounds: writableDescriptor,

            // Following supports cell renderers' "partial render" capability:
            snapshot: writableDescriptor,
            minWidth: writableDescriptor,
            disabled: writableDescriptor
        });

        if (arguments.length) {
            this.resetGridCY(gridX, gridY);
        }
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

module.exports = factory;
