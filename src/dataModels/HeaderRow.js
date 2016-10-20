'use strict';

var UPWARDS_BLACK_ARROW = '\u25b2', // aka '▲'
    DOWNWARDS_BLACK_ARROW = '\u25bc'; // aka '▼'

function HeaderRow(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
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
            sortString = this.getSortImageForColumn(x),
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

    /**
     * @param {number} columnIndex
     * @desc Returns a "sort indicator" string to display in the header. It is made up of the following parts:
     * 1. **Sort rank** - A natural number that indicates the order in which the columns are sorted in a multi-column sort. (Excluded for a single-column sort.)
     * 2. **Sort direction** - A string that indicates if the column is sorted ascending or descending.
     * 3. **Separator** - A space character to separate the sort indicator from the column header string that follows it.
     * @returns {string}
     * @memberOf DataSourceFilterRow#prototype
     */
    getSortImageForColumn: function(columnIndex) {
        var result, sortPosition, rank, arrow,
            sorts = this.behavior.dataModel.getSortedColumnIndexes(),
            sortSpec = sorts.find(function(spec, index) {
                sortPosition = index;
                return spec.columnIndex === columnIndex;
            });

        if (sortSpec) {
            arrow = sortSpec.direction > 0
                ? UPWARDS_BLACK_ARROW
                : DOWNWARDS_BLACK_ARROW;

            result = arrow + ' ';

            if (sorts.length > 1) {
                rank = sorts.length - sortPosition; // reverse of index
                result = rank + result;
            }
        }

        return result;
    }
};

module.exports = HeaderRow;
