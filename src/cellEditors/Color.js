'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Color = CellEditor.extend('Color', {

    template: function() {
        /*
            <input type="color">
        */
    }

});

module.exports = Color;
