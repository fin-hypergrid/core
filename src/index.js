/* eslint-env browser */

'use strict';

var Hypergrid = require('./Hypergrid');

Hypergrid.behaviors = require('./behaviors/index');
Hypergrid.cellEditors = require('./cellEditors/index');
Hypergrid.features = require('./features/index');

require('./polyfills');

window.fin = {
    Hypergrid: Hypergrid
};
