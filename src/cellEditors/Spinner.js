'use strict';
/**
 *
 * @module cell-editors\Spinner
 *
 */

var Simple = require('./Simple.js');

function Spinner() {
    Simple.call(this);
}

Spinner.prototype = new Simple();

Spinner.prototype.constructor = Spinner;

Spinner.prototype.alias = 'spinner';

Spinner.prototype.template = function() {/*
    <input id="editor" type="number">
*/
};


module.exports = Spinner;
