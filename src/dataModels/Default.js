'use strict';

var DataModel = require('./DataModel');

/**
 * @constructor
 * @extends DataModel
 */
var Default = DataModel.extend('Default', {

    /**
     * @type {object}
     * @memberOf Default.prototype
     */
    dataUpdates: {},

    /**
     * @memberOf Default.prototype
     * @desc This is the most important behavior function.
     * @returns {object} Data point at the given coordinates.
     * @param {number} x - the horizontal coordinate
     * @param {number} x - the vertical coordinate
     */
    getValue: function(x, y) {
        var override = this.dataUpdates['p_' + x + '_' + y];
        if (override) {
            return override;
        }
        if (x === 0) {
            if (y === 0) {
                return '';
            }
            return y;
        }
        if (y === 0) {
            return this.alphaFor(x - 1);
        }
        return (x - 1) + ', ' + this.alpha((y - 1) % 26);
    },

    /**
     * @memberOf Default.prototype
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        this.dataUpdates['p_' + x + '_' + y] = value;
    },

    /**
     * @memberOf Default.prototype
     * @returns {number}
     */
    getColumnCount: function() {
        return 27;
    },

    /**
     * @memberOf Default.prototype
     * @returns {number}
     */
    getRowCount: function() {
        //jeepers batman a quadrillion rows!
        return 53;
    }

});

module.exports = Default;
