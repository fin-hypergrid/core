'use strict';

var Simple = require('./Simple');

var Color = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
     */
    alias: 'color',

    template: function() {
        /*
            <input id="editor" type="color">
        */
    }

});

module.exports = Color;