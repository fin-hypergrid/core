'use strict';
/**
 *
 * @module cell-editors\Textfield
 *
 */

var Simple = require('./Simple.js');

function Textfield() {
    Simple.call(this);
}

Textfield.prototype = new Simple();

Textfield.prototype.constructor = Textfield;

Textfield.prototype.alias = 'textfield';

Textfield.prototype.template = function() {/*
    <input id="editor">
*/
};

Textfield.prototype.selectAll = function() {
    this.input.setSelectionRange(0, this.input.value.length);
};

module.exports = Textfield;


