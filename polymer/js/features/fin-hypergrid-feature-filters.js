'use strict';

(function() {

    Polymer('fin-hypergrid-feature-filters', { /* jshint ignore:line  */

        handleTap: function(grid, event) {
            var gridCell = event.gridCell;
            if (grid.isFilterRow(gridCell.y) && gridCell.x !== -1) {
                grid.filterClicked(event);
            } else if (this.next) {
                this.next.handleTap(grid, event);
            }
        }

    });

})();
