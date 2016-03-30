'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Combo = Simple.extend('Combo', {

    /**
     * the list of items to pick from
     * @type {Array}
     * @memberOf Combo.prototype
     */
    items: [],

    /**
     * @memberOf Combo.prototype
     * @desc request focus for my input control
     */
    takeFocus: function() {
        var self = this;
        setTimeout(function() {
            //self.input.focus();
            self.selectAll();
        }, 300);
    },

    /**
     * @memberOf Combo.prototype
     */
    selectAll: function() {
        var lastCharPlusOne = this.getEditorValue().length;
        this.getInputControl().setSelectionRange(0, lastCharPlusOne);
    }

});

module.exports = Combo;
