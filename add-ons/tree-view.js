'use strict';

/**
 * @classdesc This is a simple helper class to set up the tree-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Insert `DataSourceTreeview` into the data model's pipeline (`addPipe`, `addPipeTo`).
 * * Perform the self-join and rebuild the index to turn the tree-view on or off, optionally hiding the ID columns (`setRelation`).
 *
 * @param {object} [options]
 * @param {boolean} [options.shared=false]
 * @constructor
 */
function TreeView(grid, options) {
    this.grid = grid;
    this.options = options;
}

TreeView.prototype = {
    constructor: TreeView.prototype.constructor,

    /**
     * @summary Reconfigure the dataModel's pipeline for tree view.
     * @desc The pipeline is reset starting with either the given `options.dataSource` _or_ the existing pipeline's first data source.
     *
     * Then the tree view filter and sorter data sources are added as requested.
     *
     * Finally the tree view data source is added.
     *
     * This method can operate on either:
     * * A data model prototype, which will affect all data models subsequently created therefrom. The prototype must be given in `options.dataModelPrototype`.
     * * The current data model instance. In this case, the instance is given its own new pipeline.
     *
     * @param {object} [options]
     * @param {object} [options.dataModelPrototype] - Adds the pipes to the given object. If omitted, this must be an instance; adds the pipes to a new "pwn" pipeline created from the first data source of the instance's old pipeline.
     * @param {dataSourcePipelineObject} [options.firstPipe] - Use as first data source in the new pipeline. If omitted, re-uses the existing pipeline's first data source.
     */
    setPipeline: function(options) {
        options = options || {};

        var amInstance = this instanceof TreeView,
            dataModel = options.dataModelPrototype || amInstance && this.grid.behavior.dataModel,
            firstPipe = options.firstPipe || dataModel.pipeline[0];

        if (!dataModel) {
            throw 'Expected dataModel.';
        }

        if (!firstPipe) {
            throw 'Expected pip (data source pipeline descriptor).';
        }

        if (options.dataModelPrototype) {
            // operating on prototype
            dataModel.truncatePipeline();
            dataModel.addPipe(firstPipe);
        } else {
            // operating on an instance: create a new "own" pipeline
            dataModel.pipeline = [firstPipe];
        }

        if (options.includeFilter) {
            dataModel.addPipe({ type: 'DataSourceGlobalFilter' });
        }

        if (options.includeSorter) {
            dataModel.addPipe({ type: 'DataSourceTreeviewSorter' });
        }

        dataModel.addPipe({ type: 'DataSourceTreeview', test: isTreeview });

        if (amInstance) {
            this.grid.behavior.setData(dataModel.source.data);
            this.grid.behavior.shapeChanged();
        }
    },

    /**
     * @summary Build/unbuild the tree view.
     * @param {boolean} join - Turn tree-view **ON**. If falsy (or omitted), turn it **OFF**.
     * @param {boolean} [hideIdColumns=false] - Once hidden, cannot be unhidden from here.
     * @returns {boolean} Joined state.
     */
    setRelation: function(join, hideIdColumns) {
        var options = join && this.options,
            behavior = this.grid.behavior,
            dataModel = behavior.dataModel,
            dataSource = dataModel.sources.treeview,
            joined = dataSource.setRelation(options),
            state = behavior.getPrivateState(),
            columnProps = behavior.getColumn(dataSource.treeColumnIndex).getProperties();

        if (joined) {
            // save the current value of column's editable property and set it to false
            this.editableWas = !!columnProps.editable;
            columnProps.editable = false;

            // save value of grid's checkboxOnlyRowSelections property and set it to true so drill-down clicks don't select the row they are in
            this.checkboxOnlyRowSelectionsWas = state.checkboxOnlyRowSelections;
            state.checkboxOnlyRowSelections = true;

            if (hideIdColumns) {
                var columnIndexes = [dataSource.idColumnIndex, dataSource.parentIdColumnIndex];

                columnIndexes.forEach(function(columnIndex) {
                    var index;
                    if (behavior.columns.find(function(column, i) {
                            index = i;
                            return column.index === columnIndex;
                        })) {
                        behavior.columns.splice(index, 1);
                    }
                });
            }
        } else {
            columnProps.editable = this.editableWas;
            state.checkboxOnlyRowSelections = this.checkboxOnlyRowSelectionsWas;
        }

        this.grid.selectionModel.clear();
        this.grid.clearMouseDown();

        dataModel.applyAnalytics();
        behavior.shapeChanged();

        return joined;
    }
};

/**
 * This is the required test function called by the data model's `isDrilldown` method in context. _Do not call directly._
 * @param {number} [event.dataCell.x] If available, also checks that the column clicked is the tree column.
 * @returns {boolean} If the data source is a tree view.
 */
function isTreeview(event) {
    var treeview = this.sources.treeview,
        result = !!(treeview && treeview.viewMakesSense());
    if (result && event && event.dataCell) {
        result = event.dataCell.x === treeview.treeColumnIndex;
    }
    return result;
}

module.exports = TreeView;
