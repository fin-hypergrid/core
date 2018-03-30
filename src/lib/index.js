'use strict';

var mixIn = require('overrider').mixIn;

var lib = {
    assignOrDelete: require('./assignOrDelete'),
    cellEventFactory: require('./cellEventFactory'),
    dynamicProperties: require('./dynamicProperties'),
    dispatchGridEvent: require('./dispatchGridEvent'),
    fields: require('./fields'),
    graphics: require('./graphics'),
    Canvas: require('./Canvas'),
    InclusiveRectangle: require('./InclusiveRectangle')
};

mixIn.call(lib, require('./deprecations'));

module.exports = lib;
