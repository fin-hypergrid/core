/* eslint-env browser */

'use strict';

require('object-iterators'); // Installs the Array.find polyfill, as needed

var Hypergrid = require('./Hypergrid');

Hypergrid.images = require('../images');
Hypergrid.behaviors = require('./behaviors');
Hypergrid.cellEditors = require('./cellEditors');
Hypergrid.features = require('./features');

(window.fin = window.fin || {}).Hypergrid = Hypergrid;
