'use strict';

var CellEditor = require('./CellEditor');
var Localization = require('../lib/Localization');


/**
 * As of spring 2016:
 * Functions well in Chrome, Safari, Firefox, and Internet Explorer.
 * @constructor
 * @extends CellEditor
 */
var Textfield = CellEditor.extend('Textfield', {

    template: '<input type="text" lang="{{locale}}" class="hypergrid-textfield" style="{{style}}">',

    initialize: function() {
        this.input.style.textAlign = this.event.properties.halign;
        this.input.style.font = this.event.properties.font;
    },

    localizer: Localization.prototype.string,

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    }
});

module.exports = Textfield;
