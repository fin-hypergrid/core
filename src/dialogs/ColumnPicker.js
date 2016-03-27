/* eslint-env browser */

'use strict';

var Dialog = require('./Dialog');

/**
 * @constructor
 */
var ColumnPicker = Dialog.extend('ColumnPicker', {
    /**
     * @param {Hypergrid} grid
     * @param {object} [options] - May include `Dialog` options.
     */
    initialize: function(grid, options) {
        // add the content to the dialog
        this.lists = grid.behavior.buildColumnPicker(this.el, this.append.bind(this));

        // add the dialog to the DOM
        this.open(options.container);
    },

    onClosed: function() {
        this.grid.behavior.setColumnDescriptors(this.lists);
    }
});


module.exports = ColumnPicker;
