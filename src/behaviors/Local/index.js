'use strict';

var Behavior = require('../Behavior');

/** @name DataSource
 * @memberOf Behavior#
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated `Hypergrid` objects without `DataSource` or `dataSource` options specified. Scheduled for removal in next version (v4).
 */
var DefaultDataModel = require('datasaur-local');

var decorators = require('./decorators');


/**
 * This class mimics the {@link dataModelAPI}.
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
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getSchema|getSchema}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#setSchema|setSchema}
     * @type {Array}
     * @memberOf Behavior#
     */
    get schema() {
        return this.dataModel.getSchema();
    },
    set schema(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    createColumns: function() {
        this.super.createColumns.call(this);

        // columnEnum deprecated
        // empty the enum without recreating it
        var columnEnum = this._columnEnum;
        Object.keys(columnEnum).forEach(function(propName) {
            delete columnEnum[propName];
        });

        this.schema.forEach(function(columnSchema, index) {
            // make sure the schema is decorated in case it was set by app and not decorated by data-schema-changed event
            if (typeof columnSchema === 'string') {
                this.schema[index] = columnSchema = { name: columnSchema };
            }
            columnSchema.index = index;

            this.addColumn(columnSchema);
        }, this);
    },

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
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
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
     * @param {dataModelAPI} newDataModel
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
     */
    decorateDataModel: function(newDataModel, options) {
        decorators.addPolyfills(newDataModel);
        decorators.addFallbacks(newDataModel, this.grid);
        decorators.addDefaultHooks(newDataModel);

        newDataModel.setMetadataStore(options && options.metadata);

        return newDataModel;
    },

    /**
     * @summary Map of drill down characters used by the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#charMap|charMap}
     * @type {{OPEN:string, CLOSE:string, INDENT:string}}
     * @memberOf Behavior#
     */
    get charMap() {
        return this.dataModel.drillDownCharMap;
    },

    /**
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @param {dataModelAPI} [dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid. If given, x and y are interpreted as data cell coordinates (unadjusted for scrolling). Does not default to the data subgrid, although you can provide it explicitly (`this.subgrids.lookup.data`).
     * @memberOf Behavior#
     */
    getValue: function(xOrCellEvent, y, dataModel) {
        if (typeof xOrCellEvent !== 'object') {
            var x = xOrCellEvent;
            xOrCellEvent = new this.CellEvent;
            if (dataModel) {
                xOrCellEvent.resetDataXY(x, y, dataModel);
            } else {
                xOrCellEvent.resetGridCY(x, y);
            }
        }
        return xOrCellEvent.value;
    },

    /**
     * @memberOf Behavior#
     * @desc update the data at point x, y with value
     * @return The data.
     * @param {CellEvent|number} xOrCellEvent - Grid column coordinate.
     * @param {number} [y] - Grid row coordinate. Omit if `xOrCellEvent` is a CellEvent.
     * @param {Object} value - The value to use. _When `y` omitted, promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid. If given, x and y are interpreted as data cell coordinates (unadjusted for scrolling). Does not default to the data subgrid, although you can provide it explicitly (`this.subgrids.lookup.data`).
     * @return {boolean} Consumed.
     */
    setValue: function(xOrCellEvent, y, value, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            value = y;
        } else {
            var x = xOrCellEvent;
            xOrCellEvent = new this.CellEvent;
            if (dataModel) {
                xOrCellEvent.resetDataXY(x, y, dataModel);
            } else {
                xOrCellEvent.resetGridCY(x, y);
            }
        }
        xOrCellEvent.value = value;
    },

    /**
     * @summary Calls `apply()` on the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#reindex|reindex}
     * @memberOf Behavior#
     */
    reindex: function() {
        this.dataModel.apply();
    },

    /**
     * @summary Gets the number of rows in the data subgrid.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRowCount|getRowCount}
     * @memberOf Behavior#
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    /**
     * Retrieve a data row from the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRow|getRow}
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
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getData|getData}
     * @return {dataRowObject[]}
     * @memberOf Behavior#
     */
    getData: function() {
        return this.dataModel.getData();
    },

    /**
     * @summary Calls `click` on the data model if column is a tree column.
     * @desc Sends clicked cell's coordinates to the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#isDrillDown|isDrillDown}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#click|click}
     * @param {CellEvent} event
     * @returns {boolean} If click was in a drill down column and click on this row was "consumed" by the data model (_i.e., caused it's state to change).
     * @memberOf Behavior#
     */
    cellClicked: function(event) {
        return this.dataModel.isDrillDown(event.dataCell.x) &&
            this.dataModel.click(event.dataCell.y);
    },

    hasTreeColumn: function(columnIndex) {
        return this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(columnIndex);
    }

});

Object.defineProperties(Local.prototype, require('../columnEnum').descriptors); // columnEnum deprecated

module.exports = Local;
