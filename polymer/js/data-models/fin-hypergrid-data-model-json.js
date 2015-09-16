/* global com */
'use strict';

(function() {

    var textMatchFilter = function(string) {
        return function(each) {
            return each.startsWith(string);
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
            if (y === 0) {
                var image = this.getSortImageForColumn(x);
                return [null, this.getHeaders()[x], image];
            } else if (y === 1) { //filter row
                var filter = this.getFilter(x);
                var image = filter.length === 0 ? 'filter-off' : 'filter-on';
                return [null, filter, this.getBehavior().getImage(image)];
            }
            var value = this.getDataSource().getValue(x, y - 2);
            return value;
        },
        setValue: function(x, y, value) {
            if (y === 1) { //filter row
                this.setFilter(x, value);
            } else {
                this.getDataSource().setValue(x, y - 2, value);
            }
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
            var count = this.getSortingSource().getRowCount();
            if (!this.isGroupingOn()) {
                count += 2;
            }
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
            var totals = this.getDataSource().getGrandTotals();
            if (!totals) {
                return [];
            }
            return [totals];
        },
        setTopTotals: function(nestedArray) {

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
