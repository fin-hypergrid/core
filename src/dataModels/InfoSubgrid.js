'use strict';

function InfoSubgrid(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
    this.dataRow = {}; // for meta data (__HEIGHT)
}

InfoSubgrid.prototype = {
    constructor: InfoSubgrid.prototype.constructor,

    type: 'info',

    setData: function(data, schema) {
        var dataRow = this.dataRow = { __ROW_HEIGHT: 40 },
            msg = this.grid.properties.noDataMessage;
        schema.forEach(function(columnSchema) {
            dataRow[columnSchema.name] = msg;
        });
    },

    getRowCount: function() {
        return this.behavior.dataModel.getRowCount() ? 0 : 1;
    },

    getValue: function(x, y) {
        return this.grid.properties.noDataMessage;
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = InfoSubgrid;
