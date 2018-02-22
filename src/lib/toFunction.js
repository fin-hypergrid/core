'use strict';

var HypergridError = require('./error');

/**
 * @param {function|string} string
 * @returns {function}
 * @private
 */
module.exports = function(string) {
    switch (typeof string) {
        case 'undefined':
        case 'function':
            return string;
        case 'string':
            break;
        default:
            throw new HypergridError('Expected string, function, or undefined.');
    }

    var args = string.match(/^function\s*\w*\s*\(([^]*?)\)/);
    if (!args) {
        throw new HypergridError('Expected function keyword with formal parameter list.');
    }
    args = args[1].split(',').map(function(s, i) {
        s = s.match(/\s*(\w*)\s*/); // trim each argument
        if (!s && i) {
            throw new HypergridError('Expected formal parameter.');
        }
        return s[1];
    });

    var body = string.match(/{\s*([^]*?)\s*}\s*$/);
    if (!body) {
        throw new HypergridError('Expected function body.');
    }
    body = body[1];

    if (args.length === 1 && !args[0]) {
        args[0] = body;
    } else {
        args = args.concat(body);
    }

    return Function.apply(null, args);
};
