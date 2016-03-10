'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Color = Simple.extend('Color', {

    template: function() {
        /*
            <input id="editor" type="color">
        */
    }

});

module.exports = Color;
