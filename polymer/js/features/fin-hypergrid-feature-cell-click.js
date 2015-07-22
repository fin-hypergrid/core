'use strict';
/**
 *
 * @module features\cell-click
 *
 */
(function() {

    Polymer('fin-hypergrid-feature-cell-click', { /* jshint ignore:line  */

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleTap: function(grid, event) {
            var gridCell = event.gridCell;
            var behavior = grid.getBehavior();
            var headerRowCount = behavior.getHeaderRowCount();
            var headerColumnCount = behavior.getHeaderColumnCount();
            if ((gridCell.y > headerRowCount) &&
                (gridCell.x > headerColumnCount)) {
                grid.cellClicked(event);
            } else if (this.next) {
                this.next.handleTap(grid, event);
            }
        }
    });

})();
