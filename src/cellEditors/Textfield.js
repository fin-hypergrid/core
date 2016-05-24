'use strict';

var CellEditor = require('./CellEditor.js');

/**
 * @constructor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text">',

    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }
});

module.exports = Textfield;
