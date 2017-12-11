'use strict';

// This file creates the Hypergrid theme registry, exposed as `Hypergrid.themes` (see).
// The initial registry consists of a single theme ('default').
// Application developers can add additional themes to this registry.

var defaults = require('../defaults');

var styles = [
    'BackgroundColor',
    'Color',
    'Font'
];

var styleWithHalign = styles.concat([
    'Halign'
]);

var dataCellStyles = styleWithHalign.concat([
    'cellPadding',
    'iconPadding'
]);

var stylers = [
    { prefix: '',                                props: dataCellStyles },
    { prefix: 'foregroundSelection',             props: styles },
    { prefix: 'columnHeader',                    props: styleWithHalign },
    { prefix: 'columnHeaderForegroundSelection', props: styles },
    { prefix: 'rowHeader',                       props: styles },
    { prefix: 'rowHeaderForegroundSelection',    props: styles }
];

var defaultTheme = {
    themeName: defaults.themeName
};

// Here we create the `defaults` theme by copying over the theme props,
// which is a subset of all the props defined in defaults.js. The following
// combines the above prefixes with their styles to get theme prop names; and
// then copies those props from the defaults.js to create the `default` theme.
module.exports.default = stylers.reduce(function(theme, styler) {
    return styler.props.reduce(function(theme, prop) {
        prop = styler.prefix + prop;
        prop = prop.replace('ForegroundSelectionBackground', 'BackgroundSelection');
        prop = prop[0].toLowerCase() + prop.substr(1);
        theme[prop] = defaults[prop];
        return theme;
    }, theme);
}, defaultTheme);
