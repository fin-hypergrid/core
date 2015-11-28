'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Color = Simple.extend('Color', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Color.prototype
     */
    alias: 'color',

    template: function() {
        /*
            <input id="editor" type="color">
        */
    }

});

module.exports = Color;
