'use strict';

/**
 * @namespace dataModelEventHandlers
 * @desc These handlers are called by {@link dispatchDataModelEvent dataModel.dispatchEvent} to perform Hypergrid housekeeping tasks.
 *
 * (Hypergrid registers itself with the data model by calling `dataModel.addListener`. Both `addListener` and `dispatchEvent` are optional API. If the data model lacks `addListener`, Hypergrid inserts a bound version of `dispatchEvent` directly into the data model.)
 *
 * #### Coding pattern
 * If there are no housekeeping tasks to be performed, do not define a handler here.
 *
 * Otherwise, the typical coding pattern is for our handler to perform the housekeeping tasks, returning `undefined` to the caller ({@link DispatchDataModelEvent}) which then re-emits the event as a Hypergrid event (_i.e.,_ as a DOM event to the `<canvas>` element).
 *
 * Alternatively, our handler can re-emit the event itself by calling the grid event handler and propagating its boolean return value value to the caller which signals the caller _not_ to re-emit on our behalf. This is useful when tasks need to be performed _after_ the Hypergrid event handler is called (or before _and_ after).
 *
 * The pattern, in general:
 * ```js
 * exports['fin-hypergrid-data-myevent'] = function(event) {
 *     var notCanceled;
 *
 *     PerformHousekeepingTasks();
 *
 *     // optionally re-emit the event as a grid event
 *     var dispatchGridEvent = require('../../lib/dispatchGridEvent.js');
 *     notCanceled = dispatchGridEvent.call(this, event.type, isCancelable, event);
 *
 *     if (!notCanceled) {
 *         PerformAdditionalHousekeepingTasks()
 *     }
 *
 *     return notCanceled;
 * }
 * Re-emitting the event is optional; if `notCanceled` is never defined, the caller will take care of it. If your handler does choose to re-emit the event itself by calling `dispatchGridEvent`, you should propagate its return value (the result of its internal call to [`dispatchEvent`](https://developer.mozilla.org/docs/Web/API/EventTarget/dispatchEvent), which is either `false` if the event was canceled or `true` if it was not).
 *
 */
module.exports = {
    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link DataModel#event:fin-hypergrid-schema-loaded}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-schema-loaded': function(event) {
        this.behavior.createColumns();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link DataModel#event:fin-hypergrid-data-loaded}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-loaded': function(event) {
        this.repaint();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link DataModel#event:fin-hypergrid-data-shape-changed}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-shape-changed': function(event) {
        this.behaviorShapeChanged();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {NormalizedDataModelEvent} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link DataModel#event:fin-hypergrid-data-prereindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-prereindex': function(event) {
        this.stashRowSelections();
        this.stashColumnSelections();
    },

    /**
     * _See the data model API page for event semantics (link below)._
     * @param {{type}} event
     * @returns {undefined|boolean} Result of re-emitted event or `undefined` if event not re-emitted.
     * @see {@link DataModel#event:fin-hypergrid-data-postreindex}
     * @memberOf dataModelEventHandlers
     */
    'fin-hypergrid-data-postreindex': function(event) {
        this.selectionModel.reset();
        this.unstashRowSelections();
        this.unstashColumnSelections();
        this.behaviorShapeChanged();
    }
};
