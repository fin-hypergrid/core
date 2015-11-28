'use strict';

var Simple = require('./Simple');

/**
 * @constructor
 */
var Date = Simple.extend('Date', {

    /**
     * my lookup alias
     * @type {string}
     * @memberOf Date.prototype
     */
    alias: 'date',

    template: function() {
        /*
            <input id="editor" type="date">
        */
    }

});

module.exports = Date;
