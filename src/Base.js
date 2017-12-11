/* globals alert */

'use strict';

var HypergridError = require('./lib/error');

/**
 * @constructor
 * @desc Extend from this base class using `Base.extend` per example.
 * @example
 * var prototype = { ... };
 * var descendantClass = Base.extend(prototype};
 * @classdesc This is an abstract base class available for all Hypergrid classes.
 */
var Base = require('extend-me').Base;

Base.prototype.version = require('../package.json').version;
Base.prototype.versionParts = splitVersionIntoParts(Base.prototype.version);
Base.prototype.versionAtLeast = function(v) {
    v = splitVersionIntoParts(v);
    for (var i = 0; i < v.length; i++) {
        var delta = v[i] - this.versionParts[i];
        if (delta === 0) { continue; } else { return delta < 0; }
    }
    return true;
};
function splitVersionIntoParts(v) {
    v = v ? v.split('.').map(function(n) { return Number(n); }) : [];
    if (v.find(function(n) { return isNaN(n); })) { v.length = 0; }
    switch (v.length) {
        case 1: v.push(0); // fall through
        case 2: v.push(0); // fall through
        case 3: break;
        default: throw new HypergridError('Expected version number to consist of 1, 2, or 3 dot-separated parts.');
    }
    return v;
}

Base.prototype.deprecated = require('./lib/deprecated');
Base.prototype.HypergridError = HypergridError;

Base.prototype.notify = function(message, onerror) {
    switch (onerror) {
        case 'warn': console.warn(message); break;
        case 'alert': alert(message); break; // eslint-disable-line no-alert
        default: throw new this.HypergridError(message);
    }
};

/**
 * Convenience function for getting the value when that value can be defined as a function that needs to be called to get the actual (primitive) value.
 * @param value
 * @returns {*}
 */
Base.prototype.unwrap = function(value) {
    if ((typeof value)[0] === 'f') {
        value = value();
    }
    return value;
};

/**
 * @method
 * @summary Mixes source members into calling context.
 * @desc Context is typically either an instance or the (shared) prototype of a "class" extended from {@link Base} (see examples).
 *
 * Typically used by plug-ins.
 * @example
 * // define instance members: myGrid.fix(), etc.
 * myGrid.mixIn({ fix: function() {...}, ... });
 * @example
 * // define prototype members: Hypergrid.prototype.fix(), etc.
 * Hypergrid.prototype.mixIn({ fix: function() {...}, ... });
 * @See {@link https://joneit.github.io/overrider/module-overrider.htm#.mixIn}
 * @param {object} source
 */
Base.prototype.mixIn = require('overrider').mixIn;


/**
 * @method
 * @summary Instantiate an object with discrete + variable args.
 * @desc The discrete args are passed first, followed by the variable args.
 * @param {function} Constructor
 * @param {Array} variableArgArray
 * @param {...*} discreteArgs
 * @returns {object} Object of type `Constructor` newly constructor using the arguments in `arrayOfArgs`.
 */
Base.prototype.createApply = function(Constructor, variableArgArray, discreteArgs) {
    var discreteArgArray = Array.prototype.slice.call(arguments, 2),
        args = [null] // null is context for `bind` call below
            .concat(discreteArgArray) // discrete arguments
            .concat(variableArgArray), // variable arguments
        BoundConstructor = Constructor.bind.apply(Constructor, args);

    return new BoundConstructor;
};


module.exports = Base;
