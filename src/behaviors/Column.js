/* eslint-env browser */

'use strict';

var _ = require('object-iterators');
var deprecated = require('../lib/deprecated');

var propertyNames = [
    'index',
    'name',
    'header',
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

    set header(value) {
        this._header = value;
        this.dataModel.getHeaders()[this.index] = value;
    },

    get header() {
        return this._header;
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

    getCellRenderer: function(config, y) {
        config.x = this.index;
        config.y = y;

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
     * @returns {sring} Falsy value means either `null` cell editor _or_ no declared cell editor for this cell.
     */
    getCellEditorAt: function(y) {
        var cellProps = this.getCellProperties(y),
            columnProps,
            editorName = cellProps.editor || (columnProps = this.getProperties()).editor,
            format = cellProps.format || (columnProps || this.getProperties()).format,
            options = {};

        if (format) {
            options.format = format;
        }

        return this.dataModel.getCellEditorAt(this.index, y, editorName, options);
    },

    /** @deprecated Use `.header` property instead.
     */
    getHeader: function() {
        return deprecated.call(this, 'header', { since: '1.0' });
    },

    /** @deprecated Use `.name` property instead.
     */
    getField: function() {
        return deprecated.call(this, 'name', { since: '1.0', getterName: 'getField' });
    },

    getFormatter: function() {
        var localizerName = this.getProperties().format;
        return this.behavior.grid.localization.get(localizerName).format;
    }
};

module.exports = Column;
