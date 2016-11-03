'use strict';

var consoleLogger = require('./gc-console-logger');

/**
 * @constructor
 * @param gc - The 2-D graphics context from your canvas
 * @param {boolean|apiLogger} [logger=true]
 * * `true` uses `gc-console-logger` function bound to 'gc.' as prefix
 * * string uses `gc-console-logger` function bound to string
 * * function used as is
 */
function GraphicsContext(gc, logger) {
    this.gc = gc;

    var self = this;
    var reWEBKIT = /^webkit/;

    switch (typeof logger) {
        case 'string':
            logger =  consoleLogger.bind(undefined, logger + '.');
            break;

        case 'function':
            if (logger.length !== 4) {
                throw 'GraphicsContext: User-supplied API logger function does not accept four parameters.';
            }
            break;

        default:
            throw 'Expected logger to be string|boolean|function.';
    }

    // Stub out all the prototype members of the canvas 2D graphics context:
    Object.keys(Object.getPrototypeOf(gc)).forEach(MakeStub);

    // Some older browsers (e.g., Chrome 40) did not have all members of canvas
    // 2D graphics context in the prototype so we make this additional call:
    Object.keys(gc).forEach(MakeStub);

    function MakeStub(key) {
        if (key in GraphicsContext.prototype || reWEBKIT.test(key)) {
            return;
        }
        if (typeof gc[key] === 'function') {
            self[key] = !logger ? gc[key].bind(gc) : function() {
                return logger(key, arguments, gc[key].apply(gc, arguments));
            };
        } else {
            Object.defineProperty(self, key, {
                get: function() {
                    var result = gc[key];
                    return logger(key, true, result);
                },
                set: function(value) {
                    gc[key] = logger(key, false, value);
                }
            });
        }
    }
}

GraphicsContext.get = function(gc, logger) {
    if (!logger) {
        return gc;
    } else {
        return new GraphicsContext(gc, logger);
    }
};


module.exports = GraphicsContext;
