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
    }
});

module.exports = Textfield;
