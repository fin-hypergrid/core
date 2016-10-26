/* eslint-env browser */

'use strict';

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

/** @typedef customDataSource
 * @type {function|boolean}
 * @summary One of:
 * * A custom data source module (object constructor).
 * * Truthy - Use a default data source object constructor.
 * * Falsy - No datasource (exclude from pipeline).
 * @memberOf AggregationsView
 */

/**
 * @param {AggregationsView.customDataSource} dataSource - A custom data source object constructor *or* `true` to enable default *or* `false` to disable.
 * @param {function} defaultDataSource - The default data source object constructor.
 * @returns {function} Returns selected dataSource; or falsy `dataSource`.
 * @memberOf AggregationsView
 * @inner
 */
function include(dataSource, defaultDataSource) {
    var isConstructor = typeof dataSource === 'function';
    return isConstructor ? dataSource : dataSource && defaultDataSource;
}

/**
 * @classdesc This is a simple helper class to set up the aggregations-view data source in the context of a hypergrid.
 *
 * It includes a single method, {@link AggregationsView#setAggregateGroups|setAggregateGroups} to:
 * * Build a new pipeline with `DataSourceAggregator` and appropriate sorter and filter.
 * * Perform the grouping and aggregations and rebuild the index to turn the aggregations-view on or off .
 *
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {object} [options.aggregations] - Optional default for {@link AggregationsView#setAggregateGroups}.
 * @param {number[]} [options.groups] - Optional default for {@link AggregationsView#setAggregateGroups}.
 * @param {AggregationsView.customDataSource} [options.includeFilter=false] - A custom filter data source *or* enable default group filter data source. The filter row is hidden when disabled.
 * @param {AggregationsView.customDataSource} [options.includeSorter=false] - A custom filter data source *or* enable default group sorting data source.
 * @constructor
 */
function AggregationsView(grid, options) {
    this.grid = grid;
    this.options = options || {};
}

AggregationsView.prototype.$$CLASS_NAME = 'AggregationsView';

/**
 * @summary Build/unbuild the group view.
 * @desc Sets up grouping on the table using the options given to the constructor (see above).
 *
 * Reconfigures the data model's data pipeline for aggregated view; restores it when unaggregated.
 *
 * Also saves and restores some grid properties:
 * * Tree column is made non-editable.
 * * Tree column is made non-selectable so clicking drill-down controls doesn't select the cell.
 * * Row are made selectable by clicking in row handles only so clicking drill-down controls doesn't select the row.
 *
 * @see {@link http://openfin.github.io/hyper-analytics/DataSourceAggregator.html#setAggregateGroups}
 *
 * @param {object} [aggregations=this.options.aggregations] - Hash of aggregate functions. See also `DataSourceAggregator.prototype.setAggregateGroups`.
 *
 * @param {number[]} [groups=this.options.groups] - List of groups. See also `DataSourceAggregator.prototype.setAggregateGroups`. One of:
 * * Non-empty array: Turn group-view **ON** using the supplied group list.
 * * Empty array (`[]`): Turn group-view **OFF**.
 *
 * @returns {boolean} Aggregated state.
 */
AggregationsView.prototype.setAggregateGroups = function(aggregations, groups) {
    aggregations = aggregations || this.options.aggregations;
    groups = groups || this.options.groups;

    if (!aggregations || !groups) {
        throw 'Expected both an aggregations hash and a group list.';
    }

    var aggregated = groups.length,
        grid = this.grid,
        behavior = grid.behavior,
        dataModel = behavior.dataModel;

    // 1. ON AGGREGATING: INSTALL PIPELINE

    if (aggregated) {
        var dataTransformers = window.fin.Hypergrid.analytics;
        behavior.setPipeline([
            include(this.options.includeFilter, dataTransformers.DataSourceGlobalFilter),
            dataTransformers.DataSourceAggregator,
            include(this.options.includeSorter, dataTransformers.DataNodeGroupSorter)
        ], {
            stash: 'default',
            apply: false // defer until after setGroupBys call below
        });
    }

    // 2. PERFORM ACTUAL AGGREGATING OR UNAGGREGATING

    var dataSource = dataModel.findDataSourceByType('aggregator'),
        columnProps = behavior.getColumnProperties(dataSource.treeColumnIndex),
        state = grid.properties;

    if (aggregated) {
        dataSource.setAggregateGroups(aggregations, groups);
        behavior.reindex(); // rows have changed
    } else {
        dataSource.setAggregateGroups({}, []);
    }

    behavior.createColumns(); // columns changed
    behavior.changed(); // number of rows changed

    // 3. SAVE OR RESTORE SOME RENDER PROPERTIES

    if (aggregated) {
        // save the current value of column's editable property and set it to false
        this.editableWas = !!columnProps.editable;
        columnProps.editable = false;

        this.cellSelectionWas = !!columnProps.cellSelection;
        columnProps.cellSelection = false;

        // save value of grid's checkboxOnlyRowSelections property and set it to true so drill-down clicks don't select the row they are in
        this.checkboxOnlyRowSelectionsWas = state.checkboxOnlyRowSelections;
        state.checkboxOnlyRowSelections = true;
    } else {
        // restore the saved render props
        columnProps.editable = this.editableWas;
        columnProps.cellSelection = this.cellSelectionWas;
        state.checkboxOnlyRowSelections = this.checkboxOnlyRowSelectionsWas;

        // 3a. ON UNGROUPING: RESTORE PIPELINE
        behavior.unstashPipeline();
    }

    grid.selectionModel.clear();
    grid.clearMouseDown();

    return aggregated;
};

module.exports = AggregationsView;
