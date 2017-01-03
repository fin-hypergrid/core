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

Hypergrid.analytics = require('hyper-analytics'); // npm
// Hypergrid.analytics = require('../../hyper-analytics'); // developer

// Expose some namespaces to users of the hypergrid.js file through `fin.Hypergrid`:
Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.dataModels = require('./dataModels');
Hypergrid.features = require('./features');
Hypergrid.rectangular = require('rectangular');
Hypergrid.lib = require('./lib');

// Create the `fin` namespace and the `fin.Hypergrid` objects:
(window.fin = window.fin || {}).Hypergrid = Hypergrid;

// Note users of the npm module do not have this object.
// THey have access to any namespace through `require`, for example:
// var behaviorJSON = require('fin-hypergrid/src/behaviors/JSON');
