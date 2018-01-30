'use strict';

var DataModel = require('./DataModel');

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
var HeaderSubgrid = DataModel.extend('HeaderSubgrid', {
    initialize: function(grid, options) {
        options = options || {};

        this.behavior = grid.behavior;

        var fallbacks = this.makeInterface(options);
        this.getRowMetadata = fallbacks.getRowMetadata;
        this.setRowMetadata = fallbacks.setRowMetadata;

        if (options.name) {
            this.name = options.name;
        }
    },

    type: 'header',

    format: 'header', // override column format

    getRowCount: function() {
        return this.grid.properties.showHeaderRow ? 1 : 0;
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

    getRowMetadata: function(y, metadata) {
        return this.metadata || (this.metadata = metadata);
    },

    setRowMetadata: function(y, metadata) {
        return (this.metadata = metadata);
    }
});

module.exports = HeaderSubgrid;
