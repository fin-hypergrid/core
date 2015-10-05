'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-base', { /* jshint ignore:line  */

        grid: null,

        setGrid: function(newGrid) {
            this.grid = newGrid;
        },
        getGrid: function() {
            return this.grid;
        },
        getBehavior: function() {
            return this.getGrid().getBehavior();
        },
        getCellProvider: function() {
            return this.getGrid().getCellProvider();
        },
        changed: function() {
            this.getBehavior().changed();
        },
        getPrivateState: function() {
            return this.getGrid().getPrivateState();
        },
        setState: function( /* state */ ) {

        },
        applyState: function() {

        }
    });

})();
