/* eslint-env browser */

/* globals treedata  */

'use strict';

var grid, treeviewAPI;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        Hyperfilter = Hypergrid.Hyperfilter,
        drillDown = Hypergrid.drillDown,
        rowById = Hypergrid.rowById,
        TreeView = Hypergrid.TreeView,
        DataModel = Hypergrid.dataModels.JSON,
        options = {
            treeColumn: 'State', // groupColumn defaults to treeColumn by default
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    // Install the drill-down API (optional, to play with in console).
    drillDown.mixInTo(DataModel.prototype);

    // Install the row-by-id API (optional, to play with treeviewAPI.deleteRowById in console, which needs it).
    rowById.mixInTo(DataModel.prototype);

    grid = new Hypergrid('div#tree-example');
    grid.setBehavior({
        data: treeData,
        Behavior: fin.Hypergrid.behaviors.JSON
    });

    var filterFactory = new Hyperfilter(grid);
    grid.setGlobalFilter(filterFactory.create());

    // show filter row as per `options`
    grid.setState({
        showFilterRow: options.includeFilter && grid.behavior.getGlobalFilter().columnFilters
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    treeviewAPI = new TreeView(grid, options);

    document.querySelector('input[type=checkbox]').onclick = function() {
        treeviewAPI.setRelation(this.checked);
    };
};

