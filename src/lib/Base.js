'use strict';

var deprecated = require('./deprecated');
var Base = require('extend-me').Base;

Base.prototype.deprecated = deprecated;
Base.prototype.HypergridError = HypergridError;


function HypergridError(message) {
    this.message = message;
}
HypergridError.prototype = Object.create(Error.prototype);
HypergridError.prototype.name = 'HypergridError';


module.exports = Base;
