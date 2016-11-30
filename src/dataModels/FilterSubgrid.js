'use strict';

function FilterRow(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
    this.dataRow = {}; // for meta data (__HEIGHT)
}

FilterRow.prototype = {
    constructor: FilterRow.prototype.constructor,

    type: 'filter',

    getRowCount: function() {
        return this.grid.isShowFilterRow() ? 1 : 0;
    },

    getValue: function(x, y) {
        return this.behavior.filter.getColumnFilterState(this.behavior.getColumn(x).name) || '';
    },

    setValue: function(x, y, value) {
        this.behavior.filter.setColumnFilterState(this.behavior.getColumn(x).name, value);
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = FilterRow;
