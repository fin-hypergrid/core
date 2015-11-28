'use strict';

var DataSourceIndexed = require('./DataSourceIndexed');
var stableSort = require('./util/stableSort');

var DataSourceSorter = DataSourceIndexed.extend('DataSourceSorter', {
    initialize: function() {
        this.descendingSort = false; // TODO: this does not seem to be in use
    },

    sortOn: function(colIdx, direction) {
        switch (direction) {
            case 0:
                this.clearIndex();
                break;

            case undefined:
            case 1:
            case -1:
                var self = this; // for use in getValue
                stableSort.sort(this.buildIndex(), getValue, direction);
                break;
        }

        function getValue(rowIdx) {
            return valOrFuncCall(self.dataSource.getValue(colIdx, rowIdx));
        }
    }
});

function valOrFuncCall(valOrFunc) {
    return typeof valOrFunc === 'function' ? valOrFunc() : valOrFunc;
}

module.exports = DataSourceSorter;