/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

function Column(behavior, index, label) {
    this.behavior = behavior;
    this.dataModel = behavior.dataModel;
    this.index = index;
    this.label = label;
}

Column.prototype = {
    constructor: Column.prototype.constructor,

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
        return this.dataModel.getCellRenderer(config, this.index, y);
    },

    getCellProperties: function(y) {
        return this.behavior.getPrivateState().cellProperties[this.index + ',' + y];
    },

    setCellProperties: function(y, value) {
        this.behavior.getPrivateState().cellProperties[this.index + ',' + y] = value;
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
        if (something === null || something === undefined) {
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
        var current = this.behavior.getPrivateState().columnProperties[this.index];
        this.clearObjectProperties(current, false);
        _(current).extendOwn(properties);
    },

    toggleSort: function(keys) {
        this.dataModel.toggleSort(this.index, keys);
    },

    getCellEditorAt: function(x, y) {
        return this.dataModel.getCellEditorAt(this.index, y);
    },

    getHeader: function() {
        return this.label;
    },

    getField: function() {
        return this.dataModel.getFields()[this.index];
    }
};

module.exports = Column;
