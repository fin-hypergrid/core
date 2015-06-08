'use strict';
/**
 *
 * @module features\base
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        next: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        detached: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        cursor: null,

        /**
         * @property {type} varname - description
         * @instance
         */
        currentHoverCell: null,

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        created: function() {
            this.createdInit();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        createdInit: function() {},

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setNext: function(nextFeature) {
            if (this.next) {
                this.next.setNext(nextFeature);
            } else {
                this.next = nextFeature;
                this.detached = nextFeature;
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
        detachChain: function() {
            this.next = null;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        attachChain: function() {
            this.next = this.detached;
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
            if (this.next) {
                this.next.handleMouseMove(grid, event);
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
        handleMouseExit: function(grid, event) {
            if (this.next) {
                this.next.handleMouseExit(grid, event);
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
        handleMouseEnter: function(grid, event) {
            if (this.next) {
                this.next.handleMouseEnter(grid, event);
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
        handleMouseDown: function(grid, event) {
            if (this.next) {
                this.next.handleMouseDown(grid, event);
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
        handleMouseUp: function(grid, event) {
            if (this.next) {
                this.next.handleMouseUp(grid, event);
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
        handleKeyDown: function(grid, event) {
            if (this.next) {
                this.next.handleKeyDown(grid, event);
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
        handleKeyUp: function(grid, event) {
            if (this.next) {
                this.next.handleKeyUp(grid, event);
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
        handleWheelMoved: function(grid, event) {
            if (this.next) {
                this.next.handleWheelMoved(grid, event);
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
        handleDoubleClick: function(grid, event) {
            if (this.next) {
                this.next.handleDoubleClick(grid, event);
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
        handleHoldPulse: function(grid, event) {
            if (this.next) {
                this.next.handleHoldPulse(grid, event);
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
        handleTap: function(grid, event) {
            if (this.next) {
                this.next.handleTap(grid, event);
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
        handleMouseDrag: function(grid, event) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
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
        isFixedRow: function(grid, event) {
            var gridCell = event.gridCell;
            var isFixed = gridCell.y < grid.getFixedRowCount();
            return isFixed;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        isFixedColumn: function(grid, event) {
            var gridCell = event.gridCell;
            var isFixed = gridCell.x < grid.getFixedColumnCount();
            return isFixed;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        isTopLeft: function(grid, event) {
            var isTopLeft = this.isFixedRow(grid, event) && this.isFixedColumn(grid, event);
            return isTopLeft;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setCursor: function(grid) {
            if (this.next) {
                this.next.setCursor(grid);
            }
            if (this.cursor) {
                grid.beCursor(this.cursor);
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
        initializeOn: function(grid) {
            if (this.next) {
                this.next.initializeOn(grid);
            }
        }

    });

})(); /* jshint ignore:line */
