'use strict';

var DataModel = require('./DataModel');
var images = require('../../images');
var DataSourceOrigin = require('../dataSources/DataSourceOrigin');

/** @typedef {object} dataSourcePipelineObject
 * @property {string} type - A "DataSourceOrigin" style constructor name.
 * @property {*} [options] - When defined, passed as 2nd argument to constructor.
 * @property {string} [parent] - Defines a branch off the main sequence.
 */

/**
 * @implements dataSourceHelperAPI
 * @desc This is a simple "null" helper API implementation with only a null `properties` method is defined.
 * @see {@link http://c2.com/cgi/wiki?NullObject}
 * @memberOf dataModels.JSON
 * @inner
 */
var nullDataSourceHelperAPI = {
    properties: function(properties) {
        var result,
            isGetter = 'getPropName' in properties;

        if (isGetter) {
            // All props are undefined in this null API regardless of their name; and
            // undefined props return `null` as per interface definition.
            result = null;
        }

        return result;
    }
};

/**
 * @name dataModels.JSON
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    initialize: function(grid, options) {
        this.reset(options);
    },

    /**
     * Override to use a different origin.
     * @type(DataSourceBase}
     */
    DataSourceOrigin: DataSourceOrigin,

    /**
     * @type {dataSourcePipelineObject[][]}
     * @summary Pipeline stash push-down list.
     * @desc The pipeline stash may be shared or instanced. This is the shared stash. An instance may override this with an instance stash variable (of the same name). See {@link dataModels.JSON.prototype#getPipelineSchemaStash}.
     * @memberOf dataModels.JSON.prototype
     */
    pipelineSchemaStash: [],

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {object} [options]
     */
    reset: function(options) {
        /**
         * Each instance has its own top totals rows.
         * @name topTotals
         * @type {object[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.topTotals = [];

        /**
         * Each instance has its own bottom totals rows.
         * @name bottomTotals
         * @type {object[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.bottomTotals = [];

        this.selectedData = [];

        /**
         * @summary Hash of data source helper APIs.
         * @desc Keyed by data source type. An API is required by data sources with an `api` property.
         * @see {@link dataModels.JSON/updateDataSources}
         * @type {object}
         */
        this.api = {};

        delete this.pipelineSchemaStash; // remove existing "own" version if any

        this.source = new this.DataSourceOrigin(options.data, options.schema);

        this.setPipeline();
        //Register Defaults
        this.registerHelperAPI('filter');
        this.registerHelperAPI('sorter');
    },

    /**
     * @summary The default data sources for a new pipeline when none are give.
     * @desc For now Filtering is hardcoded in the grid.
     * In the future, this will likely be empty (unless overridden by application developer for his own purposes).
     * @type {pipelineSchema}
     * @memberOf dataModels.JSON.prototype
     */
    defaultPipelineSchema: [],

    clearSelectedData: function() {
        this.selectedData.length = 0;
    },

    /**
     * @deprecated As of v1.0.7, reference the `dataSource` property instead.
     * @returns {*}
     */
    getDataSource: function() {
        return this.deprecated('getDataSource()', 'dataSource', '1.0.7');
    },

    getData: function() {
        return this.source.data;
    },

    /**
     * @deprecated As of v1.1.0, use getIndexedData
     */
    getFilteredData: function() {
        return this.deprecated('getFilteredData()', 'getIndexedData()', '1.1.0', arguments);
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
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @returns {*}
     */
    getValue: function(x, r) {
        var hasHierarchyColumn = this.hasHierarchyColumn(),
            headerRowCount = this.grid.getHeaderRowCount(),
            value;

        if (hasHierarchyColumn) {
            if (x === -2) {
                x = 0;
            }
        } else if (this.isDrillDown()) {
            x += 1;
        }

        if (r < headerRowCount) {
            value = this.getHeaderRowValue(x, r);
        } else {
            var y = r - headerRowCount;
            // if (hasHierarchyColumn) {
            //     y += 1;
            // }
            value = this.dataSource.getValue(x, y);
        }
        return value;
    },

    /**
     * @param {number} r - Grid row coordinate.
     * @returns {*}
     */
    getDataIndex: function(r) {
        var y = r - this.grid.getHeaderRowCount();
        return this.dataSource.getDataIndex(y);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} y - positive values refer to data rows; negative values refer to _bottom totals_ rows
     * @returns {*}
     */
    getHeaderRowValue: function(x, y) {
        var value;
        if (y === undefined) {
            value = this.schema[Math.max(x, 0)].header;
        } else if (y < 0) { // bottom totals rows
            var bottomTotals = this.getBottomTotals();
            value = bottomTotals[bottomTotals.length + y][x];
        } else {
            var isFilterRow = this.grid.isShowFilterRow(),
                isHeaderRow = this.grid.isShowHeaderRow(),
                topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
            if (y >= topTotalsOffset) { // top totals rows
                value = this.getTopTotals()[y - topTotalsOffset][x];
            } else if (isHeaderRow && y === 0) {
                value = this.schema[x].header || this.schema[x].name;
                var sortString = this.getSortImageForColumn(x); //TODO: Should be cleaned up with a proper rowProperties
                if (sortString) {
                    var at = value.lastIndexOf(this.groupHeaderDelimiter) + 1;
                    value = at ? value.substr(0, at) + sortString + value.substr(at) : sortString + value;
                }
            } else { // must be filter row
                //TODO: Should be cleaned up with a proper rowProperties
                if (!this.filter.getColumnFilterState) {
                    throw new this.HypergridError('Column filters not available.');
                }
                value = this.filter.getColumnFilterState(this.schema[x].name) || '';
                var icon = images.filter(value.length);
                return [null, value, icon];
            }
        }
        return value;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param value
     */
    setValue: function(x, r, value) {
        var hasHierarchyColumn = this.hasHierarchyColumn();
        var headerRowCount = this.grid.getHeaderRowCount();

        if (hasHierarchyColumn) {
            if (x === -2) {
                x = 0;
            }
        } else if (this.isDrillDown()) {
            x += 1;
        }

        if (r < headerRowCount) {
            this.setHeaderRowValue(x, r, value);
        } else {
            var y = r - headerRowCount;
            this.dataSource.setValue(x, y, value);
        }
        this.changed();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @param {number} r - Grid row coordinate.
     * @param value
     * @returns {*}
     */
    setHeaderRowValue: function(x, r, value) {
        if (value === undefined) {
            return this._setHeader(x, r); // r is really the value
        }
        var isFilterRow = this.grid.isShowFilterRow();
        var isHeaderRow = this.grid.isShowHeaderRow();
        var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
        if (r >= topTotalsOffset) {
            this.getTopTotals()[r - topTotalsOffset][x] = value;
        } else if (x === -1) {
            return; // can't change the row numbers header
        } else if (isHeaderRow && r === 0) {
            return this._setHeader(x, value);
        } else if (isFilterRow) {
            this.setFilter(x, value);
        } else {
            return this._setHeader(x, value);
        }
        return '';
    },

    /**
     * @deprecated As of v1.1.0, use `this.grid.behavior.getColumnProperties(x)` instead.
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @returns {*}
     */
    getColumnProperties: function(x) {
        //access directly because we want it ordered
        return this.deprecated('getColumnProperties(x)', 'grid.behavior.getColumnProperties(x)', '1.1.0', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var showTree = this.grid.properties.showTreeColumn === true;
        var offset = (this.isDrillDown() && !showTree) ? -1 : 0;
        return this.dataSource.getColumnCount() + offset;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getRowCount: function() {
        var count = this.dataSource.getRowCount();
        count += this.grid.getHeaderRowCount();
        return count;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getHeaders: function() {
        console.warn('getHeaders() has been deprecated as of v1.1.0. It will be removed in a future release. Header strings are now found in dataSource.schema[*].header.');
        return this.dataSource && this.dataSource.getHeaders();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} headers
     */
    setHeaders: function(headers) {
        this.dataSource.setHeaders(headers);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} fields
     */
    setFields: function(fields) {
        this.dataSource.setFields(fields);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getFields: function() {
        console.warn('getFields() has been deprecated as of v1.1.0. It will be removed in a future release. Field names are now found in dataSource.schema[*].name.');
        return this.dataSource.getFields();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getCalculators: function() {
        console.warn('getCalculators() has been deprecated as of v1.1.0. It will be removed in a future release. Calculator functions are now found in dataSource.schema[*].calculator.');
        return this.dataSource.getProperty('calculators');
    },

    /**
     * @deprecated
     * @memberOf dataModels.JSON.prototype
     */
    applyAnalytics: function(options) {
        selectedDataRowsBackingSelectedGridRows.call(this);

        this.pipeline.forEach(function(dataSource) {
            if (dataSource) {
                if (dataSource.apply) {
                    dataSource.apply(options);
                }
            }
        });

        reselectGridRowsBackedBySelectedDataRows.call(this);
    },

    /**
     * @summary Set or reset grid data.
     * See {@link DataSourceOrigin#setData} for details.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource, schema) {
        this.source.setData(dataSource, schema);
    },

    /** @typedef pipelineSchema
     * @type {DataSourceBase[]}
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
     * @param {string} [options.stash] - See {@link dataModels.JSON.prototype#getPipelineSchemaStash}. If given, saves the currently defined pipeline onto the indicated stash stack and then resets it with the given `DataSources`.
     * @memberOf dataModels.JSON.prototype
     */
    setPipeline: function(DataSources, options) {
        if (!Array.isArray(DataSources)) {
            options = DataSources;
            DataSources = undefined;
        }

        if (options && options.stash) {
            this.getPipelineSchemaStash(options.stash).push(this.DataSources);
        }

        var dataSource = this.source;

        /**
         * @summary Currently defined pipeline.
         * @desc Each instance has its own pipeline.
         * (Pipelines cannot be shared because they contain indexes specific to the data in the grid.)
         * @name pipeline
         * @type {dataSourcePipelineObject[]}
         * @memberOf dataModels.JSON.prototype
         */
        this.pipeline = [];

        DataSources = DataSources || this.defaultPipelineSchema;

        DataSources.forEach(function(DataSource) {
            if (DataSource) {
                dataSource = new DataSource(dataSource);
                this.pipeline.push(dataSource);

                // Ensure a null helper API defined for all data sources that require one
                if (dataSource.type && dataSource.set && !this.api[dataSource.type]) {
                    this.registerHelperAPI(dataSource.type);
                }
            }
        }, this);

        this.updateDataSources();

        this.dataSource = dataSource;

        this.DataSources = DataSources;
    },

    /**
     * Find the last data source in the pipeline of specified type.
     * @param {string} type
     * @returns {DataSourceBase}
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
     * @summary Update data sources with APIs of matching types.
     * @desc Only updates _qualified_ data sources, which include:
     * * those for which an API of the data source's type is defined in `this.api`; and
     * * those that can accept an API (have an `api` property to set).
     * @param {string} [type] - Type of data source to update. If omitted, updates all data sources.
     * @returns {number|object} One of:
     * `type` specified - The number of updated data sources of the specified type.
     * `type` omitted - Hash containing the number of updated data sources by type.
     * *
     */
    updateDataSources: function(type) {
        var results = {},
            api = this.api;

        this.pipeline.filter(function(dataSource) {
            if (
                (!type || dataSource.type === type) &&
                api[dataSource.type]
            ) {
                dataSource.set(api[dataSource.type]);
                results[dataSource.type] = (results[dataSource.type] || 0) + 1;
            }
        });

        return type ? results[type] : results;
    },

    /**
     * @summary The pipeline stash currently in use (either shared or instance).
     * @desc Instance stash is created here when requested and instance doesn't yet have its "own" version.
     * @param {string} [whichStash] - One of:
     * * `'shared'` - Use shared stash.
     * * `'own'' or `'instance'` - Use instance stash, creating it if it does not exist.
     * * `'default'` or `undefined` - Use instance stash if previously created; otherwise use shared stash.
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
                // disable eslint no-fallthrough
            case 'default':
            case undefined:
                stash = this.pipelineSchemaStash;
                break;
        }
        return stash;
    },

    /**
     * Pops the last stashed pipeline off the stash stack, making it the currently defined pipeline.
     * @param {string} [whichStash] - See {@link dataModels.JSON.prototype#getPipelineSchemaStash}.
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
        return this.deprecated('truncatePipeline(newLength)', 'setPipeline()', '1.1.0', arguments, 'Build a local pipeline (array of data source constructors) and pass it to setPipeline.');
    },

    isDrillDown: function(event) {
        var colIndex = event && event.gridCell && event.gridCell.x;
        return this.dataSource.isDrillDown(colIndex);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {Array<Array>} totalRows
     */
    setTopTotals: function(totalRows) {
        this.topTotals = totalRows;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {Array<Array>}
     */
    getTopTotals: function() {
        return this.dataSource.getGrandTotals() || this.topTotals;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {Array<Array>} totalRows
     */
    setBottomTotals: function(totalRows) {
        this.bottomTotals = totalRows;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {Array<Array>}
     */
    getBottomTotals: function() {
        return this.dataSource.getGrandTotals() || this.bottomTotals;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getActiveColumns: function() {
        return this.grid.behavior.columns.filter(function(column) {
            return column.name !== 'tree';
        });
    },

    /**
     * @deprecated As of v1.0.6, use `this.getActiveColumns` instead.
     * @returns {*}
     */
    getVisibleColumns: function() {
        return this.deprecated('getVisibleColumns()', 'getActiveColumns()', '1.0.6', arguments);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getHiddenColumns: function() {
        var visible = this.grid.behavior.columns;
        var all = this.grid.behavior.allColumns;
        var hidden = [];
        for (var i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort(function(a, b) {
            return a.header < b.header;
        });
        return hidden;
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasHierarchyColumn: function() {
        var showTree = this.grid.properties.showTreeColumn === true;
        return this.isDrillDown() && showTree;
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
    cellClicked: function(cell, event) {
        var clickedInDrillDownColumn = this.isDrillDown(event);
        if (clickedInDrillDownColumn) {
            var y = event.gridCell.y - this.grid.getHeaderRowCount();
            this.toggleRow(y);
        }
        return clickedInDrillDownColumn;
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
     * @returns {boolean|undefined} If any rows expanded or collapsed; `undefined` means row had no drill-down control.
     * @memberOf dataModels.JSON.prototype
     */
    toggleRow: function(y, expand) {
        //TODO: fire a row toggle event
        var changed;
        if (this.isDrillDown()) {
            changed = this.dataSource.click(y, expand);
            if (changed) {
                this.reindex({rowClick: true});
                this.changed();
            }
        }
        return changed;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} r - Grid row coordinate.
     * @returns {object}
     */
    getRow: function(r) {
        var headerRowCount = this.grid.getHeaderRowCount(),
            topTotals = this.getTopTotals(),
            hasToptotals = !!topTotals.length,
            y = r - headerRowCount;

        if (r < headerRowCount && !hasToptotals) {
            return topTotals[r - (headerRowCount - topTotals.length)];
        }

        return this.dataSource.getRow(y);
    },

    /**
     * @summary _Getter:_ Return the filter from the data model.
     * @method
     * @returns {dataSourceHelperAPI} The grid's currently assigned filter.
     * @memberOf dataModels.JSON.prototype
     */
    get filter() {
        return this.api.filter;
    },

    /**
     * @summary _Setter:_ Assign a filter to the data model.
     * @method
     * @param {dataSourceHelperAPI|undefined|null} filter - One of:
     * * A filter object - Turns the filter *ON*.
     * * `undefined` or `null` - Turns the filter *OFF.*
     * @memberOf dataModels.JSON.prototype
     */
    set filter(filter) {
        this.registerHelperAPI('filter', filter);
    },
    /**
     * @summary _Getter_
     * @method
     * @returns {sorterAPI} The grid's currently assigned sorter.
     * @memberOf dataModels.JSON.prototype
     */
    get sorter() {
        return this.api.sorter;
    },

    /**
     * @summary _Setter:_ Assign a sorter to the grid.
     * @method
     * @param {sorterAPI|undefined|null} sorter - One of:
     * * A sorter object, turning sorting *ON*.
     * * If `undefined` or `null`, the {@link dataModels.JSON~nullSorter|nullSorter} is reassigned to the grid, turning sorting *OFF.*
     * @memberOf dataModels.JSON.prototype
     */
    set sorter(sorter) {
        this.registerHelperAPI('sorter', sorter);
    },

    /**
     * @summary Register the data source helper API.
     * @desc The API is immediately applied to all data sources in the pipeline of the given type; and reassigned later whenever the pipeline is reset.
     * @param {string} dataSourceType
     * @param {dataSourceHelperAPI|undefined|null} helper - One of:
     * * A filter object - Turns the data source *ON*.
     * * `undefined` or `null` - Turns the data source *OFF.*
     * * A helper API. Turns the data source *ON*.
     */
    registerHelperAPI: function(dataSourceType, helper) {
        this.api[dataSourceType] = helper = helper || nullDataSourceHelperAPI;

        if (typeof helper.properties === 'function' && helper.properties.length === 1) {
            helper.prop = propPrep.bind(helper, this);
        }

        if (this.updateDataSources(dataSourceType)) {
            this.reindex();
        }
    },

    /**
     * @deprecated As of v1.1.0, use `this.reindex` instead.
     * @memberOf dataModels.JSON.prototype
     */
    applyState: function() {
        return this.deprecated('applyState()', 'reindex()', '1.1.0', arguments);
    },

    getUnfilteredValue: function(x, y) {
        return this.deprecated('getUnfilteredValue(x, y)', null, '1.1.0', arguments, 'No longer supported');
    },

    getUnfilteredRowCount: function() {
        return this.deprecated('getUnfilteredValue(x, y)', null, '1.1.0', arguments, 'No longer supported');
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

    get schema() { return this.source.schema; },

    set schema(schema) {
        this.source.setSchema(schema);
    }
});

// LOCAL METHODS -- to be called with `.call(this`

/**
 * Accumulate actual data row objects backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON.prototype
 */
function selectedDataRowsBackingSelectedGridRows() {
    var selectedData = this.selectedData,
        hasRowSelections = this.grid.selectionModel.hasRowSelections(),
        needIndexedDataList = selectedData.length || hasRowSelections;

    if (needIndexedDataList) {
        var indexedData = this.getIndexedData();
    }

    // STEP 1: Remove any filtered data rows from the recently selected list.
    selectedData.forEach(function(dataRow, index) {
        if (indexedData.indexOf(dataRow) >= 0) {
            delete selectedData[index];
        }
    });

    // STEP 2: Accumulate the data rows backing any currently selected grid rows in `this.selectedData`.
    if (hasRowSelections) { // any current grid row selections?
        this.grid.getSelectedRows().forEach(function(selectedRowIndex) {
            var dataRow = indexedData[selectedRowIndex];
            if (selectedData.indexOf(dataRow) < 0) {
                selectedData.push(dataRow);
            }
        });
    }
}

/**
 * Re-establish grid row selections based on actual data row objects accumulated by `selectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @this {dataModels.JSON}
 * @memberOf dataModels.JSON.prototype
 */
function reselectGridRowsBackedBySelectedDataRows() {
    if (this.selectedData.length) { // any data row objects added from previous grid row selections?
        var selectionModel = this.grid.selectionModel,
            offset = this.grid.getHeaderRowCount(),
            filteredData = this.getIndexedData();

        selectionModel.clearRowSelection();

        this.selectedData.forEach(function(dataRow) {
            var index = filteredData.indexOf(dataRow);
            if (index >= 0) {
                selectionModel.selectRow(offset + index);
            }
        });
    }
}

/**
 * @inner
 * @summary Digests `(columnIndex, propName, value)` and calls `properties`.
 * @desc Digests the three parameters `(columnIndex, propName, value)` detailed below, creating a single object with which it then calls the helper API `properties` method.
 *
 * A helper API `properties` method:
 * * Supports two types of actions:
 *   * **Getter** call where you supply just the property name. The method gets the property value from the API and returns it.
 *   * **Setter** call where you supply a value along with the property name; or you supply a hash of property name/value pairs. The method sets the property on the API and returns nothing. All values are valid with the exception of `undefined` which deletes the property of the given name rather than setting it to `undefined`.
 * * Supports two types of properties:
 *   * **Global properties** affect the API globally.
 *   * **Column properties** pertain to specific columns.
 *
 * This method is overloaded. The way it is called as explained in the Parameters section below determines both the type of action (getter, setter) and the kind of property (global, column).
 *
 * Note: Not all API properties are dynamic; some are static and updating them later will have no effect.
 *
 * @this {dataSourceHelperAPI}
 *
 * @param {DataSourceBase} dataModel - The data model. This parameter is bound to the call by {@link dataModels.JSON#setHelperAPI|setHelperAPI}.
 *
 * @param {number} [columnIndex] - If given, this is a property on a specific column. If omitted, this is a property on the whole API properties object.
 *
 * @param {string|object} property - _If `columnIndex` is omitted, this arg takes first position._
 *
 * One of these types:
 * * **string** - Property name. The name of the explicit property to either get or (if `value` also given) set on the properties object.
 * * **object** - Hash of properties to set on the properties object.
 *
 * @param [value] - _If `columnIndex` is omitted, this arg takes second position._
 *
 * One of:
 * * Omitted (when `property` is a string), this is the "getter" action: Return the value from the properties object of the key in `property`.
 * * When `property` is a string and `value` is given, this is the "setter" action: Copy this value to properties object using the key in `property`.
 * * When `property` is a hash and `value` is given: Unexpected; throws an error.
 *
 * @returns {propObject}
 */
function propPrep(dataModel, columnIndex, propName, value) {
    var invalid,
        properties = {},
        argCount = arguments.length;

    if (typeof columnIndex === 'number') {
        argCount--;
    } else {
        value = propName;
        propName = columnIndex;
        columnIndex = undefined;
    }

    switch (argCount) {
        case 2: // getter propName name or setter hash
            if (typeof propName === 'object') {
                properties = propName;
            } else {
                properties.getPropName = propName;
            }
            break;
        case 3: // setter for value
            if (typeof propName !== 'string') {
                invalid = true;
            } else {
                properties[propName] = value;
            }
            break;
        default: // too few or too many args
            invalid = true;
    }

    if (invalid) {
        throw 'Invalid overload.';
    }

    if (columnIndex !== undefined) {
        // non-enumerable propName:
        Object.defineProperty(properties, 'column', {
            value: {
                index: columnIndex,
                name: dataModel.source.schema[columnIndex].name
            }
        });
    }

    return this.properties(properties);
}
/**
 * @memberOf JSON.prototype
 */
JSON.prototype.reindex = JSON.prototype.applyAnalytics; // eslint-disable-line no-extend-native

module.exports = JSON;
