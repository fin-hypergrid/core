'use strict';

var popMenu = require('pop-menu');

/**
 * @classdesc Build, organize, and sort a column schema list from a list of columns.
 *
 * FilterTree requires a column schema. As a fallback when you don't have a column schema of your own, the string array returned by behavior.dataModel.getFields() would work as is. This factory object will do a little better than that, taking Hypergrid's column array and creating a more textured column schema, including column aliases and types.
 *
 * CAVEAT: Set up the schema completely before instantiating your filter state. Filter-tree uses the schema (in part) to generate column selection drop-downs as part of its "query builder" UI. Note that the UI is *not* automatically updated if you change the schema later.
 *
 * @param {Column[]} columns
 * @constructor
 */
function ColumnSchemaFactory(columns) {
    /**
     * This is the output produced by the factory.
     * @type {menuItem[]}
     */
    this.schema = columns.map(function(column) {
        var item = {
            name: column.name,
            alias: column.header,
            type: column.getType()
        };

        if (column.calculator) {
            item.calculator = column.calculator;
        }

        return item;
    });

    this.schema.walk = popMenu.walk;
    this.schema.lookup = popMenu.lookup;
}

var placementPrefixMap = {
    top: '\u0000',
    bottom: '\uffff',
    undefined: ''
};

ColumnSchemaFactory.prototype = {

    constructor: ColumnSchemaFactory.prototype.constructor,

    /**
     * Organize schema into submenus.
     * @param {RegExp} columnGroupsRegex - Schema names or aliases that match this are put into a submenu.
     * @param {string} [options.key='name'] - Must be either 'name' or 'alias'.
     */
    organize: function(columnGroupsRegex, options) {
        var key = options && options.key || 'name',
            submenus = {},
            menu = [];

        this.schema.forEach(function(item) {
            var value = item[key],
                group = value.match(columnGroupsRegex);
            if (group) {
                group = group[0];
                if (!(group in submenus)) {
                    submenus[group] = {
                        label: group.toUpperCase(),
                        submenu: []
                    };
                }
                submenus[group].submenu.push(item);
            } else {
                menu.push(item);
            }
        });

        for (var submenuName in submenus) {
            menu.push(submenus[submenuName]);
        }

        this.schema = menu;
    },

    lookup: function(findOptions, value) {
        return popMenu.lookup.apply(this.schema, arguments);
    },

    walk: function(iteratee) {
        return popMenu.walk.apply(this.schema, arguments);
    },

    /**
     * Overlays a custom schema on top of the derived schema.
     * This is an easy way to include hidden columns that might have been omitted from your custom schema.
     * @param customSchema
     */
    overlay: function(customSchema) {
        var lookup = this.schema.lookup;
        this.schema.walk(function(columnSchema) {
            return lookup.call(customSchema, function(customColumnSchema) {
                return customColumnSchema.name === columnSchema.name;
            });
        });
    },

    /**
     * @summary Sort the schema.
     * @desc Walk the menu structure, sorting each submenu until finally the top-level menu is sorted.
     * @param {boolean} [submenuPlacement] - One of:
     * * `'top'` - Place all the submenus at the top of each enclosing submenu.
     * * `'bottom'` - Place all the submenus at the bottom of each enclosing submenu.
     * * `undefined` (or omitted) - Give no special treatment to submenus.
     */
    sort: function(submenuPlacement) {
        var prefix = placementPrefixMap[submenuPlacement];

        this.schema.sort(function recurse(a, b) {
            if (a.label && !a.sorted) {
                a.submenu.sort(recurse);
                a.sorted = true;
            }
            a = a.label ? prefix + a.label : a.alias || a.name || a;
            b = b.label ? prefix + b.label : b.alias || b.name || b;
            return a < b ? -1 : a > b ? 1 : 0;
        });
    }
};

module.exports = ColumnSchemaFactory;
