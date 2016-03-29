// schema.js - tools for building column schema lists for use by filter-tree

'use strict';


/**
 * @summary Build a default schema list from current columns.
 * @desc Actually, the string array returned by behavior.getFields() would work as is. This function returns an array of plain objects containing aliases ("headerified" column names) as well as  type information (typically inferred by inspection of the data). In stead of this, you could supply your own schema sent by your server.
 * @param {Behavior} behavior
 * @returns {object[]}
 */
function getDefaultSchema(behavior) {
    return behavior.columns.map(function(column) {
        return {
            name: column.getField(),
            alias: column.getHeader(),
            type: column.getType()
        };
    });
}

/**
 * Utility function  for organizing schema into submenus.
 * @param {RegExp} columnGroupsRegex - Schema names or aliases that match this are be put into a submenu.
 * @param {string} key - Must be either 'name' or 'alias'.
 * @returns {Array} new schema
 */
function organize(key, schema, columnGroupsRegex) {
    var menu = [], submenus = {};

    schema.forEach(function(item) {
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

    return menu;
}

function sort(prefix, schema) {
    schema.sort(function recurse(a, b) {
        if (a.label && !a.sorted) {
            a.submenu.sort(recurse);
            a.sorted = true;
        }
        a = a.label ? prefix + a.label : a.alias || a.name || a;
        b = b.label ? prefix + b.label : b.alias || b.name || b;
        return a < b ? -1 : a > b ? 1 : 0;
    });
}

module.exports = {
    getDefault : getDefaultSchema,
    sort : sort.bind(null, ''),
    sortWithSubmenusAtTop : sort.bind(null, '\u0000'),
    sortWithSubmenusAtBottom : sort.bind(null, '\uffff'),
    organizeByName: organize.bind(null, 'name'),
    organizeByAlias: organize.bind(null, 'alias'),
};
