'use strict';

var Base = require('extend-me').Base;

Base.prototype.deprecated = require('./deprecated');
Base.prototype.HypergridError = require('./error');
Base.prototype.unwrap = unwrap;

function unwrap(value) {
    if (typeof value === 'function') {
        value = value();
    }
    return value;
}

module.exports = Base;
