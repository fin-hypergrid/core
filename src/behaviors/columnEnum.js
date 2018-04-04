'use strict';

// `columnEnum` et al, have been deprecated as of 3.0.0 in favor of accessing column schema
// through .schema, .columns, and .allColumns, all of which now sport self-referential dictionaries.
// To finally remove, delete this file and all lines using `_columnEnum`

var ArrayDecorator = require('synonomous');

var warned = {};

var columnEnumKey = function() {};
var columnEnumDecorators = {};

function warnColumnEnumDeprecation() {
    if (!warned.columnEnumDecorators) {
        console.warn('.columnEnumDecorators and .columnEnumKey have both been deprecated as of v3.0.0 and no longer have any meaning. (Will be removed in a future release.) Note that .columnEnum[propName] is also deprecated in favor of either .getColumns()[propName].index or .schema[propName].index.');
        warned.columnEnumDecorators = true;
    }
}

exports.mixin = {
    columnEnumSynchronize: function() {
        var columnEnum = this._columnEnum || (this._columnEnum = {}),
            allColumns = this.allColumns,
            arrayDecorator = new ArrayDecorator({ transformations: ['verbatim', 'toCamelCase', 'toAllCaps'] }),
            dict = arrayDecorator.decorateArray(allColumns.slice());

        dict.length = 0;
        Object.assign(columnEnum, dict);

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
        warnColumnEnumDeprecation();
        return columnEnumKey;
    },
    set columnEnumKey($) {
        warnColumnEnumDeprecation();
    },

    get columnEnumDecorators() {
        warnColumnEnumDeprecation();
        return columnEnumDecorators;
    },
    set columnEnumDecorators($) {
        warnColumnEnumDeprecation();
    }
};
