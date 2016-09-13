'use strict';

var deprecated = require('./deprecated');
var Base = require('extend-me').Base;

Base.prototype.deprecated = deprecated;
Base.prototype.HypergridError = HypergridError;
Base.prototype.unwrap = unwrap;

function HypergridError(message) {
    this.message = message;
}
HypergridError.prototype = Object.create(Error.prototype);
HypergridError.prototype.name = 'HypergridError';

function unwrap(value) {
    if (typeof value === 'function') {
        value = value();
    }
    return value;
}

module.exports = Base;
