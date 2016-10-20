/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

var Feature = require('./Feature.js');

/**
 * @constructor
 * @extends Feature
 */
var ColumnPicker = Feature.extend('ColumnPicker', {

    /**
     * @memberOf ColumnPicker.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyUp: function(grid, event) {
        var key = event.detail.char.toLowerCase();
        var keys = grid.properties.editorActivationKeys;
        if (keys.indexOf(key) > -1) {
           grid.toggleDialog('ColumnPicker');
        }
    },

});

module.exports = ColumnPicker;
