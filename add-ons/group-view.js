/* globals CustomEvent window*/

// NOTE: gulpfile.js's 'add-ons' task copies this file, altering the final line, to /demo/build/add-ons/, along with a minified version. Both files are eventually deployed to http://openfin.github.io/fin-hypergrid/add-ons/.

'use strict';

/**
 * @classdesc This is a simple helper class to set up the group-view data source in the context of a hypergrid.
 *
 * It includes methods to:
 * * Insert `DataSourceGroupview` into the data model's pipeline
 * * Perform the column grouping and rebuild the index to turn the view on or off (`setRelation`).
 *
 * @param {object}
 * @constructor
 */
function GroupView(grid) {
    var self = this;
    this.grid = grid;

    var G = Object.getPrototypeOf(this.grid),
        B = Object.getPrototypeOf(this.grid.behavior),
        DM = Object.getPrototypeOf(this.grid.behavior.dataModel);

    G.setGroups = function(arrayOfColumnIndexes) {
        this.behavior.setGroups(arrayOfColumnIndexes);
    }.bind(this.grid);

    G.fireSyntheticGroupsChangedEvent = function(groups) {
        var detail = {
            groups: groups,
            time: Date.now(),
            grid: this
        };
        var clickEvent = new CustomEvent('fin-groups-changed', {
            detail: detail
        });
        this.canvas.dispatchEvent(clickEvent);
    }.bind(this.grid);

    B.setGroups = function(arrayOfColumnIndexes) {
        this.dataModel.setGroups(arrayOfColumnIndexes);
        this.createColumns();
        this.changed();
    }.bind(this.grid.behavior);

    B.getGroups = function() {
        return this.dataModel.getGroups();
    }.bind(this.grid.behavior);

    B.getAvailableGroups = function() {
        return this.dataModel.getAvailableGroups();
    }.bind(this.grid.behavior);

    DM.getGroups = function() {
        var headers = this.getHeaders().slice(1); //Exclude the tree column
        var fields = this.getFields().slice(0);
        var groupBys = this.sources.groupview.groupBys;
        var groups = [];
        for (var i = 0; i < groupBys.length; i++) {
            var field = headers[groupBys[i]];
            groups.push({
                id: groupBys[i],
                label: field,
                field: fields
            });
        }
        return groups;
    }.bind(this.grid.behavior.dataModel);

    DM.setGroups = function(groups) {
        this.sources.groupview.setGroupBys(groups);
        self.setRelation(groups);
        this.grid.fireSyntheticGroupsChangedEvent(this.getGroups());
    }.bind(this.grid.behavior.dataModel);


    DM.getAvailableGroups = function() {
        var headers = this.sources.source.getHeaders().slice(0);
        var groupBys = this.sources.groupview.groupBys;
        var groups = [];
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
    }.bind(this.grid.behavior.dataModel);

}

GroupView.prototype = {
    constructor: GroupView.prototype.constructor,

    /**
     * @summary Reconfigure the dataModel's pipeline for group view.
     * @desc The pipeline is reset starting with Hypergrid's DataSourceOrigin
     *
     * The group view data source is added.
     * Then the group view filter is added as requested.
     * Finally the group view group sorter source is added.
     *
     * This method can operate on either:
     * * A data model prototype, which will affect all data models subsequently created therefrom. The prototype must be given in `options.dataModelPrototype`.
     * * The current data model instance. In this case, the instance is given its own new pipeline.
     *
     * @param {object} [options]
     * @param {object} [options.dataModelPrototype] - Adds the pipes to the given object. If omitted, this must be an instance; adds the pipes to a new "own" pipeline created from the first data source of the instance's old pipeline.
     */
    setPipeline: function(options) {
        options = options || {};

        var amInstance = this instanceof GroupView,
            dataModel = options.dataModelPrototype || amInstance && this.grid.behavior.dataModel,
            pipelines = [];
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
        if (options.includeFilter) {
            pipelines.push(window.fin.Hypergrid.analytics.DataSourceGlobalFilter);
        }
        pipelines.push(window.fin.Hypergrid.analytics.DataSourceGroupView);

        if (options.includeSorter) {
            pipelines.push(window.fin.Hypergrid.analytics.DataNodeGroupSorter);
        }
        if (amInstance) {
            this.grid.behavior.setPipeline(pipelines);
            this.grid.behavior.shapeChanged();
        }
    },

    /**
     * @summary Build/unbuild the group view.
     * @param {boolean} groups - Turn group-view **ON**. If falsy (or omitted), turn it **OFF**.
     * @returns {boolean} View State.
     */
    setRelation: function(groups) {
        var behavior = this.grid.behavior,
            dataModel = behavior.dataModel,
            dataSource = dataModel.sources.groupview,
            grouped = !!groups.length,
            state = behavior.getPrivateState(),
            columnProps = behavior.getColumn(dataSource.treeColumnIndex).getProperties();

        if (grouped) {
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

        behavior.applyAnalytics();
        behavior.shapeChanged();

        return grouped;
    }
};

module.exports = GroupView;
