'use strict';

var DataSourceIndexed = require('./DataSourceIndexed');
var DataSourceSorter = require('./DataSourceSorter');

var DataSourceSorterComposite = DataSourceIndexed.extend({
    initialize: function() {
        this.sorts = [];
        this.last = this.dataSource;
    },

    // Caveats regarding this.sorts:
    // 1. Columns should be uniquely represented (i.e., no repeats with same columnIndex)
    // 2. Columns should be added low- to high-order (i.e., most grouped columns come last)
    sortOn: function(columnIndex, direction) {
        this.sorts.push([columnIndex, direction]);
    },

    applySorts: function() {
        var each = this.dataSource;

        this.sorts.forEach(function(sort) {
            each = new DataSourceSorter(each);
            each.sortOn.apply(each, sort);
        });

        this.last = each;
    },

    clearSorts: function() {
        this.sorts.length = 0;
        this.last = this.dataSource;
    },

    getValue: function(x, y) {
        return this.last.getValue(x, y);
    },

    setValue: function(x, y, value) {
        this.last.setValue(x, y, value);
    }
});

module.exports = DataSourceSorterComposite;