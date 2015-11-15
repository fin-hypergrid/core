'use strict';

var headerify = require('./util/headerify');

function DataSource(data, fields) {
    this.fields = fields || computeFieldNames(data[0]);
    this.data = data;
}

DataSource.prototype = {
    constructor: DataSource.prototype.constructor, // preserve constructor

    isNullObject: false,

    getRow: function(y) {
        return this.data[y];
    },

    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[this.fields[x]];
    },

    setValue: function(x, y, value) {
        this.getRow(y)[this.fields[x]] = value;
    },

    getRowCount: function() {
        return this.data.length;
    },

    getColumnCount: function() {
        return this.getFields().length;
    },

    getFields: function() {
        return this.fields;
    },

    getHeaders: function() {
        return (
            this.headers = this.headers ||
            this.getDefaultHeaders().map(function(each) {
                return headerify(each);
            })
        );
    },

    getDefaultHeaders: function() {
        return this.getFields();
    },

    setFields: function(fields) {
        this.fields = fields;
    },

    setHeaders: function(headers) {
        if (!(headers instanceof Array)) {
            error('setHeaders', 'param #1 `headers` not array');
        }
        this.headers = headers;
    },

    getGrandTotals: function() {
        //nothing here
        return;
    },

    setData: function(arrayOfUniformObjects) {
        this.data = arrayOfUniformObjects;
    }
};

function error(methodName, message) {
    throw new Error('DataSource.' + methodName + ': ' + message);
}

function computeFieldNames(object) {
    if (!object) {
        return [];
    }
    var fields = [].concat(Object.getOwnPropertyNames(object).filter(function(e) {
        return e.substr(0, 2) !== '__';
    }));
    return fields;
}

module.exports = DataSource;