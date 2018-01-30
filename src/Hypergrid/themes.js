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

// Here we create the `defaults` theme by copying over the theme props,
// which is a subset of all the props defined in defaults.js. The following
// combines the above prefixes with their styles to get theme prop names; and
// then copies those props from the defaults.js to create the `default` theme.
var defaultTheme = stylers.reduce(function(theme, styler) {
    return styler.props.reduce(function(theme, prop) {
        prop = styler.prefix + prop;
        prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection'); // unfortunate!
        prop = prop[0].toLowerCase() + prop.substr(1);
        theme[prop] = defaults[prop];
        return theme;
    }, theme);
}, {
    themeName: defaults.themeName
});

/**
 * @summary The Hypergrid theme registry.
 * @desc The standard registry consists of a single theme, `default`, built from values in defaults.js.
 */
var registry = {
    default: defaultTheme
};

/**
 * @param {string} [name] - A registry name for the new theme. May be omitted if the theme has an embedded name (in `theme.themeName`).
 * _If omitted, the 2nd parameter (`theme`) is promoted to first position._
 * @param {HypergridThemeObject} [theme]
 * To build a Hypergrid theme object from a loaded {@link https://polymerthemes.com Polymer Theme} CSS stylesheet:
 * ```javascript
 * var myTheme = require('fin-hypergrid-themes').buildTheme();
 * ```
 * @this {Hypergrid.constructor}
 * @memberOf Hypergrid.
 */
function registerTheme(name, theme) {
    if (arguments.length === 1) {
        theme = name;
        name = theme.themeName;
    }

    if (!name) {
        throw new HypergridError('Cannot register a theme without a name.');
    }

    if (name === 'default') {
        throw new HypergridError('Cannot register or unregister the "default" theme.');
    }

    if (theme) {
        registry[theme.themeName = theme.themeName || name] = theme;
    } else {
        delete registry[name];
    }
}

/**
 * App developers are free to add in additional themes, such as those in {@link https://openfin.github.com/fin-hypergrid-themes/themes}:
 * ```javascript
 * Hypergrind.registerThemes(require('fin-hypergrid-themes'));
 * ```
 */
function registerThemes(themeCollection) {
    _(themeCollection).each(function(theme, name) {
        registerTheme(name, theme);
    });
}

/**
 * Apply props from the given theme object to the global theme object,
 * the `defaults` layer at the bottom of the properties hierarchy.
 *
 * Note that a `themeName` property is always added to override `defaults.themeName`.
 * @this {Hypergrid.constructor}
 * @param {object|string} [theme=registry.default] - One of:
 * * **string:** A registered theme name.
 * * **object:** A theme object.
 * @param {string|undefined} [theme.themeName=undefined]
 * When `theme` is an object but this property is omitted, defaults to an explicit `undefined`.
 * @memberOf Hypergrid.
 */
function applyTheme(theme) {
    if (
        typeof theme === 'undefined' ||
        typeof theme === 'object' && !Object.getOwnPropertyNames(theme).length
    ) {
        theme = 'default';
    }

    if (typeof theme === 'string') {
        if (!registry[theme]) {
            throw new HypergridError('Unknown theme "' + theme + '"');
        }
        theme = registry[theme];
    }

    var newThemeDescriptor = Object.getOwnPropertyDescriptors(theme);

    // When no theme name, set it to explicit `undefined` (to mask defaults.themeName).
    if (!('themeName' in newThemeDescriptor)) {
        newThemeDescriptor.themeName = {
            configurable: true,
            value: undefined
        };
    }

    _(newThemeDescriptor).each(function(descriptor, key) {
        if (key in dynamicPropertyDescriptors) {
            // Dynamic properties are defined on properties layer; defining these
            // r-values on the theme layer is ineffective so let's not allow it.
            delete newThemeDescriptor[key];
        } else {
            // Make sure all the new theme props are configurable so they can be deleted by the next call.
            descriptor.configurable = true;
        }
    });

    // Apply the theme (i.e., add new members to theme layer)
    Object.defineProperties(this._theme, newThemeDescriptor);
}

/**
 * Additions to `Hypergrid.prototype` for setting an instance theme.
 * @mixin
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
     * Apply props from the given theme object to the local (instance) object,
     * the instance's `myGrid.themeLayer` layer in the properties hierarchy.
     *
     * Note that a `themeName` property is always added to mask `defaults.themeName`.
     * @param {object|string} [theme=require('./themes').default] - One of:
     * * **string:** A registered theme name.
     * * **object:** A unregistered (anonymous) theme object.
     * @param {string|undefined} [theme.themeName=undefined]
     * When `theme` is an object but this property is omitted, defaults to an explicit `undefined`.
     * @memberOf Hypergrid#
     */
    applyTheme: function(theme) {
        // Before calling the shared `applyTheme` method, delete all the own props of this grid instance's theme layer (defined by previous call)
        var themeLayer = this._theme;
        Object.getOwnPropertyNames(themeLayer).forEach(function(propName) {
            delete themeLayer[propName];
        });

        // Don't call the shared `applyTheme` method with a null or empty theme because it would copy the default theme into this grid instance's theme layer which is not what we want; we just want to remove the instance's theme (already done, above) to reveal the global them underneath.
        if (!theme || typeof theme === 'object' && Object.getOwnPropertyNames(theme).length === 0) {
            return;
        }

        applyTheme.call(this, theme);
    },

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
 * Shared properties of `Hypergrid` for registering themes and setting a global theme.
 * @mixin
 */
var sharedMixin = {
    registerTheme: registerTheme,
    registerThemes: registerThemes,
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
