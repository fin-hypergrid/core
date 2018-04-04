'use strict';

var Behavior = require('../Behavior');

/** @memberOf Local~
 * @default require('datasaur-local')
 * @summary Default data model.
 * @desc The default data model for newly instantiated `Hypergrid` objects without `DataModel` or `dataModel` options specified. Scheduled for eventual deprecation at which point one of the options will be required.
 */
var DefaultDataModel = require('datasaur-local');

var decorators = require('./decorators');
var dispatchDataModelEvent = require('./dispatchDataModelEvent');


/**
 * This class mimics the {@link DataModel}.
 * > This constructor (actually {@link Local#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @constructor
 * @extends Behavior
 */
var Local = Behavior.extend('Local', {

    initialize: function(grid, options) {
        this.setData(options);
    },

    /**
     * @summary Convenience getter/setter.
     * @desc Calls the data model's `getSchema`/`setSchema` methods.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#getSchema|getSchema}
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#setSchema|setSchema}
     * @type {Array}
     * @memberOf Local#
     */
    get schema() {
        return this.dataModel.getSchema();
    },
    set schema(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    dataModelEventHandlers: require('./events').dataModelEventHandlers, // for adding additional event handlers

    createColumns: function() {
        this.super.createColumns.call(this, createColumns);
    },

    /**
     * @summary Build the `$rowProxy$` lazy getter collection based on current `schema`.
     *
     * @desc The `$rowProxy$` lazy getter collection is returned by the `getRow` fallback.
     *
     * `$rowProxy$` collection is a dataRow-like object (a hash of column values keyed by column name)
     * for the particular row whose index is in the `$y$` property.
     *
     * The row index can be conveniently set with a call to `fallbacks.getRow()`,
     * which sets the row index and returns the accessor itself.
     *
     * `$y$` is a "hidden" property, non-enumerable it won't show up in `Object.keys(...)`.
     *
     * This fallback implementation is "lazy": The enumerable members are all getters that invoke `getValue` and setters that invoke `setValue`.
     *
     * This function should be called each time a new schema is set.
     */
    createDataRowProxy: function() {
        var dataModel = this.dataModel,
            dataRowProxy = {};

        Object.defineProperty(dataRowProxy, '$y$', {
            enumerable: false, // not a real data field
            writable: true // set later on calls to fallbacks.getRow(y) to y
        });

        this.schema.forEach(function(columnSchema, columnIndex) {
            Object.defineProperty(dataRowProxy, columnSchema.name, {
                enumerable: true, // is a real data field
                get: function() {
                    return dataModel.getValue(columnIndex, this.$y$);
                },
                set: function(value) {
                    return dataModel.setValue(columnIndex, this.$y$, value);
                }
            });
        });

        dataModel.$rowProxy$ = dataRowProxy;
    },

    /**
     * Create a new data model
     * @param {object} [options]
     * @param {DataModel} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    getNewDataModel: function(options) {
        var newDataModel;

        options = options || {};

        if (options.dataModel) {
            newDataModel = options.dataModel;
        } else if (options.DataModel) {
            newDataModel = new options.DataModel;
        } else {
            newDataModel = new DefaultDataModel;
        }

        return newDataModel;
    },

    /**
     * @summary Attach a data model object to the grid.
     * @desc Installs data model events, fallbacks, and hooks.
     *
     * Called from {@link Behavior#reset}.
     * @this {Behavior}
     * @param {object} [options]
     * @param {DataModel} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {DataModel} [options.metadata] - Passed to {@link DataModel#setMetadataStore setMetadataStore}.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    resetDataModel: function(options) {
        var newDataModel = this.getNewDataModel(options),
            changed = newDataModel && newDataModel !== this.dataModel;

        if (changed) {
            this.dataModel = this.decorateDataModel(newDataModel, options);
            decorators.addDeprecationWarnings.call(this);
            decorators.addFriendlierDrillDownMapKeys.call(this);
        }

        return changed;
    },

    /**
     * Decorate data model object, initialize its metadata store, and subscribe to its events.
     * @see {@link module:decorators.injectPolyfills injectPolyfills}
     * @see {@link module:decorators.injectCode injectCode}
     * @see {@link module:decorators.injectDefaulthooks injectDefaulthooks}
     * @param {DataModel} newDataModel
     * @param {DataModel} [options.metadata] - Passed to {@link DataModel#setMetadataStore setMetadataStore}.
     * @memberOf Local#
     */
    decorateDataModel: function(newDataModel, options) {
        decorators.injectPolyfills(newDataModel);
        decorators.injectCode(newDataModel);
        decorators.injectDefaulthooks(newDataModel);

        newDataModel.setMetadataStore(options && options.metadata);

        this.boundDispatchEvent = this.boundDispatchEvent || dispatchDataModelEvent.bind(this.grid);
        newDataModel.addListener(this.boundDispatchEvent);

        return newDataModel;
    },

    /**
     * @summary Map of drill down characters used by the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#charMap|charMap}
     * @type {{OPEN:string, CLOSE:string, INDENT:string}}
     * @memberOf Local#
     */
    get charMap() {
        return this.dataModel.drillDownCharMap;
    },

    /**
     * @summary Calls `click` on the data model if column is a tree column.
     * @desc Sends clicked cell's coordinates to the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#isDrillDown|isDrillDown}
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#click|click}
     * @param {CellEvent} event
     * @returns {boolean} If click was in a drill down column and click on this row was "consumed" by the data model (_i.e., caused it's state to change).
     * @memberOf Local#
     */
    cellClicked: function(event) {
        return this.dataModel.isDrillDown(event.dataCell.x) &&
            this.dataModel.click(event.dataCell.y);
    },

    hasTreeColumn: function(columnIndex) {
        return this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(columnIndex);
    }

});

/**
 * @this {Local}
 */
function createColumns() {
    this.schema.forEach(function(columnSchema) {
        this.addColumn(columnSchema);
    }, this);

    this.columnEnumSynchronize();
}

Local.prototype.mixIn(require('../columnEnum').mixin);

module.exports = Local;
