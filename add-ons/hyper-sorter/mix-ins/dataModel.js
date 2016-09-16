'use strict';

module.exports = {

    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param keys
     */
    toggleSort: function(colIndex, keys) {
        this.incrementSortState(colIndex, keys);
        this.applyAnalytics({columnSort: true});
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} columnIndex
     * @param {boolean} deferred
     */
    unSortColumn: function(columnIndex, deferred) {
        var sorts = this.getSortedColumnIndexes(),
            sortPosition;

        if (sorts.find(function(sortSpec, index) {
                sortPosition = index;
                return sortSpec.columnIndex === columnIndex;
            })) {
            sorts.splice(sortPosition, 1);
            if (!deferred) {
                this.applyAnalytics({columnSort: true});
            }
        }
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @param {number} colIndex
     * @param {string[]} keys
     */
    incrementSortState: function(columnIndex, keys) {
        var sorts = this.getSortedColumnIndexes(),
            sortSpec = sorts.find(function(spec, index) {
                return spec.columnIndex === columnIndex;
            });

        if (!sortSpec) { // was unsorted
            if (keys.indexOf('CTRL') < 0) { sorts.length = 0; }
            sorts.unshift({
                columnIndex: columnIndex, // so define and...
                direction: 1 // ...make ascending
            });
        } else if (sortSpec.direction > 0) { // was ascending
            sortSpec.direction = -1; // so make descending
        } else { // was descending
            this.unSortColumn(columnIndex, true); // so make unsorted
        }

        //Minor improvement, but this check can happe n earlier and terminate earlier
        if (sorts.length > 3) {
            sorts.length = 3;
        }
    }
};
