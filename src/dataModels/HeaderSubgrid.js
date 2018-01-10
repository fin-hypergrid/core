'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function HeaderSubgrid(grid, options) {
    this.grid = grid;
    this.behavior = grid.behavior;

    /**
     * @type {dataRowObject}
     */
    this.dataRow = {}; // for meta data (__HEIGHT)

    if (options && options.name) {
        this.name = options.name;
    }
}

HeaderSubgrid.prototype = {
    constructor: HeaderSubgrid.prototype.constructor,

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
};

module.exports = HeaderSubgrid;
