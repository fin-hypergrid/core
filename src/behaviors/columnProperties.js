'use strict';

var toFunction = require('../lib/toFunction');

var FIELD = 'columnProperties.field is deprecated as of v1.1.0 in favor of columnProperties.name. (Will be removed in a future release.)',
    COLUMN_NAME = 'columnProperties.columnName is deprecated as of v1.1.0 in favor of columnProperties.name. (Will be removed in a future release.)';

/**
 * @this {Column}
 * @returns {object}
 * @memberOf Column#
 */
function createColumnProperties() {
    var column = this,
        tableState = column.behavior.grid.properties,
        properties;

    properties = Object.create(tableState, {

        index: { // read-only (no setter)
            enumerable: true,
            get: function() {
                return column.index;
            }
        },

        name: { // read-only (no setter)
            enumerable: true,
            get: function() {
                return column.name;
            }
        },

        field: { // read-only (no setter)
            enumerable: true,
            get: function() {
                if (FIELD) { console.warn(FIELD); FIELD = undefined; }
                return column.name;
            }
        },

        columnName: { // read-only (no setter)
            enumerable: true,
            get: function() {
                if (COLUMN_NAME) { console.warn(COLUMN_NAME); COLUMN_NAME = undefined; }
                return column.name;
            }
        },

        header: {
            enumerable: true,
            get: function() {
                return column.header;
            },
            set: function(header) {
                column.header = header;
            }
        },

        type: {
            enumerable: true,
            get: function() {
                return column.type;
            },
            set: function(type) {
                column.type = type;
            }
        },

        calculator: {
            enumerable: true,
            get: function() {
                return column.calculator;
            },
            set: function(calculator) {
                column.calculator = toFunction(calculator);
            }
        }

    });

    Object.defineProperty(properties, 'rowHeader', {
        value: Object.create(properties, createColumnProperties.rowHeaderDescriptors)
    });

    Object.defineProperty(properties, 'columnHeader', {
        value: Object.create(properties, createColumnProperties.columnHeaderDescriptors)
    });

    Object.defineProperty(properties, 'filterProperties', {
        value: Object.create(properties, createColumnProperties.filterDescriptors)
    });

    Object.defineProperty(properties, 'infoProperties', {
        value: Object.create(properties, createColumnProperties.infoDescriptors)
    });

    return properties;
}

createColumnProperties.rowHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderFont;
        },
        set: function(value) {
            this.rowHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderColor;
        },
        set: function(value) {
            this.rowHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundSelectionColor = value;
        }
    }
};

createColumnProperties.filterDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterFont;
        },
        set: function(value) {
            this.filterFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterColor;
        },
        set: function(value) {
            this.filterColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundColor;
        },
        set: function(value) {
            this.filterBackgroundColor = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterForegroundSelectionColor;
        },
        set: function(value) {
            this.filterForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundSelectionColor;
        },
        set: function(value) {
            this.filterBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterHalign;
        },
        set: function(value) {
            this.filterHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterRenderer;
        },
        set: function(value) {
            this.filterRenderer = value;
        }
    }
};

createColumnProperties.columnHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderFont;
        },
        set: function(value) {
            this.columnHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderColor;
        },
        set: function(value) {
            this.columnHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderHalign;
        },
        set: function(value) {
            this.columnHeaderHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderRenderer;
        },
        set: function(value) {
            this.columnHeaderRenderer = value;
        }
    },
    leftIcon: { writable: true, value: undefined},
    centerIcon: { writable: true, value: undefined},
    rightIcon: { writable: true, value: undefined},
};

createColumnProperties.infoDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.infoFont;
        },
        set: function(value) {
            this.infoFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.infoColor;
        },
        set: function(value) {
            this.infoColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.infoBackgroundColor;
        },
        set: function(value) {
            this.infoBackgroundColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.infoHalign;
        },
        set: function(value) {
            this.infoHalign = value;
        }
    },
    format: {
        writable: true,
        enumerable: true,
        value: 'info'
    }
};

module.exports.createColumnProperties = createColumnProperties;
