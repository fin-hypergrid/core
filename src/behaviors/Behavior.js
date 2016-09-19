/* eslint-env browser */

'use strict';

var _ = require('object-iterators');
var Base = require('../lib/Base');

var Column = require('./Column');
var dialogs = require('../dialogs');

var noExportProperties = [
    'columnHeader',
    'columnHeaderColumnSelection',
    'filterProperties',
    'rowHeader',
    'rowHeaderRowSelection',
    'rowNumbersProperties',
    'treeColumnProperties',
    'treeColumnPropertiesColumnSelection',
];

/**
 * @constructor
 * @abstract
 * @desc A sort of "model++." It contains all code/data that's necessary for easily implementing a virtual data source and its manipulation/analytics.
 *
 */
var Behavior = Base.extend('Behavior', {

    /**
     * @desc this is the callback for the plugin pattern of nested tags
     * @param {Hypergrid} grid
     * @param {object} [options] - _(See {@link behaviors.JSON#setData}.)_
     * @memberOf Behavior.prototype
     */
    initialize: function(grid, options) {
        /**
         * @type {Hypergrid}
         * @memberOf Behavior.prototype
         */
        this.grid = grid;

        this.initializeFeatureChain(grid);

        this.grid.behavior = this;
        this.reset(options);
    },

    /**
     * @desc create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
     * @param {Hypergrid} grid
     * @memberOf Behavior.prototype
     */
    initializeFeatureChain: function(grid) {
        var self = this;

        /**
         * @summary Hash of feature class names.
         * @desc Built here but otherwise not in use.
         * @type {object}
         * @memberOf Behavior.prototype
         */
        this.featureMap = {};

        this.features.forEach(function(FeatureConstructor) {
            var newFeature = new FeatureConstructor;
            self.featureMap[newFeature.$$CLASS_NAME] = newFeature;
            if (self.featureChain) {
                self.featureChain.setNext(newFeature);
            } else {
                /**
                 * @summary Controller chain of command.
                 * @desc Each feature is linked to the next feature.
                 * @type {Feature}
                 * @memberOf Behavior.prototype
                 */
                self.featureChain = newFeature;
            }
        });
        if (this.featureChain) {
            this.featureChain.initializeOn(grid);
        }
    },

    features: [], // override in implementing class unless no features

    reset: function(options) {
        this.clearState();

        if (this.dataModel) {
            this.dataModel.reset();
        } else {
            /**
             * @type {DataModel}
             * @memberOf Behavior.prototype
             */
            this.dataModel = this.getNewDataModel(options);
        }

        this.renderedColumnCount = 30;
        this.renderedRowCount = 60;
        this.dataUpdates = {}; //for overriding with edit values;
        this.scrollPositionX = this.scrollPositionY = 0;
        this.clearColumns();
        this.clearState();
        this.createColumns();
    },

    clearColumns: function() {
        /**
         * @type {Column[]}
         * @memberOf Behavior.prototype
         */
        this.columns = [];

        /**
         * @type {Column[]}
         * @memberOf Behavior.prototype
         */
        this.allColumns = [];

        this.allColumns[-1] = this.columns[-1] = this.newColumn({ index: -1 });
        this.allColumns[-2] = this.columns[-2] = this.newColumn({ index: -2 });

        this.columnEnum = {};
    },

    getActiveColumn: function(x) {
        return this.columns[x];
    },

    /**
     * The "grid index" given a "data index" (or column object)
     * @param {Column|number} columnOrIndex
     * @returns {undefined|number} The grid index of the column or undefined if column not in grid.
     */
    getActiveColumnIndex: function(columnOrIndex) {
        var index = columnOrIndex instanceof Column ? columnOrIndex.index : columnOrIndex;
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].index === index) {
                return i;
            }
        }
    },

    getVisibleColumn: function() {
        return this.deprecated('getVisibleColumn(x)', 'getActiveColumn(x)', '1.0.6', arguments);
    },
    getVisibleColumnName: function() {
        return this.deprecated('getVisibleColumnName(x)', 'getActiveColumn(x).name', '1.0.6', arguments);
    },
    getColumnId: function() {
        return this.deprecated('getColumnId(x)', 'getActiveColumn(x).header', '1.0.6', arguments);
    },
    getHeader: function() {
        return this.deprecated('getHeader(x)', 'getActiveColumn(x).header', '1.0.6', arguments);
    },

    getColumn: function(x) {
        return this.allColumns[x];
    },

    newColumn: function(options) {
        return new Column(this, options);
    },

    addColumn: function(options) {
        var column = this.newColumn(options);
        this.columns.push(column);
        this.allColumns.push(column);
        return column;
    },

    createColumns: function() {
        //concrete implementation here
    },

    getColumnWidth: function(x) {
        var column = this.getActiveColumn(x);
        if (!column) {
            return this.grid.properties.defaultColumnWidth;
        }
        var width = column.getWidth();
        return width;
    },

    setColumnWidth: function(x, width) {
        this.getActiveColumn(x).setWidth(width);
        this.stateChanged();
    },

    getCellRenderer: function(config, x, y) {
        return this.getActiveColumn(x).getCellRenderer(config, x, y);
    },
    getCellProvider: function(name) {
        return this.deprecated('getCellProvider()', 'grid.cellRenderers', '1.0.6', arguments);
    },
    createCellProvider: function(name) {
        console.error('getCellProvider() is deprecated as of v1.0.6. No replacement; do not call. Previously called by `Behavior` constructor; `new CellRenderers()` is now called by `Hypergrid` constructor instead.', arguments);
    },

    /**
     * @deprecated
     * @memberOf Behavior.prototype
     */
    applyAnalytics: function() {
        this.dataModel.reindex();
        this.shapeChanged();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc utility function to empty an object of its members
     * @param {object} obj - the object to empty
     * @param {boolean} [exportProps]
     * * `undefined` (omitted) - delete *all* properties
     * * **falsy** - delete *only* the export properties
     * * **truthy** - delete all properties *except* the export properties
     */
    clearObjectProperties: function(obj, exportProps) {
        for (var key in obj) {
            if (
                obj.hasOwnProperty(key) && (
                    exportProps === undefined ||
                    !exportProps && noExportProperties.indexOf(key) >= 0 ||
                    exportProps && noExportProperties.indexOf(key) < 0
                )
            ) {
                delete obj[key];
            }
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
     * @returns {object}
     */
    getPrivateState: function() {
        return this.deprecate('getPrivateState()', 'grid.properties', '1.2.0');
    },

    //this is effectively a clone, with certain things removed....
    getState: function() {
        var copy = JSON.parse(JSON.stringify(this.grid.properties));
        this.clearObjectProperties(copy.columnProperties, false);
        return copy;
    },
    /**
     * @memberOf Behavior.prototype
     * @desc clear all table state
     */
    clearState: function() {
        /**
         * memento for the user configured visual properties of the table
         * @type {object}
         * @memberOf Behavior.prototype
         */
        this.grid.properties = this.getDefaultState();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} Newly created default empty tablestate.
     */
    getDefaultState: function() {
        var tableProperties = this.grid._getProperties();
        var state = Object.create(tableProperties);

        _(state).extendOwn({
            rowHeights: {},
            columnProperties: []
        });

        return state;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Restore this table to a previous state.
     * See the [memento pattern](http://c2.com/cgi/wiki?MementoPattern).
     * @param {Object} memento - an encapsulated representation of table state
     */
    setState: function(memento) {

        //we don't want to clobber the column properties completely
        if (!memento.columnIndexes) {
            var length = this.dataModel.schema.length;
            memento.columnIndexes = [];
            for (var i = 0; i < length; i++) {
                memento.columnIndexes[i] = i;
            }
        }
        var colProperties = memento.columnProperties;
        delete memento.columnProperties;
        this.clearState();
        var state = this.grid.properties;
        this.createColumns();
        this._setColumnOrder(memento.columnIndexes);
        _(state).extendOwn(memento);
        this.setAllColumnProperties(colProperties);
        memento.columnProperties = colProperties;

        //just to be close/ it's easier on the eyes
        this.setColumnWidth(-1, 24.193359375);
        this.dataModel.reindex();
    },

    setAllColumnProperties: function(properties) {
        properties = properties || [];
        for (var i = 0; i < properties.length; i++) {
            var current = this.grid.properties.columnProperties[i];
            this.clearObjectProperties(current, false);
            _(current).extendOwn(properties[i]);
        }
    },

    _setColumnOrder: function(columnIndexes) {
        if (Array.isArray(columnIndexes)){
            this.columns.length = columnIndexes.length;
            columnIndexes.forEach(function(index, i) {
                this.columns[i] = this.allColumns[index];
            }, this);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Rebuild the column order indexes
     * @param {Array} columnIndexes - list of column indexes
     * @param {Boolean} [silent=false] - whether to trigger column changed event
     */
    setColumnIndexes: function(columnIndexes, silent) {
        var tableState = this.grid.properties;
        this._setColumnOrder(columnIndexes);
        tableState.columnIndexes = columnIndexes;
        this.changed();
        if (!silent) {
            this.grid.fireSyntheticOnColumnsChangedEvent();
        }
    },

    /**
     * @summary Show inactive column(s) or move active column(s).
     *
     * @desc Adds one or several columns to the "active" column list.
     *
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list. This can only move columns around within the active column list; it cannot add inactive columns (because it can only refer to columns in the active column list).
     * * `false` - The full column list (as per column schema array). This inserts columns from the "inactive" column list, moving columns that are already active.
     *
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {number} [referenceIndex=this.columns.length] - Insertion point, _i.e.,_ the element to insert before. A negative values skips the reinsert. Default is to insert new columns at end of active column list.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted._
     *
     * @param {boolean} [allowDuplicateColumns=false] - Unless true, already visible columns are removed first.
     *
     * _Promoted left one arg position when `isActiveColumnIndexes` omitted + one position when `referenceIndex` omitted._
     *
     * @memberOf Behavior.prototype
     */
    showColumns: function(isActiveColumnIndexes, columnIndexes, referenceIndex, allowDuplicateColumns) {
        // Promote args when isActiveColumnIndexes omitted
        if (typeof isActiveColumnIndexes === 'number' || Array.isArray(isActiveColumnIndexes)) {
            allowDuplicateColumns = referenceIndex;
            referenceIndex = columnIndexes;
            columnIndexes = isActiveColumnIndexes;
            isActiveColumnIndexes = false;
        }

        var activeColumns = this.columns,
            sourceColumnList = isActiveColumnIndexes ? activeColumns : this.allColumns;

        // Nest scalar index
        if (typeof columnIndexes === 'number') {
            columnIndexes = [columnIndexes];
        }

        var newColumns = columnIndexes
            // Look up columns using provided indexes
            .map(function(index) { return sourceColumnList[index]; })
            // Remove any undefined columns
            .filter(function(column) { return column; });

        // Default insertion point is end (i.e., before (last+1)th element)
        if (typeof referenceIndex !== 'number') {
            allowDuplicateColumns = referenceIndex; // assume reference index was omitted when not a number
            referenceIndex = activeColumns.length;
        }

        // Remove already visible columns and adjust insertion point
        if (!allowDuplicateColumns) {
            newColumns.forEach(function(column) {
                var i = activeColumns.indexOf(column);
                if (i >= 0) {
                    activeColumns.splice(i, 1);
                    if (referenceIndex > i) {
                        --referenceIndex;
                    }
                }
            });
        }

        // Insert the new columns at the insertion point
        if (referenceIndex >= 0) {
            activeColumns.splice.apply(activeColumns, [referenceIndex, 0].concat(newColumns));
        }

        this.getPrivateState().columnIndexes = activeColumns.map(function(column) { return column.index; });
    },

    /**
     * @summary Hide active column(s).
     * @desc Removes one or several columns from the "active" column list.
     * @param {boolean} [isActiveColumnIndexes=false] - Which list `columnIndexes` refers to:
     * * `true` - The active column list.
     * * `false` - The full column list (as per column schema array).
     * @param {number|number[]} columnIndexes - Column index(es) into list as determined by `isActiveColumnIndexes`. One of:
     * * **Scalar column index** - Adds single column at insertion point.
     * * **Array of column indexes** - Adds multiple consecutive columns at insertion point.
     *
     * _This required parameter is promoted left one arg position when `isActiveColumnIndexes` omitted._
     * @memberOf Behavior.prototype
     */
    hideColumns: function(isActiveColumnIndexes, columnIndexes) {
        var args = Array.prototype.slice.call(arguments); // Convert to array so we can add an argument (element)
        args.push(-1); // Remove only; do not reinsert.
        this.showColumns.apply(this, args);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc fetch the value for a property key
     * @returns {*} The value of the given property.
     * @param {string} key - a property name
     */
    resolveProperty: function(key) {
        // todo: remove when we remove the deprecated grid.resolveProperty
        return this.grid.resolveProperty(key);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc A specific cell was clicked; you've been notified.
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     * @return {boolean} Clicked in a drill-down column.
     */
    cellClicked: function(cell, event) {
        return this.dataModel.cellClicked(cell, event);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc A specific cell was le double-clicked; you've been notified.
     * @param {Point} cell - point of cell coordinates
     * @param {Object} event - all event information
     */
    cellDoubleClicked: function(cell, event) {

    },

    lookupFeature: function(key) {
        return this.featureMap[key];
    },

    /**
     * @memberOf Behavior.prototype
     * @desc setter for the hypergrid
     * @param {Hypergrid} grid
     */
    setGrid: function(grid) {
    },

    /**
     * @memberOf Behavior.prototype
     * @desc First check to see if something was overridden.
     * @return {*} The value at `x,y` for the top left section of the hypergrid.
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     */
    getValue: function(x, y) {
        var column = this.getActiveColumn(x);
        return column && column.getValue(y);
    },

    getUnfilteredValue: function(x, y) {
        var column = this.getActiveColumn(x);
        return column && column.getUnfilteredValue(y);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @return The data.
     * @param {number} c - Grid column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param {Object} value - the value to use
     */
    setValue: function(c, r, value) {
        var column = this.getActiveColumn(c);
        return column && column.setValue(r, value);
    },

    getDataValue: function(x, y) {
        return this.dataModel.getValue(x, y);
    },

    setDataValue: function(x, y, value) {
        this.dataModel.setValue(x, y, value);
    },

    /**
     * @memberOf Behavior.prototype
     * This does not include the column properties.
     * @return {object} The cell properties for the cell at x,y in the hypergrid.
     * @param {number} x - Data x coordinate.
     * @param {number} r - Grid row coordinate.
     */
    getCellProperties: function(x, r) {
        var column = this.getColumn(x);
        return column && column.getCellProperties(r);
    },
    /**
     * @memberOf Behavior.prototype
     * @return {*} The value at x,y in the hypergrid.
     * @param {number} x - Data x coordinate.
     * @param {number} r - Grid row coordinate.
     */
    getCellProperty: function(x, r, key) {
        var column = this.getColumn(x);
        return column && column.getCellProperty(r, key);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @param {number} x - Data x coordinate.
     * @param {number} r - Grid row coordinate.
     * @param {Object} value - the value to use
     */
    setCellProperties: function(x, r, value) {
        var column = this.getColumn(x);
        if (column) {
            column.setCellProperties(r, value);
        }
    },
    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of rows in the hypergrid.
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredRowCount()', null, '1.1.0', arguments, 'No longer supported');
    },
    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of the fixed rows area  of the hypergrid.
     */
    getFixedRowsHeight: function() {
        var count = this.getFixedRowCount();
        var total = 0;
        for (var i = 0; i < count; i++) {
            total = total + this.getRowHeight(i);
        }
        //var footerHeight = this.getDefaultRowHeight();
        //total = total + (footerHeight * this.getFooterRowCount());
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of a specific row in the hypergrid.
     * @param {number} rowNum - row index of interest
     */
    getRowHeight: function(rowNum) {
        var rowHeights = this.grid.properties.rowHeights;
        return rowHeights && rowHeights[rowNum] || this.getDefaultRowHeight();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The value is lazily initialized and comes from the properties mechanism for '`defaultRowHeight`', which should be ~20px.
     * @returns {number} The row height in pixels.
     */
    getDefaultRowHeight: function() {
        if (!this.defaultRowHeight) {
            this.defaultRowHeight = this.grid.properties.defaultRowHeight;
        }
        return this.defaultRowHeight;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the pixel height of a specific row
     * @param {number} rowNum - the row index of interest
     * @param {number} height - pixel height
     */
    setRowHeight: function(rowNum, height) {
        var tableState = this.grid.properties;
        tableState.rowHeights[rowNum] = Math.max(5, height);
        this.stateChanged();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc This will allow 'floating' fixed rows.
     * @return {number} The maximum height of the fixed rows area in the hypergrid.
     */
    getFixedRowsMaxHeight: function() {
        return this.getFixedRowsHeight();
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The width of the fixed column area in the hypergrid.
     */
    getFixedColumnsWidth: function() {
        var count = this.getFixedColumnCount();
        var total = 0;
        if (this.grid.isShowRowNumbers()) {
            total = this.getColumnWidth(-1);
        }
        for (var i = 0; i < count; i++) {
            total = total + this.getColumnWidth(i);
        }
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc This exists to support "floating" columns.
     * @return {number} The total width of the fixed columns area.
     */
    getFixedColumnsMaxWidth: function() {
        return this.getFixedColumnsWidth();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the scroll position in vertical dimension and notify listeners.
     * @param {number} y - the new y value
     */
    _setScrollPositionY: function(y) {
        this.setScrollPositionY(y);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the scroll position in horizontal dimension and notify listeners.
     * @param {number} x - the new x value
     */
    _setScrollPositionX: function(x) {
        this.setScrollPositionX(x);
        this.changed();
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of columns just rendered, including partially rendered columns.
     * @param {number} count - how many columns were just rendered
     */
    setRenderedColumnCount: function(count) {
        this.renderedColumnCount = count;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of rows just rendered, including partially rendered rows.
     * @param {number} count - how many rows were just rendered
     */
    setRenderedRowCount: function(count) {
        this.renderedRowCount = count;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The fixed row area has been clicked, massage the details and call the real function.
     * @param {Hypergrid} grid
     * @param {Object} mouse - event details
     */
    _fixedRowClicked: function(grid, mouse) {
        var x = this.translateColumnIndex(this.getScrollPositionX() + mouse.gridCell.x - this.getFixedColumnCount());
        var translatedPoint = this.grid.newPoint(x, mouse.gridCell.y);
        mouse.gridCell = translatedPoint;
        this.fixedRowClicked(grid, mouse);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The fixed column area has been clicked, massage the details and call the real function.
     * @param {Hypergrid} grid
     * @param {Object} mouse - event details
     */
    _fixedColumnClicked: function(grid, mouse) {
        var translatedPoint = this.grid.newPoint(mouse.gridCell.x, this.getScrollPositionY() + mouse.gridCell.y - this.getFixedRowCount());
        mouse.gridCell = translatedPoint;
        this.fixedColumnClicked(grid, mouse);
    },

    moveSingleSelect: function(grid, x, y) {
        if (this.featureChain) {
            this.featureChain.moveSingleSelect(grid, x, y);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @param {Hypergrid} grid
     */
    setCursor: function(grid) {
        grid.updateCursor();
        this.featureChain.setCursor(grid);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseMove: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseMove(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleClick(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling tap to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onContextMenu: function(grid, event) {
        var proceed = grid.fireSyntheticContextMenuEvent(event);
        if (proceed && this.featureChain) {
            this.featureChain.handleContextMenu(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onWheelMoved: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleWheelMoved(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onMouseDrag: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDrag(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling key down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling key up to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onKeyUp: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleKeyUp(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    onDoubleClick: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleDoubleClick(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling double click to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {string[]} [options] - Forwarded to dialog constructor.
     */
    openDialog: function(dialogName, options) {
        return new dialogs[dialogName](this.grid, options);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseDown(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseExit: function(grid, event) {
        if (this.featureChain) {
            this.featureChain.handleMouseExit(grid, event);
            this.setCursor(grid);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc I've been notified that the behavior has changed.
     */
    changed: function() { this.grid.behaviorChanged(); },

    /**
     * @memberOf Behavior.prototype
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    shapeChanged: function() { this.grid.behaviorShapeChanged(); },

    /**
     * @memberOf Behavior.prototype
     * @desc The dimensions of the grid data have changed. You've been notified.
     */
    stateChanged: function() { this.grid.behaviorStateChanged(); },

    /**
     * @memberOf Behavior.prototype
     * @return {boolean} Can re-order columns.
     */
    isColumnReorderable: function() {
        return this.grid.properties.columnsReorderable;
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior.prototype
     */
    getColumnProperties: function(x) {
        var column = this.getColumn(x);
        return column && column.properties;
    },

    /**
     * @param {index} x - Data x coordinate.
     * @return {Object} The properties for a specific column.
     * @memberOf Behavior.prototype
     */
    setColumnProperties: function(x, properties) {
        var column = this.getColumn(x);
        if (!column) {
            throw 'Expected column.';
        }
        var result = _(column.properties).extendOwn(properties);
        this.changed();
        return result;
    },

    /**
     * Clears all cell properties of given column or of all columns.
     * @param {number} [x] - Omit for all columns.
     */
    clearAllCellProperties: function(x) {
        if (x === undefined) {
            for (var i = this.allColumns.length - 1; i >= 0; --i) {
                this.getColumn(i).clearAllCellProperties();
            }
        } else {
            var column = this.getColumn(i);
            if (column) {
                column.clearAllCellProperties();
            }
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @return {string[]} All the currently hidden column header labels.
     */
    getHiddenColumnDescriptors: function() {
        var tableState = this.grid.properties;
        var indexes = tableState.columnIndexes;
        var labels = [];
        var columnCount = this.getActiveColumnCount();
        for (var i = 0; i < columnCount; i++) {
            if (indexes.indexOf(i) === -1) {
                var column = this.getActiveColumn(i);
                labels.push({
                    id: i,
                    header: column.header,
                    field: column.name
                });
            }
        }
        return labels;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {integer} The number of fixed columns.
     */
    getFixedColumnCount: function() {
        return this.grid.properties.fixedColumnCount || 0;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the number of fixed columns
     * @param {number} n - the integer count of how many columns to be fixed
     */
    setFixedColumnCount: function(n) {
        this.grid.properties.fixedColumnCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {integer} The number of fixed rows.
     */
    getFixedRowCount: function() {
        var headers = this.grid.getHeaderRowCount();
        var usersSize = this.grid.properties.fixedRowCount || 0;
        return headers + usersSize;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Set the number of fixed rows, which includes (top to bottom order):
     * 1. The header rows
     *    1. The header labels row (optional)
     *    2. The filter row (optional)
     *    3. The top total rows (0 or more)
     * 2. The non-scrolling rows (externally called "the fixed rows")
     *
     * @returns {number} Sum of the above or 0 if none of the above are in use.
     *
     * @param {number} n - The number of rows.
     */
    setFixedRowCount: function(n) {
        this.grid.properties.fixedRowCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of header rows.
     * A portion of the number returned by {@link Behavior#getFixedRowCount()|getFixedRowCount()}.
     * (The remaining _fixed rows_ are the _top totals_ rows.)
     */
    getHeaderRowCount: function() {
        var header = this.grid.isShowHeaderRow() ? 1 : 0;
        var filter = this.grid.isShowFilterRow() ? 1 : 0;
        var totals = this.getTopTotals().length;
        return header + filter + totals;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of footer rows, consisting entirely of 0 or more _bottom totals_ rows.
     */
    getFooterRowCount: function() {
        return this.getBottomTotals().length;
    },

    getTopTotals: function() {
        return this.dataModel.getTopTotals();
    },
    /**
     * @memberOf Behavior.prototype
     * @summary Set the number of header rows.
     * @param {number} n - The number of _fixed rows_ to reserve as header rows.
     * (The remaining _fixed rows_ are the _top totals_ rows.)
     */
    setHeaderRowCount: function(n) {
        this.grid.properties.headerRowCount = n;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of fixed rows.
     */
    getHeaderColumnCount: function() {
        return this.grid.properties.headerColumnCount;
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} The number of fixed rows.
     */
    setHeaderColumnCount: function(numberOfHeaderColumns) {
        this.grid.properties.headerColumnCount = numberOfHeaderColumns;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc a dnd column has just been dropped, we've been notified
     */
    endDragColumnNotification: function() {},

    /**
     * @memberOf Behavior.prototype
     * @return {null} the cursor at a specific x,y coordinate
     * @param {number} x - the x coordinate
     * @param {number} y - the y coordinate
     */
    getCursorAt: function(x, y) {
        return null;
    },

    /**
     * Number of _visible_ columns.
     * @memberOf Behavior.prototype
     * @return {number} The total number of columns.
     */
    getActiveColumnCount: function() {
        return this.columns.length;
    },
    getColumnCount: function() {
        return this.deprecated('getColumnCount()', 'getActiveColumnCount()', '1.0.6', arguments);
    },

    /**
     * @summary Column alignment of given grid column.
     * @desc One of:
     * * `'left'`
     * * `'center'`
     * * `'right'`
     *
     * Cascades to grid.
     * @memberOf Behavior.prototype
     * @desc Quietly set the horizontal scroll position.
     * @param {number} x - The new position in pixels.
     */
    setScrollPositionX: function(x) {
        /**
         * @memberOf Behavior.prototype
         * @type {number}
         */
        this.scrollPositionX = x;
    },

    getScrollPositionX: function() {
        return this.scrollPositionX;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc Quietly set the vertical scroll position.
     * @param {number} y - The new position in pixels.
     */
    setScrollPositionY: function(y) {
        /**
         * @memberOf Behavior.prototype
         * @type {number}
         */
        this.scrollPositionY = y;
    },

    getScrollPositionY: function() {
        return this.scrollPositionY;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {cellEditor} The cell editor for the cell at the given coordinates.
     * @param {Point} editPoint - The grid cell coordinates.
     */
    getCellEditorAt: function(editPoint) {
        var cellEditor, options,
            column = this.getActiveColumn(editPoint.x);

        if (column) {
            options = {
                column: column,
                editPoint: editPoint
            };

            cellEditor = this.grid.isFilterRow(editPoint.y)
                ? this.grid.cellEditors.create('filterbox', options)
                : column.getCellEditorAt(editPoint.y, options);
        }

        return cellEditor;
    },
    /**
     * @memberOf Behavior.prototype
     * @return {boolean} `true` if we should highlight on hover
     * @param {boolean} isColumnHovered - the column is hovered or not
     * @param {boolean} isRowHovered - the row is hovered or not
     */
    highlightCellOnHover: function(isColumnHovered, isRowHovered) {
        return isColumnHovered && isRowHovered;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellPropertiesPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a fixed row cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedRowPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a fixed column cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellFixedColumnPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function is a hook and is called just before the painting of a top left cell occurs
     * @param {window.fin.rectangular.Point} cell
     */
    cellTopLeftPrePaintNotification: function(cell) {

    },

    /**
     * @memberOf Behavior.prototype
     * @desc this function enhance the double click event just before it's broadcast to listeners
     * @param {Object} event - event to enhance
     */
    enhanceDoubleClickEvent: function(event) {},

    /**
     * @memberOf Behavior.prototype
     * @desc swap src and tar columns
     * @param {number} src - column index
     * @param {number} tar - column index
     */
    swapColumns: function(source, target) {
        var columns = this.columns;
        var tmp = columns[source];
        columns[source] = columns[target];
        columns[target] = tmp;
        this.changed();
    },

    getColumnEdge: function(c, renderer) {
        return this.dataModel.getColumnEdge(c, renderer);
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} x - column index
     * @param {number} y - totals row index local to the totals area
     * @param value
     * @param {string[]} [areas=['top', 'bottom']] - may include `'top'` and/or `'bottom'`
     */
    setTotalsValue: function(x, y, value, areas) {
        this.grid.setTotalsValueNotification(x, y, value, areas);
    },

    /**
     * @memberOf Behavior.prototype
     * @return {object} The object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    convertViewPointToDataPoint: function(viewPoint) {
        var newX = this.getActiveColumn(viewPoint.x).index;
        var newPoint = this.grid.newPoint(newX, viewPoint.y);
        return newPoint;
    },
    hasHierarchyColumn: function() {
        return false;
    },

    getSelectionMatrixFunction: function(selectedRows) {
        return function() {
            return null;
        };
    },

    autosizeAllColumns: function() {
        this.checkColumnAutosizing(true);
        this.changed();
    },

    checkColumnAutosizing: function(force) {
        force = force === true;
        this.autoSizeRowNumberColumn();
        var autoSized = this.allColumns[-2].checkColumnAutosizing(force);
        this.allColumns.forEach(function(column) {
            autoSized = column.checkColumnAutosizing(force) || autoSized;
        });
        return autoSized;
    },

    autoSizeRowNumberColumn: function() {
        if (this.grid.isRowNumberAutosizing()) {
            this.allColumns[-1].checkColumnAutosizing(true);
        }
    },

    /**
     * @summary _Getter_
     * @method
     * @returns {dataSourceHelperAPI} The grid's currently assigned filter.
     * @memberOf Behavior.prototype
     */
    get filter() {
        return this.dataModel.filter;
    },

    /**
     * @summary _Setter:_ Assign a filter to the grid.
     * @method
     * @param {dataSourceHelperAPI|undefined|null} filter - One of:
     * * A filter object, turning filter *ON*.
     * * If `undefined` or `null`, the null filter is reassigned to the grid, turning filtering *OFF*.
     * @memberOf Behavior.prototype
     */
    set filter(filter) {
        this.dataModel.filter = filter;
    },

    /**
     * @summary _Getter_
     * @method
     * @returns {sorterAPI} The grid's currently assigned sorter.
     * @memberOf dataModels.JSON.prototype
     */
    get sorter() {
        return this.dataModel.sorter;
    },

    /**
     * @summary _Setter:_ Assign a sorter to the grid.
     * @method
     * @param {sorterAPI|undefined|null} sorter - One of:
     * * A sorter object, turning sorting *ON*.
     * * If `undefined` or `null`, the {@link dataModels.JSON~nullSorter|nullSorter} is reassigned to the grid, turning sorting *OFF.*
     * @memberOf Hypergrid.prototype
     */
    set sorter(sorter) {
        this.dataModel.sorter = sorter;
    },

    getSelectedRows: function() {
        return this.grid.selectionModel.getSelectedRows();
    },

    getSelectedColumns: function() {
        return this.grid.selectionModel.getSelectedColumns();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    },

    getData: function() {
        return this.dataModel.getData();
    },

    getFilteredData: function() {
        return this.deprecated('getIndexedData()', 'getIndexedData', '1.1.0', arguments);
    },
    getIndexedData: function() {
       this.dataModel.getIndexedData();
    },
});

/**
 * @memberOf Behavior.prototype
 */
Behavior.prototype.reindex = Behavior.prototype.applyAnalytics;

module.exports = Behavior;
