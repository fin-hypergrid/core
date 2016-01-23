'use strict';

var deprecated = require('./deprecated');
var Base = require('extend-me').Base;

Base.prototype.deprecated = deprecated;

module.exports = Base;
