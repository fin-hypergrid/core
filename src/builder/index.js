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
 * * This file (along with module-loader.js) is blacklisted in .npmignore and is not published to npm.
 *
 * Note: The npm "main" entry point is undefined in package.json implying /index.js
 * which just contains an indirection to /src/Hypergrid/index.js.
 */

// Create the `fin` namespace if not already extant
var fin = window.fin = window.fin || {};

// Create the `fin.Hypergrid` object, which serves both as a "class" (constructor) and a namespace:
var Hypergrid = fin.Hypergrid = require('../Hypergrid');

// Install the module loader
Hypergrid.require = require('./module-loader');

// Install `src` the internal module namespace which is for the build file only
Hypergrid.src = {};

// Note: At this point, `Hypergrid.modules`, the external module namespace, has already
// been installed by ./Hypergrid/index.js (for both npm and build modules).

// Install implicit modules which are external modules but are not overridable so non-configurable, non-writable
Object.defineProperties(Hypergrid.modules, {
    'extend-me': {value: require('extend-me') },
    'object-iterators': { value: require('object-iterators') },
    overrider: { value: require('overrider') },
    rectangular: { value: require('rectangular') },
    'fin-hypergrid-field-tools': { value: require('fin-hypergrid-field-tools') },
    'datasaur-base': { value: require('datasaur-base') },
    'datasaur-local': { value: require('datasaur-local') }
});

// Install internal modules may not be overridden so non-configurable, non-writable
Object.defineProperties(Hypergrid.src, {
    lib: { value: require('../lib') },
    behaviors: { value: require('../behaviors') },
    dataModels: { value: require('../dataModels') },
    features: { value: require('../features') },
    Base: { value: require('../Base') },
    defaults: { value: require('../defaults') }
});

// Deprecate certain properties
Object.defineProperties(Hypergrid, {
    lib: { get: deprecated.bind(null, 'lib') },
    behaviors: { get: deprecated.bind(null, 'behaviors') },
    dataModels: { get: deprecated.bind(null, 'dataModels') },
    features: { get: deprecated.bind(null, 'features') },
    rectangular: { get: deprecated.bind(null, 'rectangular', 'modules') }
});

function deprecated(key, registry) {
    registry = registry || 'src';

    var requireString, warning;

    switch (registry) {
        case 'src':
            requireString = 'fin-hypergrid/src/' + key;
            warning = 'Reference to ' + key + ' internal modules using' +
                ' `Hypergrid.' + key + '.modulename` has been deprecated as of v3.0.0 in favor of' +
                ' `Hypergrid.require(\'' + requireString + '/modulename\')` and will be removed in a future release.' +
                ' See https://github.com/fin-hypergrid/core/wiki/Client-Modules#predefined-modules.';
            break;

        case 'modules':
            requireString = key;
            warning = 'Reference to ' + key + ' external module using' +
                ' `Hypergrid.' + key + '.` has been deprecated as of v3.0.0 in favor of' +
                ' `Hypergrid.require(\'' + requireString + '\')` and will be removed in a future release.' +
                ' See https://github.com/fin-hypergrid/core/wiki/Client-Modules#external-modules.';
    }

    if (!deprecated.warned[key]) {
        console.warn(warning);
        deprecated.warned[key] = true;
    }

    return Hypergrid.require(requireString);
}
deprecated.warned = {};
