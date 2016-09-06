'use strict';

// console.warn polyfill as needed
// used for deprecation warnings
if (!console.warn) {
    console.warn = function() {
        console.log.apply(console, ['WARNING:'].concat(Array.prototype.slice.call(arguments)));
    };
}

var warned = {};

var regexIsMethod = /\)$/;

/**
 * User is warned and new property is returned or new method is called and the result is returned.
 * @param {string} methodName - Deprecated method name with parentheses (required) containing argument list (optional; see `args` below).
 * @param {string} dotProps - Dot-separated new property name to invoke or method name to call. Method names are indicated by including parentheses with optional argument list. The arguments in each list are drawn from the arguments presented in the `methodName` parameter.
 * @param {string} since - Version in which the name was deprecated.
 * @param {Arguments|Array} [args] - The actual arguments in the order listed in `methodName`. Only needed when arguments need to be forwarded.
 * @param {string} [notes] - Notes to add to message.
 * @returns {*} Return value of new property or method call.
 */
var deprecated = function(methodName, dotProps, since, args, notes) {
    if (!regexIsMethod.test(methodName)) {
        throw 'Expected method name to have parentheses.';
    }

    if (typeof args === 'string') {
        // `args` omitted
        notes = args;
        args = undefined;
    }

    var chain = dotProps.split('.'),
        formalArgList = argList(methodName),
        result = this;

    if (!(methodName in warned)) {
        warned[methodName] = deprecated.warnings;
    }
    if (warned[methodName]) {
        var memberType = regexIsMethod.test(dotProps) ? 'method' : 'property';
        var warning = 'The .' + methodName + ' method is deprecated as of v' + since +
            ' in favor of the .' + chain.join('.') + ' ' + memberType + '.' +
            ' (Will be removed in a future release.)';

        if (notes) {
            warning += ' ' + notes;
        }

        console.warn(warning);

        --warned[methodName];
    }

    function mapToFormalArg(argName) {
        var index = formalArgList.indexOf(argName);
        if (index === -1) {
            throw 'Actual arg "' + argName + '" not found in formal arg list ' + formalArgList;
        }
        return args[index];
    }

    for (var i = 0, last = chain.length - 1; i <= last; ++i) {
        var link = chain[i],
            name = link.match(/\w+/)[0],
            isMethod = regexIsMethod.test(link),
            actualArgList = isMethod ? argList(link) : undefined,
            actualArgs = [];

        if (actualArgList) {
            actualArgs = actualArgList.map(mapToFormalArg);
            result = result[name].apply(result, actualArgs);
        } else if (isMethod) {
            result = result[name]();
        } else {
            result = result[name];
        }
    }

    return result;
};

deprecated.warnings = 5; // just enough to be annoying

function argList(s) {
    return s.match(/^\w+\((.*)\)$/)[1].match(/(\w+)/g);
}

module.exports = deprecated;
