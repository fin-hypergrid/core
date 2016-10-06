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
 * Note: The npm "main" entry point (as noted in package.json) is src/Hypergrid.js.
 */

var Hypergrid = require('./Hypergrid');

// Expose some namespaces to users of the hypergrid.js file through `fin.Hypergrid`:
Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.dataModels = require('./dataModels');
Hypergrid.features = require('./features');
Hypergrid.analytics = require('./Shared.js').analytics;
Hypergrid.DataSourceBase = require('fin-hypergrid-data-source-base');
Hypergrid.rectangular = require('rectangular');

// Create the `fin` and in particular the `fin.Hypergrid` objects:
(window.fin = window.fin || {}).Hypergrid = Hypergrid;

// Note that while users of the npm module can also access the above namespaces through the Hypergrid object, in reality they also have access to any namespace through `require`, for example:
// var behaviorJSON = require('fin-hypergrid/src/behaviors/JSON');
