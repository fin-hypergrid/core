'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function FilterSubgrid(grid, options) {
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

FilterSubgrid.prototype = {
    constructor: FilterSubgrid.prototype.constructor,

    type: 'filter',

    format: 'filter', // override column format

    getRowCount: function() {
        return this.grid.properties.showFilterRow ? 1 : 0;
    },

    getValue: function(x, y) {
        return this.behavior.dataModel.getFilter(x) || '';
    },

    setValue: function(x, y, value) {
        this.behavior.dataModel.setFilter(x, value);
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = FilterSubgrid;
