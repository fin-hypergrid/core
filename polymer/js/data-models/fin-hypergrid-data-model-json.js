/* global com */
'use strict';

(function() {

    var textMatchFilter = function(string) {
        return function(each) {
            return (each + '').toLowerCase().startsWith(string.toLowerCase());
        };
    }

    var headerify = function(string) {
        var pieces = string.replace(/[_-]/g, ' ').replace(/[A-Z]/g, ' $&').split(' ').map(function(s) {
            return s.charAt(0).toUpperCase() + s.slice(1);
        });
        return pieces.join(' ');
    };

    var nullDataSource = {
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
        getGrandTotals: function() {
            return [];
        }
    };

    Polymer('fin-hypergrid-data-model-json', { /* jshint ignore:line  */

        //null object pattern for the source object
        source: nullDataSource,
        prefilter: nullDataSource,
        presorter: nullDataSource,
        analytics: nullDataSource,
        postfilter: nullDataSource,
        postsorter: nullDataSource,
        topTotals: [],

        isGroupingOn: function() {
            return false;
        },
        getDataSource: function() {
            var source = this.isGroupingOn() ? this.analytics : this.presorter;
            return source;
        },
        getFilterSource: function() {
            var source = this.isGroupingOn() ? this.postfilter : this.prefilter;
            return source;
        },
        getSortingSource: function() {
            var source = this.isGroupingOn() ? this.postsorter : this.presorter;
            return source;
        },
        getValue: function(x, y) {
            var grid = this.getGrid();
            var headerRowCount = grid.getHeaderRowCount();
            if (y < headerRowCount) {
                return this.getHeaderRowValue(x, y);
            }
            var value = this.getDataSource().getValue(x, y - headerRowCount);
            return value;
        },
        getHeaderRowValue: function(x, y) {
            if (x === -2) {
                x = 0; //hierarchy column
            }
            if (y === undefined) {
                return this.getHeaders()[Math.max(x, 0)];
            }
            var grid = this.getGrid();
            var behavior = grid.getBehavior();
            var isFilterRow = grid.isShowFilterRow();
            var isHeaderRow = grid.isShowHeaderRow();
            var isBoth = isFilterRow && isHeaderRow;
            var topTotalsOffset = (isFilterRow ? 1 : 0) + (isHeaderRow ? 1 : 0);
            if (y >= topTotalsOffset) {
                return this.getTopTotals()[y - topTotalsOffset][x];
            }
            var filter = this.getFilter(x);
            var image = filter.length === 0 ? 'filter-off' : 'filter-on';
            if (isBoth) {
                if (y === 0) {
                    image = this.getSortImageForColumn(x);
                    return [null, this.getHeaders()[x], image];
                } else {
                    return [null, filter, behavior.getImage(image)];
                }
            } else if (isFilterRow) {
                return [null, filter, behavior.getImage(image)];
            } else {
                image = this.getSortImageForColumn(x);
                return [null, this.getHeaders()[x], image];
            }
            return '';
        },
        setValue: function(x, y, value) {
            var grid = this.getGrid();
            var headerRowCount = grid.getHeaderRowCount();
            if (y < headerRowCount) {
                return this.setHeaderRowValue(x, y, value);
            }
            this.getDataSource().setValue(x, y - headerRowCount, value);
        },
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
        getFilter: function(x) {
            var columnProperties = this.getColumnProperties(x);
            var filter = columnProperties.filter || '';
            return filter;
        },
        setFilter: function(x, value) {
            var columnProperties = this.getColumnProperties(x);
            columnProperties.filter = value;
            this.applyAnalytics();
        },
        getColumnCount: function() {
            var count = this.getDataSource().getColumnCount();
            return count;
        },
        getRowCount: function() {
            var grid = this.getGrid();
            var count = this.getSortingSource().getRowCount();
            count += grid.getHeaderRowCount();
            return count;
        },
        getHeaders: function() {
            if (!this.headers || this.headers.length === 0) {
                this.headers = this.getDefaultHeaders().map(function(each) {
                    return headerify(each);
                });
            }
            return this.headers;
        },
        getDefaultHeaders: function() {
            var headers = this.getDataSource().getHeaders();
            return headers;
        },
        setHeaders: function(headers) {
            this.headers = headers;
        },
        setFields: function(fields) {
            this.fields = fields;
        },
        getFields: function() {
            var fields = this.getDataSource().getFields();
            return fields;
        },
        setData: function(arrayOfUniformObjects) {
            this.source = new fin.analytics.JSDataSource(arrayOfUniformObjects); /* jshint ignore:line */
            this.prefilter = new fin.analytics.DataSourceFilter(this.source); /* jshint ignore:line */
            this.presorter = new fin.analytics.DataSourceSorterComposite(this.prefilter); /* jshint ignore:line */
            this.analytics = new fin.analytics.DataSourceAggregator(this.presorter); /* jshint ignore:line */
            this.postfilter = new fin.analytics.DataSourceFilter(this.analytics); /* jshint ignore:line */
            this.postsorter = new fin.analytics.DataSourceSorterComposite(this.postfilter); /* jshint ignore:line */
            this.initColumnIndexes(this.getState());
        },
        getTopTotals: function() {
            if (!this.isGroupingOn()) {
                return this.topTotals;
            }
            return [this.getDataSource().getGrandTotals()];
        },
        setTopTotals: function(nestedArray) {
            return this.topTotals = nestedArray;
        },
        setGroups: function() {

        },
        cellClicked: function(x, y) {

        },
        hasHierarchyColumn: function() {
            return this.isGroupingOn();
        },
        applyAnalytics: function() {
            this.applyFilters();
            this.applySorts();
            this.changed();
        },
        applyFilters: function() {
            var colCount = this.getColumnCount();
            var filterSource = this.getFilterSource();
            filterSource.clearFilters();
            for (var i = 0; i < colCount; i++) {
                var filterText = this.getFilter(i);
                if (filterText.length > 0) {
                    filterSource.addFilter(i, textMatchFilter(filterText));
                }
            }
            filterSource.applyFilters();
        },
        toggleSort: function(index) {
            this.incrementSortState(index);
            this.applyAnalytics();
        },
        incrementSortState: function(colIndex) {
            colIndex++; //hack to get around 0 index
            var state = this.getState();
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
            } else {
                state.sorts.unshift(colIndex);
            }
            if (state.sorts.length > 3) {
                state.sorts.length = 3;
            }
        },
        applySorts: function() {
            var sortingSource = this.getDataSource();
            var sorts = this.getState().sorts;
            if (!sorts || sorts.length === 0) {
                sortingSource.clearSorts();
            } else {
                for (var i = 0; i < sorts.length; i++) {
                    var colIndex = Math.abs(sorts[i]) - 1;
                    var type = sorts[i] < 0 ? -1 : 1;
                    sortingSource.sortOn(colIndex, type);
                }
            }
            sortingSource.applySorts();
        },
        getSortImageForColumn: function(index) {
            index++;
            var up = true;
            var sorts = this.getState().sorts;
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
            position++;
            var name = (1 + sorts.length - position) + (up ? '-up' : '-down');
            return this.getBehavior().getImage(name);
        },
    });
})();
