(function() {

    'use strict';

    //var noop = function() {};

    //var ANIMATION_TIME = 200;

    Polymer({ /* jshint ignore:line */
        handleMouseMove: function(grid, event) {
            var currentHoverCell = grid.getHoverCell();
            if (!event.gridCell.equals(currentHoverCell)) {
                if (currentHoverCell) {
                    this.handleMouseExit(grid, currentHoverCell);
                }
                this.handleMouseEnter(grid, event);
                grid.setHoverCell(event.gridCell);
            } else {
                if (this.next) {
                    this.next.handleMouseMove(grid, event);
                }
            }
        },
        handleMouseEnter: function(grid, event) {
            console.log('mouse enter', event);
        },
        handleMouseExit: function(grid, event) {
            console.log('mouse exit', event);
        }
    });

})(); /* jshint ignore:line */
