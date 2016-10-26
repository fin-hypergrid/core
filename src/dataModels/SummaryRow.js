'use strict';

function SummaryRow(grid, options) {
    this.behavior = grid.behavior;

    /**
     * @type {dataRows[]}
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
        return this.data && this.data.length || 0;
    },

    getData: function() {
        return this.behavior.dataModel.dataSource.getGrandTotals() || this.data;
    },

    setData: function(data) {
        var oldData = this.data = [];
        this.data = data || [];

        // Reuse old row heights unless new rows already have heights
        if (!this.data.find(function(dataRow) { return dataRow.__HEIGHT; })) {
            oldData.find(function(oldDataRow, i) {
                var newDataRow = this.data[i];
                if (newDataRow && oldDataRow.__HEIGHT) {
                    newDataRow.__HEIGHT = oldDataRow.__HEIGHT;
                }
                return !newDataRow;
            });
        }
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
