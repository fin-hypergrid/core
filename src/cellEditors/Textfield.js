'use strict';

var Simple = require('./Simple');

var Textfield = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
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