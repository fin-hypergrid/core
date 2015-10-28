'use strict';
/**
 *
 * @module features\base
 * @description
 instances of features are connected to one another to make a chain of responsibility for handling all the input to the hypergrid.
 *
 */

var Base = require('./Base.js');

function Filters() {
    Base.call(this);
    this.alias = 'Filters';
};

Filters.prototype = Object.create(Base.prototype);

        Filters.prototype.handleTap = function(grid, event) {
            var gridCell = event.gridCell;
            if (grid.isFilterRow(gridCell.y) && gridCell.x !== -1) {
                grid.filterClicked(event);
            } else if (this.next) {
                this.next.handleTap(grid, event);
            }
        };

module.exports = Filters;
