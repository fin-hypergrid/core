'use strict';

var Simple = require('./Simple');

var Spinner = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
     */
    alias: 'spinner',

    template: function() {
        /*
            <input id="editor" type="number">
        */
    }

});

module.exports = Spinner;