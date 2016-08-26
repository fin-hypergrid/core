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
        options = { data: treeData },
        shared = true; // operate on shared (prototype) pipeline vs. own (instance)

    // Install the drill-down API (optional).
    drillDown.mixInTo(dataModelPrototype);

    // Add a blank column.
    treeData.forEach(function(dataRow) { dataRow.name = ''; });

    if (shared) {
        // Mutate shared pipeline (avoids calling setData twice).
        pipelineOptions.dataModelPrototype = dataModelPrototype;
        TreeView.prototype.setPipeline(pipelineOptions);
    }

    grid = new Hypergrid('div#tree-example');
    grid.setBehavior(new fin.Hypergrid.behaviors.JSON(grid), options.data, options);

    var idx = grid.behavior.columnEnum;

    grid.setState({
        columnIndexes: [ idx.NAME, idx.STATE, idx.LATITUDE, idx.LONGITUDE ], // so drill-down column on far left
        fixedColumnCount: 1, // so far left drill-down column always visible
        showFilterRow: pipelineOptions.includeFilter
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    // In order for the the State column to not sort the leaves (city names), we want it to use the "depth sorter" rather than the regular sorter used by the other columns. To make this work, the column does need to be called out when it differs from the tree (drill-down) column. In this demo, those columns are separate. We do this using the groupColumn (which normally defaults to whatever the tree column is set to).
    var treeViewOptions = { groupColumn: 'State' },
        treeView = new TreeView(grid, treeViewOptions),
        dd = treeView.drillDown = {};

    if (!shared) {
        // Mutate instance pipeline (calls setData again to rebuild pipeline).
        treeView.setPipeline(pipelineOptions);
    }

    document.querySelector('input[type=checkbox]').onclick = function() {
        if (treeView.setRelation(this.checked)) {
            dd.column = grid.behavior.getColumn(treeView.dataSource.treeColumn.index);

            dd.header = dd.column.header;
            dd.column.header = '';

            dd.unsortable = dd.column.getProperties().unsortable;
            dd.column.getProperties().unsortable = true;
        } else {
            dd.column.header = dd.header;
            dd.column.getProperties().unsortable = dd.unsortable;
        }
    };
};

