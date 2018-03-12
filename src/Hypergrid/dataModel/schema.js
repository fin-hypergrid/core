'use strict';

/**
 * @module dataModel/schema
 */

var headerifiers = require('../../lib/headerifiers');

/**
 * @function module:dataModel/schema.enrich
 * @summary Called via `data-schema-changed` event by data model implementation of `setSchema` when implemented, otherwise by `getSchema`, whenever the schema changes.
 *
 * Enriches schema. For each "column schema" (element of schema array):
 *
 * 1. Objectify column schemata<br>
 * Ensures each column schema is an object with a `name` property.
 * 2. Index schema schemata<br>
 * Adds an `index` property to each column schema element.
 * 3. Create enum entries<br>
 * Constructs an enum directly on the schema array object itself. This is a convenience feature, helpful for looking up column schema by column name rather than by index. To get the index of a column when you know the name:
 * ```javascript
 * var schema = dataModel.getSchema();
 * var columnName = 'foo';
 * var columnIndex = schema[columnName].index;
 * ```
 * 4. Create data row proxy<br>
 * Creates a proxy object with getters for each field to be used as a fallback when `getRow` is not implemented.
 *
 * @param {dataRowObject[]}
 *
 * @this {Hypergrid}
 */
exports.enrich = function(schema) {
    var dataModel = this.behavior.dataModel;

    schema = schema || dataModel.getSchema();

    // Make sure each element of `schema` is an object with a `name` property.
    schema.forEach(function(columnSchema, index) {
        if (typeof columnSchema === 'string') {
            schema[index] = { name: columnSchema };
        }
    });

    // There shouldn't be any meta data columns in the schema proper.
    schema = schema.filter(function(columnSchema) {
        return columnSchema.name.substr(0, 2) !== '__';
    });

    // Set `index` property.
    schema.forEach(function(columnSchema, index) {
        columnSchema.index = index;
    });

    // Set `header` property.
    var headerifier = headerifiers[this.properties.headerify];
    if (headerifier) {
        schema.forEach(function(columnSchema) {
            if (!columnSchema.header) {
                columnSchema.header = headerifier(columnSchema.name);
            }
        });
    }

    initSchemaEnum.call(dataModel);

    initDataRowProxy.call(dataModel);
};

// schema dictionary (enum)

// all instances of xX or _X
var REGEX_CAMEL_CASE_OR_UNDERSCORE = /([^_A-Z])([A-Z]+)/g;
var REGEX_ALL_PUNC_RUN = /[^a-z0-9]+/gi;

// all instances of _x
var REGEX_ALL_PUNC_RUN_BEFORE_LETTER = /[^a-z0-9]+([a-z0-9])?/ig;
function WITH_UPPER_CASE(match, char) { return char === undefined ? '' : char.toUpperCase(); }

var REGEX_INITIAL_DIGIT = /^(\d)/;
var WITH_DOLLAR_PREFIX = '$$$1';

var REGEX_INITIAL_CAPITAL = /^([A-Z])/;
function WITH_LOWER_CASE(match, char) { return char.toLowerCase(); }

// Pass through as is.
function passThrough(key) {
    return key;
}

// Convert runs of punctuation to camel case by captializing following letter.
// Otherwise, leaves other letters' case as they were.
// If result starts with digit, prefix with '$'.
function toCamelCase(key) {
    return key
        .replace(REGEX_ALL_PUNC_RUN_BEFORE_LETTER, WITH_UPPER_CASE)
        .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
        .replace(REGEX_INITIAL_CAPITAL, WITH_LOWER_CASE);
}

// Convert all runs of punctuation and camel case transitions to underscore.
// If result starts with digit, prefix with '$'.
// Convert result to all caps.
function toAllCaps(key) {
    return key
        .replace(REGEX_ALL_PUNC_RUN, '_')
        .replace(REGEX_CAMEL_CASE_OR_UNDERSCORE, '$1_$2')
        .replace(REGEX_INITIAL_DIGIT, WITH_DOLLAR_PREFIX)
        .toUpperCase();
}

var converters = [passThrough, toCamelCase, toAllCaps];

/**
 * @summary Build schema dictionary (enum)
 * @desc For each column schema in the schema array, adds three properties to the array object:
 * * name, verbatim
 * * name, transformed to all-caps with runs of punctuation and camel case transitions to underscore converted to underscore
 * * name, transformed to camelCase with runs of punctuation removed and the next letter capitalized
 *
 * Conflicts can obviously arise, in which case who's ever first wins.
 * @this {dataModelAPI}
 */
function initSchemaEnum() {
    var schema = this.getSchema();

    schema.forEach(function(columnSchema, columnIndex) {
        converters.forEach(function(converter) {
            var convertedKey = converter(columnSchema.name);
            if (!(convertedKey in schema)) {
                schema[convertedKey] = schema[columnIndex];
            }
        });
    });
}


/**
 * @summary Build the `dataRowProxy` getter collection based on current `schema`.
 *
 * @desc The `dataRowProxy` collection is returned by the `getRow` fallback.
 *
 * `dataRowProxy` collection is a dataRow-like object (a hash of column values keyed by column name)
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
 *
 * @this {dataModelAPI}
 */
function initDataRowProxy() {
    var dataModel = this,
        dataRowProxy = {};

    Object.defineProperty(dataRowProxy, '$y$', {
        enumerable: false, // not a real data field
        writable: true // set later on calls to fallbacks.getRow(y) to y
    });

    dataModel.getSchema().forEach(function(columnSchema, columnIndex) {
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

    dataModel.dataRowProxy = dataRowProxy;
}
