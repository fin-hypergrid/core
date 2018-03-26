'use strict';

/**
 * @module fields
 */

var Decorator = require('synonomous');

var REGEXP_META_PREFIX = /^__/; // starts with double underscore

var api = {

    /**
     * @function module:fields.decorate
     * @summary Decorate given schema based on `name` property of each element:
     * * Decorate `schema` (array object) with synonyms.
     * * _Iff `headerfierName` given: Decorate each element with `header` property (when undefined)
     * @param {columnSchema[]} schema
     * @param {string} [headerifierName] - Name of string transformer to use to generate headers (from column names) for those columns without defined headers.
     * @returns {columnSchema[]} Array object also decroated with synonyms for elements.
     */
    decorate: function(schema, headerifierName) {
        var decorator = new Decorator;

        decorator.decorateArray(schema);

        decorator.transformations = { toTitle: 'header' };
        decorator.decorateArray(schema);

        return schema;
    },

    /**
     * @function module:fields.normalize
     * @summary Normalizes and returns given schema array.
     * @desc For each "column schema" (element of schema array):
     *
     * 1. Objectify column schemata<br>
     * Ensures each column schema is an object with a `name` property.
     * 2. Index schema schemata<br>
     * Adds an `index` property to each column schema element.
     * 3. Decorates schema<br>
     * Decorates the schema array object itself with column names and column name synonyms. This is helpful for looking up column schema by column name rather than by index. To get the index of a column when you know the name:
     * ```javascript
     * var schema = dataModel.getSchema();
     * var columnName = 'foo';
     * var columnIndex = schema[columnName].index;
     * ```
     * 4. Adds missing headers.
     *
     * This function is safe to call repeatedly.
     *
     * Called via `data-schema-changed` event by data model implementation of `setSchema`.
     *
     * @param {rawColumnSchema[]} schema
     * @returns {columnSchema[]}
     */
    normalize: function(schema, headerifierName) {
        // Make sure each element of `schema` is an object with a `name` property.
        schema.forEach(function(columnSchema, index) {
            if (typeof columnSchema === 'string') {
                schema[index] = {
                    name: columnSchema
                };
            }
        });

        // Remove all meta data columns from schema
        for (var i = schema.length; i--;) {
            if (REGEXP_META_PREFIX.test(schema[i].name)) {
                schema.splice(i, 1);
            }
        }

        // Set `index` property.
        schema.forEach(function(columnSchema, index) {
            columnSchema.index = index;
        });

        return schema;
    },

    /**
     * @function module:fields.getFieldNames
     * @summary Get keys of given hash with "metakeys" filtered out.
     * @desc Metakeys are keys beginning with a double-underscore.
     *
     * DO NOT REMOVE -- Not used in fin-hypergrid/core but has legacy exposure.
     * @param {object} hash
     * @returns {string[]} Member names from `hash` that do _not_ begin with double-underscore.
     */
    getFieldNames: function(hash) {
        return Object.keys(hash || {}).filter(function(fieldName) {
            return !REGEXP_META_PREFIX.test(fieldName);
        });
    },

    /**
     * @function module:fields.titleize
     * @desc Used by {@link module:fields.getSchema getSchema}.
     * Override as needed for different titleization flavor.
     * @param {string} key
     * @returns {string} Title version of key (for use as column header).
     */
    titleize: require('synonomous/transformers').toTitle,

    /**
     * @function module:fields.getSchema
     * @summary Returns a schema derived from given sample data row with "metakeys" filtered out.
     * @desc Metakeys are keys beginning with a double-underscore.
     *
     * DO NOT REMOVE -- Not used in fin-hypergrid/core but has legacy exposure.
     * @param {dataRowObject[]} [data]
     * @returns {columnSchema[]} Array object also decroated with synonyms for elements.
     */
    getSchema: function(data) {
        var dataRow = data && data[0] || {},
            schema = api.getFieldNames(dataRow);

        api.normalize(schema);
        api.decorate(schema, 'toTitle');

        return schema;
    }
};

module.exports = api;
