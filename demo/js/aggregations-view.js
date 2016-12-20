/* eslint-env browser */
/* globals fin */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        rollups = Hypergrid.analytics.util.aggregations, // aggregate function generator
        options = {
            includeSorter: true,
            includeFilter: true,
            aggregations: {
                totalPets: rollups.sum(2),
                averagePets: rollups.avg(2),
                maxPets: rollups.max(2),
                minPets: rollups.min(2),
                firstPet: rollups.first(2),
                lastPet: rollups.last(2),
                stdDevPets: rollups.stddev(2)
            },
            groups: [5, 0, 1]
        };

    grid = new Hypergrid('div#example', {
        data: window.people1,
        plugins: [
            Hypergrid.drillDown, // simple API install (plain object with `install` method) but no `name` defined so no ref is saved
            Hypergrid.Hyperfilter, // object API instantiation; `$$CLASS_NAME` defined so ref saved in `grid.plugins.hyperfilter`
            [Hypergrid.Hypersorter, {Column: fin.Hypergrid.behaviors.Column}], // object API instantiation to grid.plugins; no `name` or `$$CLASS_NAME` defined so no ref saved
            [Hypergrid.AggregationsView, options] // object API instantiation with one arg; `$$CLASS_NAME` defined so ref saved in `grid.plugins.aggregationsView`
        ]
    });

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

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (this.checked) {
            // turn aggregations view ON using options.aggregates and options.group
            // Alternatively, you may supply overrides for both as parameters here.
            grid.plugins.aggregationsView.setAggregateGroups();
        } else {
            // turn aggregations view OFF
            grid.plugins.aggregationsView.setAggregateGroups([]);
        }
    };
};

