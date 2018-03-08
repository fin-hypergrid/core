'use strict';

var Behavior = require('./Behavior');


var warned = {};


/**
 * > This constructor (actually {@link behaviors.JSON#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @name behaviors.JSON
 * @constructor
 * @extends Behavior
 */
var JSON = Behavior.extend('behaviors.JSON', {

    get columnEnum() {
        if (!warned.columnEnum) {
            console.warn('.columnEnum has been deprecated as of v3.0.0 in favor of .schema. (Will be removed in a future release.) .schema now serves as a column enum, largely compatible with the deprecated property. Please see https://fin-hypergrid.github.io/doc/dataModel.api#initSchema for details.');
            warned.columnEnum = true;
        }
        return this.schema;
    },

    initialize: function(grid, options) {
        this.setData(options);
    },

    createColumns: function() {
        Behavior.prototype.createColumns.call(this);

        this.schema.forEach(function(columnSchema, index) {
            // todo these lines decorate schema but it should already be decorated but only on data-schema-changed event
            if (typeof columnSchema === 'string') {
                this.schema[index] = columnSchema = { name: columnSchema };
            }
            columnSchema.index = index;

            this.addColumn(columnSchema);
        }, this);
    },

    /**
     * @memberOf behaviors.JSON#
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
     * @memberOf behaviors.JSON#
     * @summary Set grid data.
     * @desc Exits without doing anything if no data (`dataRows` undefined or omitted and `options.data` undefined).
     *
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     *
     * @param {object} [options] - _(Promoted to first argument position when `dataRows` omitted.)_
     *
     * @param {function|object[]} [options.data] - Passed to behavior constructor. May be:
     * * An array of congruent raw data objects
     * * A function returning same
     * * Omit for non-local datasources
     *
     * @param {function|menuItem[]} [options.schema] - Passed to behavior constructor. May be:
     * * A schema array
     * * A function returning same. Called at filter reset time with behavior as context.
     * * Omit to allow the data model to generate a basic schema from its data.
     *
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
            dataModel.setData(dataRows, schema);
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

    hasTreeColumn: function(columnIndex) {
        return this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(columnIndex);
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    }
});


// deprecate columnEnumDecorator and columnEnumKey

var deprecatedColumnEnumDecorators = {};
var columnEnumDeprecationDescriptor = {
    get: function() {
        warnColumnEnumDeprecation();
        return deprecatedColumnEnumDecorators;
    },
    set: function(x) {
        warnColumnEnumDeprecation();
    }
};

function warnColumnEnumDeprecation() {
    if (!warned.columnEnumDecorators) {
        console.warn('.columnEnumDecorators and .columnEnumKey have both been deprecated as of v3.0.0 and no longer have any meaning. (Will be removed in a future release.) Note that .columnEnum is also deprecated in favor of .schema, which now serves as a column enum. (See https://fin-hypergrid.github.io/doc/dataModel.api#initSchema.)');
        warned.columnEnumDecorators = true;
    }
}

Object.defineProperty(JSON.prototype, 'columnEnumKey', columnEnumDeprecationDescriptor);
Object.defineProperty(JSON.prototype, 'columnEnumDecorators', columnEnumDeprecationDescriptor);
Object.defineProperty(JSON, 'columnEnumDecorators', columnEnumDeprecationDescriptor);


module.exports = JSON;
