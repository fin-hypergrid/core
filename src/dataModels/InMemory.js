'use strict';

var DataModel = require('./DataModel');

var InMemory = DataModel.extend({

    dataUpdates: {},

    /**
     * @function
     * @instance
     * @desc This is the most important behavior function.
     * @returns {object} Data point at the given coordinates.
     * @param {number} x - the x coordinate
     * @param {number} x - the y coordinate
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

    setValue: function(x, y, value) {
        this.dataUpdates['p_' + x + '_' + y] = value;
    },

    getColumnCount: function() {
        return 27;
    },

    getRowCount: function() {
        //jeepers batman a quadrillion rows!
        return 53;
    }

});

module.exports = InMemory;