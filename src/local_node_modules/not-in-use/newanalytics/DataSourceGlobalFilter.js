'use strict';

var DataSourceIndexed = require('./DataSourceIndexed');

var DataSourceGlobalFilter = DataSourceIndexed.extend('DataSourceGlobalFilter', {

    set: function(filter) {
        this.filter = filter;
    },

    clear: function() {
        delete this.filter;
        this.clearIndex();
    },

    apply: function() {
        if (!this.filter) {
            this.clearIndex();
        } else {
            this.buildIndex(applyFilter);
        }
    },

    getRowCount: function() {
        return this.filter ? this.index.length : this.dataSource.getRowCount();
    }
});

function applyFilter(r, rowObject) { // called in context from .buildIndex()
    var self = this;
    return this.getFields().find(function(columnIndex) {
        var cellValue = self.dataSource.getValue(columnIndex, r);
        return self.filter(cellValue, rowObject, r);
    });
}

module.exports = DataSourceGlobalFilter;