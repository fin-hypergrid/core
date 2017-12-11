'use strict';

var DataModel = require('./DataModel');
var DataSourceOrigin = require('../lib/DataSourceOrigin');

/** @typedef {object} dataSourcePipelineObject
 * @property {string} type - A "DataSourceOrigin" style constructor name.
 * @property {*} [options] - When defined, passed as 2nd argument to constructor.
 * @property {string} [parent] - Defines a branch off the main sequence.
 */

/**
 * @name dataModels.JSON
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    initialize: function(grid, options) {
        this.charMap = new CharMap(this);
        this.reset(options);
    },

    /**
     * Override to use a different origin.
     * @type(DataSourceBase}
     * @memberOf dataModels.JSON.prototype
     */
    DataSourceOrigin: DataSourceOrigin,

    /**
     * @type {dataSourcePipelineObject[][]}
     * @summary Pipeline stash push-down list.
     * @desc The pipeline stash may be shared or instanced. This is the shared stash. An instance may override this with an instance stash variable (of the same name). See {@link dataModels.JSON#getPipelineSchemaStash}.
     * @memberOf dataModels.JSON.prototype
     */
    pipelineSchemaStash: [],

    /**
     * @param {object} [options]
     * @param {object} [options.pipeline] - Consumed by {@link dataModels.JSON#setPipeline}.
     * If omitted, previously established pipeline is reused.
     * * @memberOf dataModels.JSON.prototype
     */
    reset: function(options) {
        delete this.pipelineSchemaStash; // remove existing "own" version if any

        options = options || {};

        this.source = new this.DataSourceOrigin(
            options.data,
            options.schema
        );

        this.setPipeline({
            pipeline: options.pipeline
        });
    },

    /**
     * Application developer should override to set up a default pipeline.
     * @type {pipelineSchema}
     * @memberOf dataModels.JSON.prototype
     */
    defaultPipelineSchema: [],

    clearSelectedData: function() {
        var key = 'clearSelectedData()',
            warned = this.$$DEPRECATION_WARNED = this.$$DEPRECATION_WARNED || {};
        if (!(key in warned)) {
            warned[key] = 0;
            console.warn(key + ' has been deprecated as of v1.2.23. This function no longer has any meaning; calls should be removed.');
        }
    },

    /**
     * @deprecated As of v1.0.7, reference the `dataSource` property instead.
     * @returns {*}
     * @memberOf dataModels.JSON.prototype
     */
    getDataSource: function() {
        return this.deprecated('getDataSource()', 'dataSource', '1.0.7');
    },

    getData: function() {
        return this.source.data;
    },

    /**
     * @deprecated As of v1.1.0, use `getIndexedData()` instead.
     * @memberOf dataModels.JSON.prototype
     */
    getFilteredData: function() {
        return this.deprecated('getFilteredData()', 'getIndexedData()', '1.2.0', arguments);
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

        this.pipeline.forEach(function(dataSource) {
            if (dataSource) {
                if (dataSource.apply) {
                    dataSource.apply(options);
                }
            }
        });

        reselectRowsByUnderlyingIndexes.call(this, selectedRowSourceIndexes);
    },

    /**
     * @summary Set or reset grid data.
     * See {@link DataSourceOrigin#setData} for details.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource, schema) {
        this.source.setData(dataSource, schema);
    },

    /** @typedef {DataSourceBase[]} pipelineSchema
     * @summary Describes a new pipeline.
     * @desc Consists of an ordered list of data source constructors, descendants of `DataSourceBase`.
     * May contain `undefined` elements, which are ignored.
     */

    /**
     * @summary Instantiates the data source pipeline.
     * @desc Each new pipe is created from the list of supplied constructors, each taking a reference to the previous data source in the pipeline.
     *
     * A reference to each new pipe is added to `this.sources` dataModel using the pipe's derived name.
     *
     * Will clear out any filtering and sorting state.
     *
     * The last pipe is assigned the synonym `this.dataSource`.
     * @param {pipelineSchema} [DataSources] - New pipeline description. If not given, uses the default {@link dataModels.JSON#DataSources|this.defaultPipelineSchema}.
     * @param {object} [options] - Takes first argument position when `DataSources` omitted.
     * @param {string} [options.stash] - See {@link dataModels.JSON#getPipelineSchemaStash}. If given, saves the currently defined pipeline onto the indicated stash stack and then resets it with the given `DataSources`.
     * @memberOf dataModels.JSON.prototype
     */
    setPipeline: function(DataSources, options) {
        if (!Array.isArray(DataSources)) {
            options = DataSources;
            DataSources = options.pipeline;
        }

        options = options || {};

        if (DataSources) {
            DataSources = DataSources.slice();
        } else if (this.DataSources) {
            DataSources = this.DataSources;
        } else {
            DataSources = this.defaultPipelineSchema.slice();
        }

        this.DataSources = DataSources;

        var pipeline = [],
            dataSource = this.source;
        if (DataSources.length) {
            if (options.stash) {
                this.getPipelineSchemaStash(options.stash).push(DataSources);
            }

            DataSources.forEach(function(DataSource) {
                if (DataSource) {
                    dataSource = new DataSource(dataSource);
                    pipeline.push(dataSource);
                }
            }, this);
        }
        this.dataSource = dataSource;

        /**
         * @summary Currently defined pipeline.
         * @desc Each instance has its own pipeline.
         * (Pipelines cannot be shared because they contain indexes specific to the data in the grid.)
         * @name pipeline
         * @type {dataSourcePipelineObject[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.pipeline = pipeline;
    },

    /**
     * Find the last data source in the pipeline of specified type.
     * @param {string} type
     * @returns {DataSourceBase}
     * @memberOf dataModels.JSON.prototype
     */
    findDataSourceByType: function(type) {
        var dataSource;
        for (var i = this.pipeline.length - 1; i >= 0; i--) {
            dataSource = this.pipeline[i];
            if (dataSource.type === type) {
                return dataSource;
            }
        }
    },

    /**
     * @summary The pipeline stash currently in use (either shared or instance).
     * @desc Instance stash is created here when requested and instance doesn't yet have its "own" version.
     * @param {string} [whichStash='default'] - One of:
     * * `'shared'` - Use shared stash.
     * * `'own'' or `'instance'` - Use instance stash, creating it if it does not exist.
     * * `'default'` - Use instance stash if previously created; otherwise use shared stash.
     * @returns The pipeline stash push-down list.
     * @memberOf dataModels.JSON.prototype
     */
    getPipelineSchemaStash: function(whichStash) {
        var stash;
        switch (whichStash) {

            case 'shared':
                stash = DataModel.prototype.stash;
                break;

            case 'own':
            case 'instance':
                if (!this.hasOwnProperty('pipelineSchemaStash')) {
                    this.pipelineSchemaStash = [];
                }
                // fallthrough
            case 'default':
            case undefined:
                stash = this.pipelineSchemaStash;
                break;

        }
        return stash;
    },

    /**
     * Pops the last stashed pipeline off the stash stack, making it the currently defined pipeline.
     * @param {string} [whichStash] - See {@link dataModels.JSON#getPipelineSchemaStash}.
     * @memberOf dataModels.JSON.prototype
     */
    unstashPipeline: function(whichStash) {
        var pipelineSchemaStash = this.getPipelineSchemaStash(whichStash);
        if (pipelineSchemaStash.length) {
            this.setPipeline(pipelineSchemaStash.pop());
        }
    },

    /**
     * @deprecated
     * @param {number} [newLength=0]
     * @memberOf dataModels.JSON.prototype
     */
    truncatePipeline: function(newLength) {
        return this.deprecated('truncatePipeline(newLength)', 'setPipeline()', '1.2.0', arguments, 'Build a local pipeline (array of data source constructors) and pass it to setPipeline.');
    },

    isTree: function() {
        return this.dataSource.isDrillDown();
    },

    isTreeCol: function(event) {
        return this.dataSource.isDrillDownCol(event);
    },

    /**
     * @deprecated As pf v1.1.0, use `this.grid.behavior.setTopTotals()` instead.
     * @summary Set the top total row(s).
     * @param {dataRowObject[]} totalRows - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @memberOf dataModels.JSON.prototype
     */
    setTopTotals: function(totalRows) {
        return this.deprecated('setTopTotals(rows)', 'grid.behavior.setTopTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @deprecated As pf v1.1.0, use `this.grid.behavior.getTopTotals()` instead.
     * @summary Get the top total row(s).
     * @returns {dataRowObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    getTopTotals: function() {
        return this.deprecated('getTopTotals(rows)', 'grid.behavior.getTopTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @deprecated
     * @summary Set the bottom total row(s).
     * @param {dataRowObject[]} totalRows - Array of 0 or more rows containing summary data. Omit to set to empty array.
     * @memberOf dataModels.JSON.prototype
     */
    setBottomTotals: function(totalRows) {
        return this.deprecated('setBottomTotals(rows)', 'grid.behavior.setBottomTotals(rows)', '1.1.0', arguments);
    },

    /**
     * @summary Get the bottom total row(s).
     * @deprecated As pf v1.1.0, use `this.grid.behavior.getBottomTotals()` instead.
     * @returns {dataRowObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    getBottomTotals: function() {
        return this.deprecated('getBottomTotals()', 'grid.behavior.getBottomTotals()', '1.1.0');
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {Column[]}
     */
    getActiveColumns: function() {
        return this.deprecated('getActiveColumns()', 'grid.behavior.getActiveColumns()', '1.2.14', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @deprecated As of v1.0.6, use `this.getActiveColumns` instead.
     * @returns {Column[]}
     */
    getVisibleColumns: function() {
        return this.deprecated('getVisibleColumns()', 'getActiveColumns()', '1.0.6', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getHiddenColumns: function() {
        return this.deprecated('getHiddenColumns()', 'grid.behavior.getHiddenColumns()', '1.2.14', arguments);
    },

    hasHierarchyColumn: function() {
        return this.deprecated('hasHierarchyColumn()', '', 'v1.3.3');
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
     * @deprecated As of v1.1.0, use `this.reindex` instead.
     * @memberOf dataModels.JSON.prototype
     */
    applyState: function() {
        return this.deprecated('applyState()', 'reindex()', '1.2.0', arguments);
    },

    getUnfilteredValue: function(x, y) {
        return this.deprecated('getUnfilteredValue(x, y)', null, '1.2.0', arguments, 'No longer supported');
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredValue(x, y)', null, '1.2.0', arguments, 'No longer supported');
    },

    /**
     * @summary Add a new data row to the grid.
     * @desc If data source pipeline in use, to see the new row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.reindex();
     * this.grid.behaviorChanged();
     * ```
     * @param {object} newDataRow
     * @returns {object} The new row object.
     * @memberOf dataModels.JSON.prototype
     */
    addRow: function(newDataRow) {
        this.getData().push(newDataRow);
        return newDataRow;
    },

    get schema() { return this.dataSource.schema; },

    set schema(schema) {
        this.dataSource.setSchema(schema);
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
