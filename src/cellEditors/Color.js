'use strict';

var CellEditor = require('./CellEditor');

/**
 * As of spring 2016:
 * Functions well in Chrome and Firefox; unimplemented in Safari.
 * @constructor
 * @extends CellEditor
 */
var Color = CellEditor.extend('Color', {

    template: '<input type="color" lang="{{locale}}" style="{{style}}">'

});

module.exports = Color;
