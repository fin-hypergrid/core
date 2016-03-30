'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Textfield = Simple.extend('Textfield', {

    template: function() {
        /*
            <input id="editor" class="hypergrid-input-textbox">
        */
    },

    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.getInputControl().setSelectionRange(0, lastCharPlusOne);
    },

    specialKeyups: {
        0x09: 'stopEditing', // tab
        0x0d: 'stopEditing', // return/enter
        0x1b: 'cancelEditing' // escape
    }
});

module.exports = Textfield;
