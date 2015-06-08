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
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleTap: function(grid, event) {
            var gridCell = event.gridCell;
            var inFixedRowArea = gridCell.y < grid.getFixedRowCount();
            var inFixedColumnArea = gridCell.x < grid.getFixedColumnCount();

            if (inFixedRowArea && inFixedColumnArea) {
                grid.topLeftClicked(event);
            } else if (inFixedRowArea) {
                grid.fixedRowClicked(event);
            } else if (inFixedColumnArea) {
                grid.fixedColumnClicked(event);
            }
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseMove: function(grid, event) {
            if (this.isFixedRow(grid, event) && !this.isFixedColumn(grid, event)) {
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
