'use strict';

var UPWARDS_BLACK_ARROW = '\u25b2', // aka '▲'
    DOWNWARDS_BLACK_ARROW = '\u25bc'; // aka '▼'

module.exports = {

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
        var sorts = this.getSortedColumnIndexes(),
            result = this.getColumnSortState(column.index),
            sortPosition = result.sortPosition;

        if (sortPosition > -1) {
            sorts.splice(sortPosition, 1); //Removed from sorts
            if (!deferred) {
                this.sorter.prop('columnSorts', sorts);
                this.reindex();
            }
        }
        this.serializeSortState();
    },

    getColumnSortState: function(columnIndex){
        var sorts = this.getSortedColumnIndexes(),
            sortPosition = -1,
            sortSpec = sorts.find(function(spec, index) {
                sortPosition = index;
                return spec.columnIndex === columnIndex;
            });
        return {sortSpec: sortSpec, sortPosition: sortPosition};
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @param column
     * @param {string[]} keys
     * @return {object[]} sorts
     */
    incrementSortState: function(column, keys) {
        var sorts = this.getSortedColumnIndexes(),
            columnIndex = column.index,
            sortSpec = this.getColumnSortState(columnIndex).sortSpec;

        if (!sortSpec) { // was unsorted
            if (keys.indexOf('CTRL') < 0) { sorts.length = 0; }
            sorts.unshift({
                columnIndex: columnIndex, // so define and...
                direction: 1, // ...make ascending
                type: column.getType()
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
    },

    serializeSortState: function(){
        var state = this.getPrivateState();
        state.sorts = this.getSortedColumnIndexes();
    },

    /**
     * @memberOf dataModels.JSON.prototype
     * @desc returns the columns that currently sorted and their intended direction of the sort
     */
    getSortedColumnIndexes: function() {
        return this.sorter.prop('sorts') || [];
    },
    /**
     * @memberOf dataModels.JSON.prototype
     * @param index
     * @param returnAsString
     * @desc Provides the unicode character used to denote visually if a column is a sorted state
     * @returns {*}
     */
    getSortImageForColumn: function(columnIndex) {
        var sorts = this.getSortedColumnIndexes(),
            state = this.getColumnSortState(columnIndex),
            sortSpec = state.sortSpec,
            sortPosition = state.sortPosition,
            result = null;

        if (sortSpec) {
            var rank = sorts.length - sortPosition,
                arrow = sortSpec.direction > 0 ? UPWARDS_BLACK_ARROW : DOWNWARDS_BLACK_ARROW;
            result = rank + arrow + ' ';
        }

        return result;
    }
};
