'use strict';

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
                return column.name;
            }
        },

        columnName: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        header: {
            get: function() {
                return column.header;
            },
            set: function(header) {
                if (this !== column.properties) {
                    tableState.header = header; // throws an error
                }
                column.header = header;
            }
        },

        type: {
            get: function() {
                return column.type;
            },
            set: function(type) {
                if (this !== column.properties) {
                    tableState.type = type; // throws an error
                }
                column.type = type;
            }
        },

        calculator: {
            get: function() {
                return column.calculator;
            },
            set: function(calculator) {
                if (this !== column.properties) {
                    tableState.calculator = calculator; // throws an error
                }
                column.calculator = calculator;
            }
        },

        toJSON: {
            // although we don't generally want header, type, and calculator to be enumerable, we do want them to be serializable
            value: function() {
                return Object.assign({
                    header: this.header,
                    type: this.type,
                    calculator: this.calculator
                }, this);
            }
        }

    });

    Object.defineProperties(properties, {
        rowHeader: { value: Object.create(properties, createColumnProperties.rowHeaderDescriptors) },
        treeHeader: { value: Object.create(properties, createColumnProperties.treeHeaderDescriptors) },
        columnHeader: { value: Object.create(properties, createColumnProperties.columnHeaderDescriptors) },
        filterProperties: { value: Object.create(properties, createColumnProperties.filterDescriptors) }
    });

    switch (column.index) {
        case column.behavior.treeColumnIndex: properties = properties.treeHeader; break;
        case column.behavior.rowColumnIndex: properties = properties.rowHeader; break;
    }

    return properties;
}

createColumnProperties.treeHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderFont;
        },
        set: function(value) {
            this.treeHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderColor;
        },
        set: function(value) {
            this.treeHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionColor = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.isDataRow ? this.treeRenderer : this.grid.properties.renderer;
        },
        set: function(value) {
            this.treeRenderer = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundSelectionColor = value;
        }
    },
    columnAutosizing: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeColumnAutosizing;
        },
        set: function(value) {
            this.treeColumnAutosizing = value;
        }
    },
    columnAutosizingMax: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeColumnAutosizingMax;
        },
        set: function(value) {
            this.treeColumnAutosizingMax = value;
        }
    }
    //leftIcon: undefined
};

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
    },
    leftIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            if (this.grid.properties.rowHeaderCheckboxes) {
                var result;
                if (this.isDataRow) {
                    result = this.isRowSelected ? 'checked' : 'unchecked';
                } else if (this.isHeaderRow) {
                    result = this.allRowsSelected ? 'checked' : 'unchecked';
                } else if (this.isFilterRow) {
                    result = 'filter-off';
                }
                return result;
            }
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'leftIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
        }
    },
    columnAutosizing: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowNumberAutosizing;
        },
        set: function(value) {
            this.rowNumberAutosizing = value;
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
    },
    editor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterEditor;
        },
        set: function(value) {
            this.filterEditor = value;
        }
    },
    rightIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            var result;
            if (this.filterable) {
                result = this.filter ? 'filter-on' : 'filter-off';
            }
            return result;
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'rightIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
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
    format: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderFormat;
        },
        set: function(value) {
            this.columnHeaderFormat = value;
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

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    createColumnProperties: createColumnProperties
};
