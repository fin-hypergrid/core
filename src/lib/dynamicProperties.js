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
    }
};

module.exports = dynamicProperties;
