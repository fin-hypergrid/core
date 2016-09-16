'use strict';

module.exports = {
    toggleSort: function(keys) {
        this.dataModel.toggleSort(this.index, keys);
    },

    unSort: function(deferred) {
        this.dataModel.unSortColumn(this.index, deferred);
    }
};
