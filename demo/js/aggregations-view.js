/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        Hyperfilter = Hypergrid.Hyperfilter,
        drillDown = Hypergrid.drillDown,
        AggregationsView = Hypergrid.AggregationsView,
        dataModelPrototype = Hypergrid.dataModels.JSON.prototype,
        rollups = window.fin.Hypergrid.analytics.util.aggregations, // aggregate function generator
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

    // Install the drill-down API (optional).
    drillDown.mixInTo(dataModelPrototype);

    grid = new Hypergrid('div#example');
    grid.setData(window.people1);

    var filterFactory = new Hyperfilter(grid);
    grid.filter = filterFactory.create();

    // show filter row as per `options`
    grid.setState({
        showFilterRow: options.includeFilter && grid.behavior.filter.columnFilters
    });

    var aggViewAPI = new AggregationsView(grid, options);

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (this.checked) {
            // turn aggregations view ON using options.aggregates and options.group
            // Alternatively, you may supply overrides for both as parameters here.
            aggViewAPI.setAggregateGroups();
        } else {
            // turn aggregations view OFF
            aggViewAPI.setAggregateGroups([]);
        }
    };
};

