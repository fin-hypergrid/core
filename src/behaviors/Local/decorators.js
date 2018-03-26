/* globals CustomEvent */

'use strict';

var hooks = require('./hooks');
var fallbacks = require('./fallbacks');
var HypergridError = require('../../lib/error');


var warned = {};


/**
 * @private
 * @this {Local}
 * @param {dataModelAPI} dataModel
 */
function addPolyfills(dataModel) {
    if (!dataModel.install) {
        dataModel.install = function(api, fallback) {
            if (fallback && !Array.isArray(api)) {
                api = api || this;
                Object.keys(api).filter(function(key) {
                    return typeof api[key] === 'function';
                }).forEach(function(key) {
                    if (!this[key]) {
                        this[key] = api[key];
                    }
                }, this);
            }
        };
    }
}

/**
 * Inject fallback methods into data model when not implemented by data model.
 * Also adds `dispatchEvent`, called by data model to communicate back to Hypergrid.
 * (Hypergrid itself never calls `dispatchEvent` on the data model.)
 * @this {Local}
 * @param {dataModelAPI} dataModel
 * @param {Hypergrid} grid
 * @private
 */
function addFallbacks(dataModel, grid) {
    dataModel.install(fallbacks, true);
    dataModel.install({ dispatchEvent: dispatchEvent.bind(grid) }, true);
}

var REGEX_DATA_EVENT_STRING = /^data(-[a-z]+)+$/;

/**
 * @private
 * @this {Hypergrid}
 * @param eventName
 * @param eventDetail
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
function addDefaultHooks(dataModel) {
    if (!dataModel.getCell) {
        dataModel.getCell = hooks.getCell;
    }

    if (!dataModel.getCellEditorAt) {
        dataModel.getCellEditorAt = hooks.getCellEditorAt;
    }
}


module.exports = {
    addPolyfills: addPolyfills,
    addFallbacks: addFallbacks,
    addDeprecationWarnings: addDeprecationWarnings,
    addFriendlierDrillDownMapKeys: addFriendlierDrillDownMapKeys,
    addDefaultHooks: addDefaultHooks
};
