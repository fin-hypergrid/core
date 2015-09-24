/* global fin */
'use strict';

/**
 *
 * @module .\selection-model
 * @description
 We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains.  This is how we know to highlight the fixed regions on the edges of the grid.
 */

(function() {

    Polymer({ /* jslint ignore:line */

        /**
         *
         * @property {fin-rectangle} rectangles - a [fin-rectangle](https://github.com/stevewirts/fin-rectangle) factory object
         * @instance
         */
        rectangles: null,

        /**
         *
         * @property {Array} selections - an array containing the selection rectangles
         * @instance
         */
        selections: null,

        /**
         *
         * @property {Array} flattenedX - an array containing the selection rectangles flattend in the x dimension
         * @instance
         */
        flattenedX: null,

        /**
         *
         * @property {Array} flattenedY - an array containing the selection rectangles flattend in the y dimension
         * @instance
         */
        flattenedY: null,

        rowSelectionModel: null,

        columnSelectionModel: null,

        /**
         * @function
         * @instance
         * @description
        a Polymer web-component life cycle event
         *
         */
        ready: function() {
            this.rectangles = document.createElement('fin-rectangle');
            this.selections = [];
            this.flattenedX = [];
            this.flattenedY = [];
            this.rowSelectionModel = new fin.RangeSelectionModel();
            this.columnSelectionModel = new fin.RangeSelectionModel();
        },

        /**
         * @function
         * @instance
         * @description
        getter for the [fin-hypergrid](module-._fin-hypergrid.html)
         * #### returns: fin-hypergrid
         */
        getGrid: function() {
            return null;
        },

        /**
         * @function
         * @instance
         * @description
        select a region given an origin x,y and extent x,y
         *
         * @param {integer} ox - origin x coordinate
         * @param {integer} oy - origin y coordinate
         * @param {integer} ex - extent x coordinate
         * @param {integer} ey - extent y coordinate
         */
        select: function(ox, oy, ex, ey) {
            var newSelection = this.rectangles.rectangle.create(ox, oy, ex, ey);
            this.selections.push(newSelection);
            this.flattenedX.push(newSelection.flattenXAt(0));
            this.flattenedY.push(newSelection.flattenYAt(0));
            this.getGrid().selectionChanged();
        },

        toggleSelect: function(ox, oy, ex, ey) {

            var selections = this.getSelections();

            for (var i = 0; i < selections.length; i++) {
                var each = selections[i];
                if (each.origin.x === ox && each.origin.y === oy && each.extent.x === ex && each.extent.y === ey) {
                    selections.splice(i, 1);
                    this.flattenedX.splice(i, 1);
                    this.flattenedY.splice(i, 1);
                    this.getGrid().selectionChanged();
                    return;
                }
            }

            this.select(ox, oy, ex, ey);

        },

        /**
         * @function
         * @instance
         * @description
        remove the last selection that was created
         */
        clearMostRecentSelection: function() {
            this.selections.length = Math.max(0, this.selections.length - 1);
            this.flattenedX.length = Math.max(0, this.flattenedX.length - 1);
            this.flattenedY.length = Math.max(0, this.flattenedY.length - 1);
            //this.getGrid().selectionChanged();
        },

        clearMostRecentColumnSelection: function() {
            this.columnSelectionModel.clearMostRecentSelection();
        },

        clearMostRecentRowSelection: function() {
            this.rowSelectionModel.clearMostRecentSelection();
        },

        getSelections: function() {
            return this.selections;
        },

        /**
         * @function
         * @instance
         * @description
        answer if I have any selections
         *
         * #### returns: boolean
         */
        hasSelections: function() {
            return this.selections.length !== 0;
        },

        /**
         * @function
         * @instance
         * @description
        answer coordinate x, y is selected
         * #### returns: boolean
         * @param {integer} x - column index
         * @param {integer} y - row index
         */
        isSelected: function(x, y) {
            return this._isSelected(this.selections, x, y);
        },

        /**
         * @function
         * @instance
         * @description
        answer if we have a selection covering a specific column
         * #### returns: boolean
         * @param {integer} col - column index
         */
        isRowHeaderCellSelected: function(col) {
            return this._isSelected(this.flattenedY, col, 0);
        },

        /**
         * @function
         * @instance
         * @description
        answer if we have a selection covering a specific row
         * #### returns: boolean
         * @param {integer} row - row index
         */
        isColumnHeaderCellSelected: function(row) {
            return this._isSelected(this.flattenedX, 0, row);
        },

        /**
         * @function
         * @instance
         * @description
        general selection query function
         *
         * @param {Array} selections - array of selection rectangles to search through
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _isSelected: function(selections, x, y) {
            if (this.isColumnSelected(x) || this.isRowSelected(y)) {
                return true;
            }
            for (var i = 0; i < selections.length; i++) {
                var each = selections[i];
                if (this.rectangles.rectangle.contains(each, x, y)) {
                    return true;
                }
            }
            return false;
        },

        /**
         * @function
         * @instance
         * @description
        empty out all our state
         *
         */
        clear: function() {
            this.selections.length = 0;
            this.flattenedX.length = 0;
            this.flattenedY.length = 0;
            this.rowSelectionModel.clear();
            this.columnSelectionModel.clear();
            //this.getGrid().selectionChanged();
        },

        isRectangleSelected: function(ox, oy, ex, ey) {
            var selections = this.getSelections();
            for (var i = 0; i < selections.length; i++) {
                var each = selections[i];
                if (each.origin.x === ox && each.origin.y === oy && each.extent.x === ex && each.extent.y === ey) {
                    return true;
                }
            }
            return false;
        },

        isColumnSelected: function(x) {
            return this.columnSelectionModel.isSelected(x);
        },

        isRowSelected: function(y) {
            return this.rowSelectionModel.isSelected(y);
        },

        selectColumn: function(x1, x2) {
            this.columnSelectionModel.select(x1, x2);
        },

        selectRow: function(y1, y2) {
            this.rowSelectionModel.select(y1, y2);
        },

        deselectColumn: function(x1, x2) {
            this.columnSelectionModel.deselect(x1, x2);
        },

        deselectRow: function(y1, y2) {
            this.rowSelectionModel.deselect(y1, y2);
        },

        getSelectedRows: function() {
            return this.rowSelectionModel.getSelections();
        },

        getSelectedColumns: function() {
            return this.columnSelectionModel.getSelections();
        },

        isColumnOrRowSelected: function() {
            return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
        },
        getFlattenedYs: function() {
            var result = [];
            var set = {};
            for (var i = 0; i < this.selections.length; i++) {
                var each = this.selections[i];
                var top = each.origin.y;
                var size = each.extent.y + 1;
                for (var r = 0; r < size; r++) {
                    var ti = r + top;
                    if (!set[ti]) {
                        result.push(ti);
                        set[ti] = true;
                    }
                }

            }
            result.sort(function(x, y) {
                return x - y;
            });
            return result;
        }


    });

})(); /* jslint ignore:line */
