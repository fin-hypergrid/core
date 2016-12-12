'use strict';

// The getter/setters described in this file are added to each grid's properties object when it is created by Hypergrid.prototype.clearState.

var dynamicProperties = {
    gridRenderer: {
        get: function() {
            return this.cache.gridRenderer;
        },
        set: function(rendererName) {
            this.cache.gridRenderer = rendererName;
            this.grid.renderer.setGridRenderer(rendererName);
        }
    },

    noDataMessage: {
        get: function() {
            return this.cache.noDataMessage;
        },
        set: function(message) {
            this.cache.noDataMessage = message;
            this.grid.setInfo(message);
        }
    },

    columnIndexes: {
        get: function() {
            return this.grid.behavior.columns.map(function(column) { return column.index; });
        },
        set: function(columnIndexes) {
            this.grid.behavior.setColumnOrder(columnIndexes);
            this.grid.behavior.changed();
        }
    },
};

module.exports = dynamicProperties;
