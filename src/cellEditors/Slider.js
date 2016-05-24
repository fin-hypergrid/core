'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 */
var Slider = CellEditor.extend('Slider', {

    template: '<input type="range">'

});

module.exports = Slider;
