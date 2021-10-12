
var Feature = require('./Feature');

/**
 * @typedef {import("../Hypergrid")} Hypergrid
 */

/**
 * @constructor
 */
// @ts-ignore TODO use classes
var OnHover = Feature.extend('OnHover', {

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf OnHover.prototype
     */
    handleMouseMove: function(grid, event) {
        var hoverCell = grid.hoverCell;
        // VC-5715 this is added for quickly repaint the images incase the button is hovered
        if (event.mousePointInLeftClickRect || event.mousePointInRightClickRect) {
            grid.repaint()
        }
        if (!event.gridCell.equals(hoverCell)) {
            if (hoverCell) {
                this.handleMouseExit(grid, hoverCell);
            }
            this.handleMouseEnter(grid, event);
            grid.setHoverCell(event);
        } else if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    }

});

module.exports = OnHover;
