'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 */
var TreeCell = CellRenderer.extend('TreeCell', {

    /**
     * @desc A simple implementation of a tree cell renderer for use mainly with the qtree.
     * @param {CanvasGraphicsContext} gc
     * @param {number} config.bounds.x - the x screen coordinate of my origin
     * @param {number} config.bounds.y - the y screen coordinate of my origin
     * @param {number} config.bounds.width - the width I'm allowed to draw within
     * @param {number} config.bounds.height - the height I'm allowed to draw within
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        var val = this.config.value.data;
        var indent = this.config.value.indent;
        var icon = this.config.value.icon;

        //fill background only if our bgColor is populated or we are a selected cell
        if (this.config.backgroundColor || this.config.isSelected) {
            gc.fillStyle = this.config.isSelected ? this.config.backgroundColor : this.config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }

        if (!val || !val.length) {
            return;
        }
        var valignOffset = Math.ceil(height / 2);

        gc.fillStyle = this.config.isSelected ? this.config.backgroundColor : this.config.backgroundColor;
        gc.fillText(icon + val, x + indent, y + valignOffset);

        var textWidth = this.config.getTextWidth(gc, icon + val);
        var minWidth = x + indent + textWidth + 10;
        this.config.minWidth = minWidth;
    }
});

module.exports = TreeCell;
