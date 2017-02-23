'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    /**
     * Navigate away from the filter cell when:
     * 1. Coming from a cell editor (`event.detail.editor` defined).
     * 2. The cell editor was for a filter cell.
     * 3. The key (`event.detail.char) maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     *    * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     *    * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     *    * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    handleKeyDown: function(grid, event) {
        var cellEvent, mappedNavKey, handler,
            detail = event.detail;

        if (detail.editor) {
            cellEvent = detail.editor.event;
            if (cellEvent.isFilterCell) {
                mappedNavKey = cellEvent.properties.mappedNavKey(detail.char);
                handler = this['handle' + mappedNavKey];
            }
        }

        if (handler) {
            handler.call(this, grid, detail);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    handleLEFT: function(grid, detail) { moveLaterally(grid, detail, -1); },
    handleRIGHT: function(grid, detail) { moveLaterally(grid, detail, +1); },
    handleUP: moveDown,
    handleDOWN: moveDown,

    handleDoubleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleDoubleClick(grid, event);
        }
    },

    handleClick: function(grid, event) {
        if (event.isFilterCell) {
            grid.onEditorActivate(event);
        } else if (this.next) {
            this.next.handleClick(grid, event);
        }
    }

});

function moveLaterally(grid, detail, deltaX) {
    var cellEvent = detail.editor.event,
        gridX = cellEvent.visibleColumn.index,
        gridY = cellEvent.visibleRow.index,
        originX = gridX,
        C = grid.renderer.visibleColumns.length;

    cellEvent = new grid.behavior.CellEvent; // redefine so we don't reset the original below

    while (
        (gridX = (gridX + deltaX + C) % C) !== originX &&
        cellEvent.resetGridXY(gridX, gridY)
    ) {
        if (cellEvent.properties.filterable) {
            // Select previous or next filterable column's filter cell
            grid.editAt(cellEvent);
            return;
        }
    }

    moveDown(grid, cellEvent);
}

function moveDown(grid, detail) {
    var cellEvent = detail.editor.event,
        gridX = cellEvent.visibleColumn.index;

    // Select first visible grid cell of this column
    grid.selectViewportCell(gridX, 0);
    grid.takeFocus();
}

module.exports = Filters;
