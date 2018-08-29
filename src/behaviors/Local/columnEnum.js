'use strict';

// `columnEnum` et al, have been deprecated as of 3.0.0 in favor of accessing column schema
// through .schema, .columns, and .allColumns, all of which now sport self-referential dictionaries.
// To finally remove, delete this file and all lines using `_columnEnum`

var ArrayDecorator = require('synonomous');
var transformers = require('synonomous/transformers');

var warned = {};

function warnColumnEnumDeprecation(method, msg) {
    if (!warned[method]) {
        console.warn('.' + method + ' has been deprecated as of v3.0.0. (Will be removed in a future release.) ' + (msg || ''));
        warned[method] = true;
    }
}

exports.mixin = {
    columnEnumSynchronize: function() {
        this._columnEnumKey = this._columnEnumKey || 'toAllCaps';

        var columnEnum = this._columnEnum || (this._columnEnum = {}),
            allColumns = this.allColumns,
            arrayDecorator = new ArrayDecorator({ transformations: [this._columnEnumKey] }),
            dict = arrayDecorator.decorateArray(allColumns.slice());

        dict.length = 0;
        Object.keys(dict).reduce(function(columnEnum, key) {
            columnEnum[key] = dict[key].index;
            return columnEnum;
        }, columnEnum);

        // clean up
        Object.keys(columnEnum).forEach(function(key) {
            if (!(key in dict)) {
                delete columnEnum[key];
            }
        });
    },

    get columnEnum() {
        if (!warned.columnEnum) {
            console.warn('.columnEnum[propName] has been deprecated as of v3.0.0 in favor of either .getColumns()[propName].index or .schema[propName].index. (Will be removed in a future release.)');
            warned.columnEnum = true;
        }
        return this._columnEnum;
    },

    get columnEnumKey() {
        warnColumnEnumDeprecation('columnEnumKey');
        return this._columnEnumKey === 'verbatim' ? 'passThrough' : this._columnEnumKey;
    },
    set columnEnumKey(transformer) {
        warnColumnEnumDeprecation('columnEnumKey');
        var type = typeof transformer,
            keys = Object.keys(transformers);
        switch (type) {
            case 'string':
                if (transformer === 'passThrough') {
                    transformer = 'verbatim';
                } else if (!(transformer in transformers)) {
                    throw new this.HypergridError('Expected registered transformer for .columnEnumKey value from: ' + keys);
                }
                this._columnEnumKey = transformer;
                break;
            case 'function':
                this._columnEnumKey = keys.find(function(key) { return transformer === transformers[key]; });
                if (!this._columnEnumKey) {
                    throw new this.HypergridError('.columnEnumKey has been deprecated as of v3.0.0 and now accepts a function reference (or string key) from require("synonmous/transformers"): ' + keys);
                }
                break;
            default:
                throw new this.HypergridError('Expected string or function for .columnEnumKey assignment but received ' + type + '.');
        }
    }
};

exports.mixInShared = {
    get columnEnumDecorators() {
        warnColumnEnumDeprecation('columnEnumDecorators');
        return transformers;
    }
};
