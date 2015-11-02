'use strict';
/**
 *
 * @module cell-editors\Slider
 *
 */

var Simple = require('./Simple.js');

function Slider() {
    Simple.call(this);
}

Slider.prototype = new Simple();

Slider.prototype.constructor = Slider;

Slider.prototype.alias = 'slider';

Slider.prototype.template = function() {/*
    <input id="editor" type="range">
*/
};


module.exports = Slider;
