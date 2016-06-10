'use strict';

var CellEditor = require('./CellEditor.js');

/**
 * @constructor
 */
var Spinner = CellEditor.extend('Spinner', {

    template: '<input type="number" lang="{{locale}}" style="{{style}}">'

});

module.exports = Spinner;
