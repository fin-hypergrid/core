'use strict';
/**
 *
 * @module cell-editors\Date
 *
 */

var Simple = require('./Simple.js');

function Date() {
    Simple.call(this);
}

Date.prototype = new Simple();

Date.prototype.constructor = Date;

Date.prototype.alias = 'date';

Date.prototype.template = function() {/*
    <input id="editor" type="date">
*/
};


module.exports = Date;
