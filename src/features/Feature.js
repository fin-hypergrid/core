'use strict';

var Base = require('../Base');

/**
 * Instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 * @constructor
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
     * @private Not really private but was cluttering up all the feature doc pages.
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
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseMove: function(grid, event) {
        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseExit: function(grid, event) {
        if (this.next) {
            this.next.handleMouseExit(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseEnter: function(grid, event) {
        if (this.next) {
            this.next.handleMouseEnter(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseDown: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseUp: function(grid, event) {
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleKeyDown: function(grid, event) {
        if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleKeyUp: function(grid, event) {
        if (this.next) {
            this.next.handleKeyUp(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleWheelMoved: function(grid, event) {
        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleDoubleClick: function(grid, event) {
        if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleClick: function(grid, event) {
        if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleMouseDrag: function(grid, event) {
        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    handleContextMenu: function(grid, event) {
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc toggle the column picker
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    moveSingleSelect: function(grid, x, y) {
        if (this.next) {
            this.next.moveSingleSelect(grid, x, y);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFixedRow: function(grid, event) {
        this.deprecated('isFixedRow', 'isFixedRow(grid, event) has been deprecated as of v1.2.0 in favor of event.isRowFixed. (Will be removed in a future version.)');
        return event.isRowFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedRow: function(grid, event) {
        return event.gridCell.y < 1;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFixedColumn: function(grid, event) {
        this.deprecated('isFixedColumn', 'isFixedColumn(grid, event) has been deprecated as of v1.2.0 in favor of event.isColumnFixed. (Will be removed in a future version.)');
        return event.isColumnFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isFirstFixedColumn: function(grid, event) {
        return event.gridCell.x === 0;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    isTopLeft: function(grid, event) {
        this.deprecated('isTopLeft', 'isTopLeft(grid, event) has been deprecated as of v1.2.0 in favor of event.isCellFixed. (Will be removed in a future version.)');
        return event.isCellFixed;
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
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
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private Not really private but was cluttering up all the feature doc pages.
     */
    initializeOn: function(grid) {
        if (this.next) {
            this.next.initializeOn(grid);
        }
    }

});

module.exports = Feature;
