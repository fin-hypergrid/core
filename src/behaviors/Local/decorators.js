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
var polyfills = require('./polyfills');


var warned = {};


/**
 * Injects missing utility functions into the data model.
 *
 * Typically, data models are extended from `datasaur-base` which supplies the utility functions. However, extending from `datasaur-base` is not a requirement and for those data models that do not, the necessary utility functions are injected here.
 *
 * The only utility function so injected at this time is `install`, which is used by:
 * * {@link module:decorators.injectCode injectCode} to:
 *    * Inject fallbacks for missing non-essential data model methods
 *    * Bind the data model's `dispatchEvent` method to the grid instance
 * * {@link module:decorators.injectDefaulthooks injectDefaulthooks} to:
 *    * Inject a default for the `getCell` hook
 *    * Inject a default for the `getCellEditorAt` hook
 *
 * @this {Local}
 * @param {DataModel} dataModel
 * @memberOf module:decorators
 */
function injectPolyfills(dataModel) {
    Object.keys(polyfills).forEach(function(key) {
        if (!dataModel[key]) {
            dataModel[key] = polyfills[key];
        }
    });
}

/**
 * Inject fallback methods into data model when not implemented by data model.
 * @this {Local}
 * @param {DataModel} dataModel
 * @memberOf module:decorators
 */
function injectCode(dataModel) {
    dataModel.install(fallbacks, { inject: true });
}

/**
 * @param {DataModel} dataModel
 * @this {Local}
 * @memberOf module:decorators
 */
function injectDefaulthooks(dataModel) {
    dataModel.install(hooks, { inject: true });
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


module.exports = {
    injectPolyfills: injectPolyfills,
    injectCode: injectCode,
    addDeprecationWarnings: addDeprecationWarnings,
    addFriendlierDrillDownMapKeys: addFriendlierDrillDownMapKeys,
    injectDefaulthooks: injectDefaulthooks
};
