'use strict';

var packageName = require('../../package.json').name;
var Hypergrid = require('../Hypergrid/index');

var REGEX_SRC_MODULES = new RegExp('^' + packageName + '/src/(Base|defaults)$'),
    REGEX_INTERNAL_MODULES = new RegExp('^' + packageName + '/src/(lib|behaviors|dataModels|features)(/(\\w+))?$');

function moduleLoader(path) { // See https://github.com/fin-hypergrid/core/wiki/Client-Modules
    var module, crumbs;

    switch (path) {
        case packageName:
            module = Hypergrid;
            break;
        case packageName + '/images':
            module = require('../../images');
            break;
        default:
            if ((crumbs = path.match(REGEX_SRC_MODULES))) {
                module = Hypergrid.src[crumbs[1]];
            } else if ((crumbs = path.match(REGEX_INTERNAL_MODULES))) {
                module = Hypergrid.src[crumbs[1]];
                if (crumbs[3]) {
                    module = module[crumbs[3]];
                }
            } else {
                module = Hypergrid.modules[path];
            }
    }

    if (!module) {
        var msg = 'Unknown module ' +  path,
            match = path.match(/(\/(index(\.js)?)?|\.js)$/);

        if (match) {
            msg += ' (try omitting trailing "' + match[1] + '")';
        }

        throw msg;
    }

    return module;
}

module.exports = moduleLoader;
