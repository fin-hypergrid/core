'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Slider = Simple.extend('Slider', {

    template: function() {
        /*
            <input id="editor" type="range">
        */
    }

});

module.exports = Slider;
