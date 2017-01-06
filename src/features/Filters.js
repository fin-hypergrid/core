'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 */
var Filters = Feature.extend('Filters', {

    /**
     * Navigate away from the filter cell if the key maps (through {@link module:defaults.navKeyMap|navKeyMap}) to one of:
     * * `'UP'` or `'DOWN'` - Selects first visible data cell under filter cell.
     * * `'LEFT'` - Opens filter cell editor in previous filterable column; if nonesuch, selects first visible data cell under filter cell.
     * * `'RIGHT'` - Opens filter cell editor in next filterable column; if nonesuch, selects first visible data cell under filter cell.
     */
    handleKeyDown: function(grid, event) {
        var editor = event.detail.editor;

        if (editor) {
            var keyChar = grid.canvas.getKeyChar(event),
                originX = editor.event.visibleColumn.index,
                gridX, gridY = editor.event.visibleRow.index,
                cellEvent = new grid.behavior.CellEvent,
                visibleColumnCount = grid.renderer.visibleColumns.length;

            switch (editor.event.properties.mappedNavKey(keyChar)) {
                case 'LEFT':
                    // Select next filterable column's filter cell
                    for (
                        gridX = wrap(originX - 1);
                        gridX !== originX && cellEvent.resetGridXY(gridX, gridY);
                        gridX = wrap(gridX - 1)
                    ) {
                        if (cellEvent.properties.filterable) {
                            grid.editAt(cellEvent);
                            return;
                        }
                    }
                    break;

                case 'RIGHT':
                    // Select previous filterable column's filter cell
                    for (
                        gridX = wrap(originX + 1);
                        gridX !== originX && cellEvent.resetGridXY(gridX, gridY);
                        gridX = wrap(gridX + 1)
                    ) {
                        if (cellEvent.properties.filterable) {
                            grid.editAt(cellEvent);
                            return;
                        }
                    }
                    break;
            }

            // Select first visible grid cell of this column
            gridX = editor.event.visibleColumn.columnIndex;
            grid.selectCell(gridX, 0, true);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }

        function wrap(n) {
            return (n + visibleColumnCount) % visibleColumnCount;
        }
    },

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

module.exports = Filters;
