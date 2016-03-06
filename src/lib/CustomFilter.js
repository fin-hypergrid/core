'use strict';

//var FilterTree = require('filter-tree');
var FilterTree = require('../../../../filter-tree/src/js/FilterTree');
var popMenu = require('../../../../filter-tree/src/js/pop-menu');


/** @typedef {function} fieldsProviderFunc
 * @returns {menuOption[]} see jsdoc typedef in pop-menu.js
 */

//var validateQuietlyOptions = {
//    alert: false,
//    focus: false
//};

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
     * This default filter state scaffold describes the filter tree root used by Hypergrid, consisting of exactly two persisted child nodes:
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
        var columnFilterSubexpression = this.columnFilters.children.find(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column === columnName;
        });

        return columnFilterSubexpression
            ? columnFilterSubexpression.getState({ syntax: 'filter-cell' })
            : '';
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

module.exports = CustomFilter;
