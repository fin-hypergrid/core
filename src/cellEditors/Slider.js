
var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
// @ts-ignore TODO use classes
var Slider = CellEditor.extend('Slider', {

    template: '<input type="range" lang="{{locale}}" style="{{style}}">'

});

module.exports = Slider;
