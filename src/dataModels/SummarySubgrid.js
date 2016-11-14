'use strict';

function SummaryRow(grid, options) {
    this.behavior = grid.behavior;

    /**
     * @type {dataRowObject[]}
     */
    this.data = [];

    if (options && options.name) {
        this.name = options.name;
    }
}

SummaryRow.prototype = {
    constructor: SummaryRow.prototype.constructor,

    type: 'summary',

    getRowCount: function() {
        return this.getData().length;
    },

    getData: function() {
        return this.behavior.dataModel.dataSource.getGrandTotals() || this.data;
    },

    setData: function(data, schema) {
        this.data = schema ? [] : data; // if there's a schema, means new data rows have arrived
    },

    getValue: function(x, y) {
        return this.data[y][x];
    },

    setValue: function(x, y, value) {
        this.data[x] = value;
    },

    getRow: function(y) {
        return this.data[y];
    }
};

module.exports = SummaryRow;
