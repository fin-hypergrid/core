/* globals CustomEvent */

'use strict';

/**
 * @module decorators
 */

var hooks = require('./hooks');
var fallbacks = require('./fallbacks');
var HypergridError = require('../../lib/error');


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

    var handler = dispatchEvent.bind(grid);

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

var REGEX_DATA_EVENT_STRING = /^data(-[a-z]+)+$/;

/**
 * @summary Hypergrid's `data-` event handler.
 * @desc `dispatchEvent` may be called by the data model to communicate back to Hypergrid. Hypergrid itself never calls `dispatchEvent` on the data model.
 *
 * This handler:
 * 1. Checks the event string to make sure it conforms to the expected syntax (must start with `data-` and include only lowercase letters and hyphens).
 * 2. Dispatches a DOM event to the `<canvas>` element with the same event name prefixed with `fin-canvas-`.
 *
 * The data model's `dispatchEvent` method is bound to the grid by {@link module:decorator.injectCode injectCode}. A curried version of this function, bound to the grid instance, is either:
 * Added to the data model via its `addListener` method, if it has one; or
 * Force-injected into the data model, overriding any native implementation. (A native implementation may exist simply to "catch" calls that might be made before the data model is attached to Hypergrid.)
 *
 * @this {Hypergrid}
 * @param eventName
 * @param eventDetail
 * @memberOf module:decorators
 */
function dispatchEvent(eventName, eventDetail) {
    if (!REGEX_DATA_EVENT_STRING.test(eventName)) {
        throw new HypergridError('Expected data event string to match ' + REGEX_DATA_EVENT_STRING + '.');
    }
    this.canvas.dispatchEvent(new CustomEvent('fin-canvas-' + eventName, eventDetail));
}

/**
 * @private
 * @this {Local}
 */
function addDeprecationWarnings() {
    var grid = this.grid;

    Object.defineProperty(this.dataModel, 'grid', {
        configurable: true,
        enumerable: false,
        get: function() {
            if (!warned.grid) {
                console.warn('`this.grid` (dataModel.grid) property has been deprecated as of v3.0.0 and will definitely be removed in a future release. Data models should have no direct knowledge of or access to the grid. (If your data model needs to call grid methods, add a data event to your grid with grid.addDataEventListener(\'data-my-event\', myHandler) and trigger it from your data model with this.dispatchEvent(\'data-my-event\'). If you need access to the grid object from within a `getCell` or `getCellEditAt` override, define `grid` and the override in a closure.)');
                warned.grid = true;
            }
            return grid;
        }
    });

    if (this.dataModel.dataSource) {
        if (!warned.dataSource) {
            console.warn('As of Hypergrid 3.0.0, the external data model is now `grid.behavior.dataModel`. Formerly, it was `grid.behavior.dataModel.dataSource`. Data model authors are strongly advised to avoid implementing a `.dataSource` property inside their data model to reduce the confusion that would result if a legacy application were to try to reference the data model via `.dataModel.dataSource` and get something unexpected instead of an error.)');
        }
    }
}

// for app layer access to drill down chars, provide friendlier keys than data model normally supports in `drillDownCharMap`.
var friendlierDrillDownMapKeys = {
    true: 'OPEN',
    false: 'CLOSE',
    null: 'INDENT'
};

/**
 * @private
 * @this {Local}
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
 * @private
 * @param {dataModelAPI} dataModel
 * @this {Local}
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
