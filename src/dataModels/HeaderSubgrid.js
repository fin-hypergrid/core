'use strict';

var DataSourceBase = require('datasaur-base');

/**
 * @implements DataModel
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
var HeaderSubgrid = DataSourceBase.extend('HeaderSubgrid', {
    type: 'header',

    initialize: function(nextDataSource, options) {
        this.grid = options.grid;
    },

    getRowCount: function() {
        return this.grid.properties.showHeaderRow ? 1 : 0;
    },

    getValue: function(x, y) {
        var column = this.grid.behavior.getColumn(x);
        return column.header || column.name; // use field name when header undefined
    },

    setValue: function(x, y, value) {
        if (y < this.getRowCount()) {
            this.grid.behavior.getColumn(x).header = value;
        }
    },

    getRow: function(y) {
        return this.dataRow;
    }
});

module.exports = HeaderSubgrid;
