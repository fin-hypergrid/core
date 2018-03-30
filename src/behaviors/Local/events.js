'use strict';

var dispatchGridEvent = require('../../lib/dispatchGridEvent.js');

/**
 * @namespace dataModelEventHandlers
 * @desc These handlers are called by {@link module:decorators.dispatchDataModelEvent dataModel.dispatchEvent}.
 *
 * They perform some Hypergrid housekeeping chores before (and possibly after) optionally re-emiting the event as a standard
 * Hypergrid event (to the `<canvas>` element).
 *
 * All the built-in data model events re-emit their events (all non-cancelable).
 *
 * #### Coding patterns
 * These handlers should return a boolean if they re-emit the event as a grid event themselves, when they have chores to perform post-re-emission. If they don't, they should return `undefined` which signals the caller (`dataModel.dispatchEvent`) to re-emit it as a grid event as a final step for the handler.
 *
 * Given the above, there are four typical coding patterns for these handlers:
 * 1. Perform chores with no event re-emission:
 * ```
 * Chores();
 * return true; // (or any defined value) signals caller not to re-emit the event
 * ```
 * 2. First perform chores; then re-emit the event as a grid event:
 * ```
 * Chores();
 * return undefined; // (or omit) signals caller to re-emit the event for us
 * ```
 * 3. First perform some pre-re-emit chores (optional); then re-emit the event as a _non-cancelable_ grid event; then perform remaining chores:
 * ```
 * optionalPreReemitChores();
 * dispatchGridEvent.call(this, event.type, event); // non-cancelable
 * remainingChores();
 * return true; // signals caller that we've already re-emitted the event and it was not canceled
 * ```
 * 3. First perform some pre-re-emit chores (optional); then re-emit the event as a _cancelable_ grid event; then perform remaining chores conditionally [iff](https://en.wikipedia.org/wiki/If_and_only_if) not canceled (_important:_ note the `true` in the following):
 * ```
 * optionalPreReemitChores();
 * if (dispatchGridEvent.call(this, event.type, true, event)) { // `true` here means cancelable
 *     conditionalChores();
 *     return true; // signals caller that we've already re-emitted the event (which was not canceled)
 * } else {
 *     return false; // signals caller that we've already re-emitted the event (which was canceled)
 * }
 * ```
 */
module.exports = {
    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-schema-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-schema-changed': function(event) {
        dispatchGridEvent.call(this, event.type, event);
        this.behavior.createColumns();
        return true;
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-changed': function(event) {
        this.repaint();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-shape-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-shape-changed': function(event) {
        this.behaviorShapeChanged();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-prereindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-prereindex': function(event) {
        saveSelectedRowsAndColumns.call(this);
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {{type}} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link dataModelAPI#event:fin-hypergrid-data-postreindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-postreindex': function(event) {
        reselectRowsAndColumns.call(this);
        this.behaviorShapeChanged();
    }
};


function saveSelectedRowsAndColumns() {
    saveSelectedDataRowIndexes.call(this);
    saveSelectedColumnNames.call(this);
}

function reselectRowsAndColumns() {
    this.selectionModel.reset();
    reselectRowsByDataRowIndexes.call(this);
    reselectColumnsByNames.call(this);
}

/**
 * Save underlying data row indexes backing current grid row selections in `grid.selectedDataRowIndexes`.
 *
 * This call should be paired with a subsequent call to `reselectRowsByUnderlyingIndexes`.
 * @private
 * @this {Hypergrid}
 * @returns {number|undefined} Number of selected rows or `undefined` if `restoreRowSelections` is falsy.
 */
function saveSelectedDataRowIndexes() {
    if (this.properties.restoreRowSelections) {
        var dataModel = this.behavior.dataModel;

        this.selectedDataRowIndexes = this.getSelectedRows().map(function(selectedRowIndex) {
            return dataModel.getRowIndex(selectedRowIndex);
        });

        return this.selectedDataRowIndexes.length;
    }
}

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowIndexes` which should be called first.
 *
 * Note that not all previously selected rows will necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
 * @private
 * @this {Hypergrid}
 * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected rows.
 */
function reselectRowsByDataRowIndexes() {
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
}

/**
 * Save data column names of currently column selections in `grid.selectedColumnNames`.
 *
 * This call should be paired with a subsequent call to `reselectColumnsByNames`.
 * @private
 * @this {Hypergrid}
 * @param sourceColumnNames
 * @returns {number|undefined} Number of selected columns or `undefined` if `restoreColumnSelections` is falsy.
 */
function saveSelectedColumnNames() {
    if (this.properties.restoreColumnSelections) {
        var behavior = this.behavior;

        this.selectedColumnNames = this.getSelectedColumns().map(function(selectedColumnIndex) {
            return behavior.getActiveColumn(selectedColumnIndex).name;
        });

        return this.selectedColumnNames.length;
    }
}

/**
 * Re-establish columns selections based on column names saved by `getSelectedColumnNames` which should be called first.
 *
 * Note that not all preveiously selected columns wil necessarily be available after a data transformation. Even if they appear to be available, if they are not from the same data set, restoring the selections may not make sense. When this is the case, the application should set the `restoreRowSelections` property to `false`.
 * @private
 * @this {Hypergrid}
 * @param sourceColumnNames
 * @returns {number|undefined} Number of rows reselected or `undefined` if there were no previously selected columns.
 */
function reselectColumnsByNames(sourceColumnNames) {
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
