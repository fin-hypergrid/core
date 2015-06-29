'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {fin-hypergrid-feature-base} next - the next feature to be given a chance to handle incoming events
         * @instance
         */
        next: null,

        /**
         * @property {fin-hypergrid-feature-base} detached - a temporary holding field for my next feature when I'm in a disconnected state
         * @instance
         */
        detached: null,

        /**
         * @property {string} cursor - the cursor I want to be displayed
         * @instance
         */
        cursor: null,

        /**
         * @property {rectangle.point} currentHoverCell - the cell location where the cursor is currently
         * @instance
         */
        currentHoverCell: null,

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        created: function() {
            this.createdInit();
        },

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        createdInit: function() {},

        /**
        * @function
        * @instance
        * @description
        set my next field, or if it's populated delegate to the feature in my next field
        * @param {fin-hypergrid-feature-base} nextFeature - this is how we build the chain of responsibility
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
        disconnect my child
        */
        detachChain: function() {
            this.next = null;
        },

        /**
        * @function
        * @instance
        * @description
        reattach my child from the detached reference
        */
        attachChain: function() {
            this.next = this.detached;
        },

        /**
        * @function
        * @instance
        * @description
         handle mouse move down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         toggle the column picker
        */

        toggleColumnPicker: function(grid) {
            if (this.next) {
                this.next.toggleColumnPicker(grid);
            }
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        isTopLeft: function(grid, event) {
            var isTopLeft = this.isFixedRow(grid, event) && this.isFixedColumn(grid, event);
            return isTopLeft;
        },

        /**
        * @function
        * @instance
        * @description
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
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
         handle this event down the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
        */
        initializeOn: function(grid) {
            if (this.next) {
                this.next.initializeOn(grid);
            }
        }

    });

})(); /* jshint ignore:line */
