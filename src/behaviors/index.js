'use strict';

// This module is provided solely in support of build file usage, e.g., `fin.Hypergrid.require('fin-hypergrid/src/behaviors/whatever')`,
// and is not meant to be used elsewhere.

var warned;

module.exports = {
    Behavior: require('./Behavior'),
    Local: require('./Local'),
    Column: require('./Column'),

    get JSON() {
        if (!warned) {
            console.warn('./src/behaviors/JSON has been renamed to Local as of v3.0.0. (Will be removed in a future release.)');
        }
        warned = true;
        return require('./Local');
    }
};
