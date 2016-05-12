'use strict';

// console.warn polyfill as needed
// used for deprecation warnings
if (!console.warn) {
    console.warn = function() {
        console.log.apply(console, ['WARNING:'].concat(Array.prototype.slice.call(arguments)));
    };
}

/**
 *
 * @param dotProps
 * @param {object} [options]
 * @param {object} [options.asOfVersion]
 * @param {object} [options.getterName] - If omitted, final name in dotProps will be used prefixed with 'get'.
 * @returns {deprecated}
 */
var deprecated = function(dotProps, options) {
    var chain = dotProps.split('.'),
        method = chain[chain.length - 1],
        asOfVersion = options && options.asOfVersion,
        result = this,
        warning;

    method = options && options.getterName || 'get' + method[0].toUpperCase() + method.substr(1);

    warning = '.' + method + '() method is deprecated';

    if (asOfVersion) {
        warning += ' as of v' + options.asOfVersion;
    }

    warning += '. Use .' + dotProps;

    if (dotProps[dotProps.length - 1] !== ')') {
        warning += ' property';
    }

    warning += ' instead. (Will be removed in a future release.)';

    console.warn(warning);

    chain.forEach(function(link) {
        result = result[link];
    });

    return result;
};

module.exports = deprecated;
