'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Slider = CellEditor.extend('Slider', {

    template: function() {
        /*
            <input id="editor" type="range">
        */
    }

});

module.exports = Slider;
