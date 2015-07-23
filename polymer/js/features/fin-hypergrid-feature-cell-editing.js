'use strict';
/**
 *
 * @module features\cell-editing
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleDoubleClick: function(grid, event) {
            var behavior = grid.getBehavior();
            var headerRowCount = behavior.getHeaderRowCount();
            var headerColumnCount = behavior.getHeaderColumnCount();
            var gridCell = event.gridCell;
            if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
                grid._activateEditor(event);
            } else if (this.next) {
                this.next.handleDoubleClick(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleHoldPulse: function(grid, event) {
            var behavior = grid.getBehavior();
            var headerRowCount = behavior.getHeaderRowCount();
            var headerColumnCount = behavior.getHeaderColumnCount();
            var gridCell = event.gridCell;
            if (gridCell.x >= headerColumnCount && gridCell.y >= headerRowCount) {
                grid._activateEditor(event);
            } else if (this.next) {
                this.next.handleHoldPulse(grid, event);
            }
        },
    });

})(); /* jshint ignore:line */
