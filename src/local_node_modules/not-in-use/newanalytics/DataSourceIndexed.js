'use strict';

var Base = require('extend-me').Base;

var DataSourceIndexed = Base.extend('DataSourceIndexed', {

    isNullObject: false,

    initialize: function(dataSource) {
        this.dataSource = dataSource;
        this.index = [];
    },

    transposeY: function(y) {
        return this.index.length ? this.index[y] : y;
    },

    getRow: function(y) {
        return this.dataSource.getRow(this.transposeY(y));
    },

    getValue: function(x, y) {
        return this.dataSource.getValue(x, this.transposeY(y));
    },

    setValue: function(x, y, value) {
        this.dataSource.setValue(x, this.transposeY(y), value);
    },

    getRowCount: function() {
        return this.index.length || this.dataSource.getRowCount();
    },

    getColumnCount: function() {
        return this.dataSource.getColumnCount();
    },

    getFields: function() {
        return this.dataSource.getFields();
    },

    setFields: function(fields) {
        return this.dataSource.setFields(fields);
    },

    getDefaultHeaders: function() {
        return this.dataSource.getFields();
    },

    setHeaders: function(headers) {
        return this.dataSource.setHeaders(headers);
    },

    getHeaders: function() {
        return this.dataSource.getHeaders();
    },

    getGrandTotals: function() {
        return this.dataSource.getGrandTotals();
    },

    setData: function(arrayOfUniformObjects) {
        return this.dataSource.setData(arrayOfUniformObjects);
    },

    clearIndex: function() {
        this.index.length = 0;
    },

    buildIndex: function(predicate) {
        var rowCount = this.dataSource.getRowCount(),
            index = this.index;

        index.length = 0;

        for (var r = 0; r < rowCount; r++) {
            if (!predicate || predicate.call(this, r, this.dataSource.getRow(r))) {
                index.push(r);
            }
        }

        return index;
    }

});

module.exports = DataSourceIndexed;
