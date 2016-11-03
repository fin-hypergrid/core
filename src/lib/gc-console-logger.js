'use strict';

var YIELDS = '\u27F9'; // LONG RIGHTWARDS DOUBLE ARROW

/**
 * To log all graphics calls, supply this function as `options.logger` to {@link GraphicsContext}.
 * @param prefix
 * @param name
 * @param args
 * @param value
 * @returns {*}
 */
function consoleLogger(prefix, name, args, value) {
    var result = value;

    if (typeof value === 'string') {
        result = '"' + result + '"';
    }

    name = prefix + name;

    switch (args) {
        case true:
            console.log(name, '=', result);
            break;

        case false:
            console.log(name, YIELDS, result);
            break;

        default: // method call
            name += '(' + Array.prototype.slice.call(args).join(', ') + ')';
            if (result === undefined) {
                console.log(name);
            } else {
                console.log(name, YIELDS, result);
            }
    }

    return value;
}

module.exports = consoleLogger;
