'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
var Slider = CellEditor.extend('Slider', {

    template: '<input type="range" lang="{{locale}}" style="{{style}}">'

});

module.exports = Slider;
