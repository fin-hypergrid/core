'use strict';
/**
 *
 * @module features\column-resizing
 *
 */
(function() {

    //var noop = function() {};

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        dragIndex: -1,

        /**
         * @property {type} varname - description
         * @instance
         */
        dragStart: -1,

        /**
         * @property {type} varname - description
         * @instance
         */
        dragIndexStartingSize: -1,

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFixedAreaCount: function(grid) {
            return grid.getFixedColumnCount();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getMouseValue: function(event) {
            return event.primitiveEvent.detail.mouse.x;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getGridCellValue: function(gridCell) {
            return gridCell.y;
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getScrollValue: function(grid) {
            return grid.getHScrollValue();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getAreaSize: function(grid, index) {
            return grid.getColumnWidth(index);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setAreaSize: function(grid, index, value) {
            grid.setColumnWidth(index, value);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getOtherFixedAreaCount: function(grid) {
            return grid.getFixedRowCount();
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFixedAreaSize: function(grid, index) {
            return grid.getFixedColumnWidth(index);
        },
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getPreviousAbsoluteSize: function(grid, index) {
            return grid.getRenderedWidth(index);
        },
        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setFixedAreaSize: function(grid, index, value) {
            grid.setFixedColumnWidth(index, value);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        overAreaDivider: function(grid, event) {
            return grid.overColumnDivider(event);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        isFixedOtherArea: function(grid, event) {
            return this.isFixedRow(grid, event);
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getCursorName: function() {
            return 'col-resize';
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        setSize: function(grid, areaIndex, size) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            var scrollValue = this.getScrollValue(grid);
            if (areaIndex < fixedAreaCount) {
                this.setFixedAreaSize(grid, areaIndex, size);
            } else {
                this.setAreaSize(grid, areaIndex - fixedAreaCount + scrollValue, size);
            }
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getSize: function(grid, areaIndex) {
            var fixedAreaCount = this.getFixedAreaCount(grid);
            if (areaIndex < 0) {
                return this.getFixedAreaSize(grid, fixedAreaCount + areaIndex);
            } else {
                return this.getAreaSize(grid, areaIndex);
            }
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        handleMouseUp: function(grid, event) {
            if (this.dragIndex > -1) {
                this.cursor = null;
                this.dragIndex = -1;

                event.primitiveEvent.stopPropagation();
                //delay here to give other events a chance to be dropped
                var self = this;
                setTimeout(function() {
                    self.attachChain();
                }, 200);
            } else if (this.next) {
                this.next.handleMouseUp(grid, event);
            }
        },

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
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
