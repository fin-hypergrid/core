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

    initialize: function() {
        this.input.style.textAlign = this.grid.behavior.getActiveColumn(this.editPoint.x).getCellProperty(this.editPoint.y, 'halign');
    },

    localizer: Localization.prototype.string,

    selectAll: function() {
        this.input.setSelectionRange(0, this.input.value.length);
    }
});

module.exports = Textfield;
