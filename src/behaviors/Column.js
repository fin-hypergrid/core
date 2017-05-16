/* eslint-env browser */

'use strict';

var overrider = require('overrider');

var deprecated = require('../lib/deprecated');
var HypergridError = require('../lib/error');
var images = require('../../images/index');

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
function Column(behavior, indexOrOptions) {
    var index, schema, options, icon;

    this.behavior = behavior;
    this.dataModel = behavior.dataModel;

    schema = this.behavior.dataModel.schema;

    switch (typeof indexOrOptions) {
        case 'number':
            index = indexOrOptions;
            options = {};
            break;
        case 'string':
            index = getIndexFromName(indexOrOptions);
            options = {};
            break;
        case 'object':
            options = indexOrOptions;
            index = options.index !== undefined
                ? options.index
                : getIndexFromName(options.name);
    }

    function getIndexFromName(name) {
        return schema.findIndex(function(columnSchema, i) {
            return columnSchema.name === name;
        });
    }

    if (index === undefined) {
        throw 'Column not found in data.';
    }

    this._index = index;

    this.properties = options;

    switch (index) {
        case this.behavior.treeColumnIndex:
            // Width of icon + 3-pixel spacer (checked and unchecked should be same width)
            icon = images[Object.create(this.properties.treeHeader, { isDataRow: { value: true } }).leftIcon];
            this.properties.minimumColumnWidth = icon ? icon.width + 3 : 0;
            break;
        case this.behavior.rowColumnIndex:
            // Width of icon + 3-pixel spacer (checked and unchecked should be same width)
            icon = images[Object.create(this.properties.rowHeader, { isDataRow: { value: true } }).leftIcon];
            this.properties.minimumColumnWidth = icon ? icon.width + 3 : 0;
            // This case avoids the "out of range" error.
            break;
        default:
            if (index < 0) {
                throw '`index` out of range';
            }
    }
}

Column.prototype = {
    constructor: Column.prototype.constructor,
    $$CLASS_NAME: 'Column',
    deprecated: deprecated,

    HypergridError: HypergridError,

    mixIn: overrider.mixIn,

    set: function(options) {
        return this.deprecated('set(options)', 'setProperties(options)', '1.2.0', arguments);
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
     * @returns {string|undefined} Returns `undefined` if the column is not in the schema (such as for handle column).
     */
    get name() { // read-only (no setter)
        var columnSchema = this.dataModel.schema[this._index];
        return columnSchema && columnSchema.name;
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
        this.dataModel.schema[this.index].header = headerText;
        this.dataModel.prop(null, this.index, 'header', headerText);
        this.behavior.grid.repaint();
    },
    get header() {
        return this.dataModel.schema[this.index].header;
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
        var schema = this.dataModel.schema;
        if (calculator !== schema[this.index].calculator) {
            if (calculator === undefined) {
                delete schema[this.index].calculator;
            } else {
                schema[this.index].calculator = calculator;
            }
            this.behavior.prop(null, this.index, 'calculator', calculator);
            this.behavior.applyAnalytics();
        }
    },
    get calculator() {
        return this.dataModel.schema[this.index].calculator;
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
        //TODO: This is calling reindex for every column during grid init. Maybe defer all reindex calls until after an grid 'ready' event
        this.dataModel.prop(null, this.index, 'type', type);
        this.behavior.reindex();
    },
    get type() {
        return this._type;
    },

    getUnfilteredValue: function(y) {
        return this.deprecated('getUnfilteredValue(y)', null, '1.2.0', arguments, 'No longer supported');
    },

    getValue: function(y) {
        return this.dataModel.getValue(this.index, y);
    },

    setValue: function(y, value) {
        return this.dataModel.setValue(this.index, y, value);
    },

    getWidth: function() {
        return this.properties.width || this.behavior.grid.properties.defaultColumnWidth;
    },

    setWidth: function(width) {
        width = Math.max(this.properties.minimumColumnWidth, width);
        if (width !== this.properties.width) {
            this.properties.width = width;
            this.properties.columnAutosizing = false;
        }
    },

    checkColumnAutosizing: function(force) {
        var properties = this.properties,
            width, preferredWidth, autoSized;

        if (properties.columnAutosizing) {
            width = properties.width;
            preferredWidth = properties.preferredWidth || width;
            force = force || !properties.columnAutosized;
            if (width !== preferredWidth || force && preferredWidth !== undefined) {
                properties.width = force ? preferredWidth : Math.max(width, preferredWidth);
                properties.columnAutosized = !isNaN(properties.width);
                autoSized = properties.width !== width;
            }
        }

        return autoSized;
    },

    getCellType: function(y) {
        var value = this.getValue(y);
        return this.typeOf(value);
    },

    getType: function() {
        var props = this.properties;
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
        //var isNumber = ((typeof value) === 'number');
        for (var y = headerRowCount; y < height; y++) {
            value = this.getValue(y);
            eachType = this.typeOf(value);
            // if (type !== eachType) {
            //     if (isNumber && (typeof value === 'number')) {
            //         type = 'float';
            //     } else {
            //         return 'mixed';
            //     }
            // }
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

    get properties() {
        return this._properties;
    },
    set properties(ownProperties) {
        this._properties = this.createColumnProperties();
        this.addProperties(ownProperties);
    },

    getProperties: function() {
        return this.deprecated('getProperties()', 'properties', '1.2.0');
    },

    /** This method is provided because some grid renderer optimizations require that the grid renderer be informed when column colors change. Due to performance concerns, they cannot take the time to figure it out for themselves. Along the same lines, making the property a getter/setter (in columnProperties.js), though doable, might present performance concerns as this property is possibly the most accessed of all column properties.
     * @param color
     */
    setBackgroundColor: function(color) {
        if (this.properties.backgroundColor !== color) {
            this.properties.backgroundColor = color;
            this.behavior.grid.renderer.rebundleGridRenderers();
        }
    },

    /**
     * @param {object} properties
     * @param {boolean} [preserve=false]
     */
    setProperties: function(properties, preserve) {
        if (!preserve) {
            this.deprecated('setProperties', 'setProperties(properties) has been deprecated in favor of properties (setter) as of v1.2.0. (Will be removed in a future version.) This advice only pertains to usages of setProperties when called with a single parameter. When called with a truthy second parameter, use the new addProperties(properties) call instead.');
            this.properties = properties;
        } else {
            this.deprecated('setPropertiesPreserve', 'setProperties(properties, preserve)', 'addProperties(properties)', '1.2.0', arguments, 'This warning pertains to setProperties only when preserve is truthy. When preserve is faulty, use the new properties setter.');
        }
    },

    addProperties: function(properties) {
        var key, descriptor, obj = this.properties;

        for (key in properties) {
            if (properties.hasOwnProperty(key)) {
                descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (!descriptor || descriptor.writable || descriptor.set) {
                    obj[key] = properties[key];
                }
            }
        }
    },

    /**
     * @summary Get a new cell editor.
     * @desc The cell editor to use must be registered with the key in the cell's `editor` property.
     *
     * The cell's `format` property is mixed into the provided cellEvent for possible overriding by developer's override of {@link DataModel.prototype.getCellEditorAt} before being used by {@link CellEditor} to parse and format the cell value.
     *
     * @param {CellEvent} cellEvent
     *
     * @returns {undefined|CellEditor} Falsy value means either no declared cell editor _or_ instantiation aborted by falsy return from `fireRequestCellEdit`.
     */
    getCellEditorAt: function(cellEvent) {
        var columnIndex = this.index,
            rowIndex = cellEvent.gridCell.y,
            editorName = cellEvent.properties.editor,
            options = Object.create(cellEvent, {
                format: {
                    // `options.format` is a copy of the cell's `format` property which is:
                    // 1. Subject to adjustment by the `getCellEditorAt` override.
                    // 2. Then used by the cell editor to reference the predefined localizer.
                    writable: true,
                    enumerable: true, // so cell editor will copy it to self
                    value: cellEvent.properties.format
                }
            }),
            cellEditor = this.dataModel.getCellEditorAt(columnIndex, rowIndex, editorName, options);

        if (cellEditor && !cellEditor.grid) {
            // cell editor returned but not fully instantiated (aborted by falsy return from fireRequestCellEdit)
            cellEditor = undefined;
        }

        return cellEditor;
    },

    getFormatter: function() {
        var localizerName = this.properties.format;
        return this.behavior.grid.localization.get(localizerName).format;
    }
};

Column.prototype.mixIn(require('./cellProperties'));
Column.prototype.mixIn(require('./columnProperties'));

module.exports = Column;
