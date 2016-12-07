/* eslint-env browser */
/* globals fin */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        options = {
            includeSorter: true,
            includeFilter: true,
            groups: [5, 0, 1] // alternatively this could be supplied in the setGroups call
        };

    grid = new Hypergrid('div#example');
    grid.setData(window.people1);

    grid.installPlugins([
        Hypergrid.drillDown, // simple API install (plain object with `install` method) but no `name` defined so no ref is saved
        Hypergrid.Hyperfilter, // object API instantiation; `$$CLASS_NAME` defined so ref saved in `grid.plugins.hyperfilter`
        [Hypergrid.Hypersorter, {Column: fin.Hypergrid.behaviors.Column}], // object API instantiation to grid.plugins; no `name` or `$$CLASS_NAME` defined so no ref saved
        [Hypergrid.GroupView, options] // object API instantiation with one arg; `$$CLASS_NAME` defined so ref saved in `grid.plugins.groupView`
    ]);

    // These modules are for EXAMPLE purposes only
    grid.sorter = grid.plugins.hypersorter;
    grid.filter = grid.plugins.hyperfilter.create();

    // show filter row as per `options`
    grid.setState({
        // columnAutosizing: false,
        showFilterRow: options.includeFilter && grid.filter.prop('columnFilters')
    });

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (this.checked) {
            // turn group view ON using options.groups
            // Alternatively, you can supply a group list override as a parameter here.
            grid.plugins.groupView.setGroups();
        } else {
            // turn group view OFF
            grid.plugins.groupView.setGroups([]);
        }
    };
};

