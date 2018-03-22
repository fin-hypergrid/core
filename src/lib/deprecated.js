'use strict';

// console.warn polyfill as needed
// used for deprecation warnings
if (!console.warn) {
    console.warn = function() {
        console.log.apply(console, ['WARNING:'].concat(Array.prototype.slice.call(arguments)));
    };
}

var regexIsMethod = /^[\w\.]+\(.*\)$/;

/**
 * User is warned and new property is returned or new method is called and the result is returned.
 * @param {string} methodName - Warning key paired with arbitrary warning in `dotProps` OR deprecated method name with parentheses containing optional argument list paired with replacement property or method in `dotProps`.
 * @param {string} dotProps - Arbitrary warning paired with warning key in `methodName` OR dot-separated new property name to invoke or method name to call. Method names are indicated by including parentheses with optional argument list. The arguments in each list are drawn from the arguments presented in the `methodName` parameter.
 * @param {string} since - Version in which the name was deprecated.
 * @param {Arguments|Array} [args] - The actual arguments in the order listed in `methodName`. Only needed when arguments need to be forwarded.
 * @param {string} [notes] - Notes to add to message.
 * @returns {*} Return value of new property or method call.
 */
var deprecated = function(methodName, dotProps, since, args, notes) {
    if (typeof args === 'string') {
        // `args` omitted
        notes = args;
        args = undefined;
    }

    var chain = dotProps.split('.'),
        warned = this.$$DEPRECATION_WARNED = this.$$DEPRECATION_WARNED || {},
        result = this,
        isSimpleWarning = dotProps.indexOf(' ') >= 0,
        isMethodCall = regexIsMethod.test(methodName),
        memberType,
        warning;

    if (!(methodName in warned)) {
        warned[methodName] = deprecated.warnings;
    }

    if (isMethodCall) {
        if (isSimpleWarning) {
            throw 'Expected replacement method or property in 2nd parameter of deprecated() call.';
        } else if (warned[methodName]) {
            --warned[methodName];
            memberType = regexIsMethod.test(dotProps) ? 'method' : 'property';
            warning = 'The .' + methodName + ' method has been deprecated as of v' + since +
                ' in favor of the .' + chain.join('.') + ' ' + memberType + '.' +
                ' (Will be removed in a future release.)';

            if (notes) {
                warning += ' ' + notes;
            }

            console.warn(warning);
        }
    } else if (isSimpleWarning) {
        if (warned[methodName]) {
            --warned[methodName];
            console.warn(dotProps);
        }
        return;
    } else {
        throw 'Expected method name with parentheses in 1st parameter OR simple warning (containing one or more spaces) in 2nd parameter of deprecated() call.';
    }

    var formalArgList = argList(methodName);

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
            linkIsMethodCall = regexIsMethod.test(link),
            actualArgList = linkIsMethodCall ? argList(link) : undefined,
            actualArgs = [];

        if (actualArgList) {
            actualArgs = actualArgList.map(mapToFormalArg);
            result = result[name].apply(result, actualArgs);
        } else if (linkIsMethodCall) {
            result = result[name]();
        } else {
            result = result[name];
        }
    }

    return result;
};

deprecated.warnings = 1; // 3 or 5 would get more attention

function argList(s) {
    return s.match(/^\w+\((.*)\)$/)[1].match(/(\w+)/g);
}

module.exports = deprecated;
