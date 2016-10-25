'use strict';

function HeaderRow(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
    this.dataRow = {}; // for meta data (__HEIGHT)
}

HeaderRow.prototype = {
    constructor: HeaderRow.prototype.constructor,

    type: 'header',

    getRowCount: function() {
        return this.grid.isShowHeaderRow() ? 1 : 0;
    },

    getValue: function(x, y) {
        var column = this.behavior.getColumn(x),
            result = column.header || column.name, // uses field name when header undefined
            sortString = this.behavior.dataModel.getSortImageForColumn(x),
            groups;

        if (sortString) {
            // if grouped header, prepend group headers to sort direction indicator
            if ((groups = result.lastIndexOf(this.behavior.groupHeaderDelimiter) + 1)) {
                sortString = result.substr(0, groups) + sortString;
                result = result.substr(groups);
            }

            // prepend sort direction indicator to column header
            result = sortString + result;
        }

        return result;
    },

    setValue: function(x, y, value) {
        this.behavior.getColumn(x).header = value;
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = HeaderRow;
