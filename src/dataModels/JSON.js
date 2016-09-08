'use strict';

var analytics = require('../Shared.js').analytics;
var DataModel = require('./DataModel');
var images = require('../../images');
var DataSourceOrigin = require('../dataSources/DataSourceOrigin');
//var NullDataSource = require('../dataSources/Null');

var UPWARDS_BLACK_ARROW = '\u25b2', // aka '▲'
    DOWNWARDS_BLACK_ARROW = '\u25bc'; // aka '▼'

/**
 * @name dataModels.JSON
 * @constructor
 * @extends DataModel
 */
var JSON = DataModel.extend('dataModels.JSON', {

    //null object pattern for the source object
    resetSources: function(stopApply) {
        this.sources = {
            source: new DataSourceOrigin()
        };
        this.source = this.sources.source;
        this.setPipeline(stopApply);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    reset: function() {
        this.setData([]);
        this.setPipeline();
    },

    topTotals: [],
    bottomTotals: [],

    initialize: function() {
        this.resetSources(true);
        this.selectedData = [];
    },

    clearSelectedData: function() {
        this.selectedData.length = 0;
    },

    getDataSource: function() {
        return this.deprecated('getDataSource()', 'dataSource', '1.0.7');
    },

    getGlobalFilterDataSource: function() {
        return this.sources.filter;
    },

    getData: function() {
        return this.source.data;
    },

    getFilteredData: function() {
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
            value = this.getHeaders()[Math.max(x, 0)];
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
                value = this.getHeaders()[x];
                var sortString = this.getSortImageForColumn(x);
                if (sortString) {
                    var at = value.lastIndexOf(this.groupHeaderDelimiter) + 1;
                    value = at ? value.substr(0, at) + sortString + value.substr(at) : sortString + value;
                }
            } else { // must be filter row
                var filter = this.getGlobalFilter();
                value = filter && filter.getColumnFilterState(this.getFields()[x]) || '';
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
     * @memberOf dataModels.JSON.prototype
     * @param {number} x - Data column coordinate.
     * @returns {*}
     */
    getColumnProperties: function(x) {
        //access directly because we want it ordered
        var column = this.grid.behavior.getColumn(x);
        return column && column.getProperties();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var showTree = this.grid.resolveProperty('showTreeColumn') === true;
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
        return this.dataSource && this.dataSource.getHeaders() || [];
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
        return this.dataSource.getFields();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getCalculators: function() {
        return this.dataSource.getProperty('calculators');
    },

    /** @typedef {object} dataSourcePipelineObject
     * @property {string} type - A `hyper-analytics`-style  "data source" constructor name.
     * @property {*} [options] - When defined, passed as 2nd argument to constructor.
     * @property {string} [parent] - Defines a branch off the main sequence.
     */

    /**
     * @type {dataSourcePipelineObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    pipeline: [
        { type: 'DataSourceGlobalFilter' },
        { type: 'DataSourceSorterComposite' }
    ],

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyAnalytics: function(options) {
        selectedDataRowsBackingSelectedGridRows.call(this);

        this.pipeline.forEach(function(sources, pipe) {
            var dataSource = sources[pipe.name];

            if (dataSource) {
                if (dataSource.sorts) {
                    dataSource.set(this.getSortedColumnIndexes().slice());
                }

                if (dataSource.apply) {
                    dataSource.apply(options);
                }
            }
        }.bind(this, this.sources));

        reselectGridRowsBackedBySelectedDataRows.call(this);
    },

    /**
     * @summary Set or reset grid data.
     * See {@link DataSourceOrigin#setData} for details.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource, dataFields, dataCalculators) {
        this.source.setHeaders(); // force rederive default headers
        this.source.setData(dataSource, dataFields, dataCalculators);
        //this.applyAnalytics();
        //requeue ??
    },

    /**
     * @summary Instantiates the data source pipeline.
     * @desc Each new pipe is created using the supplied constructor and a reference to the previous data source in the pipeline. A reference to each new pipe is added to `this` dataModel as a property using the pipe's `name`.
     *
     * The last pipe is assigned the synonym `this.dataSource`.
     *
     * Branches are created when a pipe specifies a name in `parent`.
     * @param {boolean} [stopApply] - Whether or not to run applyAnalytics
     * @memberOf dataModels.JSON.prototype
     */
    setPipeline: function(stopApply) {
        var dataSource = this.source,
            mainPipeTip;

        this.pipeline.forEach(function(sources, pipe) {
            var DataSource = analytics[pipe.type];

            pipe.name = pipe.name || getDataSourceName(pipe.type);

            if (pipe.parent) {
                mainPipeTip = dataSource; // tip of main trunk on first diversion
                dataSource = sources[getDataSourceName(pipe.parent)];
                if (!dataSource) {
                    throw 'Parent data source not in pipeline.';
                }
            }

            dataSource = new DataSource(dataSource);
            sources[pipe.name] = dataSource;

        }.bind(this, this.sources));

        this.dataSource = mainPipeTip || dataSource;// tip of main trunk if never branched
        if (!stopApply) {
            this.applyAnalytics();
        }
    },

    /**
     * @param {number} [newLength=0]
     */
    truncatePipeline: function(newLength) {
        this.pipeline.length = newLength || 0;
    },

    /**
     * Add a pipe to the data source pipeline.
     * @desc No-op if already added.
     * @param {dataSourcePipelineObject} newPipe
     * @param {string|null|undefined} [afterPipe] - One of:
     * * `null` - Inserts at beginning.
     * * *string* - Name of an existing pipe _after which_ the new pipe will be added.
     * * *else* _(including `undefined` or omitted)_ - Adds to end.
     * @memberOf dataModels.JSON.prototype
     */
    addPipe: function(newPipe, referencePipe) {
        var referenceIndex,
            added = this.pipeline.find(function(pipe) { return pipe.type === newPipe.type; });

        if (!added) {
            if (referencePipe === null) {
                referenceIndex = 0; // add to beginning
            } else if (
                !this.pipeline.find(function(pipe, index) {
                    referenceIndex = index + 1; // add after found pipe
                    return pipe.type === referencePipe;
                })
            ) {
                referenceIndex = this.pipeline.length; // not found: add to end
            }
            this.pipeline.splice(referenceIndex, 0, newPipe);
        }
    },

    isDrillDown: function(event) {
        return this.pipeline.find(function(pipe) {
            var test = pipe.test,
                type = typeof test;

            test = type === 'function' && pipe.test ||
                type === 'string' && this[pipe.test];

            return test && test.call(this, event);
        }.bind(this));
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
        var showTree = this.grid.resolveProperty('showTreeColumn') === true;
        return this.isDrillDown() && showTree;
    },


    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param keys
     */
    toggleSort: function(colIndex, keys) {
        this.incrementSortState(colIndex, keys);
        this.applyAnalytics({columnSort: true});
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} columnIndex
     * @param {boolean} deferred
     */
    unSortColumn: function(columnIndex, deferred) {
        var sorts = this.getSortedColumnIndexes(),
            sortPosition;

        if (sorts.find(function(sortSpec, index) {
                sortPosition = index;
                return sortSpec.columnIndex === columnIndex;
            })) {
            sorts.splice(sortPosition, 1);
            if (!deferred) {
                this.applyAnalytics({columnSort: true});
            }
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    getSortedColumnIndexes: function() {
        var state = this.getPrivateState();
        state.sorts = state.sorts || [];
        return state.sorts;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param {string[]} keys
     */
    incrementSortState: function(columnIndex, keys) {
        var sorts = this.getSortedColumnIndexes(),
            sortSpec = sorts.find(function(spec, index) {
                return spec.columnIndex === columnIndex;
            });

        if (!sortSpec) { // was unsorted
            if (keys.indexOf('CTRL') < 0) { sorts.length = 0; }
            sorts.unshift({
                columnIndex: columnIndex, // so define and...
                direction: 1 // ...make ascending
            });
        } else if (sortSpec.direction > 0) { // was ascending
            sortSpec.direction = -1; // so make descending
        } else { // was descending
            this.unSortColumn(columnIndex, true); // so make unsorted
        }

        //Minor improvement, but this check can happe n earlier and terminate earlier
        if (sorts.length > 3) {
            sorts.length = 3;
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        var sortPosition,
            sorts = this.getSortedColumnIndexes(),
            sortSpec = sorts.find(function(spec, index) {
                sortPosition = index;
                return spec.columnIndex === columnIndex;
            }),
            result = null;

        if (sortSpec) {
            var rank = sorts.length - sortPosition,
                arrow = sortSpec.direction > 0 ? UPWARDS_BLACK_ARROW : DOWNWARDS_BLACK_ARROW;
            result = rank + arrow + ' ';
        }

        return result;
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
                this.applyAnalytics({rowClick: true});
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
     * @summary Get a reference to the filter attached to the Hypergrid.
     * @returns {FilterTree}
     * @memberOf dataModels.JSON.prototype
     */
    getGlobalFilter: function() {
        return this.getGlobalFilterDataSource().get();
    },

    /**
     * @summary Attach/detach a filter to a Hypergrid.
     * @param {FilterTree} [filter] - The filter object. If undefined, any attached filter is removed, turning filtering OFF.
     * @memberOf dataModels.JSON.prototype
     */
    setGlobalFilter: function(filter) {
        this.getGlobalFilterDataSource().set(filter);
        this.applyAnalytics();
    },

    /**
     * @summary Set the case sensitivity of filter tests against data.
     * @desc Case sensitivity pertains to string compares only. This includes untyped columns, columns typed as strings, typed columns containing data that cannot be coerced to type or when the filter expression operand cannot be coerced.
     *
     * NOTE: This is a shared property and affects all grid managed by this instance of the app.
     * @param {boolean} isSensitive
     * @memberOf dataModels.JSON.prototype
     */
    setGlobalFilterCaseSensitivity: function(isSensitive) {
        this.getGlobalFilter().setCaseSensitivity(isSensitive);
        this.applyAnalytics();
    },

    /**
     * @summary Get a particular column filter's state.
     * @param {string} columnName
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getFilter: function(columnIndexOrName, options) {
        var isIndex = !isNaN(Number(columnIndexOrName)),
            columnName = isIndex ? this.getFields()[columnIndexOrName] : columnIndexOrName;

        return this.getGlobalFilter().getColumnFilterState(columnName, options);
    },

    /**
     * @summary Set a particular column filter's state.
     * @desc After setting the new filter state, reapplies the filter to the data source.
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {string|object} [state] - A filter tree object or a JSON, SQL, or CQL subexpression string that describes the a new state for the named column filter. The existing column filter subexpression is replaced with a new node based on this state. If it does not exist, the new subexpression is added to the column filters subtree (`filter.columnFilters`).
     *
     * If undefined, removes the entire column filter subexpression from the column filters subtree.
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @param {string} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `setFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setFilter: function(columnIndexOrName, state, options) {
        var isIndex = !isNaN(Number(columnIndexOrName)),
            columnName = isIndex ? this.getFields()[columnIndexOrName] : columnIndexOrName;

        this.getGlobalFilter().setColumnFilterState(columnName, state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getFilters: function(options) {
        return this.getGlobalFilter().getColumnFiltersState(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setFilters: function(state, options) {
        this.getGlobalFilter().setColumnFiltersState(state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getTableFilter: function(options) {
        return this.getGlobalFilter().getTableFilterState(options);
    },

    /**
     * @summary Set a the table filter state.
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setTableFilter: function(state, options) {
        this.getGlobalFilter().setTableFilterState(state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyState: function() {
        this.applyAnalytics();
    },

    getUnfilteredValue: function(x, y) {
        return this.source.getValue(x, y);
    },

    getUnfilteredRowCount: function() {
        return this.source.getRowCount();
    },

    /**
     * @summary Add a new data row to the grid.
     * @desc If data source pipeline in use, to see the new row in the grid, you must eventually call:
     * ```javascript
     * this.grid.behavior.applyAnalytics();
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
});

// LOCAL METHODS -- to be called with `.call(this`

/**
 * Accumulate actual data row objects backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @memberOf dataModels.JSON.prototype
 */
function selectedDataRowsBackingSelectedGridRows() {
    var selectedData = this.selectedData,
        hasRowSelections = this.grid.selectionModel.hasRowSelections(),
        needFilteredDataList = selectedData.length || hasRowSelections;

    if (needFilteredDataList) {
        var filteredData = this.getFilteredData();
    }

    // STEP 1: Remove any filtered data rows from the recently selected list.
    selectedData.forEach(function(dataRow, index) {
        if (filteredData.indexOf(dataRow) >= 0) {
            delete selectedData[index];
        }
    });

    // STEP 2: Accumulate the data rows backing any currently selected grid rows in `this.selectedData`.
    if (hasRowSelections) { // any current grid row selections?
        this.grid.getSelectedRows().forEach(function(selectedRowIndex) {
            var dataRow = filteredData[selectedRowIndex];
            if (selectedData.indexOf(dataRow) < 0) {
                selectedData.push(dataRow);
            }
        });
    }
}

/**
 * Re-establish grid row selections based on actual data row objects accumulated by `selectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @memberOf dataModels.JSON.prototype
 */
function reselectGridRowsBackedBySelectedDataRows() {
    if (this.selectedData.length) { // any data row objects added from previous grid row selections?
        var selectionModel = this.grid.selectionModel,
            offset = this.grid.getHeaderRowCount(),
            filteredData = this.getFilteredData();

        selectionModel.clearRowSelection();

        this.selectedData.forEach(function(dataRow) {
            var index = filteredData.indexOf(dataRow);
            if (index >= 0) {
                selectionModel.selectRow(offset + index);
            }
        });
    }
}

function getDataSourceName(name) {
    name = analytics[name].prototype.$$CLASS_NAME || name;
    if (/^DataSource\w+Filter$/.test(name)) {
        name = 'filter';
    } else {
        name = name.replace(/^Data(Source|Node)/, '').toLowerCase();
    }
    return name;
}


module.exports = JSON;
