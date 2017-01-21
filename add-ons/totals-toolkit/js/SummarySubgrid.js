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
     * @type {Array<Array>}
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
        var data = this.data;

        if (!data.length) {
            data = this.behavior.dataModel.dataSource.getGrandTotals() || data;
        }

        return data;
    },

    /**
     * @summary Set summary data rows.
     * @desc Set to an array of data row objects.
     * @param {Array<Array>} data - `[]` defers to data source's grand totals.
     */
    setData: function(data, schema) {
        this.data = data;
    },

    getValue: function(x, y) {
        var row = this.getRow(y);
        return row[x];
    },

    /**
     * @summary Set a value in a summary row.
     * @desc Setting a value on a non-extant row creates the row.
     * @param x
     * @param y
     * @param value
     */
    setValue: function(x, y, value) {
        var row = this.data[y] = this.data[y] || Array(this.behavior.getActiveColumnCount());
        row[x] = value;
    },

    getRow: function(y) {
        return this.getData()[y];
    }
};

module.exports = SummarySubgrid;
