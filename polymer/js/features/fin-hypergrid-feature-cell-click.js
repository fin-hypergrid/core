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
            var fixedRowsHeight = grid.getFixedRowsHeight();
            var fixedColsWidth = grid.getFixedColumnsWidth();
            if ((event.primitiveEvent.detail.mouse.y > fixedRowsHeight) &&
                (event.primitiveEvent.detail.mouse.x > fixedColsWidth)) {
                grid.cellClicked(event);
            } else if (this.next) {
                this.next.handleTap(grid, event);
            }
        }
    });

})();
