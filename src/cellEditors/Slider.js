'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Slider = Simple.extend('Slider', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Slider.prototype
     */
    alias: 'slider',

    template: function() {
        /*
            <input id="editor" type="range">
        */
    }

});

module.exports = Slider;
