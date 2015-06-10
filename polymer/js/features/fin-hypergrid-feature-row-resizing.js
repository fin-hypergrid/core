'use strict';
/**
 *
 * @module features\row-resizing
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        dragArea: -1,

        /**
         * @property {type} varname - description
         * @instance
         */
        dragStart: -1,

        /**
         * @property {type} varname - description
         * @instance
         */
        dragAreaStartingSize: -1,

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        getFixedAreaCount: function(grid) {
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
        getMouseValue: function(event) {
            return event.primitiveEvent.detail.mouse.y;
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
            return gridCell.x;
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
            return grid.getVScrollValue();
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
            return grid.getRowHeight(index);
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
            grid.setRowHeight(index, value);
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
        getFixedAreaSize: function(grid, index) {
            return grid.getFixedRowHeight(index);
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
            grid.setFixedRowHeight(index, value);
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
            return grid.overRowDivider(event);
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
            return this.isFixedColumn(grid, event);
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
            return 'row-resize';
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
            return grid.getRenderedHeight(index);
        },

    });

})(); /* jshint ignore:line */
