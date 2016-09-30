'use strict';

var CellEditor = require('./CellEditor.js');
var Localization = require('../lib/Localization');


/**
 * As of spring 2016:
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 * @extends CellEditor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">',

    localizer: Localization.prototype.string,

    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.input.setSelectionRange(0, lastCharPlusOne);
    }
});

module.exports = Textfield;
