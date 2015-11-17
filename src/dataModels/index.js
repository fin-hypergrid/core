'use strict';

module.exports = {
    DataModel: require('./DataModel'), // abstract base class
    Default: require('./Default'),
    InMemory: require('./InMemory'),
    JSON: require('./JSON')
};