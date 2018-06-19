'use strict';

var DataSourceBase = require('datasaur-base');

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
var HeaderSubgrid = DataSourceBase.extend('HeaderSubgrid', {
    type: 'header',

    format: 'header', // override column format

    initialize: function(nextDataSource, options) {
        this.properties = options.grid.properties;
        this.behavior = options.grid.behavior;
    },

    getRowCount: function() {
        return this.properties.showHeaderRow ? 1 : 0;
    },

    getValue: function(x, y) {
        var column = this.behavior.getColumn(x);
        return column.header || column.name; // use field name when header undefined
    },

    setValue: function(x, y, value) {
        if (y < this.getRowCount()) {
            this.behavior.getColumn(x).header = value;
        }
    },

    getRow: function(y) {
        return this.dataRow;
    },

    getRowMetadata: function(y, prototype) {
        return this.metadata || prototype !== undefined && (this.metadata = Object.create(prototype));
    },

    setRowMetadata: function(y, metadata) {
        return (this.metadata = metadata);
    }
});

module.exports = HeaderSubgrid;
