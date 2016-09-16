/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid, treeviewAPI;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        Hyperfilter = Hypergrid.Hyperfilter,
        drillDown = Hypergrid.drillDown,
        TreeView = Hypergrid.TreeView,
        options = {
            // In order for the the State column not to sort the leaves (city names), we want it to use the "depth sorter" rather than the regular sorter used by the other columns. To make this work, the column does need to be called out when it differs from the tree (drill-down) column. In this demo, the tree column (containing the drill-down controls) is called name, which is the default. The `groupColumn` option normally defaults to whatever the `treeColumn` is set to but in this case we use it to call out the State column.
            groupColumn: 'State',
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    // Add a blank column.
    treeData.forEach(function(dataRow) { dataRow.name = ''; });

    grid = new Hypergrid('div#tree-example');
    grid.setData(treeData);

    // Install the drill-down API (optional).
    var dataModel = grid.behavior.dataModel,
        dataModelPrototype = Object.getPrototypeOf(dataModel);
    drillDown.mixInTo(dataModelPrototype);

    var filterFactory = new Hyperfilter(grid);
    grid.filter = filterFactory.create();

    var idx = grid.behavior.columnEnum;

    grid.setState({
        columnIndexes: [ idx.NAME, idx.STATE, idx.LATITUDE, idx.LONGITUDE ], // so drill-down column on far left
        fixedColumnCount: 1, // so far left drill-down column always visible
        showFilterRow: options.includeFilter && grid.behavior.filter.columnFilters
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    treeviewAPI = new TreeView(grid, options);
    var dd = treeviewAPI.drillDown = {};

    var checkbox = document.querySelector('input[type=checkbox]'),
        button = document.querySelector('input[type=button]');

    checkbox.onclick = function() {
        if (treeviewAPI.setRelation(this.checked)) {
            dd.column = grid.behavior.getColumn(dataModel.sources.treeview.treeColumn.index);

            dd.header = dd.column.header;
            dd.column.header = '';

            dd.unsortable = dd.column.getProperties().unsortable;
            dd.column.getProperties().unsortable = true;
        } else {
            dd.column.header = dd.header;
            dd.column.getProperties().unsortable = dd.unsortable;
        }
        button.disabled = !this.checked;
    };

    button.onclick = function() {
        dataModel.expandAllRows(true);
    };
};

