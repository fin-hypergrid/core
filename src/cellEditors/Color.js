'use strict';
/**
 *
 * @module cell-editors\Color
 *
 */

var Simple = require('./Simple.js');

function Color() {
    Simple.call(this);
}

Color.prototype = new Simple();

Color.prototype.constructor = Color;

Color.prototype.alias = 'color';

Color.prototype.template = function() {/*
    <input id="editor" type="color">
*/
};


module.exports = Color;
