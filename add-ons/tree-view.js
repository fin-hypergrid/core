'use strict';

var treeView = {
    /**
     * Add the tree-view data source to the data source pipeline.
     * @param {DataModel} dataModel
     * @param {boolean} [shared=false] - Add to prototype.
     */
    addDataSourceTo: function(dataModel, shared) {
        if (!shared) {
            // Not shared so clone the default pipeline.
            // If you don't do this, the mutated pipeline will be shared among all grid instances.
            dataModel.pipeline = Object.getPrototypeOf(dataModel).pipeline.slice();
        }

        // Insert the treeview data sourc e after the raw data source
        var pipe = {
            type: 'DataSourceTreeview',
            test: test
        };

        dataModel.addPipe(pipe, 'JSDataSource');
    },

    setData: function(grid, data, options) {
        // Reset the pipeline, pointing at some tree (self-joined) data
        grid.behavior.setData(data, options);
        var idx = grid.behavior.columnEnum;

        // Only show the data columns; don't show the ID and parentID columns
        grid.setState({
            columnIndexes: [idx.STATE, idx.LATITUDE, idx.LONGITUDE],
            checkboxOnlyRowSelections: true
        });
    },

    toggle: function(behavior) {
        var treeViewOptions = this.checked && { treeColumnName: 'State'};
        behavior.dataModel.sources.treeview.setRelation(treeViewOptions);
        behavior.dataModel.applyAnalytics();
        behavior.shapeChanged();
        return treeViewOptions;
    }
};

/**
 *
 * @param {number} [columnIndex] If given, also checks that the column clicked is the tree column.
 * @returns {boolean} The data source is a tree view.
 */
function test(event) {
    var treeview = this.sources.treeview,
        result = !!(treeview && treeview.viewMakesSense());
    if (result && event) {
        result = event.dataCell.x === treeview.treeColumnIndex;
    }
    return result;
}

module.exports = treeView;
