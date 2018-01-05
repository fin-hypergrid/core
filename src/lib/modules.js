'use strict';

/*
 * This module is the namespace of loaded external modules known to `Hypergrid.require`,
 * which may include loaded application modules, datasource modules, and plug-in modules.
 *
 * The pre-loaded external modules listed below can conveniently be overridden by the
 * application developer by loading a new module using the same key.
 *
 * For example, to override `finbars` with another compatible module (that conforms to the
 * same interface), just assign it like so: `Hypergrid.modules.Scrollbar = myFinbarReplacement;`
 */

module.exports = {
    Scrollbar: require('finbars')
};
