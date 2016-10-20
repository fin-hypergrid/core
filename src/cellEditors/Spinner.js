'use strict';

var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
var Spinner = CellEditor.extend('Spinner', {

    template: '<input type="number" lang="{{locale}}" style="{{style}}">'

});

module.exports = Spinner;
