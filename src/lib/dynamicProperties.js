'use strict';

/**
 * @summary Dynamic property getter/setters.
 * @desc ### Backing store
 * Dynamic grid properties can make use of a backing store.
 * This backing store is created in the "own" layer by {@link Hypergrid#clearState|clearState} and backs grid-only properties. We currently do not create one for derived (column and cell) properties objects.
 * The members of the backing store have the same names as the dynamic properties that utilize them.
 * They are initialized by {@link Hypergrid#clearState|clearState} to the default values from {@link module:defaults|defaults} object members (also) of the same name.
 *
 * Note that all dynamic properties must not be enumerable and configurable to protect them from being deleted when a theme is applied.
 *
 * ### Themes
 * This layer is also where themes are applied.
 *
 * Note that {@link Hypergrid#applyTheme} ensures that all thematic members are defined as enumerable and configurable so they can be deleted when a new theme is applied.
 * @name dynamicPropertyDescriptors
 * @module
 */
var dynamicPropertyDescriptors = {
    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    subgrids: {
        get: function() {
            return this.var.subgrids;
        },
        set: function(subgrids) {
            this.grid.behavior.subgrids = this.var.subgrids = subgrids;
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
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
     * @memberOf module:dynamicPropertyDescriptors
     */
    columnIndexes: {
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.index;
            });
        },
        set: function(columnIndexes) {
            this.grid.behavior.setColumnOrder(columnIndexes);
            this.grid.behavior.changed();
        }
    },

    /**
     * @memberOf module:dynamicPropertyDescriptors
     */
    columnNames: {
        get: function() {
            return this.grid.behavior.getActiveColumns().map(function(column) {
                return column.name;
            });
        },
        set: function(columnNames) {
            this.grid.behavior.setColumnOrderByName(columnNames);
            this.grid.behavior.changed();
        }
    }
};

module.exports = dynamicPropertyDescriptors;
