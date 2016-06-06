'use strict';

var CellEditor = require('./CellEditor.js');
var localization = require('../lib/localization');


/**
 * @constructor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text">',

    localizer: localization.prototype.string,

    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }
});

module.exports = Textfield;
