'use strict';

// This file in root folder allows an app under development in a sister folder to reference a local build
// of Hypergrid with "file://../fin-hypergrid" in it's package.json. (Still has to be npm install'd.)

module.exports = require('./src/hypergrid');
