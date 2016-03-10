'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Spinner = Simple.extend('Spinner', {

    template: function() {
        /*
            <input id="editor" type="number">
        */
    }

});

module.exports = Spinner;
