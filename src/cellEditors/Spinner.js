'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Spinner = Simple.extend('Spinner', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Spinner.prototype
     */
    alias: 'spinner',

    template: function() {
        /*
            <input id="editor" type="number">
        */
    }

});

module.exports = Spinner;
