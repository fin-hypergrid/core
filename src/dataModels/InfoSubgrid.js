'use strict';

function InfoSubgrid(grid) {
    this.grid = grid;
    this.behavior = grid.behavior;
    this.data = [];
}

InfoSubgrid.prototype = {
    constructor: InfoSubgrid.prototype.constructor,

    type: 'info',

    format: 'info', // override column format

    hasOwnData: true, // do not call setData implicitly

    pad: true, // row(s) should be padded to fill to bottom of grid viewport

    /**
     * Populates each row data object with all columns set to given row message, growing/shrinking `data` to match `messages`'s length.
     * @param {string[]} messages
     * @param {Array} schema
     * @memberOf InfoSubgrid#
     */
    setData: function(messages, schema) {
        var data = this.data, key;
        if (schema) {
            data.length = messages.length;
            messages.forEach(function(message, i) {
                var dataRow = data[i] = data[i] || {};
                schema.forEach(function(columnSchema) {
                    key = columnSchema.name;
                    dataRow[key] = message;
                });
            });
            this.key = key;
        }
    },

    getRowCount: function() {
        return this.behavior.dataModel.getRowCount() ? 0 : this.data.length;
    },

    getValue: function(x, y) {
        return this.data[y][this.key];
    },

    getRow: function(y) {
        return this.data[y];
    }
};

module.exports = InfoSubgrid;
