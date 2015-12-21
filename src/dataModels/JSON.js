'use strict';

var analytics = require('hyper-analytics');
//var analytics = require('../local_node_modules/hyper-analytics');
//var analytics = require('../local_node_modules/finanalytics');
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
    }
};

/**
 * @name dataModels.JSON
 * @constructor
 */
var JSON = DataModel.extend('dataModels.JSON', {

    //null object pattern for the source object
    source: nullDataSource,

    preglobalfilter: nullDataSource,
    prefilter: nullDataSource,

    presorter: nullDataSource,
    analytics: nullDataSource,
    postfilter: nullDataSource,
    postsorter: nullDataSource,

    topTotals: [],
    bottomTotals: [],

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasAggregates: function() {
        return this.analytics.hasAggregates();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasGroups: function() {
        return this.analytics.hasGroups();
    },

    getDataSource: function() {
        return this.analytics; //this.hasAggregates() ? this.analytics : this.presorter;
    },

    getFilterSource: function() {
        return this.prefilter; //this.hasAggregates() ? this.postfilter : this.prefilter;
    },

    getSortingSource: function() {
        return this.presorter; //this.hasAggregates() ? this.postsorter : this.presorter;
    },

    getData: function() {
        return this.source.data;
    },

    getFilteredData: function() {
        var ds = this.getDataSource();
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
        var grid = this.getGrid();
        var headerRowCount = grid.getHeaderRowCount();
        var value;
        if (hasHierarchyColumn && x === -2) {
            x = 0;
        }
        if (y < headerRowCount) {
            value = this.getHeaderRowValue(x, y);
            return value;
        }
        if (hasHierarchyColumn) {
            y += 1;
        }
        value = this.getDataSource().getValue(x, y - headerRowCount);
        return value;
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
            var grid = this.getGrid(),
                isFilterRow = grid.isShowFilterRow(),
                isHeaderRow = grid.isShowHeaderRow(),
                topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
            if (y >= topTotalsOffset) { // top totals rows
                value = this.getTopTotals()[y - topTotalsOffset][x];
            } else if (isHeaderRow && y === 0) {
                value = this.getHeaders()[x];
                var sortString = this.getSortImageForColumn(x);
                if (sortString) { value = sortString + value; }
            } else { // must be filter row
                value = this.getFilter(x);
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
        var grid = this.getGrid();
        var headerRowCount = grid.getHeaderRowCount();
        if (hasHierarchyColumn) {
            if (x === -2) {
                return;
            } else {
                x += 1;
            }
        }
        if (y < headerRowCount) {
            this.setHeaderRowValue(x, y, value);
        } else if (hasHierarchyColumn) {
            y += 1;
        } else {
            this.getDataSource().setValue(x, y - headerRowCount, value);
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
        var grid = this.getGrid();
        var isFilterRow = grid.isShowFilterRow();
        var isHeaderRow = grid.isShowHeaderRow();
        var isBoth = isFilterRow && isHeaderRow;
        var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
        if (y >= topTotalsOffset) {
            this.getTopTotals()[y - topTotalsOffset][x] = value;
        } else if (x === -1) {
            return; // can't change the row numbers
        } else if (isBoth) {
            if (y === 0) {
                return this._setHeader(x, value);
            } else {
                this.setFilter(x, value);
            }
        } else if (isFilterRow) {
            this.setFilter(x, value);
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
        var column = this.getBehavior().allColumns[colIndex];
        if (column) {
            return column.getProperties();
        }
        return undefined;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @returns {*}
     */
    getFilter: function(colIndex) {
        var columnProperties = this.getColumnProperties(colIndex);
        if (!columnProperties) {
            return '';
        }
        return columnProperties.filter || '';
    },

    getComplexFilter: function(colIndex) {
        var columnProperties = this.getColumnProperties(colIndex);
        if (!columnProperties) {
            return '';
        }
        var filter = columnProperties.complexFilter;
        if (filter) {
            var filterObject = this.getGrid().resolveFilter(filter.type);
            filterObject.setState(filter.state);
            var newFilter = filterObject.create();
            return function(data) {
                var transformed = valueOrFunctionExecute(data);
                return newFilter(transformed);
            };
        } else {
            return;
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param value
     */
    setFilter: function(colIndex, value) {
        var columnProperties = this.getColumnProperties(colIndex);
        columnProperties.filter = value;
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        return this.analytics.getColumnCount();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {number}
     */
    getRowCount: function() {
        var grid = this.getGrid();
        var count = this.getDataSource().getRowCount();
        count += grid.getHeaderRowCount();
        return count;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getHeaders: function() {
        return this.analytics.getHeaders();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} headers
     */
    setHeaders: function(headers) {
        this.getDataSource().setHeaders(headers);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {string[]} fields
     */
    setFields: function(fields) {
        this.getDataSource().setFields(fields);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {string[]}
     */
    getFields: function() {
        return this.getDataSource().getFields();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {object[]} dataRows
     */
    setData: function(dataRows) {
        this.source = new analytics.JSDataSource(dataRows);
        this.preglobalfilter = new analytics.DataSourceGlobalFilter(this.source);
        this.prefilter = new analytics.DataSourceFilter(this.preglobalfilter);
        this.presorter = new analytics.DataSourceSorterComposite(this.prefilter);
        this.analytics = new analytics.DataSourceAggregator(this.presorter);

        this.applyAnalytics();

        //this.postfilter = new analytics.DataSourceFilter(this.analytics);
        //this.postsorter = new analytics.DataSourceSorterComposite(this.postfilter);
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
        if (!this.hasAggregates()) {
            return this.topTotals;
        }
        return this.getDataSource().getGrandTotals();
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
        if (!this.hasAggregates()) {
            return this.bottomTotals;
        }
        return this.getDataSource().getGrandTotals();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param groups
     */
    setGroups: function(groups) {
        this.analytics.setGroupBys(groups);
        this.applyAnalytics();
        this.getGrid().fireSyntheticGroupsChangedEvent(this.getGroups());
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getGroups: function() {
        var headers = this.getHeaders().slice(0);
        var fields = this.getFields().slice(0);
        var groupBys = this.analytics.groupBys;
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
        var headers = this.source.getHeaders().slice(0);
        var groupBys = this.analytics.groupBys;
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
    getVisibleColumns: function() {
        var items = this.getBehavior().columns;
        items = items.filter(function(each) {
            return each.label !== 'Tree';
        });
        return items;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {object[]}
     */
    getHiddenColumns: function() {
        var visible = this.getBehavior().columns;
        var all = this.getBehavior().allColumns;
        var hidden = [];
        for (var i = 0; i < all.length; i++) {
            if (visible.indexOf(all[i]) === -1) {
                hidden.push(all[i]);
            }
        }
        hidden.sort(function(a, b) {
            return a.label < b.label;
        });
        return hidden;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param aggregations
     */
    setAggregates: function(aggregations) {
        this.quietlySetAggregates(aggregations);
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param aggregations
     */
    quietlySetAggregates: function(aggregations) {
        this.analytics.setAggregates(aggregations);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @returns {boolean}
     */
    hasHierarchyColumn: function() {
        return this.hasAggregates() && this.hasGroups();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyAnalytics: function() {
        this.applyFilters();
        this.applySorts();
        this.applyGroupBysAndAggregations();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyGroupBysAndAggregations: function() {
        if (this.analytics.aggregates.length === 0) {
            this.quietlySetAggregates({});
        }
        this.analytics.apply();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applyFilters: function() {
        var grid = this.getGrid();
        var visibleColumns = this.getVisibleColumns();
        this.preglobalfilter.apply(visibleColumns);
        var visColCount = visibleColumns.length;
        var filterSource = this.getFilterSource();
        var groupOffset = this.hasAggregates() ? 1 : 0;
        filterSource.clearAll();
        var details = [];
        for (var v = 0; v < visColCount; v++) {
            var column = visibleColumns[v];
            var i = column.index;
            var formatterType = column.getProperties().format;
            var formatter = grid.getFormatter(formatterType);
            var filterText = this.getFilter(i);
            var complexFilter = this.getComplexFilter(i);
            if (complexFilter) {
                filterSource.add(i - groupOffset, this.createFormattedFilter(formatter, complexFilter));
                details.push({
                    column: column.label,
                    format: 'complex',
                });
            } else if (filterText.length > 0) {
                filterSource.add(i - groupOffset, this.createFormattedFilter(formatter, textMatchFilter(filterText)));
                details.push({
                    column: column.label,
                    format: formatterType,
                });
            }

        }
        filterSource.applyAll();
        grid.fireSyntheticFilterAppliedEvent({
            details: details
        });
    },

    createFormattedFilter: function(formatter, filter) {
        return function(value) {
            var formattedValue = formatter(value);
            return filter(formattedValue);
        };
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param keys
     */
    toggleSort: function(colIndex, keys) {
        this.incrementSortState(colIndex, keys);
        this.applyAnalytics();
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
        var already = state.sorts.indexOf(colIndex);
        if (already === -1) {
            already = state.sorts.indexOf(-1 * colIndex);
        }
        if (already > -1) {
            if (state.sorts[already] > 0) {
                state.sorts[already] = -1 * state.sorts[already];
            } else {
                state.sorts.splice(already, 1);
            }
        } else if (hasCTRL || state.sorts.length === 0) {
            state.sorts.unshift(colIndex);
        } else {
            state.sorts.length = 0;
            state.sorts.unshift(colIndex);
        }
        if (state.sorts.length > 3) {
            state.sorts.length = 3;
        }
    },

    /**
     * @memberOf dataModels.JSON.prototype
     */
    applySorts: function() {
        var sortingSource = this.getSortingSource();
        var sorts = this.getPrivateState().sorts;
        var groupOffset = this.hasAggregates() ? 1 : 0;
        if (!sorts || sorts.length === 0) {
            sortingSource.clearSorts();
        } else {
            for (var i = 0; i < sorts.length; i++) {
                var colIndex = Math.abs(sorts[i]) - 1;
                var type = sorts[i] < 0 ? -1 : 1;
                sortingSource.sortOn(colIndex - groupOffset, type);
            }
        }
        sortingSource.applySorts();
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
     * @memberOf dataModels.JSON.prototype
     * @param cell
     * @param event
     */
    cellClicked: function(cell, event) {
        if (!this.hasAggregates()) {
            return;
        }
        if (event.gridCell.x !== 0) {
            return; // this wasn't a click on the hierarchy column
        }
        var grid = this.getGrid();
        var headerRowCount = grid.getHeaderRowCount();
        var y = event.gridCell.y - headerRowCount + 1;
        this.analytics.click(y);
        this.changed();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} y
     * @returns {object}
     */
    getRow: function(y) {
        var grid = this.getGrid();
        var headerRowCount = grid.getHeaderRowCount();
        if (y < headerRowCount && !this.hasAggregates()) {
            var topTotals = this.getTopTotals();
            return topTotals[y - (headerRowCount - topTotals.length)];
        }
        return this.getDataSource().getRow(y - headerRowCount);
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
        return this.getDataSource().getValue(index, y);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {sring} string
     */
    setGlobalFilter: function(string) {
        if (!string || string.length === 0) {
            this.preglobalfilter.clear();
        } else {
            this.preglobalfilter.set(textMatchFilter(string));
        }
        this.applyAnalytics();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {object} config
     * @param {number} x
     * @param {number} y
     * @param {number} untranslatedX
     * @param {number} untranslatedY
     * @returns {object}
     */
    getCellRenderer: function(config, x, y, untranslatedX, untranslatedY) {
        var renderer;
        var provider = this.getGrid().getCellProvider();

        config.x = x;
        config.y = y;
        config.untranslatedX = untranslatedX;
        config.untranslatedY = untranslatedY;

        renderer = provider.getCell(config);
        renderer.config = config;

        return renderer;
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
        return this.source.getValue(x, y);
    },

    getUnfilteredRowCount: function() {
        return this.source.getRowCount();
    },

});

function valueOrFunctionExecute(valueOrFunction) {
    return typeof valueOrFunction === 'function' ? valueOrFunction() : valueOrFunction;
}

function textMatchFilter(string) {
    string = string.toLowerCase();
    return function(each) {
        each = valueOrFunctionExecute(each);
        return (each + '').toLowerCase().search(string) > -1;
    };
}

module.exports = JSON;
