
var CellEditor = require('./CellEditor');

/**
 * @constructor
 * @extends CellEditor
 */
// @ts-ignore TODO use classes
var Spinner = CellEditor.extend('Spinner', {

    template: '<input type="number" lang="{{locale}}" style="{{style}}">'

});

module.exports = Spinner;
