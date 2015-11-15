'use strict';

var DataSourceDecorator = require('./DataSourceDecorator');

module.exports = (function() {

    function DataSourceGlobalFilter(dataSource) {
        DataSourceDecorator.call(this, dataSource, false);
        this.filter = null;
    }

    DataSourceGlobalFilter.prototype = Object.create(DataSourceDecorator.prototype);

    DataSourceGlobalFilter.prototype.setFilter = function(filter) {
        this.filter = filter;
    };

    DataSourceGlobalFilter.prototype.clearFilters = function() { /* filter */
        this.filter = null;
        this.indexes.length = 0;
    };

    DataSourceGlobalFilter.prototype.getRowCount = function() {
        if (this.indexes.length !== 0) {
            return this.indexes.length;
        }
        //our filter matched nothing....
        if (this.filter) {
            return 0;
        }
        return this.dataSource.getRowCount();
    };

    DataSourceGlobalFilter.prototype.applyFilters = function() {
        if (!this.filter) {
            this.indexes.length = 0;
            return;
        }
        var indexes = this.indexes;
        indexes.length = 0;
        var count = this.dataSource.getRowCount();
        for (var r = 0; r < count; r++) {
            if (this.applyFilterTo(r)) {
                indexes.push(r);
            }
        }
    };

    DataSourceGlobalFilter.prototype.applyFilterTo = function(r) {
        var isFiltered = false;
        var filter = this.filter;
        var colCount = this.getColumnCount();
        var rowObject = this.dataSource.getRow(r);
        for (var i = 0; i < colCount; i++) {
            isFiltered = isFiltered || filter(this.dataSource.getValue(i, r), rowObject, r);
            if (isFiltered) {
                return true;
            }
        }
        return false;
    };

    return DataSourceGlobalFilter;

})();