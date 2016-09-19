'use strict';

/**
 * @param {function|string} string
 * @returns {function}
 * @private
 */
function toFunction(string) {
    switch (typeof string) {
        case 'undefined':
        case 'function':
            return string;
        case 'string':
            break;
        default:
            throw 'Expected string, function, or undefined.';
    }

    var args = string.match(/function\s*\(([^]*?)\)/);
    if (!args) {
        throw 'Expected function keyword with formal parameter list.';
    }
    args = args[1].split(',').map(function(s, i) {
        s = s.match(/\s*(\w*)\s*/); // trim each argument
        if (!s && i) {
            throw 'Expected formal parameter.';
        }
        return s[1];
    });

    var body = string.match(/{\s*([^]*?)\s*}/);
    if (!body) {
        throw 'Expected function body.';
    }
    body = body[1];

    if (args.length === 1 && !args[0]) {
        args[0] = body;
    } else {
        args = args.concat(body);
    }

    return Function.apply(null, args);
}

var FIELD = 'columnProperties.field is deprecated as of v1.1.0 in favor of columnProperties.name. (Will be removed in a future release.)',
    COLUMN_NAME = 'columnProperties.columnName is deprecated as of v1.1.0 in favor of columnProperties.name. (Will be removed in a future release.)';

/**
 * @this {Column}
 * @returns {object}
 */
function createColumnProperties() {
    var column = this,
        tableState = column.behavior.getPrivateState(),
        properties;

    properties = Object.create(tableState, {

        index: { // read-only (no setter)
            get: function() {
                return column.index;
            }
        },

        name: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        field: { // read-only (no setter)
            get: function() {
                if (FIELD) { console.warn(FIELD); FIELD = undefined; }
                return column.name;
            }
        },

        columnName: { // read-only (no setter)
            get: function() {
                if (COLUMN_NAME) { console.warn(COLUMN_NAME); COLUMN_NAME = undefined; }
                return column.name;
            }
        },

        header: {
            get: function() {
                return column.header;
            },
            set: function(header) {
                column.header = header;
            }
        },

        type: {
            get: function() {
                return column.type;
            },
            set: function(type) {
                column.type = type;
            }
        },

        calculator: {
            get: function() {
                return column.calculator;
            },
            set: function(calculator) {
                column.calculator = toFunction(calculator);
            }
        }

    });


    Object.defineProperty(properties, 'rowNumbersProperties', { value: Object.create(properties, {
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderForegroundSelectionColor;
            },
            set: function(value) {
                this.columnHeaderForegroundSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderBackgroundSelectionColor;
            },
            set: function(value) {
                this.columnHeaderBackgroundSelectionColor = value;
            }
        }
    })});

    Object.defineProperty(properties, 'rowHeader', { value: Object.create(properties, {
        font: {
            configurable: true,
            get: function() {
                return this.rowHeaderFont;
            },
            set: function(value) {
                this.rowHeaderFont = value;
            }
        },
        color: {
            configurable: true,
            get: function() {
                return this.rowHeaderColor;
            },
            set: function(value) {
                this.rowHeaderColor = value;
            }
        },
        backgroundColor: {
            configurable: true,
            get: function() {
                return this.rowHeaderBackgroundColor;
            },
            set: function(value) {
                this.rowHeaderBackgroundColor = value;
            }
        },
        foregroundSelectionFont: {
            configurable: true,
            get: function() {
                return this.rowHeaderForegroundSelectionFont;
            },
            set: function(value) {
                this.rowHeaderForegroundSelectionFont = value;
            }
        },
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.rowHeaderForegroundSelectionColor;
            },
            set: function(value) {
                this.rowHeaderForegroundSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.rowHeaderBackgroundSelectionColor;
            },
            set: function(value) {
                this.rowHeaderBackgroundSelectionColor = value;
            }
        }
    })});

    Object.defineProperty(properties, 'columnHeader', { value: Object.create(properties, {
        font: {
            configurable: true,
            get: function() {
                return this.columnHeaderFont;
            },
            set: function(value) {
                this.columnHeaderFont = value;
            }
        },
        color: {
            configurable: true,
            get: function() {
                return this.columnHeaderColor;
            },
            set: function(value) {
                this.columnHeaderColor = value;
            }
        },
        backgroundColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderBackgroundColor;
            },
            set: function(value) {
                this.columnHeaderBackgroundColor = value;
            }
        },
        foregroundSelectionFont: {
            configurable: true,
            get: function() {
                return this.columnHeaderForegroundSelectionFont;
            },
            set: function(value) {
                this.columnHeaderForegroundSelectionFont = value;
            }
        },
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderForegroundSelectionColor;
            },
            set: function(value) {
                this.columnHeaderForegroundSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderBackgroundSelectionColor;
            },
            set: function(value) {
                this.columnHeaderBackgroundSelectionColor = value;
            }
        },
        halign: {
            configurable: true,
            get: function() {
                return this.columnHeaderHalign;
            },
            set: function(value) {
                this.columnHeaderHalign = value;
            }
        }
    })});

    Object.defineProperty(properties, 'columnHeaderColumnSelection', { value: Object.create(properties.columnHeader, {
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderForegroundColumnSelectionColor;
            },
            set: function(value) {
                this.columnHeaderForegroundColumnSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.columnHeaderBackgroundColumnSelectionColor;
            },
            set: function(value) {
                this.columnHeaderBackgroundColumnSelectionColor = value;
            }
        }
    })});

    Object.defineProperty(properties, 'rowHeaderRowSelection', { value: Object.create(properties.rowHeader, {
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.rowHeaderForegroundRowSelectionColor;
            },
            set: function(value) {
                this.rowHeaderForegroundRowSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.rowHeaderBackgroundRowSelectionColor;
            },
            set: function(value) {
                this.rowHeaderBackgroundRowSelectionColor = value;
            }
        }
    })});

    Object.defineProperty(properties, 'filterProperties', { value: Object.create(properties, {
        font: {
            configurable: true,
            get: function() {
                return this.filterFont;
            },
            set: function(value) {
                this.filterFont = value;
            }
        },
        color: {
            configurable: true,
            get: function() {
                return this.filterColor;
            },
            set: function(value) {
                this.filterColor = value;
            }
        },
        backgroundColor: {
            configurable: true,
            get: function() {
                return this.filterBackgroundColor;
            },
            set: function(value) {
                this.filterBackgroundColor = value;
            }
        },
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.filterForegroundSelectionColor;
            },
            set: function(value) {
                this.filterForegroundSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.filterBackgroundSelectionColor;
            },
            set: function(value) {
                this.filterBackgroundSelectionColor = value;
            }
        },
        cellBorderStyle: {
            configurable: true,
            get: function() {
                return this.filterCellBorderStyle;
            },
            set: function(value) {
                this.filterCellBorderStyle = value;
            }
        },
        cellBorderThickness: {
            configurable: true,
            get: function() {
                return this.filterCellBorderThickness;
            },
            set: function(value) {
                this.filterCellBorderThickness = value;
            }
        }
    })});

    Object.defineProperty(properties, 'treeColumnProperties', { value: Object.create(properties, {
        font: {
            configurable: true,
            get: function() {
                return this.treeColumnFont;
            },
            set: function(value) {
                this.treeColumnFont = value;
            }
        },
        color: {
            configurable: true,
            get: function() {
                return this.treeColumnColor;
            },
            set: function(value) {
                this.treeColumnColor = value;
            }
        },
        backgroundColor: {
            configurable: true,
            get: function() {
                return this.treeColumnBackgroundColor;
            },
            set: function(value) {
                this.treeColumnBackgroundColor = value;
            }
        },
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.treeColumnForegroundSelectionColor;
            },
            set: function(value) {
                this.treeColumnForegroundSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.treeColumnBackgroundSelectionColor;
            },
            set: function(value) {
                this.treeColumnBackgroundSelectionColor = value;
            }
        }
    })});

    Object.defineProperty(properties, 'treeColumnPropertiesColumnSelection', { value: Object.create(properties.treeColumnProperties, {
        foregroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.treeColumnForegroundColumnSelectionColor;
            },
            set: function(value) {
                this.treeColumnForegroundColumnSelectionColor = value;
            }
        },
        backgroundSelectionColor: {
            configurable: true,
            get: function() {
                return this.treeColumnBackgroundColumnSelectionColor;
            },
            set: function(value) {
                this.treeColumnBackgroundColumnSelectionColor = value;
            }
        }
    })});

    return properties;
}

module.exports.createColumnProperties = createColumnProperties;
