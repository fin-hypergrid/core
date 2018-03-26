'use strict';

// To finally remove, delete this file and all lines in other files with "// columnEnum deprecated" comment.

var warned = {};

var columnEnumKey = function() {};
var columnEnumDecorators = {};

function warnColumnEnumDeprecation() {
    if (!warned.columnEnumDecorators) {
        console.warn('.columnEnumDecorators and .columnEnumKey have both been deprecated as of v3.0.0 and no longer have any meaning. (Will be removed in a future release.) Note that .columnEnum[propName] is also deprecated in favor of either .getColumns()[propName].index or .schema[propName].index.');
        warned.columnEnumDecorators = true;
    }
}

exports.descriptors = {
    columnEnum: {
        get: function() {
            if (!warned.columnEnum) {
                console.warn('.columnEnum[propName] has been deprecated as of v3.0.0 in favor of either .getColumns()[propName].index or .schema[propName].index. (Will be removed in a future release.)');
                warned.columnEnum = true;
            }
            return this._columnEnum;
        }
    },

    columnEnumKey: {
        get: function() {
            warnColumnEnumDeprecation();
            return columnEnumKey;
        },
        set: warnColumnEnumDeprecation
    },

    columnEnumDecorators: {
        get: function() {
            warnColumnEnumDeprecation();
            return columnEnumDecorators;
        },
        set: warnColumnEnumDeprecation
    }
};
