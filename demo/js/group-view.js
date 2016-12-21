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
        Hypergrid.Hyperfilter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hyperfilter`
        Hypergrid.Hypersorter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hypersorter`
        [Hypergrid.GroupView, options] // object API instantiation with one arg; `name` defined so ref saved in `grid.plugins.groupView`
    ]);

    // Inform data model of external DCIs. (These DCIs are for EXAMPLE purposes only.)
    grid.setController({
        // These modules are for EXAMPLE purposes only
        filter: grid.plugins.hyperfilter.create(),
        sorter: grid.plugins.hypersorter
    });

    // show filter row as per `options`
    grid.setState({
        // columnAutosizing: false,
        showFilterRow: options.includeFilter && grid.prop('filter', 'columnFilters')
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

