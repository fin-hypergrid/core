'use strict';

var Point = require('rectangular').Point;
var RangeSelectionModel = require('sparse-boolean-array');

/**
 *
 * @module .\selection-model
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

function SelectionModel() {

    /**
     * @name selections
     * @type {Rectangle[]}
     * @summary The selection rectangles.
     * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
     * @memberOf SelectionModel.prototype
     */
    this.selections = [];

    /**
     * @name flattenedX
     * @type {Rectangle[]}
     * @summary The selection rectangles flattened in the horizontal direction (no width).
     * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
     * @memberOf SelectionModel.prototype
     */
    this.flattenedX = [];

    /**
     * @name flattenedY
     * @type {Rectangle[]}
     * @summary The selection rectangles flattened in the vertical direction (no height).
     * @desc Created as an empty array upon instantiation by the {@link SelectionModel|constructor}.
     * @memberOf SelectionModel.prototype
     */
    this.flattenedY = [];

    /**
     * @name rowSelectionModel
     * @type {RangeSelectionModel}
     * @summary The selection rectangles.
     * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
     * @memberOf SelectionModel.prototype
     */
    this.rowSelectionModel = new RangeSelectionModel();

    /**
     * @name columnSelectionModel
     * @type {RangeSelectionModel}
     * @summary The selection rectangles.
     * @desc Created as a new RangeSelectionModel upon instantiation by the {@link SelectionModel|constructor}.
     * @memberOf SelectionModel.prototype
     */
    this.columnSelectionModel = new RangeSelectionModel();

    this.setLastSelectionType('');
}

SelectionModel.prototype = {

    /**
     * @type {boolean}
     * @memberOf SelectionModel.prototype
     */
    allRowsSelected: false,

    /**
     * @function
     * @instance
     * @desc getter for the [fin-hypergrid](module-._fin-hypergrid.html)
     * #### returns: fin-hypergrid
     */
    getGrid: function() {
        return null;
    },

    getLastSelection: function() {
        var sels = this.selections;
        var sel = sels[sels.length - 1];
        return sel;
    },

    getLastSelectionType: function() {
        return this.lastSelectionType;
    },

    /**
     * @param type
     * @memberOf SelectionModel.prototype
     */
    setLastSelectionType: function(type) {
        this.lastSelectionType = type;
    },

    /**
     * @function
     * @instance
     * @description Select the region described by the given coordinates.
     *
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     */
    select: function(ox, oy, ex, ey) {
        var newSelection = this.getGrid().newRectangle(ox, oy, ex, ey);
        this.selections.push(newSelection);
        this.flattenedX.push(newSelection.flattenXAt(0));
        this.flattenedY.push(newSelection.flattenYAt(0));
        this.setLastSelectionType('cell');
        this.getGrid().selectionChanged();
    },

    toggleSelect: function(ox, oy, ex, ey) {

        var selected, index;

        selected = this.selections.find(function(selection, idx) {
            index = idx;
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });

        if (selected) {
            this.selections.splice(index, 1);
            this.flattenedX.splice(index, 1);
            this.flattenedY.splice(index, 1);
            this.getGrid().selectionChanged();
        } else {
            this.select(ox, oy, ex, ey);
        }
    },

    /**
     * @function
     * @instance
     * @desc remove the last selection that was created
     */
    clearMostRecentSelection: function() {
        this.allRowsSelected = false;
        this.selections.length = Math.max(0, this.selections.length - 1);
        this.flattenedX.length = Math.max(0, this.flattenedX.length - 1);
        this.flattenedY.length = Math.max(0, this.flattenedY.length - 1);
        //this.getGrid().selectionChanged();
    },

    clearMostRecentColumnSelection: function() {
        this.columnSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('column');
    },

    clearMostRecentRowSelection: function() {
        this.rowSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('row');
    },

    clearRowSelection: function() {
        this.rowSelectionModel.clear();
        this.setLastSelectionType('row');
    },

    getSelections: function() {
        return this.selections;
    },

    /**
     * @function
     * @instance
     * @returns {boolean} There are active selection(s).
     */
    hasSelections: function() {
        return this.selections.length !== 0;
    },

    hasRowSelections: function() {
        return !this.rowSelectionModel.isEmpty();
    },

    hasColumnSelections: function() {
        return !this.columnSelectionModel.isEmpty();
    },

    /**
     * @function
     * @instance
     * @desc answer if we have a selection covering a specific column
     * #### returns: boolean
     * @param {number} y
     */
    isCellSelectedInRow: function(y) {
        return this._isCellSelected(this.flattenedX, 0, y);
    },

    /**
     * @function
     * @instance
     * @desc answer if we have a selection covering a specific row
     * #### returns: boolean
     * @param {number} x
     */
    isCellSelectedInColumn: function(x) {
        return this._isCellSelected(this.flattenedY, x, 0);
    },

    /**
     * @function
     * @instance
     * @summary Selection query function.
     * @returns {boolean} The given cell is selected (part of an active selection).
     * @param {Rectangle[]} selections - Selection rectangles to search through.
     * @param {number} x
     * @param {number} y
     */
    isSelected: function(x, y) {
        return (
            this.isColumnSelected(x) ||
            this.isRowSelected(y) ||
            this._isCellSelected(this.selections, x, y)
        );
    },

    isCellSelected: function(x, y) {
        return this._isCellSelected(this.selections, x, y);
    },

    _isCellSelected: function(selections, x, y) {
        var point = new Point(x, y);
        return !!selections.find(function(selection) {
            return selection.contains(point);
        });
    },
    /**
     * @function
     * @instance
     * @desc empty out all our state
     *
     */
    clear: function() {
        this.allRowsSelected = false;
        this.selections.length = 0;
        this.flattenedX.length = 0;
        this.flattenedY.length = 0;
        this.rowSelectionModel.clear();
        this.columnSelectionModel.clear();
        //this.getGrid().selectionChanged();
    },

    isRectangleSelected: function(ox, oy, ex, ey) {
        return !!this.selections.find(function(selection) {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });
    },

    isColumnSelected: function(x) {
        return this.columnSelectionModel.isSelected(x);
    },

    isRowSelected: function(y) {
        return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
    },

    selectColumn: function(x1, x2) {
        this.columnSelectionModel.select(x1, x2);
        this.setLastSelectionType('column');
    },

    selectAllRows: function() {
        this.clear();
        this.allRowsSelected = true;
    },

    areAllRowsSelected: function() {
        return this.allRowsSelected;
    },

    selectRow: function(y1, y2) {
        this.rowSelectionModel.select(y1, y2);
        this.setLastSelectionType('row');
    },

    deselectColumn: function(x1, x2) {
        this.columnSelectionModel.deselect(x1, x2);
        this.setLastSelectionType('column');
    },

    deselectRow: function(y1, y2) {
        this.rowSelectionModel.deselect(y1, y2);
        this.setLastSelectionType('row');
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
        this.selections.forEach(function(selection) {
            var top = selection.origin.y;
            var size = selection.extent.y + 1;
            for (var r = 0; r < size; r++) {
                var ti = r + top;
                if (!set[ti]) {
                    result.push(ti);
                    set[ti] = true;
                }
            }
        });
        result.sort(function(x, y) {
            return x - y;
        });
        return result;
    },

    selectRowsFromCells: function(offset) {
        offset = offset || 0;

        var sm = this.rowSelectionModel;
        this.allRowsSelected = false;
        sm.clear();

        this.selections.forEach(function(selection) {
            var top = selection.origin.y,
                size = selection.extent.y;
            sm.select(top + offset, top + size + offset);
        });
    },

    selectColumnsFromCells: function(offset) {
        offset = offset || 0;

        var sm = this.columnSelectionModel;
        sm.clear();

        this.selections.forEach(function(selection) {
            var left = selection.origin.x;
            var size = selection.extent.x;
            sm.select(left + offset, left + size + offset);
        });
    },

    isInCurrentSelectionRectangle: function(x, y) {
        var last = this.selections[this.selections.length - 1],
            point = new Point(x, y);
        return last && last.contains(point);
    }
};

module.exports = SelectionModel;