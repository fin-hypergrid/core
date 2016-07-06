'use strict';

var treeview = {
    addDataSourceTo: function(dataModel) {
        // Optional: Clone the default pipeline.
        // If you don't do this, the mutated pipeline will be shared among all grid instances.
        dataModel.pipeline = Object.getPrototypeOf(dataModel).pipeline.slice();

        // Insert the treeview after source
        var pipe = {
            type: 'DataSourceTreeview',
            test: test
        };
        dataModel.addPipe(pipe, 'JSDataSource');
    },

    setData: function(grid, data) {
        var idx = grid.behavior.columnEnum;

        // Reset the pipeline, pointing at some tree (self-joined) data
        grid.behavior.setData(data);

        // Only show the data columns; don't show the ID and parentID columns
        grid.setState({
            columnIndexes: [idx.STATE, idx.LATITUDE, idx.LONGITUDE],
            checkboxOnlyRowSelections: true
        });

        return data;
    },

    toggle: function(behavior, event) {
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

module.exports = treeview;
