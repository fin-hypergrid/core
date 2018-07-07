'use strict';

/**
 * @namespace dataModelEventHandlers
 * @desc These handlers are called by {@link module:decorators.dispatchDataModelEvent dataModel.dispatchEvent}.
 *
 * (Hypergrid registers itself with the data model by calling `dataModel.addListener`. Both `addListener` and `dispatchEvent` are optional API. If the data model lacks `addListener`, Hypergrid inserts a bound version of `dispatchEvent` directly into the data model.)
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
 * var dispatchGridEvent = require('../../lib/dispatchGridEvent.js');
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
