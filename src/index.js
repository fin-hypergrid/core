/* eslint-env browser */

'use strict';

/* NOTE
 *
 * What this file is:
 * * This file is browserify's entry point.
 * * This file creates the `window.fin.Hypergrid` object.
 *
 * What this file is not:
 * * This file is not a node module; it has no reference to `module.exports` or `exports`; it cannot be "required" by any other file.
 * * This file is blacklisted in .npmignore and is not published to npm.
 *
 * Note: The npm "main" entry point is undefined in package.json implying /index.js.
 */

var Hypergrid = require('./Hypergrid');

Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.dataModels = require('./dataModels');
Hypergrid.features = require('./features');
Hypergrid.rectangular = require('rectangular');
Hypergrid.lib = require('./lib');
Hypergrid.Base = require('./Base');

var windowRequire = window.require;

// Recommended usage:
// if (fin && fin.Hypergrid) { require = fin.Hypergrid.require; } // install
// var Base = require('fin-hypergrid/src/Base');
Hypergrid.require = function(path) {
    var result, crumbs, i,
        errMsg = 'Path ' + path + ' unknown or not exposed in build file.';

    if (path.indexOf('fin-hypergrid/') === 0) {
        result = Hypergrid;
        crumbs = path.split('/');
        i = 1;

        if (crumbs[i] === 'src') {
            switch (crumbs[++i]) {
                case 'lib':
                case 'Base':
                case 'behaviors':
                case 'dataModels':
                case 'features':
                    result = result[crumbs[i++]];
                    break;
                default:
                    throw errMsg;
            }
        }

        while (crumbs[i]) {
            switch (crumbs[i]) {
                case 'lib':
                case 'Base':
                case 'behaviors':
                case 'dataModels':
                case 'features':
                    result = undefined;
                    break;
                default:
                    result = result[crumbs[i++]];
            }
            if (!result) {
                throw errMsg;
            }
        }

        return result;
    } else if (windowRequire) {
        return windowRequire.apply(this, arguments);
    } else {
        throw errMsg;
    }

    return result;
};

// Create the `fin` namespace and the `fin.Hypergrid` objects:
(window.fin = window.fin || {}).Hypergrid = Hypergrid;

// Note users of the npm module do not have this object.
// THey have access to any namespace through `require`, for example:
// var behaviorJSON = require('fin-hypergrid/src/behaviors/JSON');
