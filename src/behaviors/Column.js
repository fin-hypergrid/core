/* eslint-env browser */

'use strict';

var overrider = require('overrider');

var deprecated = require('../lib/deprecated');

/** @summary Create a new `Column` object.
 * @see {@link module:Cell} is mixed into Column.prototype.
 * @constructor
 * @param behavior
 * @param {number|string|object} indexOrOptions - One of:
 * * If a positive number, valid index into `fields` array.
 * * If a string, a name in the `fields` array.
 * * If an object, must contain either an `index` or a `name` property.
 *
 * Positive values of `index` are "real" fields; see also {@link Column#setProperties|setProperties} which is called to set the remaining properties specified in `options`.
 *
 * Negative values of `index` are special cases:
 * `index` | Meaning
 * :-----: | --------
 *    -1   | Row header column
 *    -2   | Tree (drill-down) column
 */
function Column(behavior, options) {
    var index, fields;

    this.behavior = behavior;
    this.dataModel = behavior.dataModel;
    fields = this.dataModel.getFields();

    switch (typeof options) {
        case 'number':
            index = options;
            options = {};
            break;
        case 'string':
            index = fields.indexOf(options);
            options = {};
            break;
        case 'object':
            index = options.index !== undefined
                ? options.index
                : fields.indexOf(options.name);
    }

    if (index === undefined) {
        throw 'Column not found in data.';
    }

    this._index = index;

    this.clearAllCellProperties();

    switch (index) {
        case -1:
        case -2:
            break;
        default:
            if (index < 0) {
                throw '`index` out of range';
            } else {
                this.setProperties(options);
            }
    }
}

Column.prototype = {
    constructor: Column.prototype.constructor,

    deprecated: deprecated,
    set: function(options) {
        return this.deprecated('set(options)', 'setProperties(options)', '1.1.0', arguments);
    },

    /**
     * @summary Index of this column in the `fields` array.
     * @returns {number}
     */
    get index() { // read-only (no setter)
        return this._index;
    },

    /**
     * @summary Name of this column from the `fields` array.
     * @returns {string}
     */
    get name() { // read-only (no setter)
        return this.dataModel.getFields()[this._index];
    },

    /**
     * @summary Get or set the text of the column's header.
     * @desc The _header_ is the label at the top of the column.
     *
     * Setting the header updates both:
     * * the `fields` (aka, header) array in the underlying data source; and
     * * the filter.
     * @type {string}
     */
    set header(headerText) {
        this.dataModel.getHeaders()[this.index] = headerText;
        this.behavior.filter.prop(this.index, 'header', headerText);
        this.behavior.grid.repaint();
    },
    get header() {
        return this.dataModel.getHeaders()[this.index];
    },

    /**
     * @summary Get or set the computed column's calculator function.
     * @desc Setting the value here updates the calculator in both:
     * * the `calculator` array in the underlying data source; and
     * * the filter.
     *
     * The results of the new calculations will appear in the column cells on the next repaint.
     * @type {string}
     */
    set calculator(calculator) {
        var calculators = this.dataModel.getCalculators();
        if (calculator === undefined) {
            delete calculators[this.index];
        } else {
            calculators[this.index] = calculator;
        }
        this.behavior.filter.prop(this.index, 'calculator', calculator);
        this.behavior.applyAnalytics();
    },
    get calculator() {
        return this.dataModel.getCalculators()[this.index];
    },

    /**
     * @summary Get or set the type of the column's header.
     * @desc Setting the type updates the filter which typically uses this information for proper collation.
     *
     * @todo: Instead of using `this._type`, put on data source like the other essential properties. In this case, sorter could use the info to choose a comparator more intelligently and efficiently.
     * @type {string}
     */
    set type(type) {
        this._type = type;
        this.behavior.filter.prop(this.index, 'type', type);
        this.behavior.applyAnalytics();
    },
    get type() {
        return this._type;
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

        return this.dataModel.getCell(config, this.getCellProperty(y, 'renderer'));
    },

    clearAllCellProperties: function() {
        this.cellProperties.length = 0;
    },

    checkColumnAutosizing: function(force) {
        var properties = this.getProperties();
        var a, b, d, autoSized;
        if (properties) {
            a = properties.width;
            b = properties.preferredWidth || a;
            d = properties.columnAutosized && !force;
            if (a !== b || !d) {
                properties.width = !d ? b : Math.max(a, b);
                properties.columnAutosized = !isNaN(properties.width);
                autoSized = properties.width !== a;
            }
        }
        return autoSized;
    },

    getCellType: function(y) {
        var value = this.getValue(y);
        return this.typeOf(value);
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
        var tableState = this.behavior.getPrivateState(),
            columnProperties = tableState.columnProperties,
            properties = columnProperties[this.index];

        if (!properties) {
            properties = this.createColumnProperties();
            columnProperties[this.index] = properties;
        }

        return properties;
    },

    /**
     * @param {object} properties
     * @param {boolean} [preserve=false]
     */
    setProperties: function(properties, preserve) {
        var key, descriptor, obj = this.getProperties();

        if (!preserve) {
            for (key in obj) {
                descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (!descriptor || descriptor.configurable) {
                    delete obj[key];
                }
            }
        }

        for (key in properties) {
            descriptor = Object.getOwnPropertyDescriptor(obj, key);
            if (!descriptor || descriptor.writable || descriptor.set) {
                obj[key] = properties[key];
            }
        }
    },

    /**
     * This method determines the proposed cell editor name from the render properties. The algorithm is:
     * 1. `editor` render property (cell editor name)
     * 2. `format` render property (localizer name)
     *
     * Note that "render property" means in each case the first defined property found on the cell, column, or grid.
     *
     * @param {number} y - The grid row index.
     * @param {object} options - Will be decorated with `format` and `column`.
     * @param {Point} options.editPoint
     * @returns {undefined|CellEditor} Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return return from fireRequestCellEdit.
     */
    getCellEditorAt: function(y, options) {
        options.format = this.getCellProperty(y, 'format');
        var editorName = this.getCellProperty(y, 'editor'),
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

overrider(Column.prototype,
    require('./cellProperties'),
    require('./columnProperties')
);

module.exports = Column;
