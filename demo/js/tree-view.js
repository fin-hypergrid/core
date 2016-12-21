/* eslint-env browser */
/* globals fin, treeData */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        options = {
            treeColumn: 'State', // groupColumn defaults to treeColumn by default
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    grid = new Hypergrid('div#tree-example');
    grid.setData(treeData);

    // These modules are for EXAMPLE purposes only
    grid.installPlugins([
        Hypergrid.drillDown, // simple API install (plain object with `install` method) but no `name` defined so no ref is saved
        Hypergrid.rowById, // ditto
        Hypergrid.Hyperfilter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hyperfilter`
        Hypergrid.Hypersorter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hypersorter`
        ['treeviewAPI', Hypergrid.TreeView, options] // object API instantiation with one arg; [0] overrides any defined name so ref saved in `grid.plugins.treeViewAPI`
    ]);

    // Inform data model of external DCIs. (These DCIs are for EXAMPLE purposes only.)
    grid.setController({
        // These modules are for EXAMPLE purposes only
        filter: grid.plugins.hyperfilter.create(),
        sorter: grid.plugins.hypersorter
    });

    // show filter row as per `options`
    grid.setState({
        showFilterRow: options.includeFilter && grid.prop('filter', 'columnFilters')
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    var checkbox = document.querySelector('input[type=checkbox]'),
        button = document.querySelector('input[type=button]');

    checkbox.onclick = function() {
        grid.plugins.treeviewAPI.setRelation(this.checked);
        button.disabled = !this.checked;
    };

    button.onclick = function() {
        grid.behavior.dataModel.expandAllRows(true);
    };
};

