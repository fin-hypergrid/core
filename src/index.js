/* eslint-env browser */

'use strict';

/* NOTE
 *
 * What this file is:
 * * This file is browserify's entry point.
 * * This file creates the window.fin.Hypergrid object.
 *
 * What this file is not:
 * * This file is a node module.
 * * This file has no reference to `module.exports`
 * * This file cannot be "required" by any other file.
 * * This file is blacklisted in .npmignore and is not published to npm.
 *
 * Note: The npm "main" entry point (as noted in package.json) is Hypergrid.js.
 */

require('./lib/polyfills');

require('object-iterators'); // Installs the Array.find polyfill, as needed

var Hypergrid = require('./Hypergrid');

Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.cellEditors = require('./cellEditors');
Hypergrid.features = require('./features');
Hypergrid.analytics = require('./Shared.js').analytics;
Hypergrid.CustomFilter = require('./filter/CustomFilter');
Hypergrid.CustomFilter.filterUtil = require('./filter/filterUtil');

(window.fin = window.fin || {}).Hypergrid = Hypergrid;
