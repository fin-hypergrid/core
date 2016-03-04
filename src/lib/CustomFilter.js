'use strict';

//var FilterTree = require('filter-tree');
var FilterTree = require('../../../../filter-tree/src/js/FilterTree');


//var tableFilterSubtree;
var columnFiltersSubtree;


/** @typedef {function} fieldsProviderFunc
 * @returns {menuOption[]} see jsdoc typedef in pop-menu.js
 */

//var validateQuietlyOptions = {
//    alert: false,
//    focus: false
//};

/** @constructor
 * @param {FilterTreeOptionsObject} options - You must provide column schema, either for the whole filter tree through `options.schema` or `options.state.schema` or for the specific nodes that need to render column list drop-downs.
 *
 * > NOTE: If `options.state` is undefined, it is defined with a {@link getFilterStateScaffold|empty state scaffold) to hold new table filter and column filter expressions to be added through UI.
 */
var CustomFilter = FilterTree.extend('CustomFilter', {

    preInitialize: function(options) {
        options.state = options.state || getFilterStateScaffold();
    },

    initialize: function() {
        extractSubtrees.call(this);
    },

    getColumnFilter: function(columnName) {
        var columnFilterSubexpression = columnFiltersSubtree.children.find(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column === columnName;
        });

        return columnFilterSubexpression
            ? columnFilterSubexpression.getState({ syntax: 'filter-cell' })
            : '';
    },

    // Following co-routines service calls from grid.dialog (see cellEditors/Filter.js)
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
 */
function getFilterStateScaffold() {

    var tableFilter = {
        persist: true,
        children: [
            // table filter expressions and subexpressions go here
        ]
    };

    var columnFilters = {
        persist: true,
        type: 'columnFilters',
        children: [
            // subexpressions with type 'columnFilter' go here, one for each active column filter
        ]
    };

    var filter = {
        children: [ tableFilter, columnFilters ]
    };

    return filter;
}


function extractSubtrees() {
    //tableFilterSubtree = this.children[0];
    columnFiltersSubtree = this.children[1];
}

module.exports = CustomFilter;
