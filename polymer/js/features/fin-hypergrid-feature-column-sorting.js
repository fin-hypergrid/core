'use strict';
/**
 *
 * @module features\column-sorting
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
            var gridCell = event.gridCell;
            if (grid.isShowHeaderRow() && gridCell.y === 0 && gridCell.x !== -1) {
                grid.toggleSort(gridCell.x);
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
        handleMouseMove: function(grid, event) {
            var y = event.gridCell.y;
            if (this.isFixedRow(grid, event) && y < 1) {
                this.cursor = 'pointer';
            } else {
                this.cursor = null;
            }
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
        }

    });

})(); /* jshint ignore:line */
