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
        handleTap: function(grid, event) {
            var behavior = grid.getBehavior();
            var gridCell = event.gridCell;
            var inHeaderRowArea = gridCell.y < behavior.getHeaderRowCount();
            var inHeaderColumnArea = gridCell.x < behavior.getHeaderColumnCount();

            if (inHeaderRowArea && inHeaderColumnArea) {
                grid.topLeftClicked(event);
            } else if (inHeaderRowArea) {
                grid.headerRowClicked(event);
            } else if (inHeaderColumnArea) {
                grid.headerColumnClicked(event);
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
            if (this.isFixedRow(grid, event) && !this.isFixedColumn(grid, event) && y < 1) {
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
