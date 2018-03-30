'use strict';


/**
 * @typedef {object} NormalizedDataModelEvent
 * @property {string} type - Event string.
 */

/**
 * @module decorators
 */

var hooks = require('./hooks');
var fallbacks = require('./fallbacks');
var dataModelEventHandlers = require('./events');
var dispatchGridEvent = require('../../lib/dispatchGridEvent');


var warned = {};


function silent() {}

/**
 * Injects missing utility functions into the data model.
 *
 * Typically, data models are extended from `datasaur-base` which supplies the utility functions. However, extending from `datasaur-base` is not a requirement and for those data models that do not, the necessary utility functions are injected here.
 *
 * The only utility function so injected at this time is `install`, which is used by:
 * * {@link module:decorators.injectCode injectCode} to:
 *    * Inject fallbacks for missing non-essential data model methods
 *    * Bind the data model's `dispatchEvent` method to the grid instance
 * * {@link module:decorators.injectCode injectCode} to:
 *    * Inject a default for the `getCell` hook
 *    * Inject a default for the `getCellEditorAt` hook
 *
 * @this {Local}
 * @param {dataModelAPI} dataModel
 * @memberOf module:decorators
 */
function injectPolyfills(dataModel) {
    if (!dataModel.install) {
        dataModel.install = function(api) {
            if (!api) {
                return;
            }

            var isArray = Array.isArray(api),
                keys = isArray ? api : Object.keys(api).filter(function(key) {
                    return typeof api[key] === 'function' &&
                        key !== 'constructor' &&
                        key !== 'initialize';
                });

            keys.forEach(function(key) {
                if (!this[key]) {
                    this[key] = isArray ? silent : api[key];
                }
            }, this);
        };
    }
}

/**
 * Injects code into data model:
 * * Inject fallback methods into data model when not implemented by data model.
 * * Binds the data model's `dispatchEvent` method to the grid instance:
 *    1. If `dataModel.addListener` is already implemented:<br>
 *       * Calls it event handler bound to this grid that handles all `data-` events.
 *       * `dataModel.dispatchEvent` is presumed to be implemented as well.
 *    2. If `dataModel.addListener` is not implemented:<br>
 *       * Inject same event handler as above into `dataModel.dispatchEvent`.
 *
 * @this {Local}
 * @param {dataModelAPI} dataModel
 * @param {Hypergrid} grid
 * @memberOf module:decorators
 */
function injectCode(dataModel, grid) {
    var options = {
        inject: true
    };

    dataModel.install(fallbacks, options);

    var handler = dispatchDataModelEvent.bind(grid);

    // There are two eventing models data models can use:
    if (dataModel.addListener) {
        // Choice #1: `addListener` eventing model: If implemented, register our bound dispatcher with it.
        dataModel.addListener(handler);
    } else {
        // Choice #2: Inject our bound dispatcher directly into data model
        options.force = true;
        dataModel.install({ dispatchEvent: handler }, options);
    }
}


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
 * A curried version of this function, bound to the grid instance, is either:
 * * Added to the data model via its `addListener` method, if it has one; or
 * * Force-injected into the data model, overriding any native implementation. (A native implementation may exist simply to "catch" calls that might be made before the data model is attached to Hypergrid.)
 *
 * @this {Hypergrid}
 * @param {string|NormalizedDataModelEvent} event
 * @memberOf module:decorators~
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
            throw new TypeError('Expected data model event to be: (string | {type:string})');
    }

    if (!REGEX_DATA_EVENT_STRING.test(type)) {
        throw new TypeError('Expected data model event type "' + type + ' to match ' + REGEX_DATA_EVENT_STRING + '.');
    }

    var nativeHandler = dataModelEventHandlers[event.type];
    if (nativeHandler) {
        var dispatched = nativeHandler.call(this, event);
    }

    return dispatched !== undefined ? dispatched : dispatchGridEvent.call(this, event.type, event);
}

/**
 * @summary Add deprecation warnings for deprecated legacy data model properties.
 * @desc This method may be removed in a future version whence all deprecations are removed.
 * @this {Local}
 * @memberOf module:decorators
 */
function addDeprecationWarnings() {
    var grid = this.grid;

    Object.defineProperties(this.dataModel, {

        grid: {
            configurable: true,
            enumerable: false,
            get: function() {
                if (!warned.grid) {
                    console.warn('dataModel.grid has been deprecated as of v3.0.0. (Will be removed in a future release.) Data models should have no direct knowledge of or access to the grid. (If your data model needs to call grid methods, add a data event to your grid with `grid.addEventListener(\'fin-hypergrid-data-my-event\', myHandler)` and trigger it from your data model with `this.dispatchEvent(\'fin-hypergrid-data-my-event\')` or `this.dispatchEvent({ type: \'fin-hypergrid-data-my-event\' })`. If you need access to the grid object from within a `getCell` or `getCellEditAt` override, define `grid` in the same closure as the override.)');
                    warned.grid = true;
                }
                return grid;
            }
        },

        dataSource: {
            configurable: true,
            enumerable: false,
            get: function() {
                if (!warned.dataSource) {
                    console.warn('dataModel.dataSource has been deprecated as of 3.0.0 in favor of `dataModel`. (Will be removed in a future release.) The _external_ data model, formerly `grid.behavior.dataModel.dataSource`, is now `grid.behavior.dataModel`.');
                    warned.dataSource = true;
                }
                return this.dataModel;
            }
        }

    });
}

// for app layer access to drill down chars, provide friendlier keys than data model normally supports in `drillDownCharMap`.
var friendlierDrillDownMapKeys = {
    true: 'OPEN',
    false: 'CLOSE',
    null: 'INDENT'
};

/**
 * @this {Local}
 * @memberOf module:decorators
 */
function addFriendlierDrillDownMapKeys() {
    var charMap = this.dataModel.drillDownCharMap;
    if (charMap) {
        Object.keys(friendlierDrillDownMapKeys).forEach(function(key) {
            if (key in charMap) {
                var friendlierKey = friendlierDrillDownMapKeys[key];
                if (!(friendlierKey in charMap)) {
                    Object.defineProperty(charMap, friendlierKey, {
                        get: function() { return this[key]; },
                        set: function(s) { this[key] = s; }
                    });
                }
            }
        });
    }
}

/**
 * @param {dataModelAPI} dataModel
 * @this {Local}
 * @memberOf module:decorators
 */
function injectDefaulthooks(dataModel) {
    if (!dataModel.getCell) {
        dataModel.getCell = hooks.getCell;
    }

    if (!dataModel.getCellEditorAt) {
        dataModel.getCellEditorAt = hooks.getCellEditorAt;
    }
}


module.exports = {
    injectPolyfills: injectPolyfills,
    injectCode: injectCode,
    addDeprecationWarnings: addDeprecationWarnings,
    addFriendlierDrillDownMapKeys: addFriendlierDrillDownMapKeys,
    injectDefaulthooks: injectDefaulthooks
};
