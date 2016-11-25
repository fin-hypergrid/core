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
    }
};

module.exports = dynamicProperties;
