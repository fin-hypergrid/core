'use strict';
/**
 *
 * @module features\key-paging
 *
 */
var commands = {
    PAGEDOWN: function(grid) {
        grid.pageDown();
    },
    PAGEUP: function(grid) {
        grid.pageUp();
    },
    PAGELEFT: function(grid) {
        grid.pageLeft();
    },
    PAGERIGHT: function(grid) {
        grid.pageRight();
    }
};

(function() {

    Polymer('fin-hypergrid-feature-key-paging', { /* jshint ignore:line  */

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        handleKeyDown: function(grid, event) {
            var detail = event.detail.char;
            var func = commands[detail];
            if (func) {
                func(grid);
            } else if (this.next) {
                this.next.handleKeyDown(grid, event);
            }
        }
    });
})();
