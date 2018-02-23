'use strict';

// This file creates the Hypergrid theme registry, exposed via:
// shared methods `Hypergrid.registerTheme` and `Hypergrid.applyTheme`
// and instance methods `myGrid.applyTheme`.
// The initial registry consists of a single theme ('default').
// Application developers can add additional themes to this registry.

var _ = require('object-iterators'); // fyi: installs the Array.prototype.find polyfill, as needed

var defaults = require('../defaults');
var dynamicPropertyDescriptors = require('../lib/dynamicProperties');
var HypergridError = require('../lib/error');

var styles = [
    'BackgroundColor',
    'Color',
    'Font'
];

var stylesWithHalign = styles.concat([
    'Halign'
]);

var dataCellStyles = stylesWithHalign.concat([
    'cellPadding',
    'iconPadding'
]);

var stylers = [
    { prefix: '',                                props: dataCellStyles },
    { prefix: 'foregroundSelection',             props: styles },
    { prefix: 'columnHeader',                    props: stylesWithHalign },
    { prefix: 'columnHeaderForegroundSelection', props: styles },
    { prefix: 'rowHeader',                       props: styles },
    { prefix: 'rowHeaderForegroundSelection',    props: styles }
];

var dynamicCosmetics = {
    rowHeaderCheckboxes: defaults.rowHeaderCheckboxes,
    rowHeaderNumbers: defaults.rowHeaderNumbers,
    gridBorder: defaults.gridBorder,
    gridBorderTop: defaults.gridBorderTop,
    gridBorderRight: defaults.gridBorderRight,
    gridBorderBottom: defaults.gridBorderBottom,
    gridBorderLeft: defaults.gridBorderLeft,
    gridRenderer: defaults.gridRenderer
};

// Create the `defaultTheme` theme by copying over the theme props,
// which is a subset of all the props defined in defaults.js, beginning with
// they dynamic cosmetics and `themeName`...
var defaultTheme = Object.assign({}, dynamicCosmetics, {
    themeName: defaults.themeName
});

// ...and then adding non-dynamic cosmetics into `defaultTheme`, by combining the above
// prefixes with their styles to get prop names and then copy those props from `defaults`.
stylers.reduce(function(theme, styler) {
    return styler.props.reduce(function(theme, prop) {
        prop = styler.prefix + prop;
        prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection'); // unfortunate!
        prop = prop[0].toLowerCase() + prop.substr(1);
        theme[prop] = defaults[prop];
        return theme;
    }, theme);
}, defaultTheme);

/**
 * @summary The Hypergrid theme registry.
 * @desc The standard registry consists of a single theme, `default`, built from values in defaults.js.
 */
var registry = Object.create(null, {
    default: { value: defaultTheme }
});
var pseudopropAdvice = {
    showRowNumbers: 'rowHeaderCheckboxes and rowHeaderNumbers',
    lineColor: 'gridLinesHColor and gridLinesVColor',
    lineWidth: 'gridLinesHWidth and gridLinesVWidth',
    gridBorder: 'gridBorderLeft, gridBorderRight, gridBorderTop, and gridBorderBottom'
};

function applyTheme(theme) {
    var themeLayer, grids, props;

    if (theme && typeof theme === 'object' && !Object.getOwnPropertyNames(theme).length) {
        theme = null;
    }

    if (this._theme) {
        grids = [this];
        themeLayer = this._theme;
        props = this.properties;

        // If removing theme, reset props to defaults
        if (!theme) {
            // Delete (non-dynamic) grid props named in this theme, revealing defaults
            Object.keys(themeLayer).forEach(function(key) {
                if (!(key in dynamicPropertyDescriptors)) {
                    delete props[key];
                }
            });

            // Reset dynamic cosmetic props to defaults
            Object.keys(dynamicCosmetics).forEach(function(key) {
                props.var[key] = defaults[key];
            });
        }

        // Delete all own props from this grid instance's theme layer (defined by an eariler call)
        Object.keys(themeLayer).forEach(function(key) {
            delete themeLayer[key];
        });
    } else {
        grids = this.grids;
        themeLayer = defaults; // global theme layer
        theme = theme || 'default';
    }

    if (typeof theme === 'string') {
        if (!registry[theme]) {
            throw new HypergridError('Unknown theme "' + theme + '"');
        }
        theme = registry[theme];
    }

    if (theme) {
        // When no theme name, set it to explicit `undefined` (to mask defaults.themeName).
        if (!theme.themeName) {
            theme.themeName = undefined;
        }

        Object.keys(theme).forEach(function(key) {
            if (key in dynamicPropertyDescriptors) {
                if (key in dynamicCosmetics) {
                    grids.forEach(function(grid) {
                        grid.properties[key] = theme[key];
                    });
                } else {
                    // Dynamic properties are defined on properties layer; defining these
                    // r-values on the theme layer is ineffective so let's not allow it.
                    var message = pseudopropAdvice[key];
                    message = message
                        ? 'Ignoring unexpected pseudo-prop ' + key + ' in theme object. Use actual props ' + message + ' instead.'
                        : 'Ignoring invalid property ' + key + ' in theme object.';
                    console.warn(message);
                    delete theme[key];
                }
            }
        });

        // No .assign() because themeName is read-only in defaults layer
        Object.defineProperties(themeLayer, Object.getOwnPropertyDescriptors(theme));
    }

    grids.forEach(function(grid) {
        grid.repaint();
    });
}


/**
 * @summary Instance theme support.
 * @desc Additions to `Hypergrid.prototype` for setting an instance theme.
 *
 * All members are documented on the {@link Hypergrid} page.
 * @mixin themes.mixin
 */
var mixin = {
    initThemeLayer: function() {
        /**
         * Descends from {@link module:defaults|defaults}.
         * @memberOf Hypergrid#
         * @private
         */
        this._theme = Object.create(defaults);

        return Object.create(this._theme, dynamicPropertyDescriptors);
    },

    /**
     * @summary Apply a grid theme.
     * @desc Apply props from the given theme object to the grid instance,
     * the instance's `myGrid.themeLayer` layer in the properties hierarchy.
     * @this {Hypergrid}
     * @param {object|string} [theme] - One of:
     * * **string:** A registered theme name.
     * * **object:** A unregistered (anonymous) theme object. Empty object removes grid theme, exposing global theme.
     * * _falsy value:_ Also removes grid theme.
     * @param {string|undefined} [theme.themeName=undefined]
     * @memberOf Hypergrid#
     */
    applyTheme: applyTheme,

    /**
     * @summary Get currently active theme.
     * @desc May return a theme name or a theme object.
     * @returns {string|undefined|object} One of:
     * * **string:** Theme name (registered theme).
     * * **object:** Theme object (unregistered anonymous theme).
     * * **undefined:** No theme (i.e., the default theme).
     * @memberOf Hypergrid#
     */
    getTheme: function() {
        var themeLayer = this._theme,
            themeName = themeLayer.themeName;
        return themeName === 'default' || !Object.getOwnPropertyNames(themeLayer).length
            ? undefined // default theme or no theme
            : themeName in registry
                ? themeName // registered theme name
                : themeLayer; // unregistered theme object
    }
};
Object.defineProperty(mixin, 'theme', {
    enumerable: true,
    set: mixin.applyTheme,
    get: mixin.getTheme
});


/**
 * @summary Theme registration and global theme support.
 * @desc Shared properties of `Hypergrid` "class" (_i.e.,_ "static" properties of constructor function) for registering themes and setting a global theme.
 *
 * All members are documented on the {@link Hypergrid} page (annotated as "(static)").
 * @mixin themes.sharedMixin
 */
var sharedMixin = {
    /**
     * @param {string} [name] - A registry name for the new theme. May be omitted if the theme has an embedded name (in `theme.themeName`).
     * _If omitted, the 2nd parameter (`theme`) is promoted to first position._
     * @param {HypergridThemeObject} [theme]
     * To build a Hypergrid theme object from a loaded {@link https://polymerthemes.com Polymer Theme} CSS stylesheet:
     * ```javascript
     * var myTheme = require('fin-hypergrid-themes').buildTheme();
     * ```
     * If omitted, the theme named in the first parameter is unregistered.
     * Grid instances that have previously applied the named theme are unaffected by this action (whether re-registering or unregistering).
     * @memberOf Hypergrid.
     */
    registerTheme: function(name, theme) {
        if (typeof name === 'object') {
            theme = name;
            name = theme.themeName;
        }

        if (!name) {
            throw new HypergridError('Cannot register an anonymous theme.');
        }

        if (name === 'default') {
            throw new HypergridError('Cannot register or unregister the "default" theme.');
        }

        if (theme) {
            theme.themeName = name;
            registry[name] = theme;
        } else {
            delete registry[name];
        }
    },

    /**
     * App developers are free to add in additional themes, such as those in {@link https://openfin.github.com/fin-hypergrid-themes/themes}:
     * ```javascript
     * Hypergrind.registerThemes(require('fin-hypergrid-themes'));
     * ```
     * @param {object} themeCollection
     * @memberOf Hypergrid.
     */
    registerThemes: function(themeCollection) {
        if (themeCollection) {
            _(themeCollection).each(function(theme, name) {
                this.registerTheme(name, theme);
            }, this);
        } else {
            Object.keys(registry).forEach(function(themeName) {
                this.registerTheme(themeName);
            }, this);
        }
    },

    /**
     * @summary Apply global theme.
     * @desc Apply props from the given theme object to the global theme object,
     * the `defaults` layer at the bottom of the properties hierarchy.
     * @this {Hypergrid.}
     * @param {object|string} [theme=registry.default] - One of:
     * * **string:** A registered theme name.
     * * **object:** A theme object. Empty object removes global them, restoring defaults.
     * * _falsy value:_ Also restores defaults.
     * @param {string|undefined} [theme.themeName=undefined]
     * @memberOf Hypergrid.
     */
    applyTheme: applyTheme
};
Object.defineProperty(sharedMixin, 'theme', { // global theme setter/getter
    enumerable: true,
    set: applyTheme,
    get: function() { return defaults; } // the defaults layer *is* the global theme layer
});


module.exports = {
    mixin: mixin,
    sharedMixin: sharedMixin
};
