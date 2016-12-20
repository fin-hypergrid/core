'use strict';

var UPWARDS_BLACK_ARROW = '\u25b2', // aka '▲'
    DOWNWARDS_BLACK_ARROW = '\u25bc'; // aka '▼'

module.exports = {

    /**
     * @summary The behaviors's sorter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @param {dataControlInterface|undefined|null} sorter
     * @memberOf Behavior#
     */
    get sorter() {
        return this.getController('sorter');
    },
    set sorter(sorter) {
        this.setController('sorter', sorter);
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param keys
     */
    toggleSort: function(column, keys) {
        this.incrementSortState(column, keys);
        this.serializeSortState();
        this.reindex();
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param {boolean} deferred
     */
    unSortColumn: function(column, deferred) {
        var sortSpec = this.getColumnSortState(column.index);

        if (sortSpec) {
            this.sorter.sorts.splice(sortSpec.rank, 1); //Removed from sorts
            if (!deferred) {
                this.reindex();
            }
        }

        this.serializeSortState();
    },

    /**
     * @param {number} columnIndex
     * @returns {sortSpecInterface}
     */
    getColumnSortState: function(columnIndex){
        var rank,
            sort = this.sorter.sorts.find(function(sort, index) {
                rank = index;
                return sort.columnIndex === columnIndex;
            });

        return sort && { sort: sort, rank: rank };
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param {string[]} keys
     * @return {object[]} sorts
     */
    incrementSortState: function(column, keys) {
        var sorts = this.sorter.sorts,
            columnIndex = column.index,
            columnSchema = this.schema[columnIndex],
            sortSpec = this.getColumnSortState(columnIndex);

        if (!sortSpec) { // was unsorted
            if (keys.indexOf('CTRL') < 0) {
                sorts.length = 0;
            }
            sorts.unshift({
                columnIndex: columnIndex, // so define and...
                direction: 1, // ...make ascending
                type: columnSchema.type
            });
        } else if (sortSpec.sort.direction > 0) { // was ascending
            sortSpec.sort.direction = -1; // so make descending
        } else { // was descending
            this.unSortColumn(column, true); // so make unsorted
        }

        //Minor improvement, but this check can happen earlier and terminate earlier
        sorts.length = Math.min(sorts.length, this.grid.properties.maxSortColumns);
    },

    serializeSortState: function(){
        this.grid.properties.sorts = this.sorter.sorts;
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        var sorts = this.sorter.sorts,
            sortSpec = this.getColumnSortState(columnIndex),
            result, rank;

        if (sortSpec) {
            var arrow = sortSpec.sort.direction > 0
                ? UPWARDS_BLACK_ARROW
                : DOWNWARDS_BLACK_ARROW;

            result = arrow + ' ';

            if (sorts.length > 1) {
                rank = sorts.length - sortSpec.rank;
                result = rank + result;
            }
        }

        return result;
    }
};
