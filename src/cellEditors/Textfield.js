'use strict';

var CellEditor = require('./CellEditor.js');
var Localization = require('../lib/Localization');


/**
 * @constructor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text">',

    localizer: Localization.prototype.string,

    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }
});

module.exports = Textfield;
