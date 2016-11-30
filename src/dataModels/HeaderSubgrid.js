'use strict';

function HeaderRow(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
    this.dataRow = {}; // for meta data (__ROW_HEIGHT)
}

HeaderRow.prototype = {
    constructor: HeaderRow.prototype.constructor,

    type: 'header',

    setData: function(data, schema) {
        var dataRow = this.dataRow = {};
        schema.forEach(function(columnSchema) {
            dataRow[columnSchema.name] = columnSchema.header;
        });
    },

    getRowCount: function() {
        return this.grid.isShowHeaderRow() ? 1 : 0;
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
    }
};

module.exports = HeaderRow;
