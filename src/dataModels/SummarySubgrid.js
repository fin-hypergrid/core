'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function SummarySubgrid(grid, options) {
    this.behavior = grid.behavior;

    /**
     * @type {dataRowObject[]}
     */
    this.data = [];

    if (options && options.name) {
        this.name = options.name;
    }
}

SummarySubgrid.prototype = {
    constructor: SummarySubgrid.prototype.constructor,

    type: 'summary',

    hasOwnData: true, // do not call setData implicitly

    getRowCount: function() {
        return this.getData().length;
    },

    getData: function() {
        return this.data;
    },

    setData: function(data, schema) {
        this.data = data;
    },

    getValue: function(x, y) {
        return this.getData()[y][x];
    },

    setValue: function(x, y, value) {
        this.data[x] = value;
    },

    getRow: function(y) {
        return this.data[y];
    }
};

module.exports = SummarySubgrid;
