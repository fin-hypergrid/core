/* eslint-env browser */

/* globals treedata */

'use strict';

var Hypergrid = fin.Hypergrid;
var drillDown = Hypergrid.drillDown;
var treeView = Hypergrid.treeView;

var grid, behavior, dataModel;

window.onload = function() {

    grid = new Hypergrid('div#tree-example', { data: treedata });
    dataModel = grid.behavior.dataModel;

    drillDown.mixInTo(Hypergrid.dataModels.JSON.prototype);
    treeView.addDataSourceTo(dataModel);
    treeView.setData(grid, treeData);

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (treeView.toggle.call(this, grid.behavior)) {
            dataModel.getCell = getCell;
        } else {
            delete dataModel.getCell;
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
