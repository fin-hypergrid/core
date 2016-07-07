/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        TreeView = Hypergrid.TreeView,
        dataModelPrototype = Hypergrid.dataModels.JSON.prototype,
        shared = false;

    // Install the drill-down API (optional).
    drillDown.mixInTo(dataModelPrototype);

    // Following call mutates the shared pipeline and, avoids calling setData twice.
    // Or comment out and uncomment `addPipe` call below (which calls setData again to rebuild the pipeline).
    TreeView.prototype.addPipeTo(dataModelPrototype);

    grid = new Hypergrid('div#tree-example', { data: treeData });
    var treeViewOptions = { treeColumnName: 'State' },
        treeView = new TreeView(grid, treeViewOptions);

    // treeView.addPipe(treeData, shared); // shared is falsy so clones a private pipeline for the instance.

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
