'use strict';

var Null = require('./DataSourceBase');

/**
 * @constructor
 */
var JSON = Null.extend('JSON',  {

    initialize: function(data, fields, calculators) {
        this.setData(data, fields, calculators);
    },

    isNullObject: false,

    getDataIndex: function(y) {
        return y;
    },

    /**
     * @memberOf DataSource.prototype
     * @param y
     * @returns {object[]}
     */
    getRow: function(y) {
        return this.data[y];
    },

    findRow: function(columnName, value) {
        var result;
        if (value != null) {
            result = this.data.find(function(row) { return row[columnName] === value; });
        }
        return result;
    },

    /**
     * @memberOf DataSource.prototype
     * @param x
     * @param y
     * @returns {*}
     */
    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[this.fields[x]];
    },

    /**
     * @memberOf DataSource.prototype
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        this.getRow(y)[this.fields[x]] = value;
    },

    /**
     * @memberOf DataSource.prototype
     * @returns {number}
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @memberOf DataSource.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        return this.getFields().length;
    },

    /**
     * @memberOf DataSource.prototype
     * @returns {number[]}
     */
    getFields: function() {
        return this.fields;
    },

    /**
     * @memberOf DataSource.prototype
     * @returns {string[]}
     */
    getHeaders: function() {
        return (
            this.headers = /*this.headers || (temporary until I get bootstrapping running unopionated)*/ this.getDefaultHeaders().map(function(each) {
                    return capitalize(each);
                })
        );
    },

    getCalculators: function() {
        return this.calculators;
    },

    /**
     * @memberOf DataSource.prototype
     * @returns {string[]}
     */
    getDefaultHeaders: function() {
        return this.getFields();
    },

    /**
     * @memberOf DataSource.prototype
     * @param {string[]} fields
     */
    setFields: function(fields) {
        this.fields = fields;
    },

    /**
     * @memberOf DataSource.prototype
     * @param {string[]} headers
     */
    setHeaders: function(headers) {
        if (!(headers instanceof Array)) {
            error('setHeaders', 'param #1 `headers` not array');
        }
        this.headers = headers;
    },

    /**
     * @memberOf DataSource.prototype
     */
    getGrandTotals: function() {
        //nothing here
    },

    /**
     * @memberOf DataSource.prototype
     * @param data
     */
    setData: function(data, fields, calculators) {

        if (!data) {
            data = [];
        }
        /**
         * @type {string[]}
         */
        this.fields = fields || computeFieldNames(data[0]);

        this.calculators = calculators || Array(this.fields.length);

        /**
         * @type {object[]}
         */
        this.data = data;
    }
});


function error(methodName, message) {
    throw new Error('DataSource.' + methodName + ': ' + message);
}

/**
 * @private
 * @param {object} object
 * @returns {string[]}
 */
function computeFieldNames(object) {
    if (!object) {
        return [];
    }
    return Object.getOwnPropertyNames(object || []).filter(function(e) {
        return e.substr(0, 2) !== '__';
    });
}

function capitalize(string) {
    return (/[a-z]/.test(string) ? string : string.toLowerCase())
        .replace(/[\s\-_]*([^\s\-_])([^\s\-_]+)/g, replacer)
        .replace(/[A-Z]/g, ' $&')
        .trim();
}

function replacer(a, b, c) {
    return b.toUpperCase() + c;
}

module.exports = JSON;
