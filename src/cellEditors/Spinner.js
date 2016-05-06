'use strict';

var CellEditor = require('./CellEditor.js');

/**
 * @constructor
 */
var Spinner = CellEditor.extend('Spinner', {

    template: function() {
        /*
            <input id="editor" type="number">
        */
    }

});

module.exports = Spinner;
