'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Color = CellEditor.extend('Color', {

    template: function() {
        /*
            <input id="editor" type="color">
        */
    }

});

module.exports = Color;
