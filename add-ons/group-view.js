/* eslint-env browser */

'use strict';

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

/** @typedef customDataSource
 * @type {function|boolean}
 * @summary One of:
 * * A custom data source module (object constructor).
 * * Truthy - Use a default data source object constructor.
 * * Falsy - No datasource (exclude from pipeline).
 * @memberOf GroupView
 */

/**
 * @param {GroupView.customDataSource} dataSource - A custom data source object constructor *or* `true` to enable default *or* `false` to disable.
 * @param {function} defaultDataSource - The default data source object constructor.
 * @returns {function} Returns selected dataSource; or falsy `dataSource`.
 * @memberOf GroupView
 * @inner
 */
function include(dataSource, defaultDataSource) {
    var isConstructor = typeof dataSource === 'function';
    return isConstructor ? dataSource : dataSource && defaultDataSource;
}

/**
 * @classdesc This is a simple helper class to set up the group-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Build a new pipeline with `DataSourceGroupView` and appropriate sorter and filter.
 * * Perform the column grouping and rebuild the index to turn the group-view on or off (`setRelation`).
 *
 * @see {@link http://openfin.github.io/hyper-analytics/DataSourceGroupView.html#setGroups}
 *
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {number[]} [options.groups] - Used by {@link GroupView#setGroups} as a default. See also `DataSourceGroupView.prototype.setGroups`.
 * @param {GroupView.customDataSource} [options.includeFilter=false] - A custom filter data source *or* enable default group filter data source. The filter row is hidden when disabled.
 * @param {GroupView.customDataSource} [options.includeSorter=false] - A custom filter data source *or* enable default group sorting data source.
 * @constructor
 */
function GroupView(grid, options) {
    this.grid = grid;
    this.options = options || {};
}

GroupView.prototype = {
    constructor: GroupView.prototype.constructor,

    $$CLASS_NAME: 'GroupView',

    fireSyntheticGroupsChangedEvent: function() {
        this.grid.canvas.dispatchEvent(new CustomEvent('fin-groups-changed', {
            detail: {
                groups: this.getGroups(),
                time: Date.now(),
                grid: this
            }
        }));
    },

    getGroups: function() {
        var dataModel = this.grid.behavior.dataModel,
            headers = dataModel.getHeaders().slice(1), //Exclude the tree column
            fields = dataModel.getFields().slice(0),
            dataSource = dataModel.findDataSourceByType('groupviewer'),
            groupBys = dataSource.groupBys,
            groups = [];
        for (var i = 0; i < groupBys.length; i++) {
            var field = headers[groupBys[i]];
            groups.push({
                id: groupBys[i],
                label: field,
                field: fields
            });
        }
        return groups;
    },

    getAvailableGroups: function() {
        var dataModel = this.grid.behavior.dataModel,
            headers = dataModel.source.getHeaders().slice(0),
            dataSource = dataModel.findDataSourceByType('groupviewer'),
            groupBys = dataSource.groupBys,
            groups = [];
        for (var i = 0; i < headers.length; i++) {
            if (groupBys.indexOf(i) === -1) {
                var field = headers[i];
                groups.push({
                    id: i,
                    label: field,
                    field: field
                });
            }
        }
        return groups;
    },

    /**
     * @summary Build/unbuild the group view.
     * @desc Sets up grouping on the table using the options given to the constructor (see above).
     *
     * Reconfigures the data model's data pipeline for group view; restores it when ungrouped.
     *
     * Also saves and restores some grid properties:
     * * Tree column is made non-editable.
     * * Tree column is made non-selectable so clicking drill-down controls doesn't select the cell.
     * * Row are made selectable by clicking in row handles only so clicking drill-down controls doesn't select the row.
     *
     * @param {number[]} [groups=this.options.groups] - One of:
     * * Non-empty array: Turn group-view **ON** using the supplied group list.
     * * Empty array (`[]`): Turn group-view **OFF**.
     *
     * @returns {boolean} Grouped state.
     */
    setGroups: function(groups) {
        groups = groups || this.options.groups;

        if (!groups) {
            throw 'Expected a group list.';
        }

        var grouped = groups.length,
            grid = this.grid,
            behavior = grid.behavior,
            dataModel = behavior.dataModel;

        // 1. ON GROUPING: INSTALL GROUP-VIEW PIPELINE

        if (grouped) {
            var dataTransformers = window.fin.Hypergrid.analytics;
            behavior.setPipeline([
                include(this.options.includeFilter, dataTransformers.DataSourceGlobalFilter),
                dataTransformers.DataSourceGroupView,
                include(this.options.includeSorter, dataTransformers.DataNodeGroupSorter)
            ], {
                stash: 'default',
                apply: false // defer until after setGroupBys call below
            });
        }

        // 2. PERFORM ACTUAL GROUPING OR UNGROUPING

        var dataSource = dataModel.findDataSourceByType('groupviewer'),
            columnProps = behavior.getColumnProperties(dataSource.treeColumnIndex),
            state = behavior.getPrivateState();

        dataSource.setGroupBys(groups);

        if (grouped) {
            behavior.reindex(); // rows have changed

            // 2a. ON GROUPING: OVERRIDE `getCell` TO FORCE `EmptyCell` RENDERER FOR PARENT ROWS
            this.defaultGetCell = dataModel.getCell;
            dataModel.getCell = getCell.bind(dataModel, this.defaultGetCell);
        }

        behavior.changed(); // number of rows changed

        this.fireSyntheticGroupsChangedEvent();

        // 3. SAVE OR RESTORE SOME RENDER PROPERTIES

        if (grouped) {
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

            // 3b. ON UNGROUPING: REMOVE `getCell` OVERRIDE
            grid.behavior.dataModel.getCell = this.defaultGetCell;
        }

        grid.selectionModel.clear();
        grid.clearMouseDown();

        return grouped;
    }
};

/**
 * Force `EmptyCell` renderer on parent rows.
 * @this {DataModel} - bound above
 * @param {function} defaultGetCell - bound above
 * @param {object} config
 * @param {string} rendererName
 * @returns {CellRenderer}
 * @memberOf GroupView
 * @inner
 */
function getCell(defaultGetCell, config, rendererName) {
    // First call the default getCell in case developer overrode it.
    // This will decorate `config` and return a renderer which we might override below.
    var cellRenderer = defaultGetCell.call(this, config, rendererName);

    if (config.isUserDataArea && this.getRow(config.y).hasChildren) {
        // Override renderer on parent rows
        cellRenderer = this.grid.cellRenderers.get('EmptyCell');
    }

    return cellRenderer;
}

module.exports = GroupView;
