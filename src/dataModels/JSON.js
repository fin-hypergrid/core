'use strict';

var DataModel = require('./DataModel');

/**
 * > This constructor (actually {@link dataModels.JSON#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @name dataModels.JSON
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {DataSource} [options.DataSource] - Must be supplied on first call; optional thereafter.
 * @param {object[]} [options.data]
 * @param {object[]} [options.schema]
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    initialize: function(grid, options) {
        this.charMap = new CharMap(this);
        this.reset(options);
    },

    /**
     * @param {object} [options]
     * @param {function} [options.DataSource] - Data source constructor.
     * @param {DataSource} [options.dataSource] - Fully instantiated data source.
     * @param {object[]} [options.data]
     * @param {object[]} [options.schema]
     * @param {object|Array} [options.metadataStore=[]] - _See {@link DataModel#makeInterface}._
     * @param {object} [options.interfaceAdditions] - _See {@link DataModel#makeInterface}._
     * @memberOf dataModels.JSON.prototype
     */
    reset: function(options) {
        var newDataSource, DataSource;

        options = options || {};

        if (options.dataSource) {
            newDataSource = options.dataSource;
        } else if ((DataSource = this.DataSource = options.DataSource || this.DataSource || JSON.DataSource)) {
            newDataSource = new DataSource;
        }

        if (newDataSource && newDataSource !== this.dataSource) {
            if (newDataSource.setInterface) {
                newDataSource.setInterface(this.makeInterface(options));
            }
            if (options.schema) {
                newDataSource.setSchema(options.schema);
            }
            if (options.data && !options.dataSource) {
                newDataSource.setData(options.data);
            }
            this.dataSource = newDataSource;
            buildRowAccessor.call(this);
        }

        if (!this.dataSource) {
            throw new this.HypergridError('Expected a data source. (Define options.dataSource or options.DataSource.)');
        }
    },

    getData: function() {
        return this.deprecated('getData()', 'dataSource.getData()', '3.0.0', arguments, 'Get data is problematic and should not be called (see https://github.com/fin-hypergrid/core/wiki/getRow-and-getData-Abuse). The fallback will copy the rows and all their data. If your data source has an implementation (and you know what you\'re doing), call it directly.');
    },

    getIndexedData: function() {
        return this.deprecated('getIndexedData()', 'dataSource.getData()', '3.0.0', arguments, 'This method was originally provided to get all the data from the tip of the data source (in a cascading datasource, rather than from the origin), which would be the subset of (transformed) rows with their transformed indexes. This was ill-advised because the right way to do this would have been to implement a `getRow` at the tip.');
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
    reindex: function() {
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
        if (schema) {
            buildRowAccessor.call(this);
        }
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
                this.reindex();
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

    getRowMetadata: function(y, metadata) {
        return this.dataSource.getRowMetadata(y, metadata);
    },

    setRowMetadata: function(y, metadata) {
        return this.dataSource.setRowMetadata(y, metadata);
    },

    get schema() {
        return this.dataSource.getSchema();
    },

    set schema(schema) {
        this.dataSource.setSchema(schema);
        buildRowAccessor.call(this);
    }
});

/**
 * @function buildRowAccessor
 *
 * @summary Build a `dataSource.getRow` fallback based on current `schema`.
 *
 * @desc The accessor is a dataRow-like object (a hash of column values keyed by column name)
 * for the particular row whose index is in `.$$rowIndex`.
 *
 * The row index can be conveniently set with a call to the accessor's `.$$getRow()` method,
 * which sets the row index and returns the accessor itself
 * (which is why it's more logically called `$$getRow` instead of `$$setRowIndex`).
 *
 * `$$rowIndex` and `$$getRow` are "hidden" members:
 * * They are non-enumerable so they won't show up in `Object.keys(...)`.
 * * They sport leading `__` to reduce the chance of clashing with actual column names.
 *
 * In this fallback implementation, the enumerable members are all getters that invoke `getValue`.
 *
 * This function should be called each time a new schema is set (_i.e.,_ on instantiation and again whenever setData is called with a defined schema).
 *
 * @this {dataModels.JSON}
 */
function buildRowAccessor() {
    var dataSource = this.dataSource,
        columnEnum = {},
        rowAccessor = Object.create(null, {
            $$rowIndex: {
                writable: true
            },
            $$getRow: {
                value: function(rowIndex) {
                    this.$$rowIndex = rowIndex;
                    return this;
                }
            }
        });

    this.schema.forEach(function(columnSchema, columnIndex) {
        columnEnum[columnSchema.name] = columnIndex;
        Object.defineProperty(rowAccessor, columnSchema.name, {
            enumerable: true,
            get: function() {
                return dataSource.getValue(columnIndex, this.$$rowIndex);
            },
            set: function(value) {
                return dataSource.setValue(columnIndex, this.$$rowIndex, value);
            }
        });
    });

    this.columnEnum = columnEnum;
    this.rowAccessor = rowAccessor;
}


/** @name DataSource
 * @memberOf JSON
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated
 * `Hypergrid` objects that do not have a defined `DataSource` option specified.
 *
 * This property is defined as a getter for now purely to be able to issue a deprecation warning that
 * the current default, `require('datasaur-local')`, has been deprecated as of v3 to be removed in v4.
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
