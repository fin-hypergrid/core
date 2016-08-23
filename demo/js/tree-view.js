/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        TreeView = Hypergrid.TreeView,
        dataModelPrototype = Hypergrid.dataModels.JSON.prototype,
        pipelineOptions = {
            includeSorter: true,
            includeFilter: true
        },
        shared = true; // operate on shared (prototype) pipeline vs. own (instance)

    // Install the drill-down API (optional).
    drillDown.mixInTo(dataModelPrototype);

    if (shared) {
        // Mutate shared pipeline (avoids calling setData twice).
        pipelineOptions.dataModelPrototype = dataModelPrototype;
        TreeView.prototype.setPipeline(pipelineOptions);
    }

    grid = new Hypergrid('div#tree-example', { data: treeData });

    grid.setState({
        showFilterRow: pipelineOptions.includeFilter
    });

    var treeViewOptions = { treeColumn: 'State' }, // groupColumn option defaults to treeColumn (or its default)
        treeView = new TreeView(grid, treeViewOptions);

    if (!shared) {
        // Mutate instance pipeline (calls setData again to rebuild pipeline).
        treeView.setPipeline(pipelineOptions);
    }

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (treeView.setRelation(this.checked, true)) {
            grid.behavior.dataModel.getCell = getCell;
        } else {
            delete grid.behavior.dataModel.getCell;
        }
    };

    function getCell(config, rendererName) {
        if (config.isUserDataArea) {
            if (config.x === grid.behavior.columnEnum.STATE) {
                config.halign = 'left';
            }
        }
        return grid.cellRenderers.get(rendererName);
    }
};

