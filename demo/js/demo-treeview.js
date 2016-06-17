/* eslint-env browser */

/* globals treedata */

'use strict';

var grid, behavior, dataModel;

window.onload = function() {

    fin.Hypergrid.analytics.util.headerify.transform = fin.Hypergrid.analytics.util.headerify.capitalize;

    grid = new fin.Hypergrid('div#tree-example', { data: treedata });
    behavior = grid.behavior;
    dataModel = behavior.dataModel;

    var idx = behavior.columnEnum;
    var treeview;

    // Optional: Clone the default pipeline. If you don't do this, the mutated pipeline will be shared among all grid instances
    dataModel.pipeline = Object.getPrototypeOf(dataModel).pipeline.slice();

    // Insert the treeview after source
    var pipe = { type: 'DataSourceTreeview' };
    dataModel.addPipe(pipe, 'JSDataSource');

    // Reset the pipeline, pointing at some tree (self-joined) data
    behavior.setData(treedata);

    // Only show the data columns; don't show the ID and parentID columns
    grid.setState({
        columnIndexes: [ idx.NAME, idx.LATITUDE, idx.LONGITUDE ],
        checkboxOnlyRowSelections: true
    });

    document.querySelector('input[type=checkbox]').onclick = function() {
        behavior.setRelation(treeview = this.checked);
        if (treeview) {
            dataModel.getCell = getCell;
        } else {
            delete dataModel.getCell;
        }
    };

    function getCell(config, rendererName) {
        if (config.isUserDataArea) {
            if (config.x === idx.NAME) {
                config.halign = 'left';
            }
        }
        return grid.cellRenderers.get(rendererName);
    };

};
