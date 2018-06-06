'use strict';

/**
 * Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    /**
     * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
     *
     * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
     * @private
     * @this {Hypergrid}
     * @returns {number|undefined} Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
     */
    stashRowSelections: function() {
        if (this.properties.restoreRowSelections) {
            var dataModel = this.behavior.dataModel;

            this.selectedDataRowIndexes = this.getSelectedRows().map(function(selectedRowIndex) {
                return dataModel.getRowIndex(selectedRowIndex);
            });

            return this.selectedDataRowIndexes.length;
        }
    },

    /**
     * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowIndexes` which should be called first.
     *
     * Note that not all previously selected rows will necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     * @private
     * @this {Hypergrid}
     * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected rows.
     */
    unstashRowSelections: function() {
        var dataRowIndexes = this.selectedDataRowIndexes;
        if (dataRowIndexes) {
            delete this.selectedDataRowIndexes;

            var i, r,
                dataModel = this.behavior.dataModel,
                rowCount = this.getRowCount(),
                selectedRowCount = dataRowIndexes.length,
                gridRowIndexes = [],
                selectionModel = this.selectionModel;

            for (r = 0; selectedRowCount && r < rowCount; ++r) {
                i = dataRowIndexes.indexOf(dataModel.getRowIndex(r));
                if (i >= 0) {
                    gridRowIndexes.push(r);
                    delete dataRowIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                    selectedRowCount--; // count down so we can bail early if all found
                }
            }

            gridRowIndexes.forEach(function(gridRowIndex) {
                selectionModel.selectRow(gridRowIndex);
            });

            return gridRowIndexes.length;
        }
    },

    /**
     * Save data column names of current column selections in `grid.selectedColumnNames`.
     *
     * This call should be paired with a subsequent call to `reselectColumnsByNames`.
     * @private
     * @this {Hypergrid}
     * @param sourceColumnNames
     * @returns {number|undefined} Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
     */
    stashColumnSelections: function() {
        if (this.properties.restoreColumnSelections) {
            var behavior = this.behavior;

            this.selectedColumnNames = this.getSelectedColumns().map(function(selectedColumnIndex) {
                return behavior.getActiveColumn(selectedColumnIndex).name;
            });

            return this.selectedColumnNames.length;
        }
    },

    /**
     * Re-establish columns selections based on column names saved by `getSelectedColumnNames` which should be called first.
     *
     * Note that not all preveiously selected columns wil necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
     * @private
     * @this {Hypergrid}
     * @param sourceColumnNames
     * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected columns.
     */
    unstashColumnSelections: function(sourceColumnNames) {
        var selectedColumnNames = this.selectedColumnNames;
        if (selectedColumnNames) {
            delete this.selectedColumnNames;

            var behavior = this.behavior,
                selectionModel = this.selectionModel;

            return selectedColumnNames.reduce(function(reselectedCount, columnName) {
                var activeColumnIndex = behavior.getActiveColumnIndex(columnName);
                if (activeColumnIndex) {
                    selectionModel.selectColumn(activeColumnIndex);
                    reselectedCount++;
                }
                return reselectedCount;
            }, 0);
        }
    }

};
