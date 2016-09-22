/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var ColumnPicker = Feature.extend('ColumnPicker', {

    /**
     * @memberOf ColumnPicker.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyUp: function(grid, event) {
        var key = event.detail.char.toLowerCase();
        var keys = grid.properties.editorActivationKeys;
        if (keys.indexOf(key) > -1) {
           grid.fireSyntheticExternalUIActivationEvent(event);
        }
    },

});

module.exports = ColumnPicker;
