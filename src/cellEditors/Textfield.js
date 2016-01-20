'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Textfield = Simple.extend('Textfield', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Textfield.prototype
     */
    alias: 'textfield',

    template: function() {
        /*
            <input id="editor">
        */
    },

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    },

    specialKeyups: {
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    },

    keyup: function(e) {
        if (e) {
            Simple.prototype.keyup(e);

            if (this.grid.isFilterRow(this.getEditorPoint().y)) {
                setTimeout(function() {
                    this.saveEditorValue();
                    this._moveEditor();
                });
            }
        }
    }
});

module.exports = Textfield;
