'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function ColumnSorting() {
    Base.call(this);
    this.alias = 'ColumnSorting';
};

ColumnSorting.prototype = Object.create(Base.prototype);

/**
* @function
* @instance
* @description
 handle this event down the feature chain of responsibility
 * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
 * @param {Object} event - the event details
*/

ColumnSorting.prototype.handleDoubleClick = function(grid, event) {
    var gridCell = event.gridCell;
    if (grid.isShowHeaderRow() && gridCell.y === 0 && gridCell.x !== -1) {
        var keys = event.primitiveEvent.detail.keys;
        grid.toggleSort(gridCell.x, keys);
    } else if (this.next) {
        this.next.handleDoubleClick(grid, event);
    }
};

/**
* @function
* @instance
* @description
handle this event down the feature chain of responsibility
* @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
* @param {Object} event - the event details
*/
ColumnSorting.prototype.handleMouseMove = function(grid, event) {
    var y = event.gridCell.y;
    if (this.isFixedRow(grid, event) && y < 1) {
        this.cursor = 'pointer';
    } else {
        this.cursor = null;
    }
    if (this.next) {
        this.next.handleMouseMove(grid, event);
    }
};


module.exports = ColumnSorting;
