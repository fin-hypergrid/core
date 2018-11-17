/* globals alert */

'use strict';

/**
 * @constructor
 * @desc Extend from this base class using `Base.extend` per example.
 * @example
 * var prototype = { ... };
 * var descendantClass = Base.extend(prototype};
 * @classdesc This is an abstract base class available for all Hypergrid classes.
 */
var Base = require('extend-me').Base;

Object.defineProperty(Base.prototype, 'version', {
    enumerable: true,
    writable: false, // read-only
    configurable: false,
    value: require('../package.json').version
});

Base.prototype.versionAtLeast = function(neededVersion) {
    var neededParts = neededVersion.split('.').map(Number),
        delta = this.version.split('.').map(function(part, i) { return Number(part) - neededParts[i]; });
    return (
        delta[0] > 0 ||
        delta[0] === 0 && (
            delta[1] > 0 ||
            delta[1] === 0 && delta[2] >= 0
        )
    );
};

Base.prototype.deprecated = require('./lib/deprecated');
Base.prototype.HypergridError = require('./lib/error');

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
