'use strict';

var DataSourceBase = require('./DataSourceBase');

/**
 * See {@link DataSourceOrigin#initialize} for constructor parameters.
 * @constructor
 */
var DataSourceOrigin = DataSourceBase.extend('DataSourceOrigin',  {

    /**
     * Currently a synonym for {@link DataSourceOrigin#setData} (see).
     */
    initialize: function(data, schema) {
        delete this.dataSource; // added by DataSourceBase#initialize but we don't want here
        this.setData.apply(this, arguments);
        this.setSchema(schema);
    },

    setData: setData,

    setSchema: function(schema){
        var fields = computeFieldNames(this.data[0]);
        if (!schema) {
            schema = Array(fields.length);
        }

        schema.forEach(function(columnSchema, i) {
            if (!columnSchema.name) {
                columnSchema.name = fields[i];
            }
        });

        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSource#
         */
        this.schema = schema;
    },

    isNullObject: false,

    getDataIndex: function(y) {
        return y;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param y
     * @returns {object[]}
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
        return row[this.fields[x]];
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        this.getRow(y)[this.fields[x]] = value;
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
        return this.getFields().length;
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {number[]}
     */
    getFields: function() {
        if (!this.warnedGetFields) {
            console.warn('The returned fields array is a now a copy. DO NOT MUTATE.');
            this.warnedGetFields = true;
        }
        return this.schema.map(function(columnSchema) {
            return columnSchema.name;
        });
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {string[]}
     */
    getHeaders: function() {
        if (!this.warnedGetHeaders) {
            console.warn('The returned headers array is a now a copy. DO NOT MUTATE.');
            this.warnedGetHeaders = true;
        }
        return this.schema.map(function(columnSchema) {
            return columnSchema.header;
        }, this);
    },

    /**
     * @memberOf DataSourceOrigin#
     * @returns {string[]}
     */
    getDefaultHeaders: function() {
        return this.getFields();
    },

    /**
     * @memberOf DataSourceOrigin#
     * @param {string[]} fields
     */
    setFields: function(fields) {
        if (!(Array.isArray(fields) && fields.length === this.schema.length)) {
            throw new this.HypergridError('Expected argument to be an array with correct length.');
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
            //throw new this.HypergridError('Expected argument to be an array with correct length.');
            return;
        }

        headers.forEach(function(header, i) {
            this.schema[i].header = header;
        }, this);


    },

    /**
     * @memberOf DataSourceOrigin#
     */
    getGrandTotals: function() {
        return [];
    },
    /**
     * @memberOf DataSourceOrigin#
     */
    isDrillDown: function() {
        return false;
    },

    transform: passthrough,
    capitalize: capitalize
});

/** @typdef {object} columnSchemaObject
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
function setData(data) {
    if (!data) {
        data = [];
    }

    /**
     * @summary The array of uniform data objects.
     * @name schema
     * @type {columnSchemaObject[]}
     * @memberOf DataSource#
     */
    this.data = data;
}


function capitalize(string) {
    return (/[a-z]/.test(string) ? string : string.toLowerCase())
        .replace(/[\s\-_]*([^\s\-_])([^\s\-_]+)/g, replacer)
        .replace(/[A-Z]/g, ' $&')
        .trim();
}

function replacer(a, b, c) {
    return b.toUpperCase() + c;
}

function passthrough(string) {
    return string;
}

/**
 * @private
 * @param {object} object
 * @returns {string[]}
 */
function computeFieldNames(object) {
    if (!object) {
        return [];
    }
    return Object.getOwnPropertyNames(object || []).filter(function(e) {
        return e.substr(0, 2) !== '__';
    });
}

module.exports = DataSourceOrigin;
