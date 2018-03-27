'use strict';

var dispatchEvent = require('../events.js').dispatchEvent;

var handlersByEventString;

/**
 * Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
var mixin = {

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-schema-changed` event.
     * @see {@link dataModelAPI#event:data-schema-changed data-schema-changed}
     */
    fireSyntheticDataSchemaChangedEvent: function(event) {
        this.behavior.createColumns();
        this.behaviorChanged();
        return dispatchEvent.call(this, 'fin-data-schema-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-changed` event.
     * @see {@link dataModelAPI#event:data-changed data-changed}
     */
    fireSyntheticDataChangedEvent: function(event) {
        this.repaint();
        return dispatchEvent.call(this, 'fin-data-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-shape-changed` event.
     * @see {@link dataModelAPI#event:data-shape-changed data-shape-changed}
     */
    fireSyntheticDataShapeChangedEvent: function(event) {
        this.behaviorShapeChanged();
        return dispatchEvent.call(this, 'fin-data-shape-changed', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-preindex` event.
     * @see {@link dataModelAPI#event:data-prereindex data-prereindex}
     */
    fireSyntheticDataPrereindexEvent: function(event) {
        saveSelectedRowsAndColumns.call(this);
        return dispatchEvent.call(this, 'fin-data-prereindex', event);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Synthesize and fire a `fin-data-postindex` event.
     * @see {@link dataModelAPI#event:data-postreindex data-postreindex}
     */
    fireSyntheticDataPostreindexEvent: function(event) {
        reselectRowsAndColumns.call(this);
        return dispatchEvent.call(this, 'fin-data-postreindex', event) &&
            this.fireSyntheticDataShapeChangedEvent(event);
    },

    delegateDataEvents: function() {
        Object.keys(handlersByEventString).forEach(function(eventString) {
            this.addDataEventListener(eventString, handlersByEventString[eventString]);
        }, this);
    },

    addDataEventListener: function(eventString, handler) {
        var grid = this;

        grid.addInternalEventListener('fin-canvas-' + eventString, function(event) {
            handler.call(grid, event || {});
        });
    }

};


handlersByEventString = {
    'data-schema-changed': mixin.fireSyntheticDataSchemaChangedEvent,
    'data-changed': mixin.fireSyntheticDataChangedEvent,
    'data-shape-changed': mixin.fireSyntheticDataShapeChangedEvent,
    'data-prereindex': mixin.fireSyntheticDataPrereindexEvent,
    'data-postreindex': mixin.fireSyntheticDataPostreindexEvent
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
 * @memberOf dataModels.JSON~
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
 * @memberOf dataModels.JSON~
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
 * @memberOf dataModels.JSON~
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
 * @memberOf dataModels.JSON~
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


module.exports = {
    mixin: mixin,
    handlers: handlersByEventString // for adding custom data event handlers
};
