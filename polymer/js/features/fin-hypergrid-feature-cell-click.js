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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
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
