'use strict';

var Simple = require('./Simple');

var Date = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
     */
    alias: 'date',

    template: function() {
        /*
            <input id="editor" type="date">
        */
    }

});

module.exports = Date;