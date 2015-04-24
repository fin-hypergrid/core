'use strict';

(function() {

    Polymer('fin-hypergrid-feature-cell-click', { /* jshint ignore:line  */
        handleTap: function(grid, event) {
            var fixedRowsHeight = grid.getFixedRowsHeight();
            if (event.primitiveEvent.detail.mouse.y > fixedRowsHeight) {
                grid.cellClicked(event);
            } else if (this.next) {
                this.next.handleTap(grid, event);
            }
        }
    });

})();
