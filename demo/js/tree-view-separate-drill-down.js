/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        drillDown = Hypergrid.drillDown,
        TreeView = Hypergrid.TreeView,
        DataModel = Hypergrid.dataModels.JSON,
        options = {
            // In order for the the State column not to sort the leaves (city names), we want it to use the "depth sorter" rather than the regular sorter used by the other columns. To make this work, the column does need to be called out when it differs from the tree (drill-down) column. In this demo, the tree column (containing the drill-down controls) is called name, which is the default. The `groupColumn` option normally defaults to whatever the `treeColumn` is set to but in this case we use it to call out the State column.
            groupColumn: 'State',
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    // Install the drill-down API (optional).
    drillDown.mixInTo(DataModel.prototype);

    // Add a blank column.
    treeData.forEach(function(dataRow) { dataRow.name = ''; });

    grid = new Hypergrid('div#tree-example');
    grid.setBehavior({
        data: treeData,
        Behavior: fin.Hypergrid.behaviors.JSON
    });

    var idx = grid.behavior.columnEnum;

    grid.setState({
        columnIndexes: [ idx.NAME, idx.STATE, idx.LATITUDE, idx.LONGITUDE ], // so drill-down column on far left
        fixedColumnCount: 1, // so far left drill-down column always visible
        showFilterRow: pipelineOptions.includeFilter
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    var treeView = new TreeView(grid, options),
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

