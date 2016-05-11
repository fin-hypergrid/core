'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Slider = CellEditor.extend('Slider', {

    template: function() {
        /*
            <input type="range">
        */
    }

});

module.exports = Slider;
