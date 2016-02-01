'use strict';

var Base = require('../lib/Base');

/**
 * @constructor
 * @desc instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 */
var Feature = Base.extend('Feature', {

    /**
     * the next feature to be given a chance to handle incoming events
     * @type {Feature}
     * @default null
     * @memberOf Feature.prototype
     */
    next: null,

    /**
     * a temporary holding field for my next feature when I'm in a disconnected state
     * @type {Feature}
     * @default null
     * @memberOf Feature.prototype
     */
    detached: null,

    /**
     * the cursor I want to be displayed
     * @type {string}
     * @default null
     * @memberOf Feature.prototype
     */
    cursor: null,

    /**
     * the cell location where the cursor is currently
     * @type {Point}
     * @default null
     * @memberOf Feature.prototype
     */
    currentHoverCell: null,

    /**
     * @memberOf Feature.prototype
     * @desc set my next field, or if it's populated delegate to the feature in my next field
     * @param {Feature} nextFeature - this is how we build the chain of responsibility
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
     * @memberOf Feature.prototype
     * @desc disconnect my child
     */
    detachChain: function() {
        this.next = null;
    },

    /**
     * @memberOf Feature.prototype
     * @desc reattach my child from the detached reference
     */
    attachChain: function() {
        this.next = this.detached;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle mouse move down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseExit: function(grid, event) {
        if (this.next) {
            this.next.handleMouseExit(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseEnter: function(grid, event) {
        if (this.next) {
            this.next.handleMouseEnter(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyUp: function(grid, event) {
        if (this.next) {
            this.next.handleKeyUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleWheelMoved: function(grid, event) {
        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDoubleClick: function(grid, event) {
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleHoldPulse: function(grid, event) {
        if (this.next) {
            this.next.handleHoldPulse(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleTap: function(grid, event) {
        if (this.next) {
            this.next.handleTap(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleContextMenu: function(grid, event) {
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc toggle the column picker
     */

    moveSingleSelect: function(grid, x, y) {
        if (this.next) {
            this.next.moveSingleSelect(grid, x, y);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFixedRow: function(grid, event) {
        var gridCell = event.viewPoint;
        var isFixed = gridCell.y < grid.getFixedRowCount();
        return isFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedRow: function(grid, event) {
        var gridCell = event.viewPoint;
        var isFixed = gridCell.y < 1;
        return isFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFixedColumn: function(grid, event) {
        var gridCell = event.viewPoint;
        var isFixed = gridCell.x < grid.getFixedColumnCount();
        return isFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedColumn: function(grid, event) {
        var gridCell = event.viewPoint;
        var edge = grid.isShowRowNumbers() ? 0 : 1;
        var isFixed = gridCell.x < edge;
        return isFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isTopLeft: function(grid, event) {
        var isTopLeft = this.isFixedRow(grid, event) && this.isFixedColumn(grid, event);
        return isTopLeft;
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
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
     * @memberOf Feature.prototype
     * @desc handle this event down the feature chain of responsibility
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    initializeOn: function(grid) {
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }

});

module.exports = Feature;
