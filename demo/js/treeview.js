/* eslint-env browser */

/* globals treedata */

'use strict';

var drilldown = fin.Hypergrid.drilldown;
var treeview = fin.Hypergrid.treeview;

var grid, behavior, dataModel;

window.onload = function() {

    grid = new fin.Hypergrid('div#tree-example', { data: treedata });
    dataModel = grid.behavior.dataModel;

    drilldown.mixInTo(fin.Hypergrid.dataModels.JSON.prototype);
    treeview.addDataSourceTo(dataModel);
    treeview.setData(grid, treedata);

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (treeview.toggle.call(this, grid.behavior)) {
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
