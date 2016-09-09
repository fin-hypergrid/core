/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid, treeviewAPI;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        rowById = Hypergrid.rowById,
        TreeView = Hypergrid.TreeView,
        dataModelPrototype = Hypergrid.dataModels.JSON.prototype,
        pipelineOptions = {
            includeSorter: true,
            includeFilter: true
        },
        shared = true; // operate on shared (prototype) pipeline vs. own (instance)

    // Install the drill-down API (optional, to play with in console).
    drillDown.mixInTo(dataModelPrototype);

    // Install the row-by-id API (optional, to play with treeviewAPI.deleteRowById in console, which needs it).
    rowById.mixInTo(dataModelPrototype);

    if (shared) {
        // Mutate shared pipeline (avoids calling setData twice).
        pipelineOptions.dataModelPrototype = dataModelPrototype;
        TreeView.prototype.setPipeline(pipelineOptions);
    }

    grid = new Hypergrid('div#tree-example', { data: treeData });

    grid.setState({
        showFilterRow: pipelineOptions.includeFilter
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    var treeViewOptions = { treeColumn: 'State' }; // groupColumn option defaults to treeColumn (or its default)
    treeviewAPI = new TreeView(grid, treeViewOptions);

    if (!shared) {
        // Mutate instance pipeline (calls setData again to rebuild pipeline).
        treeviewAPI.setPipeline(pipelineOptions);
    }

    document.querySelector('input[type=checkbox]').onclick = function() {
        treeviewAPI.setRelation(this.checked, true);
    };
};

