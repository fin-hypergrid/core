'use strict';

var Simple = require('./Simple');

var Slider = Simple.extend({

    /**
     * @property {string} alias - my lookup alias
     * @instance
     */
    alias: 'slider',

    template: function() {
        /*
            <input id="editor" type="range">
        */
    }

});

module.exports = Slider;