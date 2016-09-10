/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        AggregationsView = Hypergrid.AggregationsView,
        dataModelPrototype = Hypergrid.dataModels.JSON.prototype,
        pipelineOptions = {
            includeSorter: true,
            includeFilter: true
        },
        rollups = window.fin.Hypergrid.analytics.util.aggregations, //functions for showing the grouping/rollup capabilities
        aggregates = {
            totalPets: rollups.sum(2),
            averagePets: rollups.avg(2),
            maxPets: rollups.max(2),
            minPets: rollups.min(2),
            firstPet: rollups.first(2),
            lastPet: rollups.last(2),
            stdDevPets: rollups.stddev(2)
        },
        options = { data:  window.people1, Behavior: fin.Hypergrid.behaviors.JSON },
        groups = [5, 0, 1],
        shared = true; // operate on shared (prototype) pipeline vs. own (instance)

    grid = new Hypergrid('div#example');
    grid.setBehavior(options);

    // Install the drill-down API (optional).
    drillDown.mixInTo(dataModelPrototype);

    if (shared) {
        // Mutate shared pipeline (avoids calling setData twice).
        dataModelPrototype.grid = grid;
        pipelineOptions.dataModelPrototype = dataModelPrototype;
        AggregationsView.prototype.setPipeline(pipelineOptions);
    }

    grid.setState({
        showFilterRow: pipelineOptions.includeFilter
    });

    var aggView = new AggregationsView(grid, {});

    if (!shared) {
        // Mutate instance pipeline (calls setData again to rebuild pipeline).
        aggView.setPipeline(pipelineOptions);
    }

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (this.checked) {
            grid.setAggregateGroups(aggregates, groups);
            grid.behavior.dataModel.getCell = getCell;
        } else {
            grid.setAggregateGroups([]);
            delete grid.behavior.dataModel.getCell;
        }
    };

    function getCell(config, rendererName) {
        return grid.cellRenderers.get(rendererName);
    }
};

