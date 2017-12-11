'use strict';

var packageName = require('../package.json').name;
var Hypergrid = require('./Hypergrid');

var REGEX_INTERNAL_MODULE = new RegExp('^' + packageName + '/src/(lib|behaviors|dataModels|features)/(\\w+)$');


// Internal module namespace
Hypergrid.src = {};

// External module namespace
// Hypergrid.modules is already defined (in Hypergrid.js)


function moduleLoader(path) { // See https://github.com/fin-hypergrid/core/wiki/Client-Modules
    var module, crumbs;

    if (path === packageName) {
        module = Hypergrid;
    } else if ((crumbs = path.match(REGEX_INTERNAL_MODULE))) {
        module = Hypergrid.src[crumbs[1]][crumbs[2]];
    } else {
        module = Hypergrid.modules[path];
    }

    if (!module) {
        throw 'Unknown module ' +  path;
    }

    return module;
}

module.exports = moduleLoader;
