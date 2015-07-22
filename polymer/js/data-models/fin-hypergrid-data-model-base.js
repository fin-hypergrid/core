'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-base', { /* jshint ignore:line  */

        grid: null,

        getValue: function(x, y) {
            return x + ', ' + y;
        },

        setValue: function(x, y, value) {
            console.log('setting (' + x + ', ' + 'y) = ' + value);
        },

        getColumnCount: function() {
            return 20;
        },

        getRowCount: function() {
            return 1000;
        },

        setGrid: function(newGrid) {
            this.grid = newGrid;
        },

        getGrid: function() {
            return this.grid;
        },

        getState: function() {
            return this.getGrid().getState();
        },

        getBehavior: function() {
            return this.getGrid().getBehavior();
        },

        getCellProvider: function() {
            return this.getGrid().getCellProvider();
        },

        getImage: function(alias) {
            return this.getBehavior().getImage(alias);
        },

        changed: function() {
            this.getBehavior().changed();
        },

        initColumnIndexes: function(state) {
            this.getBehavior().initColumnIndexes(state);
        },

    });

})();
