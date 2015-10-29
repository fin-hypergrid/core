'use strict';

var Base = require('./Base.js');

var alphaFor = function(i) {
    // Name the column headers in A, .., AA, AB, AC, .., AZ format
    // quotient/remainder
    //var quo = Math.floor(col/27);
    var quo = Math.floor((i) / 26);
    var rem = (i) % 26;
    var code = '';
    if (quo > 0) {
        code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
    }
    code += String.fromCharCode('A'.charCodeAt(0) + rem);
    return code;
};
//var noop = function() {};
var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function InMemory() {
    Base.call(this);
};

InMemory.prototype = Object.create(Base.prototype);

InMemory.prototype.dataUpdates = {};

/**
* @function
* @instance
* @description
this is the most important behavior function it returns each data point at x,y coordinates
* #### returns: Object
 * @param {integer} x - the x coordinate
 * @param {integer} x - the y coordinate
*/
InMemory.prototype.getValue = function(x, y) {
    var override = this.dataUpdates['p_' + x + '_' + y];
    if (override) {
        return override;
    }
    if (x === 0) {
        if (y === 0) {
            return '';
        }
        return y;
    }
    if (y === 0) {
        return alphaFor(x - 1);
    }
    return (x - 1) + ', ' + a[(y - 1) % 26];
};

InMemory.prototype.setValue = function(x, y, value) {
    this.dataUpdates['p_' + x + '_' + y] = value;
};

InMemory.prototype.getColumnCount = function() {
    return 27;
};

InMemory.prototype.getRowCount = function() {
    //jeepers batman a quadrillion rows!
    return 53;
};

module.exports = InMemory;
