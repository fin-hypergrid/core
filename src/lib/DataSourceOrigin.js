/* eslint-env browser */

'use strict';

var DataSourceBase = require('fin-hypergrid-data-source-base');

var getFieldNames = require('./fields').getFieldNames;

/**
 * See {@link DataSourceOrigin#initialize} for constructor parameters.
 * @constructor
 */
var DataSourceOrigin = DataSourceBase.extend('DataSourceOrigin',  {

    /**
     * Currently a synonym for {@link DataSourceOrigin#setData} (see).
     */
    initialize: function(data, schema, ti, ri) {
        delete this.dataSource; // added by DataSourceBase#initialize but we don't want here
        this.treeColumnIndex = ti;
        this.rowColumnIndex = ri;
        this._schema = setInternalColSchema.call(this, []);
        this.setData(data, schema);
    },

    /** @typedef {object} columnSchemaObject
     * @property {string} name - The required column name.
     * @property {string} [header] - An override for derived header
     * @property {function} [calculator] - A function for a computed column. Undefined for normal data columns.
     * @property {string} [type] - Used for sorting when and only when comparator not given.
     * @property {object} [comparator] - For sorting, both of following required:
     * @property {function} comparator.asc - ascending comparator
     * @property {function} comparator.desc - descending comparator
     */

    /**
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DataSourceOrigin#
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSourceOrigin#
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    get schema() { return this._schema; },
    set schema(schema) {
        schema = setInternalColSchema.call(this, schema);
        this._schema = schema;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {columnSchemaObject[]}
     */
    getSchema:  function(){
        return this._schema;
    },
    /**
     * @memberOf DataSourceOrigin#
     * Caveat: Do not call on a data update when you expect to reuse the existing schema.
     * @param schema
     */
    setSchema: function(schema){
        if (!schema.length) {
            var fields = getFieldNames(this.data[0]);

            schema = Array(fields.length);

            for (var i = 0; i < fields.length; i++) {
                schema[i] = { name: fields[i] };
            }
        }
        schema = setInternalColSchema.call(this, schema);
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSourceOrigin#
         */
        this._schema = schema;
    },

    isNullObject: false,

    getDataIndex: function(y) {
        return y;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param y
     * @returns {dataRowObject}
     */
    getRow: function(y) {
        return this.data[y];
    },

    /**
     * @summary Find, replace, or update a row by it's primary key column.
     * @param {string|object} columnName - One of:
     * * _string_ - Column name. See `value`.
     * * _object_ - Hash of 0 or more key-value pairs to search for.
     * @param {string[]|*} [value] - One of:
     * _omitted_ - When `columnName` is a hash and you want to search all its keys.
     * _string[]_ - When `columnName` is a hash but you only want to search certain keys.
     * _otherwise_ - When `columnName` is a string. Value to search for.
     * Note that `null` is a valid search value.
     * @param {object|null|undefined} [replacement] - One of:
     * * _omitted_ - Ignored.
     * * _object_ - Replacement for the data row if found.
     * * `null` - Flag to delete the data row if found. The found data row is nonetheless returned.
     * * `undefined` - Flag to return index of found row instead of row object itself.
     * @returns {object|number|undefined} One of:
     * * `undefined` - data row not found
     * * _object_ - found data row object (will have been deleted if `replacement` was `null`)
     * * _number_ - index of found data row object in `this.data` (if `replacement` was `undefined`)
     * @todo Use a binary search (rather than `Array..find`) when column is known to be indexed (sorted).
     * @memberOf DataSourceOrigin#
     */
    findRow: function findRow(columnName, value, replacement) {
        var result, index, keys, hash, args;

        if (typeof columnName === 'object') {
            hash = columnName;

            if (value instanceof Array) {
                args = 2;
                keys = value;
                if (keys.reduce(function(sum, key) {
                        if (key in hash) {
                            sum++;
                        }
                        return sum;
                    }, 0) !== keys.length) {
                    throw 'Expected all keys given in 2nd arg to be found in hash given in 1st arg.';
                }
            } else {
                args = 1;
                keys = Object.keys(hash);
                replacement = value; // promote
            }

            if (keys.length === 1) {
                columnName = keys[0];
                value = hash[columnName];
                hash = undefined;
            } else if (keys.length) {
                result = this.data.find(function(row, idx) {
                    if (!row) {
                        return;
                    }
                    index = idx;
                    for (var key in keys) {
                        columnName = keys[key];
                        if (row[columnName] !== hash[columnName]) {
                            return; // bail
                        }
                    }
                    return true; // found!
                });
            }
        } else {
            if (arguments.length < 2) {
                throw 'Expected at least 2 arguments when first argument not object but found ' + arguments.length + '.';
            }
            args = 2;
        }

        if (!hash) {
            result = this.data.find(function(row, idx) {
                if (!row) { return; }
                index = idx;
                return row[columnName] === value;
            });
        }

        if (result) {
            this.foundRowIndex = index;
            if (replacement === null) {
                this.data.splice(index, 1);
            } else if (typeof replacement === 'object') {
                this.data[index] = replacement;
            } else if (replacement === undefined) {
                if (arguments.length > args) {
                    delete this.data[index];
                }
            } else {
                throw 'Expected null, undefined, or object but found ' + typeof replacement + '.';
            }
        } else {
            this.foundRowIndex = undefined;
        }

        return result;
    },

    /**
     * @summary Find, replace, or update a row by it's index.
     * @param {number} index - Row index that is being accessed
     * @param {object|null|undefined} [replacement] - One of:
     * * _omitted_ - Ignored.
     * * _object_ - Replacement for the data row if found.
     * * `null` - Flag to delete the data row if found. The found data row is nonetheless returned.
     * * `undefined` - Flag to delete the row at that index.
     * @returns {object|number|undefined} One of:
     * * `undefined` - data row not found
     * * _object_ - found data row object (will have been deleted if `replacement` was `null`)
     * @todo Use a binary search (rather than `Array..find`) when column is known to be indexed (sorted).
     * @memberOf DataSourceOrigin#
     */
    findRowByIndex: function findRow(index, replacement) {
        var result;

        if (arguments.length < 1) {
            throw 'Expected at least 1 argument but found ' + arguments.length + '.';
        }

        if (typeof index !== 'number') {
            throw 'Expected at index to be a number but got ' + index + '.';
        }

        result = this.data[index];

        if (result) {
            if (replacement === null) {
                this.data.splice(index, 1);
            } else if (typeof replacement === 'object') {
                this.data[index] = replacement;
            } else if (replacement === undefined && arguments.length >= 2) {
                delete this.data[index];
            } else if (replacement !== undefined) {
                throw 'Expected null, undefined, or object but found ' + typeof replacement + '.';
            }
        }

        return result;
    },


    /**
     * @memberOf DataSourceOrigin#
     * @param x
     * @param y
     * @returns {*}
     */
    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[this.schema[x].name];
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        this.getRow(y)[this.schema[x].name] = value;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {number}
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {number}
     */
    getColumnCount: function() {
        return this.schema.length;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {number[]}
     */
    getFields: function() {
        return this.schema.map(function(columnSchema) { return columnSchema.name; });
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {string[]}
     */
    getHeaders: function() {
        return this.schema.map(function(columnSchema) { return columnSchema.header; });
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param {string[]} fields
     */
    setFields: function(fields) {
        if (!(Array.isArray(fields) && fields.length === this.schema.length)) {
            throw new this.DataSourceError('Expected argument to be an array with correct length.');
        }
        fields.forEach(function(field, i) {
            this.schema[i].field = field;
        }, this);
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param {string[]} [headers] - If omitted, headers will be reset to their derived defaults on next call to `getHeaders`.
     */
    setHeaders: function(headers) {
        if (!(Array.isArray(headers) && headers.length === this.schema.length)) {
            throw new this.DataSourceError('Expected argument to be an array with correct length.');
        }
        headers.forEach(function(header, i) {
            this.schema[i].header = header;
        }, this);
    }
});

function setInternalColSchema(schema) {
    if (!schema[this.treeColumnIndex]) {
        schema[this.treeColumnIndex] = {name: 'Tree', header: 'Tree'}; //Tree Column
    }
    if (!schema[this.rowColumnIndex]) {
        schema[this.rowColumnIndex] = {name: '', header: ''}; //Row Handle Column
    }
    return schema;
}


module.exports = DataSourceOrigin;


// Create the `datasaur` namespace and the `datasaur.base` object for use by data sources included via <script> tags:
(window.datasaur = window.datasaur || {}).base = require('fin-hypergrid-data-source-base');
