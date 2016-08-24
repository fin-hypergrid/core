'use strict';

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

/**
 * @classdesc This is a simple helper class to set up the aggregations-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Insert `DataSourceAggregator` into the data model's pipeline (`addPipe`, `addPipeTo`).
 * * Perform the grouping and aggregations and rebuild the index to turn the aggregations-view on or off(`setRelation`).
 *
 * @param {object}
 * @constructor
 */
function AggregationsView(grid) {
    this.grid = grid;
    var self = this;

    var G = Object.getPrototypeOf(this.grid),
        B = Object.getPrototypeOf(this.grid.behavior),
        DM = Object.getPrototypeOf(this.grid.behavior.dataModel);

    G.setAggregateGroups = function(aggregations, arrayOfColumnIndexes) {
        this.behavior.setAggregateGroups(aggregations, arrayOfColumnIndexes);
    }.bind(this.grid);

    B.setAggregateGroups = function(mapOfKeysToFunctions, groups) {
        this.dataModel.setAggregateGroups(mapOfKeysToFunctions, groups);
        this.createColumns();
        setTimeout(function() {
            this.changed();
        }.bind(this.grid.behavior), 100);
    }.bind(this.grid.behavior);

    DM.setAggregateGroups = function(aggregations, groups) {
        this.sources.aggregator.setAggregateGroups(aggregations, groups);
        self.setRelation(aggregations, groups);
    }.bind(this.grid.behavior.dataModel);
}

AggregationsView.prototype = {
    constructor: AggregationsView.prototype.constructor,

    /**
     * @summary Reconfigure the dataModel's pipeline for aggregations view.
     * @desc The pipeline is reset starting with either the given `options.dataSource` _or_ the existing pipeline's first data source.
     *
     * Then the aggregations view filter and sorter data sources are added as requested.
     *
     * Finally the aggregations view data source is added.
     *
     * This method can operate on either:
     * * A data model prototype, which will affect all data models subsequently created therefrom. The prototype must be given in `options.dataModelPrototype`.
     * * The current data model instance. In this case, the instance is given its own new pipeline.
     *
     * @param {object} [options]
     * @param {object} [options.dataModelPrototype] - Adds the pipes to the given object. If omitted, this must be an instance; adds the pipes to a new "own" pipeline created from the first data source of the instance's old pipeline.
     * @param {dataSourcePipelineObject} [options.firstPipe] - Use as first data source in the new pipeline. If omitted, re-uses the existing pipeline's first data source.
     */
    setPipeline: function(options) {
        options = options || {};

        var amInstance = this instanceof AggregationsView,
            dataModel = options.dataModelPrototype || amInstance && this.grid.behavior.dataModel;

        if (!dataModel) {
            throw 'Expected dataModel.';
        }

        if (options.dataModelPrototype) {
            // operating on prototype
            dataModel.truncatePipeline();
        } else {
            // operating on an instance: create a new "own" pipeline
            dataModel.pipeline = [];
        }

        dataModel.addPipe({ type: 'DataSourceAggregator', test: isAggregationsview });

        if (options.includeFilter) {
            dataModel.addPipe({ type: 'DataSourceGlobalFilter' });
        }

        if (options.includeSorter) {
            dataModel.addPipe({type: 'DataSourceSorterComposite'});
            dataModel.addPipe({type: 'DataNodeGroupSorter', parent: 'DataSourceAggregator'});
        }

        if (amInstance) {
            this.grid.behavior.setPipeline();
            this.grid.behavior.shapeChanged();
        }
    },

    /**
     * @summary Build/unbuild the aggregations view.
     * @desc Both parameters should must contain non-empty arrays to turn aggregations **ON**; if either or both are empty, aggregations are turned **OFF**.
     Add a line note
     * @param {boolean} aggregations - Turn aggregations-view **ON**. If falsy (or omitted), turn it **OFF**.
     * @param {number[]} groups - indexes of columns to group against
     * @returns {boolean} aggregation view state.
     */
    setRelation: function(aggregations, groups) {
        var behavior = this.grid.behavior,
            dataModel = behavior.dataModel,
            aggregated = !!aggregations.length && !!groups.length,
            dataSource = dataModel.sources.aggregator,
            state = behavior.getPrivateState(),
            columnProps = behavior.getColumn(dataSource.treeColumnIndex).getProperties();

        if (aggregated) {
            // save the current value of column's editable property and set it to false
            this.editableWas = !!columnProps.editable;
            columnProps.editable = false;

            // save value of grid's checkboxOnlyRowSelections property and set it to true so drill-down clicks don't select the row they are in
            this.checkboxOnlyRowSelectionsWas = state.checkboxOnlyRowSelections;
            state.checkboxOnlyRowSelections = true;

        } else {
            columnProps.editable = this.editableWas;
            state.checkboxOnlyRowSelections = this.checkboxOnlyRowSelectionsWas;
        }

        this.grid.selectionModel.clear();
        this.grid.clearMouseDown();

        dataModel.applyAnalytics();
        behavior.shapeChanged();

        return aggregated;
    }
};

/**
 * This is the required test function called by the data model's `isDrilldown` method in context. _Do not call directly._
 * @param {number} [columnIndex] If given, also checks that the column clicked is the aggregations column.
 * @returns {boolean} If the data source is a aggregations view.
 */
function isAggregationsview(event) {
    var aggregationsview = this.sources.aggregator,
        result = !!(aggregationsview && aggregationsview.viewMakesSense());
    if (result && event) {
        result = event.dataCell.x === aggregationsview.treeColumnIndex;
    }
    return result;
}

module.exports = AggregationsView;
