'use strict';

/*
 * This module is the namespace of loaded external modules known to `Hypergrid.require`,
 * which may include loaded application modules, datasource modules, and plug-in modules.
 *
 * Applications can override the "overridable" modules. For example, to override `finbars` with
 * a compatible module (that conforms to the same interface), just assign it like so:
 * ```js
 * Hypergrid.modules.Scrollbar = myFinbarReplacement;
 * ```
 */

// overridable modules
// Hypergrid vectors through here for these modules
module.exports = {
    Scrollbar: require('finbars'),
    templater: require('mustache') // mustache interface: { render: function(template, context) }
};

// non-overridable modules
// Access via `Hypergrid.require`
// For users of pre-bundled build file (others should use `require`)
// These are NOT overridable so non-configurable, non-writable
Object.defineProperties(module.exports, {
    'datasaur-base': { value: require('datasaur-base') }, // may be removed in a future release
    'datasaur-local': { value: require('datasaur-local') }, // may be removed in a future release
    'extend-me': {value: require('extend-me') },
    finbars: { value: require('finbars') },
    'object-iterators': { value: require('object-iterators') },
    overrider: { value: require('overrider') },
    rectangular: { value: require('rectangular') },
    'sparse-boolean-array': { value: require('sparse-boolean-array') },
    synonomous: { value: require('synonomous') }
});
