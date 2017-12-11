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
 * Note: The npm "main" entry point is undefined in package.json implying /index.js which is an indirection to /src/Hypergrid.js.
 */

// Create the `fin` namespace if not already extant
var fin = window.fin = window.fin || {};

// Create the `fin.Hypergrid` object, which serves both as a "class" (constructor) and a namespace:
var Hypergrid = fin.Hypergrid = require('./Hypergrid');

// Install the module loader
Hypergrid.require = require('./module-loader');

// Install implicit modules which are external modules but are not overridable so non-configurable, non-writable
Object.defineProperties(Hypergrid.modules, {
    'extend-me': {value: require('extend-me') },
    'fin-hypergrid-field-tools': { value: require('fin-hypergrid-field-tools') },
    pubsubstar: { value: require('pubsubstar') },
    rectangular: { value: require('rectangular') },
    'datasaur-base': { value: require('datasaur-base') }, // scheduled for removal in v4
    'datasaur-local': { value: require('datasaur-local') } // scheduled for removal in v4
});

// Install internal modules may not be overridden so non-configurable, non-writable
Object.defineProperties(Hypergrid.src, {
    lib: { value: require('./lib') },
    behaviors: { value: require('./behaviors') },
    dataModels: { value: require('./dataModels') },
    features: { value: require('./features') }
});

// Deprecate certain properties
Object.defineProperties(Hypergrid, {
    lib: { get: deprecated.bind(null, 'lib') },
    behaviors: { get: deprecated.bind(null, 'behaviors') },
    dataModels: { get: deprecated.bind(null, 'dataModels') },
    features: { get: deprecated.bind(null, 'features') },
    rectangular: { get: deprecated.bind(null, 'rectangular', 'modules') }
});

// Note: The npm module version does *not* have the additional following properties
// (.require, .src, and .modules). Both internal and external modules can be accessed
// with Browserify's require() in exactly the same way as with Hypergrid.require():
// For example:
// var pubsub = require('pubsubstar');
// var behaviorJSON = require('fin-hypergrid/src/behaviors/JSON');

function deprecated(key, registry) {
    registry = registry || 'src';

    var requireString = registry === 'src' ? 'fin-hypergrid/src/' + key + '/modulename' : key;

    console.warn(new Error('Direct reference to source modules using' +
        ' `Hypergrid.' + key + '.modulename` has been deprecated as of v3.0.0 in favor of' +
        ' `Hypergrid.require(\'' + requireString + '\')` and will be removed in a future release.' +
        ' See Client Modules wiki.'));

    return Hypergrid.require(requireString);
}
