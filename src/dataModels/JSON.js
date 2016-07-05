'use strict';

var analytics = require('../Shared.js').analytics;
var DataModel = require('./DataModel');
var images = require('../../images');

var UPWARDS_BLACK_ARROW = '\u25b2', // aka '▲'
    DOWNWARDS_BLACK_ARROW = '\u25bc'; // aka '▼'

var nullDataSource = {
    isNullObject: function() {
        return true;
    },
    getFields: function() {
        return [];
    },
    getHeaders: function() {
        return [];
    },
    getColumnCount: function() {
        return 0;
    },
    getRowCount: function() {
        return 0;
    },
    getAggregateTotals: function() {
        return [];
    },
    hasAggregates: function() {
        return false;
    },
    hasGroups: function() {
        return false;
    },
    getRow: function() {
        return null;
    },

    viewMakesSense: function() {
        return false;
    },
    setAggregates: function() {},
    setGroupBys: function() {},
    groupBys: [],

};

/**
 * @name dataModels.JSON
 * @constructor
 */
var JSON = DataModel.extend('dataModels.JSON', {

    //null object pattern for the source object
    resetSources: function() {
        this.sources = {
            source: nullDataSource,
            aggregator: nullDataSource,
            globalfilter: nullDataSource,
            sortercomposite: nullDataSource
        };
        this.dataSource = undefined;
    },

    topTotals: [],
    bottomTotals: [],

    initialize: function() {
        this.resetSources();
        this.selectedData = [];
    },

    clearSelectedData: function() {
        this.selectedData.length = 0;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasAggregates: function() {
        return this.sources.aggregator.hasAggregates();
    },

    isTreeview: function() {
        return !!(this.sources.treeview && this.sources.treeview.viewMakesSense());
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasGroups: function() {
        return this.sources.aggregator.hasGroups();
    },

    getDataSource: function() {
        return this.deprecated('getDataSource()', 'dataSource', '1.0.7');
    },

    getGlobalFilterDataSource: function() {
        return this.sources.globalfilter;
    },

    getData: function() {
        return this.sources.source.data;
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
     * @param {number} x
     * @param {number} y
     * @returns {*}
     */
    getValue: function(x, y) {
        var hasHierarchyColumn = this.hasHierarchyColumn();
        var headerRowCount = this.grid.getHeaderRowCount();
        var value;

        if (hasHierarchyColumn) {
            if (x === -2) {
                x = 0;
            }
        } else if (this.hasAggregates()) {
            x += 1;
        }
        if (y < headerRowCount) {
            value = this.getHeaderRowValue(x, y);
        } else {
            // if (hasHierarchyColumn) {
            //     y += 1;
            // }
            value = this.dataSource.getValue(x, y - headerRowCount);
        }
        return value;
    },

    getDataIndex: function(y) {
        return this.dataSource.getDataIndex(y - this.grid.getHeaderRowCount());
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x
     * @param {number} y - negative values refer to _bottom totals_ rows
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
                if (sortString) { value = sortString + value; }
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
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        var hasHierarchyColumn = this.hasHierarchyColumn();
        var headerRowCount = this.grid.getHeaderRowCount();
        if (hasHierarchyColumn) {
            if (x === -2) {
                x = 0;
            }
        } else if (this.hasAggregates()) {
            x += 1;
        }
        if (y < headerRowCount) {
            this.setHeaderRowValue(x, y, value);
        } else {
            this.dataSource.setValue(x, y - headerRowCount, value);
        }
        this.changed();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} x
     * @param {number} y
     * @param value
     * @returns {*}
     */
    setHeaderRowValue: function(x, y, value) {
        if (value === undefined) {
            return this._setHeader(x, y); // y is really the value
        }
        var isFilterRow = this.grid.isShowFilterRow();
        var isHeaderRow = this.grid.isShowHeaderRow();
        var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
        if (y >= topTotalsOffset) {
            this.getTopTotals()[y - topTotalsOffset][x] = value;
        } else if (x === -1) {
            return; // can't change the row numbers header
        } else if (isHeaderRow && y === 0) {
            return this._setHeader(x, value);
        } else if (isFilterRow) {
            this.setFilter(x, value, { alert: true });
        } else {
            return this._setHeader(x, value);
        }
        return '';
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @returns {*}
     */
    getColumnProperties: function(colIndex) {
        //access directly because we want it ordered
        var column = this.grid.behavior.getColumn(colIndex);
        if (column) {
            return column.getProperties();
        }
        return undefined;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        var showTree = this.grid.resolveProperty('showTreeColumn') === true;
        var hasAggregates = this.hasAggregates();
        var offset = (hasAggregates && !showTree) ? -1 : 0;
        return this.sources.aggregator.getColumnCount() + offset;
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
        return this.sources.aggregator.getHeaders();
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

    /** @typedef {object} dataSourcePipelineObject
     * @property {function} DataSource - A `hyper-analytics`-style  "data source" constructor.
     * @property {*} [options] - When defined, passed as 2nd argument to constructor.
     * @property {string} [parent] - Defines a branch off the main sequence.
     */

    /**
     * @type {dataSourcePipelineObject[]}
     * @memberOf dataModels.JSON.prototype
     */
    pipeline: [
        { type: 'JSDataSource' },
        { type: 'DataSourceAggregator' },
        { type: 'DataSourceGlobalFilter' },
        { type: 'DataSourceSorterComposite' },
        { type: 'DataNodeGroupSorter', parent: 'DataSourceAggregator' }
    ],

    /**
     * @summary Instantiates the data source pipeline.
     * @desc Each new layer is created using the supplied constructor and a reference to the previous data source in the pipeline. A reference to each new layer is added to `this` dataModel as a property using the layer's `name`.
     *
     * The first layer must have a `@@CLASS_NAME` of `'DataSource'`. Hence, the start of the pipeline is `this.source`. The last layer is assigned the synonym `this.dataSource`.
     *
     * Branches are created when a layer specifies a name in `parent`.
     * @param {object[]} dataSource - Array of uniform objects containing the grid data.
     * @memberOf dataModels.JSON.prototype
     */
    setData: function(dataSource) {
        this.resetSources();

        this.pipeline.forEach(function(sources, layer, index) {
            var DataSource = analytics[layer.type];

            layer.name = layer.name || getDataSourceName(layer.type);

            if (index === 0 && layer.name !== 'source') {
                throw 'Expected pipeline to begin with source.';
            }

            if (layer.parent) {
                this.dataSource = this.dataSource || dataSource; // tip of main trunk on first diversion
                dataSource = sources[getDataSourceName(layer.parent)];
                if (!dataSource) {
                    throw 'Parent data source not in pipeline.';
                }
            }

            dataSource = layer.options === undefined
                ? new DataSource(dataSource)
                : new DataSource(dataSource, layer.options);

            sources[layer.name] = dataSource;
        }.bind(this, this.sources));

        this.source = this.sources.source;
        this.dataSource = this.dataSource || dataSource; // tip of main trunk if never branched

        this.applyAnalytics();
    },

    /**
     * Add a layer to the data source pipeline.
     * @param {dataSourcePipelineObject} newLayer - The new pipeline layer.
     * @param {string} [referenceLayer] - Name of an existing pipeline layer after which the new layer will be added. If not found (such as `null`), inserts at beginning. If `undefined` or omitted, adds to end.
     * @memberOf dataModels.JSON.prototype
     */
    addPipe: function(newLayer, referenceLayer) {
        var layerIndex;
        if (referenceLayer !== undefined) {
            referenceLayer = this.pipeline.find(function(layer, index) {
                var found = layer.type === referenceLayer;
                layerIndex = index;
                return found;
            });
        }
        if (referenceLayer === undefined) {
            layerIndex = this.pipeline.length;
        }
        this.pipeline.splice(layerIndex + 1, 0, newLayer);
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
        return this.hasAggregates() ? this.dataSource.getGrandTotals() : this.topTotals;
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
        return this.hasAggregates() ? this.dataSource.getGrandTotals() : this.bottomTotals;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param groups
     */
    setGroups: function(groups) {
        this.sources.aggregator.setGroupBys(groups);
        this.applyAnalytics();
        this.grid.fireSyntheticGroupsChangedEvent(this.getGroups());
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getGroups: function() {
        var headers = this.getHeaders().slice(0);
        var fields = this.getFields().slice(0);
        var groupBys = this.sources.aggregator.groupBys;
        var groups = [];
        for (var i = 0; i < groupBys.length; i++) {
            var field = headers[groupBys[i]];
            groups.push({
                id: groupBys[i],
                label: field,
                field: fields
            });
        }
        return groups;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getAvailableGroups: function() {
        var headers = this.sources.source.getHeaders().slice(0);
        var groupBys = this.sources.aggregator.groupBys;
        var groups = [];
        for (var i = 0; i < headers.length; i++) {
            if (groupBys.indexOf(i) === -1) {
                var field = headers[i];
                groups.push({
                    id: i,
                    label: field,
                    field: field
                });
            }
        }
        return groups;
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
     * @param aggregations
     */
    setAggregates: function(aggregations) {
        this.sources.aggregator.setAggregates(aggregations);
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasHierarchyColumn: function() {
        var showTree = this.grid.resolveProperty('showTreeColumn') === true;
        return this.hasAggregates() && this.hasGroups() && showTree;
    },

    setRelation: function(options) {
        this.sources.treeview.setRelation(options);
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyAnalytics: function(dontApplyAggregator) {
        selectedDataRowsBackingSelectedGridRows.call(this);

        this.pipeline.forEach(function(sources, layer) {
            var dataSource = sources[layer.name];

            switch (layer.type) {
                case 'DataSourceAggregator':
                    if (dontApplyAggregator) {
                        dataSource = undefined;
                    }
                    break;

                case 'DataSourceSorterComposite':
                    if (sources.aggregator && sources.aggregator.viewMakesSense()) {
                        dataSource = sources.groupsorter;
                    }
                    dataSource.clearSorts();
                    (this.getPrivateState().sorts || []).forEach(function(sort) {
                        dataSource.sortOn(Math.abs(sort) - 1, Math.sign(sort));
                    });
                    break;
            }

            if (dataSource && dataSource.apply) {
                dataSource.apply();
            }
        }.bind(this, this.sources));

        reselectGridRowsBackedBySelectedDataRows.call(this);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param keys
     */
    toggleSort: function(colIndex, keys) {
        this.incrementSortState(colIndex, keys);
        this.applyAnalytics(true);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param {boolean} deferred
     */
    unSortColumn: function(colIndex, deferred) {
        colIndex++; //hack to get around 0 index
        var already = this.getColumnSortState(colIndex);
        if (already > -1) {
            this.removeColumnSortState(colIndex, already);
            if (!deferred) {
                this.applyAnalytics(true);
            }
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    getSortedColumnIndexes: function() {
        var state = this.getPrivateState();
        return state.sorts && state.sorts.slice() || [];
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param {string[]} keys
     */
    incrementSortState: function(colIndex, keys) {
        colIndex++; //hack to get around 0 index
        var state = this.getPrivateState();
        var hasCTRL = keys.indexOf('CTRL') > -1;
        state.sorts = state.sorts || [];
        var already = this.getColumnSortState(colIndex);
        if (already > -1) {
            if (state.sorts[already] > 0) {
                state.sorts[already] = -1 * state.sorts[already]; //descending
            } else {
                this.removeColumnSortState(colIndex, already);
            }
        } else if (hasCTRL || state.sorts.length === 0) {
            state.sorts.unshift(colIndex);
        } else {
            state.sorts.length = 0;
            state.sorts.unshift(colIndex);
        }
        //Minor improvement, but this check can happen earlier and terminate earlier
        if (state.sorts.length > 3) {
            state.sorts.length = 3;
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @returns {number}
     */
    getColumnSortState: function(colIndex) {
        //assumption is that colIndex has been hacked to get around 0
        var already,
            state = this.getPrivateState();

        state.sorts = state.sorts || [];

        //Check data columns
        already = state.sorts.indexOf(colIndex);

        //Check columns with negative indices. Meta columns??
        if (already === -1) {
            already = state.sorts.indexOf(-1 * colIndex);
        }
        return already;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param {number} sortPosition
     */
    removeColumnSortState: function(colIndex, sortPosition) {
        //assumption is that colIndex has been hacked to get around 0
        var state = this.getPrivateState();
        state.sorts = state.sorts || [];
        state.sorts.splice(sortPosition, 1);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @returns {*}
     */
    getSortImageForColumn: function(index) {
        index++;
        var up = true;
        var sorts = this.getPrivateState().sorts;
        if (!sorts) {
            return null;
        }
        var position = sorts.indexOf(index);
        if (position < 0) {
            position = sorts.indexOf(-1 * index);
            up = false;
        }
        if (position < 0) {
            return null;
        }
        var rank = sorts.length - position;
        var arrow = up ? UPWARDS_BLACK_ARROW : DOWNWARDS_BLACK_ARROW;
        return rank + arrow + ' ';
    },

    /**
     * @memberOf dataModels.JSON.prototypedrilldown
     * @param cell
     * @param event
     */
    cellClicked: function(cell, event) {
        if (
            this.isTreeview() && event.dataCell.x === this.sources.treeview.treeColumnIndex ||
            this.hasAggregates() && event.gridCell.x === 0
        ) {
            var y = event.gridCell.y - this.grid.getHeaderRowCount();
            this.toggleRow(y);
        }
    },

    /**
     * @summary Toggle the drill-down control of a the specified row.
     * @desc Ignored if the specified row has no drill-down control.
     * @param y
     * @param {boolean} [expand] - One of:
     * * `true` - expands row (if expandable)
     * * `false` - collapses row (if expandable)
     * * `undefined` - toggles state of row (if expandable)
     * @returns {undefined|boolean} One of:
     * * `undefined` - row was not expandable
     * * `true` - row was expandable _and_ state changed
     * * `false` - row was expandable _but_ state did _not_ change
     * @memberOf dataModels.JSON.prototypedrilldown
     */
    toggleRow: function(y, expand) {
        var changed;
        if (this.isTreeview() || this.hasAggregates()) {
            changed = this.dataSource.click(y, expand);
            if (changed) {
                this.applyAnalytics(true);
                this.changed();
            }
        }
        return changed;
    },

    /**
     * @summary Toggle all revealed drill-down controls.
     * @desc Works its way from the bottom of the table to the top. Ignored for rows without a drill-down control or rows hidden inside of collapsed drill-downs.
     * @param {boolean|number} [depth] - One of:
     * * `undefined` (or omitted) - Expand all revealed expandable rows that are currently collapsed; collapse all revealed expandable rows that are currently expanded. _Not recommended. Results are unpredictable unless you know the current state of the drill-downs._
     * * `true` - Expand all revealed expandable rows that are currently collapsed.
     * * `false` (or `0`) - Collapse all revealed expandable rows that are currently expanded.
     * * number > 0 - Expands revealed expandable rows that are currently collapsed but only to the given depth.
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean} If any rows had a change of state.
     */
    toggleAllRows: function(expand, depth, smartApply) {
        var changed = false;
        if (this.isTreeview() || this.hasAggregates()) {
            var initial, limit = this.dataSource.getRowCount(), increment;
            if (expand) {
                // work down from top
                initial = 0;
                increment = +1;
            } else {
                // work up from bottom
                initial = limit - 1;
                limit = increment = -1;
            }
            for (var y = initial; y !== limit; y += increment) {
                if (this.dataSource.click(y, expand, depth)) {
                    changed = true;
                }
            }
            if (!smartApply || changed && smartApply) {
                this.applyAnalytics(true);
                this.changed();
            }
        }
        return changed;
    },

    /**
     * @summary Expand all rows to the given depth.
     * @desc When called with a depth < Infinity, expands those rows but does not collapse deeper rows. In such a case, consider calling `expandAndCollapseRows` with that depth instead.
     * @param {number} [depth=Infinity]
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean} If any rows had a change of state.
     */
    expandRowsToDepth: function(depth, smartApply) {
        var changed = false;
        while (this.toggleAllRows(true, depth || Infinity)) {
            changed = true;
        }
        if (!smartApply || changed && smartApply) {
            this.applyAnalytics(true);
            this.changed();
        }
        return changed;
    },

    /**
     * Convenience function to expand all rows.
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if a change was detected.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {*}
     */
    expandAllRows: function(smartApply) {
        return this.expandRowsToDepth(Infinity, smartApply);
    },

    /**
     * @summary Collapse rows deeper than (or equal to) the given depth.
     * @desc Only affects "revealed" rows (those rows not hidden inside of currently collapsed rows); to affect all rows, call `expandAndCollapseRows` instead.
     * @param {number} [depth=0]
     * @param {boolean} [smartApply=false] - One of:
     * * `true` - Apply and repaint if and only if rows were collapsed.
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean} If any rows had a change of state.
     */
    collapseRowsFromDepth: function(depth, smartApply) {
        return this.toggleAllRows(false, -depth || 0, smartApply);
    },

    /**
     * @summary Expand all rows to the given depth and collapse all other rows.
     * @desc Call without a `depth` to collapse all rows, including those that may be expanding even though not currently revealed (because hidden inside of currently collapsed rows).
     * @param {number} [depth=0]
     * @param {boolean} [apply=false] - One of:
     * * `true` - Always apply and repaint. (Note that this logic differs from those methods that take `smartApply`.)
     * * `false` - Always apply and repaint.
     * * `undefined` - Never apply and repaint.
     * @returns {boolean} Always returns `true`.
     */
    expandAndCollapseRows: function(depth, apply) {
        this.expandAllRows();
        this.collapseRowsFromDepth(depth, apply);
        return true;
    },

    revealRowByID: function(ID, smartApply) {
        var changed;

        if (this.isTreeview()) {
            changed = this.sources.treeview.revealRow(ID);
            if (!smartApply || changed && smartApply) {
                this.applyAnalytics(true);
                this.changed();
            }
        }

        return changed;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} y
     * @returns {object}
     */
    getRow: function(y) {
        var headerRowCount = this.grid.getHeaderRowCount();
        if (y < headerRowCount && !this.hasAggregates()) {
            var topTotals = this.getTopTotals();
            return topTotals[y - (headerRowCount - topTotals.length)];
        }
        return this.dataSource.getRow(y - headerRowCount);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} y
     * @returns {object}
     */
    buildRow: function(y) {
        var colCount = this.getColumnCount();
        var fields = [].concat(this.getFields());
        var result = {};
        if (this.hasAggregates()) {
            result.tree = this.getValue(-2, y);
            fields.shift();
        }
        for (var i = 0; i < colCount; i++) {
            result[fields[i]] = this.getValue(i, y);
        }
        return result;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} y
     * @returns {object}
     */
    getComputedRow: function(y) {
        var rcf = this.getRowContextFunction([y]);
        var fields = this.getFields();
        var row = {};
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            row[field] = rcf(field)[0];
        }
        return row;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string} fieldName
     * @param {number} y
     * @returns {*}
     */
    getValueByField: function(fieldName, y) {
        var index = this.getFields().indexOf(fieldName);
        if (this.hasAggregates()) {
            y += 1;
        }
        return this.dataSource.getValue(index, y);
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

    /**
     * @memberOf dataModels.JSON.prototype
     */
    reset: function() {
        this.setData([]);
    },

    getUnfilteredValue: function(x, y) {
        return this.sources.source.getValue(x, y);
    },

    getUnfilteredRowCount: function() {
        return this.sources.source.getRowCount();
    }
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
    return name.replace(/^Data(Source|Node)/, '').toLowerCase() || 'source';
}


module.exports = JSON;
