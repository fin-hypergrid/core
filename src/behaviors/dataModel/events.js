'use strict';

/**
 * @module dataModel/events
 */


var dispatchEvent = require('../../Hypergrid/events.js').dispatchEvent;
var enrichSchema = require('./schema').enrich;


/**
 * @summary Data model event collection.
 * @desc The keys are the data model event strings; the values functions containing _ad hoc_ logic for these events.
 *
 * @property {function} data-schema-changed
 * See {@link dataModelAPI#event:data-schema-changed data-schema-changed}
 *
 * @property {function} data-changed
 * See {@link dataModelAPI#event:data-changed data-changed}
 *
 * @property {function} data-shape-changed
 * See {@link dataModelAPI#event:data-shape-changed data-shape-changed}
 *
 * @property {function} data-prereindex
 * See {@link dataModelAPI#event:data-prereindex data-prereindex}
 *
 * @property {function} data-postreindex
 * See {@link dataModelAPI#event:data-postreindex data-postreindex}
 *
 * @memberOf module:dataModel/events
 */
var events = {
    'data-schema-changed': function(event) {
        enrichSchema.call(this.behavior.dataModel, event && event.schema);
    },
    'data-changed': function() {
        this.repaint();
    },
    'data-shape-changed': function() {
        this.behaviorChanged();
    },
    'data-prereindex': function() {
        this.selectedRowSourceIndexes = getUnderlyingIndexesOfSelectedRows.call(this);
    },
    'data-postreindex': function() {
        if (this.selectedRowSourceIndexes) {
            if (this.selectedRowSourceIndexes.length) {
                reselectRowsByUnderlyingIndexes.call(this, this.selectedRowSourceIndexes);
            }
            delete this.selectedRowSourceIndexes;
        }
        this.behaviorShapeChanged();
    }
};

/**
 * Save underlying data row indexes backing current grid row selections.
 * This call should be paired with a subsequent call to `reselectGridRowsBackedBySelectedDataRows`.
 * @private
 * @this {Behavior}
 */
function getUnderlyingIndexesOfSelectedRows() {
    var sourceIndexes = [],
        dataModel = this.dataModel;

    if (this.properties.checkboxOnlyRowSelections) {
        this.getSelectedRows().forEach(function(selectedRowIndex) {
            sourceIndexes.push(dataModel.getRowIndex(selectedRowIndex));
        });
    }

    return sourceIndexes;
}

/**
 * Re-establish grid row selections based on underlying data row indexes saved by `getSelectedDataRowsBackingSelectedGridRows` which should be called first.
 * @private
 * @this {Behavior}
 */
function reselectRowsByUnderlyingIndexes(sourceIndexes) {
    var i, r,
        dataModel = this.dataModel,
        rowCount = dataModel.getRowCount(),
        selectedRowCount = sourceIndexes.length,
        rowIndexes = [],
        selectionModel = this.selectionModel;

    selectionModel.clearRowSelection();

    if (this.properties.checkboxOnlyRowSelections) {
        for (r = 0; selectedRowCount && r < rowCount; ++r) {
            i = sourceIndexes.indexOf(dataModel.getRowIndex(r));
            if (i >= 0) {
                rowIndexes.push(r);
                delete sourceIndexes[i]; // might make indexOf increasingly faster as deleted elements are not enumerable
                selectedRowCount--; // count down so we can bail early if all found
            }
        }

        rowIndexes.forEach(function(rowIndex) {
            selectionModel.selectRow(rowIndex);
        });
    }

    return rowIndexes.length;
}

/**
 * @summary Add the data model events to the grid.
 * @desc _This function is only intended to be called from {@link Behavior#dataModelReset dataModelReset()}._
 *
 * Listeners for the data model events are added to the grid object using the `events` module's `on` method. This allows data models to "talk back" to (trigger events on) Hypergrid.
 *
 * Unlike regular DOM events which emanate from the `<canvas>` element, these come from the data model. On receipt of the event, Hypergrid performs the _ad hoc_ logic appropriate to the event, as defined above in {@link module:dataModel/events.events events}); and then re-triggers the event on the `<canvas>` element.
 *
 * These event listeners only need to be added to the grid once; they are good for all data models (thanks to loose coupling).
 *
 * @todo This method could be called from Hypergrid constructor instead.
 *
 * @this {Behavior}
 * @memberOf module:dataModel/events
 */
function addEvents() {
    var grid = this.grid;

    Object.keys(events).forEach(function(name) {
        var handler = events[name];
        grid.on(name, function(payload) {
            handler.call(grid, payload);
            return dispatchEvent.call(grid, name, payload || {});
        });
    });
}

module.exports = {
    events: events,
    addEvents: addEvents
};
