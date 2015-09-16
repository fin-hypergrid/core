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
        getValue: function(x, y) {
            if (y === 0) {
                return this.getHeaders()[x];
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
            var count = this.getDataSource().getRowCount();
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
            this.presorter = new fin.analytics.DataSourceFilter(this.prefilter); /* jshint ignore:line */
            this.analytics = new fin.analytics.DataSourceAggregator(this.presorter); /* jshint ignore:line */
            this.postfilter = new fin.analytics.DataSourceFilter(this.analytics); /* jshint ignore:line */
            this.postsorter = new fin.analytics.DataSourceFilter(this.postfilter); /* jshint ignore:line */
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
    });
})();
