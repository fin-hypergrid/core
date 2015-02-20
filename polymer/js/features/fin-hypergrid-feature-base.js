(function() {

    'use strict';

    Polymer({ /* jshint ignore:line */

        next: null,
        detached: null,
        cursor: null,

        created: function() {
            this.createdInit();
        },

        createdInit: function() {},

        setNext: function(nextFeature) {
            if (this.next) {
                this.next.setNext(nextFeature);
            } else {
                this.next = nextFeature;
                this.detached = nextFeature;
            }
        },

        detachChain: function() {
            this.next = null;
        },

        attachChain: function() {
            this.next = this.detached;
        },

        handleMouseMove: function(grid, event) {
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
        },

        handleMouseDown: function(grid, event) {
            if (this.next) {
                this.next.handleMouseDown(grid, event);
            }
        },

        handleMouseUp: function(grid, event) {
            if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },

        handleKeyDown: function(grid, event) {
            if (this.next) {
                this.next.handleKeyDown(grid, event);
            }
        },

        handleKeyUp: function(grid, event) {
            if (this.next) {
                this.next.handleKeyUp(grid, event);
            }
        },

        handleWheelMoved: function(grid, event) {
            if (this.next) {
                this.next.handleWheelMoved(grid, event);
            }
        },

        handleDoubleClick: function(grid, event) {
            if (this.next) {
                this.next.handleDoubleClick(grid, event);
            }
        },

        handleHoldPulse: function(grid, event) {
            if (this.next) {
                this.next.handleHoldPulse(grid, event);
            }
        },

        handleTap: function(grid, event) {
            if (this.next) {
                this.next.handleTap(grid, event);
            }
        },

        handleMouseDrag: function(grid, event) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
        },

        isFixedRow: function(grid, event) {
            var gridCell = event.gridCell;
            var isFixed = gridCell.y < grid.getFixedRowCount();
            return isFixed;
        },

        isFixedColumn: function(grid, event) {
            var gridCell = event.gridCell;
            var isFixed = gridCell.x < grid.getFixedColumnCount();
            return isFixed;
        },
        setCursor: function(grid) {
            if (this.next) {
                this.next.setCursor(grid);
            }
            if (this.cursor) {
                grid.beCursor(this.cursor);
            }
        },
        initializeOn: function(grid) {
            if (this.next) {
                this.next.initializeOn(grid);
            }
        }

    });

})(); /* jshint ignore:line */
