'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * Renders a tree cell (presumably in the tree column).
 * @constructor
 * @extends CellRenderer
 */
var TreeCell = CellRenderer.extend('TreeCell', {
    paint: function(gc, config) {
        var x = config.bounds.x,
            y = config.bounds.y,
            val = config.value.data,
            indent = config.value.indent,
            icon = config.value.icon;

        // Fill background only if our bgColor is populated or we are a selected cell.
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;
            gc.fillRect(x, y, config.bounds.width, config.bounds.height);
        }

        if (!val || !val.length) {
            return;
        }

        gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;

        var valignOffset = Math.ceil(config.bounds.height / 2);
        gc.fillText(icon + val, x + indent, y + valignOffset);

        config.minWidth = x + indent + gc.getTextWidth(icon + val) + 10;
    }
});

module.exports = TreeCell;
