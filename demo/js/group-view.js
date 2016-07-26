/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        GroupView = Hypergrid.GroupView,
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
        GroupView.prototype.setPipeline(pipelineOptions);
    }

    grid = new Hypergrid('div#tree-example', { data:  window.people1 });

    grid.setState({
        showFilterRow: pipelineOptions.includeFilter
    });

    var groupView = new GroupView(grid, {});

    if (!shared) {
        // Mutate instance pipeline (calls setData again to rebuild pipeline).
        groupView.setPipeline(pipelineOptions);
    }

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (groupView.setRelation(this.checked, true)) {
            grid.behavior.dataModel.getCell = getCell;
        } else {
            delete grid.behavior.dataModel.getCell;
        }
    };

    function getCell(config, rendererName) {
        if (config.isUserDataArea) {
            if (this.getRow(config.y).hasChildren) {
                return grid.cellRenderers.get('EmptyCell');
            }
        }
        return grid.cellRenderers.get(rendererName);
    }
};

