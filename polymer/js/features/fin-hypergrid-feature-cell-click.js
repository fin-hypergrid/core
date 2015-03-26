'use strict';

(function() {

    Polymer('fin-hypergrid-feature-cell-click', { /* jshint ignore:line  */
        handleTap: function(grid, event) {
            grid.fireCellClickEvent(event);
            if (this.next) {
                this.next.handleTap(grid, event);
            }
        }
    });

})();
