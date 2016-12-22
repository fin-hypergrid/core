/* eslint-env browser */

'use strict';

// NOTE: gulpfile.js's 'add-ons' task makes a copy of this file, altering the final line. The copy is placed in demo/build/add-ons/ along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/. Neither file is saved to the repo.

/** @typedef customDataSource
 * @type {function|boolean}
 * @summary One of:
 * * A custom data source module (object constructor).
 * * Truthy - Use a default data source object constructor.
 * * Falsy - No datasource (exclude from pipeline).
 * @memberOf TreeView
 */

/**
 * @param {TreeView.customDataSource} dataSource - A custom data source object constructor *or* `true` to enable default *or* `false` to disable.
 * @param {function} defaultDataSource - The default data source object constructor.
 * @returns {function} Returns selected dataSource; or falsy `dataSource`.
 * @memberOf TreeView
 * @inner
 */
function include(dataSource, defaultDataSource) {
    var isConstructor = typeof dataSource === 'function';
    return isConstructor ? dataSource : dataSource && defaultDataSource;
}

/**
 * @classdesc This is a simple helper class to set up the tree-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Build a new pipeline with `DataSourceTreeview` and appropriate sorter and filter.
 * * Perform the self-join and rebuild the index to turn the tree-view on or off, optionally hiding the ID columns.
 *
 * @see {@link http://openfin.github.io/hyper-analytics/DataSourceTreeview.html#setRelation}
 *
 * @param {Hypergrid} grid
 * @param {object} [options] - In addition to the following, also contains options for `DataSourceTreeView`'s `setRelation` method (|see}) by {@link TreeView#setRelation|this.setRelation}.
 * @param {number|string} [options.idColumn='ID'] - See `DataSourceTreeview.prototype.setRelation`.
 * @param {number|string} [options.parentIdColumn='parentID'] - See `DataSourceTreeview.prototype.setRelation`.
 * @param {number|string} [options.treeColumn='name'] - See `DataSourceTreeview.prototype.setRelation`.
 * @param {number|string} [options.groupColumn=dataSource.treeColumn.name] - See `DataSourceTreeview.prototype.setRelation`.
 * @param {TreeView.customDataSource} [options.includeFilter=false] - A custom filter data source *or* enable default tree filter data source. The filter row is hidden when disabled.
 * @param {TreeView.customDataSource} [options.includeSorter=false] - A custom filter data source *or* enable default tree sorting data source.
 * @param {boolean} [options.hideIdColumns=false] - Once hidden, cannot be unhidden from here.
 * @constructor
 */
function TreeView(grid, options) {
    this.grid = grid;
    this.options = options || {};
}

TreeView.prototype.name = 'TreeView';

/**
 * @summary Build/unbuild the tree view.
 * @desc "Joins" the table to itself through the ID and parent ID columns using the options given to the constructor (see above).
 *
 * Reconfigures the data model's data pipeline for tree view join; restores it when unjoined.
 *
 * Also saves and restores some grid properties:
 * * Tree column is made non-editable.
 * * Tree column is made non-selectable so clicking drill-down controls doesn't select the cell.
 * * Row are made selectable by clicking in row handles only so clicking drill-down controls doesn't select the row.
 * @param {boolean} join - If truthy, turn tree-view **ON**. If falsy (or omitted), turn it **OFF**.
 * @returns {DataSourceTreeView} Indicates joined state; undefined indicates unjoined.
 */
TreeView.prototype.setRelation = function(join) {
    var grid = this.grid,
        behavior = grid.behavior,
        dataModel = behavior.dataModel;

    if (join) {
        var dataTransformers = window.fin.Hypergrid.analytics;
        behavior.setPipeline([
            include(this.options.includeFilter, dataTransformers.DataSourceTreeviewFilter),
            include(this.options.includeSorter, dataTransformers.DataSourceTreeviewSorter),
            dataTransformers.DataSourceTreeview
        ], {
            stash: 'default'
        });
    }

    var dataSource = dataModel.findDataSourceByType('treeviewer'),
        joined = dataSource.setRelation(join && this.options),
        columnProps = behavior.getColumnProperties(dataSource.treeColumn.index),
        state = grid.properties;

    if (joined) {
        // Make the tree column uneditable: Save the current value of the tree column's editable property and set it to false.
        this.editableWas = !!columnProps.editable;
        columnProps.editable = false;

        this.cellSelectionWas = !!columnProps.cellSelection;
        columnProps.cellSelection = false;

        // Save value of grid's checkboxOnlyRowSelections property and set it to true so drill-down clicks don't select the row they are in
        this.checkboxOnlyRowSelectionsWas = state.checkboxOnlyRowSelections;
        state.checkboxOnlyRowSelections = true;

        if (this.options.hideIdColumns) {
            var columnIndexes = [dataSource.idColumn.index, dataSource.parentIdColumn.index];

            columnIndexes.forEach(function(columnIndex) {
                var index = behavior.getActiveColumnIndex(columnIndex);
                if (index !== undefined) {
                    behavior.columns.splice(index, 1);
                }
            });
        }

        // setRelation changed rows and hiding ID columns changed columns so reapply analytics
        behavior.reindex();
    } else {
        // restore the saved render props
        columnProps.editable = this.editableWas;
        columnProps.cellSelection = this.cellSelectionWas;
        state.checkboxOnlyRowSelections = this.checkboxOnlyRowSelectionsWas;

        behavior.unstashPipeline();
    }

    grid.selectionModel.clear();
    grid.clearMouseDown();

    return joined && dataSource;
};

/**
 * @summary Delete a row and it's children.
 * @desc _Requires that the row-by-id API is installed._
 *
 * Alternatively, you can reassign the children to another row (see `adoptiveParentID` below).
 *
 * After you're done with all your row manipulations, you must call:
 * ```javascript
 * grid.behavior.reindex();
 * grid.behaviorShapeChanged();
 * grid.repaint(); // call this eventually
 * ```
 *
 * @param {number} ID - ID of the row to delete.
 * @param {null|number} [adoptiveParentID] - ID of the row to reassign the orphaned children to.
 * If null, reassigns to top-level.
 * If omitted, the orphans are recursively deleted.
 * _If omitted, the remaining parameters are promoted one position._
 * @param {boolean} [keepParent] - Just delete (or reassign) children but keep the parent.
 * @param {boolean} [keepDrillDown] - Keep drill down control on the kept parent.
 * @returns {number} Total rows deleted.
 */
TreeView.prototype.deleteRow = function(ID, adoptiveParentID, keepParent, keepDrillDown) {
    var method, dataRow,
        adopting = typeof adoptiveParentID === 'number' || adoptiveParentID === null,
        deletions = 0,
        dataModel = this.grid.behavior.dataModel,
        treeview = dataModel.findDataSourceByType('treeviewer'),

        // getIdColumn rather than idColumn in case setRelation not called yet:
        idColumnName = (treeview.idColumn = this.options.idColumn).name,
        parentIdColumnName = (treeview.parentIdColumn = this.options.parentIdColumn).name;

    if (!adopting) {
        keepDrillDown = keepParent;
        keepParent = adoptiveParentID;
        adoptiveParentID = undefined;
    }

    if (adoptiveParentID && !dataModel.source.findRow(idColumnName, adoptiveParentID)) {
        throw 'Adoptive parent row not found.';
    }

    method = keepParent ? dataModel.getRowById : dataModel.deleteRowById;
    dataRow = method.call(dataModel, idColumnName, ID);
    if (dataRow) {
        if (!keepParent) {
            deletions++;
        } else if (!keepDrillDown) {
            delete dataRow.__EXPANDED;
        }

        while ((dataRow = dataModel.source.findRow(parentIdColumnName, ID))) {
            if (adopting) {
                dataRow[parentIdColumnName] = adoptiveParentID;
            } else {
                deletions += this.deleteRow(dataRow[idColumnName]);
            }
        }
    }

    return deletions;
};

module.exports = TreeView;
