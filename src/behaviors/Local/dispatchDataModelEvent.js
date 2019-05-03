'use strict';

var dataModelEventHandlers = require('./events');
var dispatchGridEvent = require('../../lib/dispatchGridEvent');


var REGEX_DATA_EVENT_STRING = /^fin-hypergrid-(data|schema)(-[a-z]+)+$/;

/**
 * @summary Hypergrid data model event handler.
 * @desc This function is not called by Hypergrid.
 * Rather, it is handed to the data model (by {@link module:decorators.injectCode injectCode} as `dispatchEvent`) to issue callbacks to the grid.
 *
 * This handler:
 * 1. Checks the event string to make sure it conforms to the expected syntax:
 *    * Starts with `fin-hypergrid-data-` or `fin-hypergrid-schema-`
 *    * Includes only lowercase letters and hyphens
 * 2. Calls a handler in the {@link dataModelEventHandlers} namespace of the same name as the event string.
 * 3. Re-emits the event as a DOM event to the `<canvas>` element (unless the handler has already done so).
 *
 * The data model's `dispatchEvent` method is bound to the grid by {@link module:decorators.injectCode injectCode}.
 * A bound version of this function, bound to the grid instance, is either:
 * * Added to the data model via its `addListener` method, if it has one; or
 * * Force-injected into the data model, overriding any native implementation. (A native implementation may exist simply to "catch" calls that might be made before the data model is attached to Hypergrid.)
 *
 * @this {Hypergrid}
 * @param {string|NormalizedDataModelEvent} event
 */
function dispatchDataModelEvent(event) {
    var type;

    switch (typeof event) {
        case 'string':
            type = event;
            event = { type: type };
            break;
        case 'object':
            if ('type' in event) {
                type = event.type;
                break;
            }
        // fall through
        default:
            throw new this.HypergridError('Expected data model event to be: (string | {type:string})');
    }

    if (!REGEX_DATA_EVENT_STRING.test(type)) {
        throw new this.HypergridError('Expected data model event type "' + type + '" to match ' + REGEX_DATA_EVENT_STRING + '.');
    }

    var nativeHandler = dataModelEventHandlers[event.type];
    if (nativeHandler) {
        var dispatched = nativeHandler.call(this, event);
    }

    return dispatched !== undefined ? dispatched : dispatchGridEvent.call(this, event.type, event);
}

module.exports = dispatchDataModelEvent;
