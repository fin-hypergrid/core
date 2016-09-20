/* eslint-env browser */
/* globals fin, treeData */

'use strict';

var grid, treeviewAPI;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        Hyperfilter = Hypergrid.Hyperfilter,
        Hypersorter = Hypergrid.Hypersorter,
        drillDown = Hypergrid.drillDown,
        rowById = Hypergrid.rowById,
        TreeView = Hypergrid.TreeView,
        options = {
            treeColumn: 'State', // groupColumn defaults to treeColumn by default
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    grid = new Hypergrid('div#tree-example');
    grid.setData(treeData);

    // Install the sorter API (optional).
    new Hypersorter(grid, { // eslint-disable-line no-new
        Column: fin.Hypergrid.behaviors.Column
    });

    // Install the drill-down API (optional).
    var dataModel = grid.behavior.dataModel,
        dataModelPrototype = Object.getPrototypeOf(dataModel);
    drillDown.mixInTo(dataModelPrototype);

    // Install the row-by-id API (optional, to play with treeviewAPI.deleteRowById in console, which needs it).
    rowById.mixInTo(dataModelPrototype);

    var filterFactory = new Hyperfilter(grid);
    grid.filter = filterFactory.create();

    // show filter row as per `options`
    grid.setState({
        showFilterRow: options.includeFilter && grid.filterProp('columnFilters')
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    treeviewAPI = new TreeView(grid, options);

    var checkbox = document.querySelector('input[type=checkbox]'),
        button = document.querySelector('input[type=button]');

    checkbox.onclick = function() {
        treeviewAPI.setRelation(this.checked);
        button.disabled = !this.checked;
    };

    button.onclick = function() {
        dataModel.expandAllRows(true);
    };
};

