'use strict';

var newPipe = { type: 'DataSourceTreeview', test: test },
    referencePipe = 'DataSourceTreeviewSorter';

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
     * @summary Add the tree-view data source into the shared pipeline.
     * @desc The tree-view data source is inserted into the shared pipeline of the given data model's prototype, immediately after the raw data source.
     *
     * The resulting pipeline addition is shared by all new grids using this data model.
     *
     * Intended to be called on the `TreeView` prototype, before the data model is instanced (which currently happens when the behavior is instanced (which currently happens when the grid is instanced)).
     *
     * @param {object} dataModelPrototype
     */
    addPipeTo: function(dataModelPrototype) {
        dataModelPrototype.addPipe(newPipe, referencePipe);
    },

    /**
     * @summary Add the tree-view data source into the instance pipeline.
     * @desc The tree-view data source is inserted into the pipeline of the given data model instance, immediately after the raw data source.
     *
     * If necessary, a private copy of the prototype's `pipeline` array is cloned for use by the instance (unless `shared` is truthy).
     *
     * Finally, `setData` is called again with `data` to rebuild the pipeline. To avoid this, consider {@link TreeView#addPipeTo}.
     *
     * @param {object[]} data - Required for the `setData` call.
     * @param {boolean} [shared=false] - Do not clone prototype's `pipeline` array. The default is to clone it.
     */
    addPipe: function(data, shared) {
        var behavior = this.grid.behavior,
            dataModel = behavior.dataModel;

        if (!shared && !dataModel.hasOwnProperty('pipeline')) {
            dataModel.pipeline = dataModel.pipeline.slice();
        }

        dataModel.addPipe(newPipe, referencePipe);
        behavior.setData(data);
        behavior.shapeChanged();
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
 * @param {number} [columnIndex] If given, also checks that the column clicked is the tree column.
 * @returns {boolean} If the data source is a tree view.
 */
function test(event) {
    var treeview = this.sources.treeview,
        result = !!(treeview && treeview.viewMakesSense());
    if (result && event) {
        result = event.dataCell.x === treeview.treeColumnIndex;
    }
    return result;
}

module.exports = TreeView;
