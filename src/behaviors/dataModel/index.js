'use strict';

/**
 * This module supports the {@link dataModelAPI}.
 *
 * Contents:
 * * `getCell` default
 * * `getCellEditorAt` default
 * * A mixin for the {@link Behavior} object containing:
 *    * {@link Behavior#getNewDataModel getNewDataModel(options)} method
 *    * {@link Behavior#resetDataModel resetDataModel()} method
 *    * {@link Behavior#dataModelSupports dataModelSupports(methodName)} method
 *    * {@link Behavior#schema schema} accessor
 *    * {@link Behavior#charMap charMap} read-only accessor
 *    * Various forwarding methods for common data model API calls
 *
 * {@link Behavior#resetDataModel resetDataModel(options)}` installs data model events, fallbacks, and hooks.
 *
 * @module dataModel
 */


var addEvents = require('./events').addEvents;


/** @name DataSource
 * @memberOf Behavior#
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated `Hypergrid` objects without `DataSource` or `dataSource` options specified. Scheduled for removal in next version (v4).
 * @deprecated
 */
var DefaultDataModel = require('datasaur-local');


var warned = {};


var mixin = {
    /**
     * Create a new data model
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Behavior#
     */
    getNewDataModel: function(options) {
        var newDataModel;

        options = options || {};

        if (options.dataModel) {
            newDataModel = options.dataModel;
        } else if (options.DataModel) {
            newDataModel = new options.DataModel;
        } else {
            if (!warned.DataModel) {
                console.warn('The default data model (`require(\'datasaur-local\')`) has been deprecated as of v3.0.0. (May be removed in a future version.) Developers should provide either an instantiated data model in `options.dataModel` or a data model constructor in `options.DataModel` for each grid instantiation.');
                warned.DataModel = true;
            }
            newDataModel = new DefaultDataModel;
        }

        return newDataModel;
    },

    /**
     * Attach a data model object to the grid.
     *
     * Called from {@link Behavior#reset}.
     * @this {Behavior}
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {dataModelAPI} [options.metadata] - Value to be passed to {@link dataModelAPI#setMetadataStore setMetadataStore} if the data model has changed.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Behavior#
     */
    resetDataModel: function(options) {
        var newDataModel = this.getNewDataModel(options),
            changed = newDataModel && newDataModel !== this.dataModel;

        if (changed) {
            this.dataModel = newDataModel;

            addEvents.call(this);
            addCatchers.call(this);
            addDeprecationWarnings.call(this);
            addFriendlierDrillDownMapKeys.call(this);
            addHooks.call(this);

            this._dataModelSupport = {};

            newDataModel.setMetadataStore(options && options.metadata);
        }

        if (!this.dataModel) {
            throw new this.HypergridError('Expected a data model in `options.dataModel` or `options.DataModel`.');
        }

        return changed;
    },

    /**
     * @this {Behavior}
     * @param {string} methodName
     * @returns {boolean}
     * @memberOf Behavior#
     */
    dataModelSupports: function(methodName) {
        return methodName in this._dataModelSupport ? this._dataModelSupport[methodName] : (
            this._dataModelSupport[methodName] =
                this.dataModel.getOwnerOf && !!this.dataModel.getOwnerOf(methodName) ||
                methodName in this.dataModel
        );
    },

    /**
     * @summary Convenience getter/setter.
     * @desc Calls the data model's `getSchema`/`setSchema` methods.
     * @type {Array}
     * @memberOf Behavior#
     */
    get schema() {
        return this.dataModel.getSchema();
    },
    set schema(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    /**
     * Map of drill down characters used by the data model.
     * @type {{OPEN:string, CLOSE:string, INDENT:string}}
     * @memberOf Behavior#
     */
    get charMap() {
        return this.dataModel.drillDownCharMap;
    },

    /**
     * @summary Calls `isDrillDown()` on the data model.
     * @see {@link module:dataModel/fallbacks}
     * @memberOf Behavior#
     */
    isDrillDown: function(x) {
        return this.dataModel.isDrillDown(x);
    },

    /**
     * @summary Calls `click()` on the data model.
     * @see {@link module:dataModel~fallbacks}
     * @memberOf Behavior#
     */
    click: function(y) {
        return this.dataModel.click(y);
    },

    /**
     * @summary Calls `apply()` on the data model.
     * @see {@link module:dataModel~fallbacks.apply}
     * @memberOf Behavior#
     */
    reindex: function() {
        this.dataModel.apply();
    },

    /**
     * @summary Gets the number of rows in the data subgrid.
     * @memberOf Behavior#
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    /**
     * Retrieve a data row from the data model.
     * @see {@link module:dataModel~fallbacks}
     * @memberOf Behavior#
     * @return {dataRowObject} The data row object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     * @return {dataRowObject[]}
     * @memberOf Behavior#
     */
    getData: function() {
        return this.dataModel.getData();
    },

    /**
     * @memberOf Behavior#
     */
    getIndexedData: function() {
        return this.deprecated('getIndexedData()', 'getData()', '3.0.0');
    },

    /**
     * @summary Calls `click` on the data model.
     * @desc Send clicked cell's data coordinates to the data model.
     * The data model may respond to clicks by adding/removing/decorating data rows (_e.g.,_ a drill-down).
     * If the click was "consumed" by the data model, fire the 'fin-data-changed' event,
     * which reindexes the data and reshapes the grid.
     * @param {CellEvent} event
     * @returns {boolean} - `true` means the click was consumed by the data model.
     * @memberOf Behavior#
     */
    cellClicked: function(event) {
        var x = event.dataCell.x,
            y = event.dataCell.y,
            consumed = this.isDrillDown(x) && this.click(y);

        if (consumed) {
            this.grid.fireDataShapeChangedEvent();
        }

        return consumed;
    }
};

/**
 * @implements {dataModelAPI#getCell}
 * @memberOf module:dataModel
 */
function getCell(config, rendererName) {
    return config.grid.cellRenderers.get(rendererName);
}

/**
 * @implements {dataModelAPI#getCellEditorAt}
 * @memberOf module:dataModel
 */
function getCellEditorAt(columnIndex, rowIndex, editorName, cellEvent) {
    return cellEvent.grid.cellEditors.create(editorName, cellEvent);
}


//////// LOCAL METHODS -- to be called with `.call(this`

/**
 * Add all catcher methods to data model.
 * Also adds `dispatchEvent`, which data model call internally to communicate back to Hypergrid.
 * (Hypergrid itself never calls `dispatchEvent`.)
 * Catchers are added with `installProperties` when available; otherwise they're just added directly to the data model object.
 * @private
 * @this {Behavior}
 */
function addCatchers() {
    var dataModel = this.dataModel;

    if (!dataModel.installMethods) {
        dataModel.installMethods = function(api) {
            Object.assign(this, api);
        };
    }

    dataModel.installMethods({ dispatchEvent: this.grid.trigger.bind(this.grid) });
}

/**
 * @private
 * @this {Behavior}
 */
function addDeprecationWarnings() {
    var grid = this.grid;

    Object.defineProperty(this.dataModel, 'grid', {
        configurable: true,
        writable: true,
        enumerable: false,
        value: function() {
            if (!warned.grid) {
                console.warn('`this.grid` (dataModel.grid) property has been deprecated as of v3.0.0 and will be removed in a future version. Data models should have no direct knowledge of or access to the grid. (If you need access to the grid object within your `getCell` or `getCellEditAt` override functions, define it in a closure.)');
                warned.grid = true;
            }
            return grid;
        }
    });

    if (this.dataModel.dataSource) {
        if (!warned.dataSource) {
            console.warn('As of Hypergrid 3.0.0, the `grid.behavior.dataModel` is now defined externally; `.dataModel.dataSource` is deprecated and no longer referenced internally. (Formerly, `.dataModel` was defined internally (by Hypergrid) and `.dataModel.dataSource` was the external "data source." Data model authors are strongly advised to avoid implementing a `.dataSource` property to reduce the confusion that would result should legacy application level code try to reference the data model via `.dataModel.dataSource` and get something unexpected instead.)');
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
 * @this {Behavior}
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
 * @this {Behavior}
 */
function addHooks() {
    if (!this.dataModel.getCell) {
        this.dataModel.getCell = getCell;
    }

    if (!this.dataModel.getCellEditorAt) {
        this.dataModel.getCellEditorAt = getCellEditorAt;
    }
}


module.exports = {
    getCell: getCell,
    getCellEditorAt: getCellEditorAt,
    mixin: mixin
};
