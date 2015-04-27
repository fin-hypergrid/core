'use strict';

(function() {

    Polymer('fin-hypergrid-feature-column-autosizing', { /* jshint ignore:line  */
        handleDoubleClick: function(grid, event) {
            var fixedRowCount = grid.getFixedRowCount();
            var fixedColCount = grid.getFixedColumnCount();
            var gridCell = event.gridCell;
            if (gridCell.y <= fixedRowCount) {
                var col = grid.getHScrollValue() + gridCell.x - fixedColCount;
                grid.autosizeColumn(col);
            } else if (this.next) {
                this.next.handleDoubleClick(grid, event);
            }
        }
    });

})(); /* jshint ignore:line */
