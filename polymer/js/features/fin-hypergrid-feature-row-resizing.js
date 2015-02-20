(function() {

    'use strict';

    Polymer({ /* jshint ignore:line */

        dragArea: -1,
        dragStart: -1,
        dragAreaStartingSize: -1,

        getFixedAreaCount: function(grid) {
            return grid.getFixedRowCount();
        },

        getMouseValue: function(event) {
            return event.primitiveEvent.detail.mouse.y;
        },

        getGridCellValue: function(gridCell) {
            return gridCell.x;
        },

        getScrollValue: function(grid) {
            return grid.getVScrollValue();
        },

        getAreaSize: function(grid, index) {
            return grid.getRowHeight(index);
        },

        setAreaSize: function(grid, index, value) {
            grid.setRowHeight(index, value);
        },

        getOtherFixedAreaCount: function(grid) {
            return grid.getFixedColumnCount();
        },

        getFixedAreaSize: function(grid, index) {
            return grid.getFixedRowHeight(index);
        },

        setFixedAreaSize: function(grid, index, value) {
            grid.setFixedRowHeight(index, value);
        },

        overAreaDivider: function(grid, event) {
            return grid.overRowDivider(event);
        },

        isFixedOtherArea: function(grid, event) {
            return this.isFixedColumn(grid, event);
        },

        getCursorName: function() {
            return 'row-resize';
        },
        getPreviousAbsoluteSize: function(grid, index) {
            return grid.getTopSideSize(index);
        },

    });

})(); /* jshint ignore:line */
