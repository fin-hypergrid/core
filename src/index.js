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
 * Note: The npm "main" entry point (as noted in package.json) is Hypergrid.js.
 */

var Hypergrid = require('./Hypergrid');

Hypergrid.images = require('../images');
// Hypergrid.behaviors = require('./behaviors'); // this was moved to Hypergrid.js
Hypergrid.cellEditors = require('./cellEditors');
Hypergrid.features = require('./features');
Hypergrid.analytics = require('./Shared.js').analytics;
Hypergrid.DefaultFilter = require('./filter/DefaultFilter');
Hypergrid.ColumnSchemaFactory = require('./filter/ColumnSchemaFactory');
Hypergrid.FilterTree = require('filter-tree');
Hypergrid.localization = require('./lib/localization');

(window.fin = window.fin || {}).Hypergrid = Hypergrid;
