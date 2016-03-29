/* eslint-env browser */

'use strict';

require('./lib/polyfills');

require('object-iterators'); // Installs the Array.find polyfill, as needed

var Hypergrid = require('./Hypergrid');

Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.cellEditors = require('./cellEditors');
Hypergrid.features = require('./features');
Hypergrid.analytics = require('hyper-analytics');
Hypergrid.CustomFilter = require('./filter/CustomFilter');
Hypergrid.CustomFilter.schema = require('./filter/schema');

(window.fin = window.fin || {}).Hypergrid = Hypergrid;
