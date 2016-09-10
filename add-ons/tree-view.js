'use strict';
/* globals window */

// NOTE: gulpfile.js's 'add-ons' task makes a copy of this file, altering the final line. The copy is placed in demo/build/add-ons/ along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/. Neither file is saved to the repo.

/**
 * @classdesc This is a simple helper class to set up the tree-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Insert the tree-view data source (`DataSourceTreeview`) into the data model's pipeline (see {#@link TreeView#setPipeline|setPipeline} method) along with the optional filter and sort data sources.
 * * Perform the self-join and rebuild the index to turn the tree-view on or off, optionally hiding the ID columns ({#@link TreeView#setRelation|setRelation} method).
 *
 * @param {object} options - Passed to data source's {@link DataSourceTreeView#setRelation|setRelation} method ({@link http://openfin.github.io/hyper-analytics/DataSourceTreeview.html#setRelation|see}) when called here by local API's {@link TreeView#setRelation|this.setRelation} method.
 * @constructor
 */
function TreeView(grid, options) {
    this.grid = grid;
    this.options = options || {};
}

TreeView.prototype = {

    constructor: TreeView.prototype.constructor,

    /**
     * @summary Reconfigure the data model's data pipeline for tree view.
     * @desc The _data transformation pipeline_ is an ordered list of data transformations, always beginning with an actual data source. Each _transformation_ in the pipeline operates on the data source immediately ahead of it. While transformations are free to completely rewrite the data in any way they want, most transformations merely apply an index to the data.
     *
     * The _shared pipeline_ is defined on the data model's prototype and is used for all grid instances (using the same data model). A grid can however define a _local pipeline_ on the data model's instance.
     *
     * In any case, the actual data pipeline is (re)constructed from a _pipeline configuration_ each time data is set on the grid via {@link dataModel/JSON#setData|setData}.
     *
     * This method reconfigures the data pipeline suitable for tree view. It is designed to operate on either of:
     * * the "shared" pipeline configuration (on the grid's data model's prototype)
     * * the grid's "local" pipeline configuration (on the grid's data model's instance)
     *
     * This method operates as follows:
     * 1. Reset the pipeline:
     *    * In the case of the shared pipeline, the array is truncated in place.
     *    * In the case of an instance pipeline, a new array is created.
     * 2. Add the first data source:
     *    * The data source provided in `options.firstPipe` is used if given; otherwise...
     *    * The existing pipeline configuration's first data source will be reused. (First time in, this will always come from the prototype's version.)
     * 3. Add the filter data source (if requested).
     * 4. Add the tree sorter data source (if requested).
     * 5. Finally, add the tree view data source.
     *
     * Step 1 above operates on the shared pipeline when you supply the data model's prototype in `options.dataModelPrototype` (see below). In this case, you have the option of calling this method _before_ instantiating your grid(s):
     *
     * ```javascript
     * var JSON = Hypergrid.dataModels.JSON.prototype;
     * var pipelineOptions = { dataModelPrototype: JSON.prototype }
     * TreeView.prototype.setPipeline(pipelineOptions);
     * ```
     *
     * This approach avoids the need to reset the data after reconfiguring the pipeline (in which case, do _not_ call this method again after instantiation).
     *
     * @param {object} [options]
     *
     * @param {boolean} [options.includeFilter=false] - Enables filtering. Includes the filter data source. The filter row is hidden if falsy.
     *
     * @param {boolean} [options.includeSorter=false] - Enables sorting. Includes the specialized tree sorter data source.
     *
     * @param {object} [options.dataModelPrototype] - Adds requested pipes to the "shared" pipeline array object instead of to a new custom (instance) pipeline array object.
     *
     * Supply this option when you want to set up the "shared" pipeline on the data model prototype, which would then be available to all grid instances subsequently created thereafter. In this case, you can call this method before or after grid instantiation. To call it before, call it directly on `TreeView.prototype`; to call it after, call it normally (on the `TreeView` instance).
     *
     * If omitted, a new "own" (instance) pipeline is created, overriding the prototype's (shared) pipeline. (In this case this method must be called normally, on the `Treeview` instance.)
     *
     * In either case, if called "normally" (on the instance), the data is reset via `setData`. (If called on the prototype it is not reset here. Currently the `Hypergrid` constructor calls it.)
     *
     */
    setPipeline: function(options) {
        options = options || {};

        var amInstance = this instanceof TreeView,
            dataModel = options.dataModelPrototype || amInstance && this.grid.behavior.dataModel,
            pipelines = [];

        if (!dataModel) {
            throw 'Expected dataModel.';
        }

        if (options.dataModelPrototype) {
            // operating on prototype
            dataModel.truncatePipeline();
        } else {
            // operating on an instance: create a new"own" pipeline
            dataModel.pipeline = [];
        }

        if (options.includeFilter) {
            pipelines.push(window.fin.Hypergrid.analytics.DataSourceTreeviewFilter);
        }

        if (options.includeSorter) {
            pipelines.push(window.fin.Hypergrid.analytics.DataSourceTreeviewSorter);
        }

        pipelines.push(window.fin.Hypergrid.analytics.DataSourceTreeview);

        dataModel.grid.behavior.setPipeline(pipelines);
    },

    /**
     * @summary Build/unbuild the tree view.
     * @param {boolean} join - If truthy, turn tree-view **ON**. If falsy (or omitted), turn it **OFF**.
     * @param {boolean} [hideIdColumns=false] - Once hidden, cannot be unhidden from here.
     * @returns {boolean} Joined state.
     */
    setRelation: function(join, hideIdColumns) {
        var options = join && this.options,
            behavior = this.grid.behavior,
            dataModel = behavior.dataModel,
            dataSource = dataModel.sources.treeview,
            state = behavior.getPrivateState(),
            filterDataSource = this.grid.behavior.dataModel.getGlobalFilterDataSource(),
            filter = filterDataSource.get();

        // clear filter before setRelation call
        filterDataSource.set(undefined);
        dataModel.applyAnalytics();

        var joined = dataSource.setRelation(options),
            columnProps = behavior.getColumnProperties(dataSource.treeColumn.index);

        // restore filter after setRelation call
        filterDataSource.set(filter);

        if (joined) {
            // Make the tree column uneditable: Save the current value of the tree column's editable property and set it to false.
            this.editableWas = !!columnProps.editable;
            columnProps.editable = false;

            this.cellSelectionWas = !!columnProps.cellSelection;
            columnProps.cellSelection = false;

            // Save value of grid's checkboxOnlyRowSelections property and set it to true so drill-down clicks don't select the row they are in
            this.checkboxOnlyRowSelectionsWas = state.checkboxOnlyRowSelections;
            state.checkboxOnlyRowSelections = true;

            if (hideIdColumns) {
                var columnIndexes = [dataSource.idColumn.index, dataSource.parentIdColumn.index];

                columnIndexes.forEach(function(columnIndex) {
                    var index = behavior.getActiveColumnIndex(columnIndex);
                    if (index !== undefined) {
                        behavior.columns.splice(index, 1);
                    }
                });
            }
        } else {
            columnProps.editable = this.editableWas;
            columnProps.cellSelection = this.cellSelectionWas;
            state.checkboxOnlyRowSelections = this.checkboxOnlyRowSelectionsWas;
        }

        this.grid.selectionModel.clear();
        this.grid.clearMouseDown();

        behavior.applyAnalytics();
        return joined;
    },

    /**
     * @summary Delete a row and it's children.
     * @desc _Requires that the row-by-id API is installed._
     *
     * Alternatively, you can reassign the children to another row (see `adoptiveParentID` below).
     *
     * After you're done with all your row manipulations, you must call:
     * ```javascript
     * grid.behavior.applyAnalytics();
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
    deleteRow: function(ID, adoptiveParentID, keepParent, keepDrillDown) {
        var method, dataRow,
            adopting = typeof adoptiveParentID === 'number' || adoptiveParentID === null,
            deletions = 0,
            dataModel = this.grid.behavior.dataModel,
            treeview = dataModel.sources.treeview,

            // getIdColumn rather than idColumn in case setRelation not called yet:
            idColumnName = treeview.setIdColumn(this.options.idColumn).name,
            parentIdColumnName = treeview.setParentIdColumn(this.options.parentIdColumn).name;

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
    }

};

module.exports = TreeView;
