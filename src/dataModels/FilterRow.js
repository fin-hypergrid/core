'use strict';

var images = require('../../images');

function FilterRow(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
}

FilterRow.prototype = {
    constructor: FilterRow.prototype.constructor,

    type: 'filter',

    getRowCount: function() {
        return this.grid.isShowFilterRow() ? 1 : 0;
    },

    getValue: function(x, y) {
        checkForColumnFilters.call(this);

        var column = this.behavior.getColumn(x),
            result = this.behavior.filter.getColumnFilterState(column.name) || '';

        result = [null, result, images.filter(result.length)];

        return result;
    },

    setValue: function(x, y, value) {
        checkForColumnFilters.call(this);

        var column = this.behavior.getColumn(x);
        this.behavior.filter.setColumnFilterState(column.name, value);
    }
};

function checkForColumnFilters() {
    if (!this.behavior.filter.getColumnFilterState) {
        throw new this.behavior.HypergridError('Column filters not available.');
    }
}

module.exports = FilterRow;
