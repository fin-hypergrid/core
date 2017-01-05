/* eslint-env browser */
/* globals fin, treeData */

'use strict';

var grid;

window.onload = function() {
    var Hypergrid = fin.Hypergrid,
        options = {
            // In order for the the State column not to sort the leaves (city names), we want it to use the "depth sorter" rather than the regular sorter used by the other columns. To make this work, the column does need to be called out when it differs from the tree (drill-down) column. In this demo, the tree column (containing the drill-down controls) is called name, which is the default. The `groupColumn` option normally defaults to whatever the `treeColumn` is set to but in this case we use it to call out the State column.
            groupColumn: 'State',
            includeSorter: true,
            includeFilter: true,
            hideIdColumns: true
        };

    // Add a blank column.
    treeData.forEach(function(dataRow) { dataRow.name = ''; });

    // These modules are for EXAMPLE purposes only
    grid = new Hypergrid('div#tree-example', { data: treeData, plugins: [
        Hypergrid.drillDown, // simple API install (plain object with `install` method) but no `name` defined so no ref is saved
        Hypergrid.rowById, // ditto
        Hypergrid.Hyperfilter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hyperfilter`
        Hypergrid.Hypersorter, // object API instantiation; `name` defined so ref saved in `grid.plugins.hypersorter`
        [Hypergrid.TreeView, options] // object API instantiation with one arg; `name` defined so ref saved in `grid.plugins.treeViewAPI`
    ] });

    // Install the sorter and Filter data sources (optional).
    // These modules are for EXAMPLE purposes only
    grid.setPipeline([
        window.datasaur.filter,
        window.datasaur.sorter
    ]);

    // Inform data model of external DCIs. (These DCIs are for EXAMPLE purposes only.)
    grid.setController({
        // These modules are for EXAMPLE purposes only
        filter: grid.plugins.hyperfilter.create(),
        sorter: grid.plugins.hypersorter
    });

    var idx = grid.behavior.columnEnum;

    grid.setState({
        columnIndexes: [ idx.NAME, idx.STATE, idx.LATITUDE, idx.LONGITUDE ], // so drill-down column on far left
        fixedColumnCount: 1, // so far left drill-down column always visible
        showFilterRow: options.includeFilter && grid.prop('filter', 'columnFilters')
    });

    grid.behavior.setColumnProperties(grid.behavior.columnEnum.STATE, {
        halign: 'left'
    });

    var dd = grid.plugins.treeView.drillDown = {};

    var checkbox = document.querySelector('input[type=checkbox]'),
        button = document.querySelector('input[type=button]');

    checkbox.onclick = function() {
        var dataSource = grid.plugins.treeView.setRelation(this.checked);
        if (dataSource) {
            dd.column = grid.behavior.getColumn(dataSource.treeColumn.index);

            dd.header = dd.column.header;
            dd.column.header = '';

            dd.unsortable = dd.column.properties.unsortable;
            dd.column.properties.unsortable = true;
        } else {
            dd.column.header = dd.header;
            dd.column.properties.unsortable = dd.unsortable;
        }
        button.disabled = !this.checked;
    };

    button.onclick = function() {
        grid.behavior.dataModel.expandAllRows(true);
    };
};

