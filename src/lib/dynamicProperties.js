'use strict';

var defaults = require('../defaults');

/**
 * @summary Dynamic property getter/setters.
 * @desc Dynamic properties can make use of a backing store.
 * This backing store is created in the "own" layer by {@link Hypergrid#clearState|clearState}.
 * The members of the backing store have the same names as the dynamic properties that utilize them.
 * They are initialized by {@link Hypergrid#clearState|clearState} to the default values from {@link module:defaults|defaults} object members (also) of the same name.
 *
 * Note: Because this initialization picks up the values from {@link module:defaults|defaults} when {@link Hypergrid#clearState|clearState} is called, any changes the application developer may wish to make to {@link module:defaults|defaults} should be made _prior to_ any grid instantiations.
 * @name dynamicProperties
 * @module
 */
var dynamicProperties = Object.create(defaults, {
    /**
     * @memberOf module:dynamicProperties
     */
    gridRenderer: {
        get: function() {
            return this.var.gridRenderer;
        },
        set: function(rendererName) {
            this.var.gridRenderer = rendererName;
            this.grid.renderer.setGridRenderer(rendererName);
        }
    },

    /**
     * @memberOf module:dynamicProperties
     */
    columnIndexes: {
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) { return column.index; });
        },
        set: function(columnIndexes) {
            this.grid.behavior.setColumnOrder(columnIndexes);
            this.grid.behavior.changed();
        }
    },
});

module.exports = dynamicProperties;
