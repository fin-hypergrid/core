/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

var propertyNames = [
    'index',
    'name',
    'header',
    'calculator',
    'type'
];

/** @summary Create a new `Column` object.
 * @constructor
 * @param behavior
 * @param {number|object} indexOrOptions - If a number, shorthand for `options.index`.
 *
 * For positive values of `options.index`, see {@link Column#initialize|initialize}. Note that for new columns, you must supply either `index` or `name`. If you supply both, they must match the definitiion in data model's `fields` list.
 *
 * Negative values are special cases:
 * `index` | Meaning
 * :-----: | --------
 *    -1   | Row header column
 *    -2   | Tree (drill-down) column
 *
 *
 */
function Column(behavior, indexOrOptions) {
    this.behavior = behavior;
    this.dataModel = behavior.dataModel;
    this.cellProperties = [];

    var options = typeof indexOrOptions === 'object' ? indexOrOptions : { index: indexOrOptions },
        index = options.index;

    switch (index) {

        case -1:
            this.index = index;
            this.name = '';
            this.header = '';
            break;

        case -2:
            this.index = index;
            this.name = 'tree';
            this.header = 'Tree';
            break;

        default:
            if (index < 0) {
                throw '`index` out of range';
            } else {
                this.set(options);
            }

    }
}

Column.prototype = {
    constructor: Column.prototype.constructor,

    /** @summary Set or reset the properties of a column object.
     * @desc When (re)setting a column object, the object must end up with fully defined `index` and `name` properties. If one is missing it will be derived from the data model's `fields` list.
     * Note: These properties of the column object should not be confused with the members of the columnProperties object which supports grid render and is something else entirely.
     * @param {object} options - Required because you must supply at least `index` or `name`.
     * @param {object} [options.index]
     * @param {object} [options.name]
     * @param {object} [options.header]
     * @param {object} [options.type]
     */
    set: function(options) {
        var fields = this.dataModel.getFields();
        var column = this;
        propertyNames.forEach(function(option) {
            if (option in options) {
                column[option] = options[option];
            }

            if (option === 'name') {
                if (column.name === undefined) {
                    column.name = fields[column.index];
                } else if (column.index === undefined) {
                    column.index = fields.indexOf(column.name);
                }

                if (column.index === undefined || column.name === undefined) {
                    throw 'Expected column name or index.';
                } else if (fields[column.index] !== column.name) {
                    throw 'Expected to find `column.name` in position `column.index` in data model\'s fields list.';
                }
            }
        });
    },

    /**
     * @summary Get or set the text of the column's header.
     * @desc The _header_ is the label at the top of the column.
     *
     * Setting the value here updates the header in both this column object as well as the `fields` (aka, header) array in the underlying data source.
     *
     * The new text will appear on the next repaint.
     * @type {string}
     */
    set header(headerText) {
        this.dataModel.getHeaders()[this.index] = this._header = headerText;
    },
    get header() {
        return this._header;
    },

    set calculator(calculator) {
        var name = this.name,
            filter = this.behavior.grid.getGlobalFilter();

        if (filter && filter.schema) {
            // Note that calculators are not applied to column schema that are simple string primitives.
            var columnSchema = filter.schema.find(function(item) {
                return item.name === name;
            });
            if (columnSchema) {
                if (calculator) {
                    columnSchema.calculator = calculator;
                } else if (columnSchema.calculator) {
                    delete columnSchema.calculator;
                }
            }
        }

        this.dataModel.getCalculators()[this.index] = this._calculator = calculator;
    },
    get calculator() {
        return this._calculator;
    },

    getUnfilteredValue: function(y) {
        return this.dataModel.getUnfilteredValue(this.index, y);
    },

    getValue: function(y) {
        return this.dataModel.getValue(this.index, y);
    },

    setValue: function(y, value) {
        return this.dataModel.setValue(this.index, y, value);
    },

    getWidth: function() {
        var properties = this.getProperties();
        return properties && properties.width || this.behavior.resolveProperty('defaultColumnWidth');
    },

    setWidth: function(width) {
        this.getProperties().width = Math.max(5, width);
    },

    getCellRenderer: function(config, x, y) {
        config.untranslatedX = x;
        config.y = y;

        config.x = this.index;
        config.normalizedY = y - this.behavior.getHeaderRowCount();

        // Legacy config.x and config.y were confusing because the x was translated while the y was not.
        // These have been deprecated and are currently implemented as getters with deprecation warnings.
        // Rather than defining these getters here on every cell render, they are defined once in Behavior.prototype.getDefaultState.
        //config.x = this.index;
        //config.y = y;

        var declaredRendererName =
            this.getCellProperties(y).renderer ||
            this.getProperties().renderer;

        var renderer = this.dataModel.getCell(config, declaredRendererName);
        renderer.config = config;
        return renderer;
    },

    getCellProperties: function(y) {
        y = this.dataModel.getDataIndex(y);
        return this.cellProperties[y] || {};
    },

    setCellProperties: function(y, value) {
        this.cellProperties[y] = value;
    },

    clearAllCellProperties: function() {
        this.cellProperties.length = 0;
    },

    checkColumnAutosizing: function(force) {
        var properties = this.getProperties();
        var a, b, d;
        if (properties) {
            a = properties.width;
            b = properties.preferredWidth || a;
            d = properties.columnAutosized && !force;
            if (a !== b || !d) {
                properties.width = !d ? b : Math.max(a, b);
                properties.columnAutosized = !isNaN(properties.width);
            }
        }
    },

    getCellType: function(y) {
        var value = this.getValue(y);
        var type = this.typeOf(value);
        return type;
    },

    getType: function() {
        var props = this.getProperties();
        var type = props.type;
        if (!type) {
            type = this.computeColumnType();
            if (type !== 'unknown') {
                props.type = type;
            }
        }
        return type;
    },

    computeColumnType: function() {
        var headerRowCount = this.behavior.getHeaderRowCount();
        var height = this.behavior.getRowCount();
        var value = this.getValue(headerRowCount);
        var eachType = this.typeOf(value);
        if (!eachType) {
            return 'unknown';
        }
        var type = this.typeOf(value);
        var isNumber = ((typeof value) === 'number');
        for (var y = headerRowCount; y < height; y++) {
            value = this.getValue(y);
            eachType = this.typeOf(value);
            if (type !== eachType) {
                if (isNumber && (typeof value === 'number')) {
                    type = 'float';
                } else {
                    return 'mixed';
                }
            }
        }
        return type;
    },

    typeOf: function(something) {
        if (something == null) {
            return null;
        }
        var typeOf = typeof something;
        switch (typeOf) {
            case 'object':
                return something.constructor.name.toLowerCase();
            case 'number':
                return parseInt(something) === something ? 'int' : 'float';
            default:
                return typeOf;
        }
    },

    getProperties: function() {
        return this.behavior.getPrivateState().columnProperties[this.index];
    },

    setProperties: function(properties) {
        var current = this.getProperties();
        this.clearObjectProperties(current, false);
        _(current).extendOwn(properties);
    },

    toggleSort: function(keys) {
        this.dataModel.toggleSort(this.index, keys);
    },

    unSort: function(deferred) {
        this.dataModel.unSortColumn(this.index, deferred);
    },

    /**
     * This method determines the proposed cell editor name from the render properties. The algorithm is:
     * 1. `editor` render property (cell editor name)
     * 2. `format` render property (localizer name)
     * 3. `type` column property (type name)
     *
     * Note that "render property" means in each case the first defined property found on the cell, column, or grid.
     *
     * @param {number} y - The original untranslated row index.
     * @param {object} options - Will be decorated with `format` and `column`.
     * @param {Point} options.editPoint
     * @returns {undefined|CellEditor} Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return return from fireRequestCellEdit.
     */
    getCellEditorAt: function(y, options) {
        var cellEditor,
            cellProps = this.getCellProperties(y),
            columnProps = this.getProperties(),
            editorName = cellProps.editor || columnProps.editor;

        options.format = cellProps.format || columnProps.format;

        cellEditor = this.dataModel.getCellEditorAt(this.index, y, editorName, options);

        if (cellEditor && !cellEditor.grid) {
            // cell editor returned but not fully instantiated (aborted by falsy return from fireRequestCellEdit)
            cellEditor = undefined;
        }

        return cellEditor;
    },

    getFormatter: function() {
        var localizerName = this.getProperties().format;
        return this.behavior.grid.localization.get(localizerName).format;
    }
};

module.exports = Column;
