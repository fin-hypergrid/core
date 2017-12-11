'use strict';

var DataModel = require('./DataModel');
var HypergridError = require('../lib/error');

/**
 * See {@link dataModels.JSON.prototype.initialize initialize} for constructor params.
 * @name dataModels.JSON
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    /**
     * Constructor proxy. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
     * @param {Hypergrid} grid
     * @param {object} [options]
     * @param {DataSource} [options.DataSource] - Must be supplied on first call; optional thereafter.
     * @param {object[]} [options.data]
     * @param {object[]} [options.schema]
     * @memberOf dataModels.JSON.prototype
     */
    initialize: function(grid, options) {
        this.charMap = new CharMap(this);
        this.reset(options);
    },

    /**
     * @param {object} [options]
     * @param {DataSource} [options.DataSource]
     * @param {object[]} [options.data]
     * @param {object[]} [options.schema]
     * @memberOf dataModels.JSON.prototype
     */
    reset: function(options) {
        options = options || {};

        var DataSource = this.DataSource = options.DataSource || this.DataSource || JSON.DataSource,
            dataSourceOptions = { interface: JSON.interface };

        if (!DataSource) {
            throw new this.HypergridError('Expected DataSource to be defined.');
        }

        this.dataSource = this.source = new DataSource(
            options.data,
            options.schema,
            dataSourceOptions
        );
    },

    getData: function() {
        return this.call('get-data');
    },

    getIndexedData: function() {
        var ds = this.dataSource;
        var count = ds.getRowCount();
        var result = new Array(count);
        for (var y = 0; y < count; y++) {
            result[y] = ds.getRow(y);
        }
        return result;
    },

    /**
     * @param {number} x - Data column coordinate.
     * @param {number} y - Data row coordinate.
     * @memberOf dataModels.JSON.prototype
     */
    getValue: function(x, y) {
        return this.dataSource.getValue(x, y);
    },

    /**
     * @param {number} y - Data row coordinate.
     * @returns {nunber} Row index in raw data array after dereferencing all data source indexing.
     * @memberOf dataModels.JSON.prototype
     */
    getDataIndex: function(y) {
        return this.dataSource.getDataIndex(y);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param value
     */
    setValue: function(x, r, value) {
        this.dataSource.setValue(x, r, value);
    },

    /**
     * @deprecated As of v1.1.0, use `this.grid.behavior.getColumnProperties(x)` instead.
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @returns {*}
     */
    getColumnProperties: function(x) {
        //access directly because we want it ordered
        return this.deprecated('getColumnProperties(x)', 'grid.behavior.getColumnProperties(x)', '1.2.0', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var offset = this.grid.behavior.hasTreeColumn() ? -1 : 0;
        return this.dataSource.getColumnCount() + offset;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getRowCount: function() {
        return this.dataSource.getRowCount();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    reindex: function(options) {
        var selectedRowSourceIndexes = getUnderlyingIndexesOfSelectedRows.call(this);
        this.dataSource.apply();
        reselectRowsByUnderlyingIndexes.call(this, selectedRowSourceIndexes);
    },

    /**
     * @summary Set or reset grid data.
     * See {@link DataSource#setData} for details.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource, schema) {
        this.dataSource.setData(dataSource, schema);
    },

    isTree: function() {
        return this.dataSource.isDrillDown();
    },

    isTreeCol: function(event) {
        return this.dataSource.isDrillDownCol(event);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        //Not implemented
    },

    /**
     * @param cell
     * @param event
     * @return {boolean} Clicked in a drill-down column.
     * @memberOf dataModels.JSON.prototype
     */
    cellClicked: function(event) {
        if (arguments.length === 2) {
            return this.deprecated('cellClicked(cell, event)', 'cellClicked(event)', '1.2.0', arguments);
        }
        return this.toggleRow(event.dataCell.y, undefined, event);
    },

    /**
     * @summary Toggle the drill-down control of a the specified row.
     * @desc Operates only on the following rows:
     * * Expandable rows - Rows with a drill-down control.
     * * Revealed rows - Rows not hidden inside of collapsed drill-downs.
     * @param y - Revealed row number. (This is not the row ID.)
     * @param {boolean} [expand] - One of:
     * * `true` - Expand row.
     * * `false` - Collapse row.
     * * `undefined` (or omitted) - Toggle state of row.
     * @param event
     * @returns {boolean|undefined} Changed. Specifically, one of:
     * * `undefined` row had no drill-down control
     * * `true` drill-down changed
     * * `false` drill-down unchanged (was already in requested state)
     * @memberOf dataModels.JSON.prototype
     */
    toggleRow: function(y, expand, event) {
        //TODO: fire a row toggle event
        var changed;
        if (this.isTreeCol(event)) {
            changed = this.dataSource.click(y, expand);
            if (changed) {
                this.reindex({rowClick: true});
                this.grid.behavior.changed();
            }
        }
        return changed;
    },

    /**
     * @param {number} r - Data row coordinate.
     * @returns {object|undefined} Returns data row object or `undefined` if a header row.
     * @memberOf dataModels.JSON.prototype
     */
    getRow: function(r) {
        return this.dataSource.getRow(r);
    },

    getRowMetadata: function(rowIndex, metadata) {
        var dataRow = this.getRow(rowIndex);
        return dataRow && (dataRow.__META || (dataRow.__META = metadata));
    },

    setRowMetadata: function(rowIndex, metadata) {
        var dataRow = this.getRow(rowIndex);
        return dataRow && (dataRow.__META = metadata);
    },

    /**
     * @summary Update or blank row in place.
     * @desc _Note parameter order is the reverse of `addRow`._
     *
     * Note regarding transformed data:
     * This method operates on untransformed data rows.
     * If data is transformed (rows rearranged or omitted), to see the new row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     *
     * @param {number} y
     * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
     * @memberOf dataModels.JSON.prototype
     */
    setRow: function(y, dataRow) {
        this.dataSource.setRow(y, dataRow);
    },

    /**
     * @summary Insert or append a new row.
     * @desc _Note parameter order is the reverse of `setRow`._
     *
     * See notes in {@link dataModels.JSON#setRow setRow} regarding transformed data.
     *
     * @param {object} dataRow
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf dataModels.JSON.prototype
     */
    addRow: function(newDataRow, beforeRowIndex) {
        this.dataSource.addRow(newDataRow, beforeRowIndex);
    },

    /**
     * @summary Deelete a row.
     * @desc Rows are removed entirely and no longer rendered.
     * Row indexes of all remaining rows are decreased by `rowCount`.
     *
     * See notes in {@link dataModels.JSON#setRow setRow} regarding transformed data.
     *
     * @param {number} y
     * @param {number} [rowCount=1]
     * @returns {object[]} The deleted row objects.
     * @memberOf DataSourceLocal#
     */
    delRow: function(y, rowCount) {
        if (rowCount === undefined) { rowCount = 1; }
        return this.data.splice(y, rowCount);
    },

    get schema() {
        return this.dataSource.getSchema();
    },

    set schema(schema) {
        this.dataSource.setSchema(schema);
    }
});


JSON.interface = {
    // Required:
    getSchema: unimplementedError('getSchema'),
    setSchema: unimplementedError('setSchema'), // called by Hypergrid only if you specify a schema on new or setData
    setData: unimplementedError('setData'),
    setValue: unimplementedError('setValue'), // called by Hypergrid only if you edit a cell
    getValue: unimplementedError('getValue'),
    getRowCount: unimplementedError('getRowCount'),
    getColumnCount: function() { return this.getSchema().length; },
    getRow: unimplementedError('getRow'),

    // Hypergrid extensions
    setRow: unsupportedWarning('setRow'),
    addRow: unsupportedWarning('addRow'),
    delRow: unsupportedWarning('delRow', []),
    apply: null,
    getDataIndex: function(y) { return y; },
    click: null,
    isDrillDown: null,
    isDrillDownCol: null,

    // following need to be set by certain data source modules for their internal (?) use:
    // getGrandTotals: null,
    // revealRow: null,
    // isLeafNode: null,
    // viewMakesSense: null
};

function unimplementedError(methodName) {
    return function() {
        throw new HypergridError('Expected required data source method `' + methodName + '()` to be implemented.');
    };
}

var warned = {};

function unsupportedWarning(methodName, returnValue) {
    return function() {
        if (!warned[methodName]) {
            console.warn('Data source does not support `' + methodName + '()`.');
            warned[methodName] = true;
        }
        return returnValue;
    };
}


/** @name DataSource
 * @memberOf JSON
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated
 * `Hypergrid` objects that do not have a defined `DataSource` option specified.
 *
 * This property is defined as a getter for now purely to be able to issue a deprecation warning that
 * the current default, `require('datasaur-local')`, has been deprecated as of v3.
 * Starting with v4, the application developer will be expected to define one of:
 * * a default data source `JSON.DataSource`; or
 * * a `DataSource` option for each grid instantiation.
 */
var DataSource = require('datasaur-local');
var warnDataSource;
Object.defineProperty(JSON, 'DataSource', {
    enumerable: true,
    get: function() {
        if (!warnDataSource) {
            console.warn('The default data source, `require(\'datasaur-local\')`, has been deprecated as of v3.0.0. Starting with v4, you must define either a default data source in `JSON.DataSource` or a `DataSource` option for each grid instantiation. For more info, see: https://github.com/fin-hypergrid/core/wiki/Data-Source');
            warnDataSource = true;
        }
        return DataSource;
    },
    set: function(Constructor) {
        DataSource = Constructor;
    }
});

// LOCAL METHODS -- to be called with `.call(this`

/**
 * Save underlying data row indexes backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON~
 */
function getUnderlyingIndexesOfSelectedRows() {
    var sourceIndexes = [],
        dataSource = this.dataSource;

    if (this.grid.properties.checkboxOnlyRowSelections) {
        this.grid.getSelectedRows().forEach(function(selectedRowIndex) {
            sourceIndexes.push(dataSource.getDataIndex(selectedRowIndex));
        });
    }

    return sourceIndexes;
}

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON~
 */
function reselectRowsByUnderlyingIndexes(sourceIndexes) {
    var i, r,
        rowCount = this.getRowCount(),
        selectedRowCount = sourceIndexes.length,
        rowIndexes = [],
        selectionModel = this.grid.selectionModel;

    selectionModel.clearRowSelection();

    if (this.grid.properties.checkboxOnlyRowSelections) {
        for (r = 0; selectedRowCount && r < rowCount; ++r) {
            i = sourceIndexes.indexOf(this.dataSource.getDataIndex(r));
            if (i >= 0) {
                rowIndexes.push(r);
                delete sourceIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                selectedRowCount--; // count down so we can bail early if all found
            }
        }

        rowIndexes.forEach(function(rowIndex) {
            selectionModel.selectRow(rowIndex);
        });
    }

    return rowIndexes.length;
}

function CharMap(dataModel) {
    this.dataModel = dataModel;
}
CharMap.prototype = {
    mixIn: require('overrider').mixIn,

    get OPEN() { return this.dataModel.dataSource.drillDownCharMap.OPEN; },
    set OPEN(s) { this.dataModel.dataSource.drillDownCharMap.OPEN = s; },

    get CLOSE() { return this.dataModel.dataSource.drillDownCharMap.CLOSE; },
    set CLOSE(s) { this.dataModel.dataSource.drillDownCharMap.CLOSE = s; },
};

module.exports = JSON;
