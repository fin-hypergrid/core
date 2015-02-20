(function() {

    'use strict';

    //var noop = function() {};

    Polymer({ /* jshint ignore:line */

        dragIndex: -1,
        dragStart: -1,
        dragIndexStartingSize: -1,

        getFixedAreaCount: function(grid) {
            return grid.getFixedColumnCount();
        },

        getMouseValue: function(event) {
            return event.primitiveEvent.detail.mouse.x;
        },

        getGridCellValue: function(gridCell) {
            return gridCell.y;
        },

        getScrollValue: function(grid) {
            return grid.getHScrollValue();
        },

        getAreaSize: function(grid, index) {
            return grid.getColumnWidth(index);
        },

        setAreaSize: function(grid, index, value) {
            grid.setColumnWidth(index, value);
        },

        getOtherFixedAreaCount: function(grid) {
            return grid.getFixedRowCount();
        },

        getFixedAreaSize: function(grid, index) {
            return grid.getFixedColumnWidth(index);
        },
        getPreviousAbsoluteSize: function(grid, index) {
            return grid.getLeftSideSize(index);
        },
        setFixedAreaSize: function(grid, index, value) {
            grid.setFixedColumnWidth(index, value);
        },

        overAreaDivider: function(grid, event) {
            return grid.overColumnDivider(event);
        },

        isFixedOtherArea: function(grid, event) {
            return this.isFixedRow(grid, event);
        },

        getCursorName: function() {
            return 'col-resize';
        },

        handleMouseDrag: function(grid, event) {
            if (this.dragIndex > -1) {
                //var fixedAreaCount = this.getFixedAreaCount(grid);
                //var offset = this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
                var distance = this.getMouseValue(event) - this.getPreviousAbsoluteSize(grid, this.dragIndex);
                this.setSize(grid, this.dragIndex, distance);
            } else if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
        },

        setSize: function(grid, areaIndex, size) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            var scrollValue = this.getScrollValue(grid);
            if (areaIndex < fixedAreaCount) {
                this.setFixedAreaSize(grid, areaIndex, size);
            } else {
                this.setAreaSize(grid, areaIndex - fixedAreaCount + scrollValue, size);
            }
        },

        getSize: function(grid, areaIndex) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            if (areaIndex < 0) {
                return this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
            } else {
                return this.getAreaSize(grid, areaIndex);
            }
        },

        handleMouseDown: function(grid, event) {
            var gridCell = event.gridCell;
            var overArea = this.overAreaDivider(grid, event);
            if (overArea > -1 && this.getGridCellValue(gridCell) < this.getOtherFixedAreaCount(grid)) {
                var scrollValue = this.getScrollValue(grid);
                var fixedAreaCount = this.getFixedAreaCount(grid);
                this.dragIndex = overArea - 1;
                this.dragStart = this.getMouseValue(event);
                if (overArea < fixedAreaCount) {
                    scrollValue = 0;
                }
                this.dragIndexStartingSize = this.getAreaSize(grid, overArea - fixedAreaCount + scrollValue);
                this.detachChain();
            } else if (this.next) {
                this.next.handleMouseDown(grid, event);
            }
        },

        handleMouseUp: function(grid, event) {
            if (this.dragIndex > -1) {
                this.cursor = null;
                this.dragIndex = -1;

                //delay here to give other events a chance to be dropped
                var self = this;
                setTimeout(function() {
                    self.attachChain();
                }, 200);
            } else if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },

        handleMouseMove: function(grid, event) {
            if (this.dragIndex > -1) {
                return;
            }
            this.cursor = null;
            if (this.next) {
                this.next.handleMouseMove(grid, event);
            }
            this.checkForAreaResizeCursorChange(grid, event);
        },

        checkForAreaResizeCursorChange: function(grid, event) {

            //var gridCell = event.gridCell;

            if (this.isFixedOtherArea(grid, event) && this.overAreaDivider(grid, event) > -1) {
                this.cursor = this.getCursorName();
            } else {
                this.cursor = null;
            }

        },
    });

})(); /* jshint ignore:line */
