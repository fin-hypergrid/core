'use strict';

var YIELDS = '\u27F9'; // LONG RIGHTWARDS DOUBLE ARROW

function consoleLogger(prefix, name, args, value) {
    var result = value;

    if (typeof value === 'string') {
        result = '"' + result + '"';
    }

    name = prefix + name;

    switch (args) {
        case 'getter':
            console.log(name, '=', result);
            break;

        case 'setter':
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
