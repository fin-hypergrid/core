'use strict';

module.exports = (function() {

    function DataSourceDecorator(dataSource) {
        this.dataSource = dataSource;
        this.indexes = [];
    }

    DataSourceDecorator.prototype.isNullObject = false;

    DataSourceDecorator.prototype.transposeY = function(y) {
        if (this.indexes.length !== 0) {
            return this.indexes[y];
        }
        return y;
    };

    DataSourceDecorator.prototype.getValue = function(x, y) {
        var value = this.dataSource.getValue(x, this.transposeY(y));
        return value;
    };

    DataSourceDecorator.prototype.getRow = function(y) {

        return this.dataSource.getRow(this.transposeY(y));
    };

    DataSourceDecorator.prototype.setValue = function(x, y, value) {

        this.dataSource.setValue(x, this.transposeY(y), value);
    };

    DataSourceDecorator.prototype.getColumnCount = function() {

        return this.dataSource.getColumnCount();
    };

    DataSourceDecorator.prototype.getFields = function() {

        return this.dataSource.getFields();
    };

    DataSourceDecorator.prototype.setFields = function(fields) {

        return this.dataSource.setFields(fields);
    };

    DataSourceDecorator.prototype.getRowCount = function() {
        if (this.indexes.length !== 0) {
            return this.indexes.length;
        }
        return this.dataSource.getRowCount();
    };

    DataSourceDecorator.prototype.setHeaders = function(headers) {
        return this.dataSource.setHeaders(headers);
    };

    DataSourceDecorator.prototype.getHeaders = function() {

        return this.dataSource.getHeaders();
    };

    DataSourceDecorator.prototype.getGrandTotals = function() {
        //nothing here
        return;
    };

    DataSourceDecorator.prototype.initializeIndexVector = function() {
        var rowCount = this.dataSource.getRowCount();
        var indexVector = new Array(rowCount);
        for (var r = 0; r < rowCount; r++) {
            indexVector[r] = r;
        }
        this.indexes = indexVector;
    };

    DataSourceDecorator.prototype.setData = function(arrayOfUniformObjects) {
        this.dataSource.setData(arrayOfUniformObjects);
    };

    return DataSourceDecorator;

})();