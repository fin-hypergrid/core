'use strict';

var Behavior = require('./Behavior');
var columnEnumDecorators = require('./columnEnumDecorators');
var DataModelJSON = require('../dataModels/JSON');

/**
 * > This constructor (actually {@link behaviors.JSON#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @name behaviors.JSON
 * @constructor
 * @extends Behavior
 */
var JSON = Behavior.extend('behaviors.JSON', {

    preInitialize: function(grid, options) {
        this.columnEnum = {};
    },

    initialize: function(grid, options) {
        this.setData(options);
    },

    createColumns: function() {
        Behavior.prototype.createColumns.call(this);

        var columnEnum = this.columnEnum;

        Object.keys(columnEnum).forEach(function(propName) {
            delete columnEnum[propName];
        });

        this.dataModel.schema.forEach(function(columnSchema, index) {
            this.addColumn({
                index: index,
                header: columnSchema.header,
                calculator: columnSchema.calculator
            });

            columnEnum[this.columnEnumKey(columnSchema.name)] = index;
        }, this);
    },

    /**
     * @summary Style enum keys.
     * @desc Override this method to style your keys to your liking.
     * @see {@columnEnumDecorators} or roll your own
     * @param key
     * @returns {string}
     * @memberOf behaviors.JSON.prototype
     */
    columnEnumKey: columnEnumDecorators.toAllCaps,

    getNewDataModel: function(options) {
        return new DataModelJSON(this.grid, options);
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Set the header labels.
     * @param {string[]|object} headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders: function(headers) {
        if (headers instanceof Array) {
            // Reset all headers
            var allColumns = this.allColumns;
            headers.forEach(function(header, index) {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this.allColumns.forEach(function(column) {
                if (headers[column.name]) {
                    column.header = headers[column.name];
                }
            });
        }
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @summary Set grid data.
     * @desc Exits without doing anything if:
     * * `dataRows` undefined; or
     * * `dataRows` omitted and `options.data` undefined
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     * Passed as 1st param to {@link dataModel.JSON#setData}.
     * @param {object} [options] - Takes first argument position when `dataRows` omitted.
     * @param {function|object} [options.data] - Array of uniform data row objects or function returning same.
     * Only used when `dataRows` was omitted.
     * @param {function|object} [options.schema] - Array of column schema objects or function returning same.
     * Passed as 2nd param to {@link dataModel.JSON#setData}.
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined) {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Expected data to be an array (of data row objects).';
        }

        options = options || {};

        var grid = this.grid,
            schema = this.unwrap(options.schema), // *always* define a new schema on reset
            schemaChanged = schema || !this.subgrids.lookup.data.getColumnCount(), // schema will change if a new schema was provided OR data model has an empty schema now, which triggers schema generation on setData below
            reindex = options.apply === undefined || options.apply; // defaults to true

        // Inform interested data models of data.
        this.subgrids.forEach(function(dataModel) {
            if (dataModel.setData && !dataModel.hasOwnData) {
                dataModel.setData(dataRows, schema);
            }
        });

        if (grid.cellEditor) {
            grid.cellEditor.cancelEditing();
        }

        if (reindex) {
            this.reindex();
        }

        if (schemaChanged) {
            this.createColumns();
        }

        grid.allowEvents(this.getRowCount());
    },

    //Not being used. Should be repurposed??
    setDataProvider: function(dataProvider) {
        this.dataModel.setDataProvider(dataProvider);
    },

    hasTreeColumn: function() {
        return this.grid.properties.showTreeColumn && this.dataModel.isTree();
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    }
});


JSON.columnEnumDecorators = columnEnumDecorators;

module.exports = JSON;
