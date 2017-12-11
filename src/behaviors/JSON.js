'use strict';

var Behavior = require('./Behavior');
var columnEnumDecorators = require('./columnEnumDecorators');
var DataModelJSON = require('../dataModels/JSON');
var features = require('../features');

/**
 * @name behaviors.JSON
 * @desc > Same parameters as {@link behaviors.Behavior#initialize|initialize}, which is called by this constructor.
 * @constructor
 * @extends Behavior
 */
var JSON = Behavior.extend('behaviors.JSON', {

    preInitialize: function(grid, options) {
        this.columnEnum = {};
    },

    /**
     * @summary Constructor logic, called _after_{@link Behavior#initialize|Behavior.initialize()}.
     * @desc This method will be called upon instantiation of this class or of any class that extends from this class.
     * > All `initialize()` methods in the inheritance chain are called, in turn, each with the same parameters that were passed to the constructor, beginning with that of the most "senior" class through that of the class of the new instance.
     *
     * @memberOf behaviors.JSON.prototype
     */
    initialize: function(grid, options) {
        this.setData(options);
    },

    features: [
        features.Filters,
        features.CellSelection,
        features.KeyPaging,
        features.ColumnResizing,
        // features.RowResizing,
        features.RowSelection,
        features.ColumnSelection,
        features.ColumnMoving,
        features.ColumnSorting,
        features.CellClick,
        features.CellEditing,
        features.OnHover
    ],

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
     * @description Set the data field.
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     * @param {object} [options] - Takes first argument position when `dataRows` omitted.
     * @param {function|object} [options.data] - Array of uniform data row objects or function returning same.
     * Passed as 1st param to {@link dataModel.JSON#setData}. If falsy, method aborted.
     * @param {function|object} [options.fields] - Array of field names or function returning same.
     * Passed as 2nd param to {@link dataModel.JSON#setData}.
     * @param {function|object} [options.calculators] - Array of calculators or function returning same.
     * Passed as 3rd param to {@link dataModel.JSON#setData}.
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
            schemaChanged = schema || !this.subgrids.lookup.data.schema.length, // schema will change if a new schema was provided OR data model has an empty schema now, which triggers schema generation on setData below
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

        grid.allowEvents(this.dataModel.getRowCount() > 0);
    },

    /**
     * @summary Rebinds the data without reshaping it.
     * @desc See {@link behaviors.JSON#setData|setData}'s parameter descriptions.
     * @param dataRows
     * @param options
     * @memberOf behaviors.JSON.prototype
     */
    updateData: function(dataRows, options) {
        this.deprecated('updateData(dataRows, options)', 'setData(dataRows, options)', 'v1.2.10', arguments,
            'To update data without changing column definitions, call setData _without a schema._');
    },

    /**
     * @memberOf behaviors.JSON.prototype
     * @description Build the fields and headers from the supplied column definitions.
     * ```javascript
     * myJsonBehavior.setColumns([
     *     { header: 'Stock Name', name: 'short_description' },
     *     { header: 'Status', name: 'trading_phase' },
     *     { header: 'Reference Price', name: 'reference_price' }
     * ]);
     * ```
     * @param {Array} columnDefinitions - an array of objects with fields 'title', and 'field'
     */
    setColumns: function(columnDefinitions) {
        console.warn('This function does not do anything');
    },

    //Not being used. Should be repurposed??
    setDataProvider: function(dataProvider) {
        this.dataModel.setDataProvider(dataProvider);
    },

    hasHierarchyColumn: function() {
        return this.deprecated('hasHierarchyColumn()', 'hasTreeColumn()', '1.3.3', arguments);
    },

    hasTreeColumn: function() {
        return this.dataModel.isTree() && this.grid.properties.showTreeColumn;
    },

    getVisibleColumns: function() {
        return this.deprecated('getVisibleColumns()', 'getActiveColumns()', '1.0.6', arguments);
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    },
});

JSON.columnEnumDecorators = columnEnumDecorators;

module.exports = JSON;
