/* eslint-env browser */

'use strict';

var _ = require('object-iterators');
var Point = require('rectangular').Point;

var Base = require('../Base');
var Column = require('./Column');
var cellEventFactory = require('./../lib/cellEventFactory');
var HeaderRow = require('../dataModels/HeaderRow');
var FilterRow = require('../dataModels/FilterRow');
var SummaryRow = require('../dataModels/SummaryRow');
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

var warned = {};

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

        // recreate `CellEvent` class so it can set up its internal `grid`, `behavior`, and `dataModel` convenience properties
        this.CellEvent = cellEventFactory(this.grid);

        this.subgrids = [
            new HeaderRow(this.grid),
            new FilterRow(this.grid),
            new SummaryRow(this.grid, { name: 'topTotals' }),
            this.dataModel,
            new SummaryRow(this.grid, { name: 'bottomTotals' })
        ];

        this.rowHeights = {};

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

    getCellRenderer: function(config, cellEvent) {
        return cellEvent.column.getCellRenderer(config, cellEvent);
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

        if (memento.rowHeights) {
            if (!warned.rowHeights) {
                warned.rowHeights = true;
                console.warn('rowHeights, the hash of row heights you provided to setState method, is no longer supported as of v1.2.0 and will be ignored. Instead use individual calls to setRowHeight(y, height, dataModel) for each row height you wish to set, where y is local zero-based row index within dataModel. The dataModel arg is optional and defaults to this.dataModel; specify to set row heights in other data models, such as header row, filter cell row, individual summary rows, etc.');
            }
        }

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

        this.grid.properties.columnIndexes = activeColumns.map(function(column) { return column.index; });
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
     * @param {Object} event - all event information
     * @return {boolean} Clicked in a drill-down column.
     */
    cellClicked: function(event) {
        if (arguments.length === 2) {
            return this.deprecated('cellClicked(cell, event)', 'cellClicked(event)', '1.2.0', arguments);
        }
        return this.dataModel.cellClicked(event);
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
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @memberOf Behavior.prototype
     */
    getValue: function(xOrCellEvent, y) {
        switch (arguments.length) {
            case 1:
                return xOrCellEvent.value;
            case 2:
                return new this.CellEvent(xOrCellEvent, y).value;
        }
    },

    getUnfilteredValue: function(x, y) {
        var column = this.getActiveColumn(x);
        return column && column.getUnfilteredValue(y);
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @return The data.
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @param {Object} value - The value to use. _When `y` omitted, promoted to 2nd arg._
     * @return {boolean} Consumed.
     */
    setValue: function(xOrCellEvent, y, value) {
        switch (arguments.length) {
            case 3: xOrCellEvent = new this.CellEvent(xOrCellEvent, y); break;
            case 2: value = y; break;
        }

        xOrCellEvent.value = value;
    },

    getDataValue: function(x, y) {
        return this.deprecated('getDataValue(x, y, value)', 'dataModel.getValue(x, y, value)', '1.1.0', arguments);
    },

    setDataValue: function(x, y, value) {
        return this.deprecated('setDataValue(x, y, value)', 'dataModel.setValue(x, y, value)', '1.1.0', arguments);
    },

    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Behavior.prototype
     */
    getCellOwnProperties: function(xOrCellEvent, y) {
        switch (arguments.length) {
            case 1:
                return xOrCellEvent.column // xOrCellEvent is cellEvent
                    .getCellOwnProperties(xOrCellEvent.dataCell.y);
            case 2:
                return this.getColumn(xOrCellEvent) // xOrCellEvent is x
                    .getCellOwnProperties(y);
        }
    },

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Behavior.prototype
     */
    getCellProperties: function(xOrCellEvent, y) {
        switch (arguments.length) {
            case 1:
                return xOrCellEvent.column // xOrCellEvent is cellEvent
                    .getCellProperties(xOrCellEvent.dataCell.y);
            case 2:
                return this.getColumn(xOrCellEvent) // xOrCellEvent is x
                    .getCellProperties(y);
        }
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate._ Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Behavior.prototype
     */
    getCellProperty: function(xOrCellEvent, y, key) {
        switch (arguments.length) {
            case 2:
                return xOrCellEvent.column // xOrCellEvent is cellEvent
                    .getCellProperty(xOrCellEvent.dataCell.y, y); // y omitted so y here is actually key
            case 3:
                return this.getColumn(xOrCellEvent) // xOrCellEvent is x
                    .getCellProperty(y, key);
        }
    },

    /**
     * @memberOf Behavior.prototype
     * @desc update the data at point x, y with value
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {Object} properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param {boolean} [preserve=false] - Falsy creates new object; truthy copies `properties` members into existing object. _When `y` omitted, this param promoted to 3rd arg._
     */
    setCellProperties: function(xOrCellEvent, y, properties, preserve) {
        if (typeof y === 'object') {
            xOrCellEvent.column // xOrCellEvent is cellEvent
                .setCellProperties(xOrCellEvent.dataCell.y, y, properties); // y omitted so y here is actually properties; properties is actually preserve
        } else {
            this.getColumn(xOrCellEvent) // xOrCellEvent is x
                .setCellProperties(y, properties, preserve);
        }
    },

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param value
     * @memberOf Behavior.prototype
     */
    setCellProperty: function(xOrCellEvent, y, key, value) {
        switch (arguments.length) {
            case 3:
                return xOrCellEvent.column // xOrCellEvent is cellEvent
                    .setCellProperty(xOrCellEvent.dataCell.y, y, key); // y omitted so y here is actually key and key is actually value
            case 4:
                return this.getColumn(xOrCellEvent) // xOrCellEvent is x
                    .setCellProperty(y, key, value);
        }
    },

    /**
     * @summary Gets the number of rows in the hypergrid.
     * @dsc Defined as the sum of all rows from all subgrids.
     * @memberOf Behavior.prototype
     */
    getRowCount: function() {
        return this.subgrids.reduce(function(sum, subgrid) {
            return sum + subgrid.getRowCount();
        }, 0);
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredRowCount()', null, '1.2.0', arguments, 'No longer supported');
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The height in pixels of the fixed rows area  of the hypergrid.
     */
    getFixedRowsHeight: function() {
        var count = this.getFixedRowCount();
        var total = 0;
        for (var i = 0; i < count; i++) {
            total += this.getRowHeight(i);
        }
        return total;
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} rowIndex - Data row coordinate local to datsModel.
     * @param {DataModel} [dataModel=this.dataModel]
     */
    getRowHeight: function(rowIndex, dataModel) {
        var rowData = (dataModel || this.dataModel).getRow(rowIndex);
        return rowData && rowData.__ROW_HEIGHT || this.grid.properties.defaultRowHeight;
    },

    /**
     * @memberOf Behavior.prototype
     * @desc The value is lazily initialized and comes from the properties mechanism for '`defaultRowHeight`', which should be ~20px.
     * @returns {number} The row height in pixels.
     */
    getDefaultRowHeight: function() {
        return this.deprecated('getDefaultRowHeight', 'grid.properties.defaultRowHeight', '1.2.0');
    },

    /**
     * @memberOf Behavior.prototype
     * @desc set the pixel height of a specific row
     * @param {number} rowIndex - Data row coordinate local to datsModel.
     * @param {number} height - pixel height
     * @param {DataModel} [dataModel=this.dataModel]
     */
    setRowHeight: function(rowIndex, height, dataModel) {
        var rowData = (dataModel || this.dataModel).getRow(rowIndex);
        if (rowData) {
            rowData.__ROW_HEIGHT = Math.max(5, height);
            this.stateChanged();
        }
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
            total += this.getColumnWidth(i);
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
        var translatedPoint = new Point(x, mouse.gridCell.y);
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
        var translatedPoint = new Point(mouse.gridCell.x, this.getScrollPositionY() + mouse.gridCell.y - this.getFixedRowCount());
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
            // todo: More efficient might be to undefine `dataModel.getData(*).__META`.
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
        return this.grid.properties.fixedColumnCount;
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
        return (
            this.grid.getHeaderRowCount() +
            this.grid.properties.fixedRowCount
        );
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
     * @param {number} The number of rows.
     */
    setFixedRowCount: function(n) {
        this.grid.properties.fixedRowCount = n;
    },

    /**
     * @summary Gets the number of "header rows".
     * @desc Defined as the sum of all rows of all subgrids before the (first) data subgrid.
     * @memberOf behaviors.JSON.prototype
     */
    getHeaderRowCount: function() {
        var result = 0;

        this.subgrids.find(function(subgrid) {
            if (!subgrid.type) {
                return true; // stop
            }
            result += subgrid.getRowCount();
        });

        return result;
    },

    /**
     * @memberOf Behavior.prototype
     * @return {number} The number of fixed rows.
     */
    getHeaderColumnCount: function() {
        throw new this.HypergridError('getHeaderColumnCount() deprecated as of v1.1.0. The naming of this function, analogous to getHeaderColumnCount, implied it returned the number of columns to the left of the data area. In fact, it returned the x coordinate of the first data column, which was (and still is) always 0. There is no replacement; use 0 instead.');
    },

    /**
     * @memberOf Behavior.prototype
     * @param {number} The number of fixed rows.
     */
    setHeaderColumnCount: function(numberOfHeaderColumns) {
        throw new this.HypergridError('setHeaderColumnCount() deprecated as of v1.1.0. The naming of this function implied the abililty to set the number of columns to the left of the data area. In fact, it set the value returned by getHeaderColumnCount which was always expected to be 0. There is no replacement.');
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
     * @param {CellEvent} editPoint - The grid cell coordinates.
     */
    getCellEditorAt: function(event) {
        return event.isGridColumn && (
            event.isFilterCell
                ? this.grid.cellEditors.create('filterbox', event)
                : event.column.getCellEditorAt(event)
        );
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
     * @return {object} The object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    convertViewPointToDataPoint: function(unscrolled) {
        return new Point(
            this.getActiveColumn(unscrolled.x).index,
            unscrolled.y
        );
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
        return this.deprecated('getIndexedData()', 'getIndexedData', '1.2.0', arguments);
    },
    getIndexedData: function() {
       this.dataModel.getIndexedData();
    },

    /**
     * An array where each element represents a subgrid to be rendered in the hypergrid.
     * The list will always include at least one "data" subgrid, typically {@link Behavior#dataModel|dataModel}.
     * It may also include zero or more other types of subgrids such as header, filter, and summary subgrids.
     *
     * ### totals-toolkit
     *
     * When the totals-toolkit is loaded, this object also serves as a hash of selected subgrids by name (i.e., for those subgrids that have a defined property `name`).
     *
     * @type {DataModel[]}
     * @memberOf Behavior.prototype
     */
    set subgrids(subgrids) {
        this._subgrids = subgrids;
    },
    get subgrids() {
        return this._subgrids;
    }
});

/**
 * @memberOf Behavior.prototype
 */
Behavior.prototype.reindex = Behavior.prototype.applyAnalytics;

module.exports = Behavior;
