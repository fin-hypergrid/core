/* eslint-env browser */

'use strict';

var _ = require('object-iterators');

function Column(behavior, index, label) {
    this.behavior = behavior;
    this.dataModel = behavior.getDataModel();
    this.index = index;
    this.label = label;
}

Column.prototype = {
    constructor: Column.prototype.constructor,

    getValue: function(y) {
        return this.dataModel.getValue(this.index, y);
    },

    setValue: function(y, value) {
        return this.dataModel.setValue(this.index, y, value);
    },

    getWidth: function() {
        var properties = this.getProperties();
        if (properties) {
            var override = properties.width;
            if (override) {
                return override;
            }
        }
        return this.behavior.resolveProperty('defaultColumnWidth');
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
            b = properties.preferredWidth || properties.width;
            d = properties.columnAutosized && !force;
            if (a !== b || !d) {
                properties.width = !d ? b : Math.max(a, b);
                properties.columnAutosized = !isNaN(properties.width);
            }
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
