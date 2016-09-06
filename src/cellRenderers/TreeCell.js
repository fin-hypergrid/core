'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @extends CellRenderer
 */
var TreeCell = CellRenderer.extend('TreeCell', {

    /**
     * @desc A simple implementation of a tree cell renderer for use mainly with the qtree.
     * @implements paintFunction
     * @memberOf TreeCell.prototype
     */
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            width = config.bounds.width,
            height = config.bounds.height;

        var val = config.value.data;
        var indent = config.value.indent;
        var icon = config.value.icon;

        //fill background only if our bgColor is populated or we are a selected cell
        if (config.backgroundColor || config.isSelected) {
            gc.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;
            gc.fillRect(x, y, width, height);
        }

        if (!val || !val.length) {
            return;
        }
        var valignOffset = Math.ceil(height / 2);

        gc.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;
        gc.fillText(icon + val, x + indent, y + valignOffset);

        var textWidth = config.getTextWidth(gc, icon + val);
        var minWidth = x + indent + textWidth + 10;
        config.minWidth = minWidth;
    }
});

module.exports = TreeCell;
