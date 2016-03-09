'use strict';

var FilterTree = require('filter-tree');
//var FilterTree = require('../../../../filter-tree/src/js/FilterTree');
var popMenu = require('pop-menu');

var ColumnQueryLanguage = require('./ColumnQueryLanguage');

/*
function ColumnQueryLanguage() {}

ColumnQueryLanguage.prototype.parse = function(columnName, state) {
    state =  {
        type: 'columnFilter',
        children: [ {
            column: columnName,
            operator: '>',
            literal: '2'
        }, {
            column: columnName,
            operator: '<',
            literal: '8'
        } ]
    };
    return state;
};

ColumnQueryLanguage.prototype.setOptions = function() {};
*/

/** @typedef {function} fieldsProviderFunc
 * @returns {menuOption[]} see jsdoc typedef in pop-menu.js
 */

var QUIET_VALIDATION = {
    alert: false,
    focus: false
};

/** @constructor
 *
 * @desc This extension of FilterTree forces a specific tree structure.
 * See {@link makeNewRoot} for a description.
 *
 * @param {FilterTreeOptionsObject} options - You must provide column schema, either for the whole filter tree through `options.schema` or `options.state.schema` or for the specific nodes that need to render column list drop-downs.
 *
 * > NOTE: If `options.state` is undefined, it is defined here as a new {@link makeNewRoot|empty state scaffold) to hold new table filter and column filter expressions to be added through UI.
 */
var CustomFilter = FilterTree.extend('CustomFilter', {

    preInitialize: function(options) {
        if (options) {

            // Set up the default "Hyperfilter" profile (see function comments)
            options.state = options.state || this.makeNewRoot();

            // Upon creation of a 'columnFilter' node, force the schema to the one column
            if ((options.type || options.state && options.state.type) === 'columnFilter') {
                this.schema = [
                    popMenu.findItem(options.parent.root.schema, options.state.children[0].column)
                ];
            }
        }
    },

    initialize: function(options) {
        this.cache = {};

        if (!options.parent) {
            this.extractSubtrees();
        }
    },

    /**
     * Create convenience vars to reference the 2 root "Hyperfilter" nodes
     */
    extractSubtrees: function() {
        var rootNodes = this.root.children;
        this.tableFilter = rootNodes[0];
        this.columnFilters = rootNodes[1];
    },

    /**
     * @summary Make a new empty Hypergrid filter tree state object.
     * @desc This function makes a new default state object as used by Hypergrid, a root with exactly two persisted child nodes:
     *
     * * children[0] represents the _table filter,_ a series of any number of filter expressions and/or subexpressions
     * * children[1] represents the _column filters,_ a series of subexpressions, one per active column filter
     *
     * The `operator` properties for all subexpressions default to `'op-and'`, which means:
     * * AND all table filter expressions and subexpressions together (may be changed from UI)
     * * AND all column Filters subexpressions together (cannot be changed from UI)
     * * AND table filters and column filters together (cannot be changed from UI)
     *
     * @returns a new instance of a Hyperfilter root
     * @memberOf Hyperfilter.prototype
     */
    makeNewRoot: function() {

        this.tableFilter = {
            persist: true,
            children: [
                // table filter expressions and subexpressions go here
            ]
        };

        this.columnFilters = {
            persist: true,
            type: 'columnFilters',
            children: [
                // subexpressions with type 'columnFilter' go here, one for each active column filter
            ]
        };

        var filter = {
            children: [
                this.tableFilter,
                this.columnFilters
            ]
        };

        return filter;
    },

    getColumnFilter: function(columnName) {
        return this.columnFilters.children.find(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column === columnName;
        });
    },

    /**
     *
     * @param columnName
     * @param {boolean} [options.syntax='CQL'] See detectState in FilterNode.js.
     */
    getColumnFilterState: function(columnName, options) {
        var result = this.cache[columnName];

        if (result === undefined) {
            var subexpression = this.getColumnFilter(columnName);

            if (subexpression) {
                var syntax = options && options.syntax || 'CQL';
                result = subexpression.getState({ syntax: syntax });
            } else {
                result = '';
            }

            this.cache[columnName] = result;
        }

        return result;
    },

    /**
     *
     * @param columnName
     * @param state
     * @param {boolean} [options.syntax='CQL'] See detectState in FilterNode.js.
     */
    setColumnFilterState: function(columnName, state, options) {
        var syntax = options && options.syntax,
            isCql = syntax === undefined || syntax === 'CQL',
            subexpression = this.getColumnFilter(columnName);

        if (isCql) {
            if (!this.CQL) {
                // set up a new CQL instance for this column prior to first use
                this.CQL = new ColumnQueryLanguage(this.root.schema);

                // bind it to this column's properties
                this.CQL.setOptions(resolveProperty.bind(this, columnName));
            }

            // convert some CQL state syntax into a filter tree state object
            var message;
            try {
                state = this.CQL.parse(columnName, state);
                this.cache[columnName] = this.CQL.cql;
                message = this.CQL.orphanedOpMsg;
            } catch (e) {
                message = e.message;
            }
            if (message) {
                console.warn(message);
            }
        }

        if (state) {
            if (subexpression) {
                // replace subexpression representing this column
                subexpression.setState(state);
            } else {
                // add a subexpression representing this column
                subexpression = this.columnFilters.add(state);
            }

            subexpression.invalid(QUIET_VALIDATION);
        } else if (subexpression) {
            // remove subexpression representing this column
            subexpression.remove();
        }
    },

    // All remaining methods are co-routines called from grid.dialog
    // See cellEditors/Filter.js

    initializeDialog: function() {

    },

    onShow: function(container) {
        container.appendChild(this.el);
    },

    onOk: function() {
        return this.invalid();
    },

    onReset: function() {

    },

    onDelete: function() {

    },

    onCancel: function() {

    },

    create: function() {
        return this.test.bind(this);
    }
});

function resolveProperty(columnName, propertyName) {
    //todo: finish this
    //return column.resolveProperty('filterCql' + key[0].toUpperCase() + key.substr(1));
}

module.exports = CustomFilter;
