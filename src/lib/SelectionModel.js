'use strict';

var RangeSelectionModel = require('sparse-boolean-array');

/**
 *
 * @constructor
 * @desc We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains. This is how we know to highlight the fixed regions on the edges of the grid.
 */

function SelectionModel(grid) {

    this.grid = grid;

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

    constructor: SelectionModel.prototype.constructor,

    /**
     * @type {boolean}
     * @memberOf SelectionModel.prototype
     */
    allRowsSelected: false,

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getLastSelection: function() {
        var sels = this.selections;
        var sel = sels[sels.length - 1];
        return sel;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
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
     * @memberOf SelectionModel.prototype
     * @description Select the region described by the given coordinates.
     *
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     */
    select: function(ox, oy, ex, ey) {
        var newSelection = this.grid.newRectangle(ox, oy, ex, ey);
        this.selections.push(newSelection);
        this.flattenedX.push(newSelection.flattenXAt(0));
        this.flattenedY.push(newSelection.flattenYAt(0));
        this.setLastSelectionType('cell');
        this.grid.selectionChanged();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     */
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
            this.grid.selectionChanged();
        } else {
            this.select(ox, oy, ex, ey);
        }
    },

    /**
     * @memberOf SelectionModel.prototype
     * @desc Remove the last selection that was created.
     */
    clearMostRecentSelection: function(dontClearRowSelections) {
        dontClearRowSelections = dontClearRowSelections === true;
        if (!dontClearRowSelections) {
            this.setAllRowsSelected(false);
        }
        if (this.selections.length) { --this.selections.length; }
        if (this.flattenedX.length) { --this.flattenedX.length; }
        if (this.flattenedY.length) { --this.flattenedY.length; }
        //this.getGrid().selectionChanged();
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearMostRecentColumnSelection: function() {
        this.columnSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearMostRecentRowSelection: function() {
        this.rowSelectionModel.clearMostRecentSelection();
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    clearRowSelection: function() {
        this.rowSelectionModel.clear();
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getSelections: function() {
        return this.selections;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean} There are active selection(s).
     */
    hasSelections: function() {
        return this.selections.length !== 0;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
    hasRowSelections: function() {
        return !this.rowSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
    hasColumnSelections: function() {
        return !this.columnSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @return {boolean} Selection covers a specific column.
     * @param {number} y
     */
    isCellSelectedInRow: function(y) {
        return this._isCellSelected(this.flattenedX, 0, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns Selection covers a specific row.
     * @param {number} x
     */
    isCellSelectedInColumn: function(x) {
        return this._isCellSelected(this.flattenedY, x, 0);
    },

    /**
     * @memberOf SelectionModel.prototype
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

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @param y
     * @returns {*}
     */
    isCellSelected: function(x, y) {
        return this._isCellSelected(this.selections, x, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param selections
     * @param x
     * @param y
     * @returns {boolean}
     * @private
     */
    _isCellSelected: function(selections, x, y) {
        var self = this;
        return !!selections.find(function(selection) {
            return self.rectangleContains(selection, x, y);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @desc empty out all our state
     *
     */
    clear: function(dontClearRowSelections) {
        dontClearRowSelections = dontClearRowSelections === true;
        this.selections.length = 0;
        this.flattenedX.length = 0;
        this.flattenedY.length = 0;
        this.columnSelectionModel.clear();
        if (!dontClearRowSelections) {
            this.setAllRowsSelected(false);
            this.rowSelectionModel.clear();
        }
        //this.getGrid().selectionChanged();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param {number} ox - origin x coordinate
     * @param {number} oy - origin y coordinate
     * @param {number} ex - extent x coordinate
     * @param {number} ey - extent y coordinate
     * @returns {boolean}
     */
    isRectangleSelected: function(ox, oy, ex, ey) {
        return !!this.selections.find(function(selection) {
            return (
                selection.origin.x === ox && selection.origin.y === oy &&
                selection.extent.x === ex && selection.extent.y === ey
            );
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @returns {*}
     */
    isColumnSelected: function(x) {
        return this.columnSelectionModel.isSelected(x);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y
     * @returns {boolean|*}
     */
    isRowSelected: function(y) {
        return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x1
     * @param x2
     */
    selectColumn: function(x1, x2) {
        this.columnSelectionModel.select(x1, x2);
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     */
    selectAllRows: function() {
        this.clear();
        this.setAllRowsSelected(true);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */

    setAllRowsSelected: function(isIt) {
        this.allRowsSelected = isIt;
    },

    areAllRowsSelected: function() {
        return this.allRowsSelected;
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y1
     * @param y2
     */
    selectRow: function(y1, y2) {
        this.rowSelectionModel.select(y1, y2);
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x1
     * @param x2
     */
    deselectColumn: function(x1, x2) {
        this.columnSelectionModel.deselect(x1, x2);
        this.setLastSelectionType('column');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param y1
     * @param y2
     */
    deselectRow: function(y1, y2) {
        this.rowSelectionModel.deselect(y1, y2);
        this.setLastSelectionType('row');
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*}
     */
    getSelectedRows: function() {
        if (this.areAllRowsSelected()) {
            var headerRows = this.grid.getHeaderRowCount();
            var rowCount = this.grid.getRowCount() - headerRows;
            var result = new Array(rowCount);
            for (var i = 0; i < rowCount; i++) {
                result[i] = i + headerRows;
            }
            return result;
        }
        return this.rowSelectionModel.getSelections();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {*|Array.Array.number}
     */
    getSelectedColumns: function() {
        return this.columnSelectionModel.getSelections();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {boolean}
     */
     isColumnOrRowSelected: function() {
        return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
    },

    /**
     * @memberOf SelectionModel.prototype
     * @returns {Array}
     */
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

    /**
     * @memberOf SelectionModel.prototype
     * @param offset
     */
    selectRowsFromCells: function(offset, dontClearRowSelections) {
        offset = offset || 0;
        dontClearRowSelections = dontClearRowSelections === true;

        var sm = this.rowSelectionModel;

        if (!dontClearRowSelections) {
            this.setAllRowsSelected(false);
            sm.clear();
        }

        this.selections.forEach(function(selection) {
            var top = selection.origin.y,
                extent = selection.extent.y;
            top += offset;
            sm.select(top, top + extent);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param offset
     */
    selectColumnsFromCells: function(offset) {
        offset = offset || 0;

        var sm = this.columnSelectionModel;
        sm.clear();

        this.selections.forEach(function(selection) {
            var left = selection.origin.x,
                extent = selection.extent.x;
            left += offset;
            sm.select(left, left + extent);
        });
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param x
     * @param y
     * @returns {*}
     */
    isInCurrentSelectionRectangle: function(x, y) {
        var last = this.selections[this.selections.length - 1];
        return last && this.rectangleContains(last, x, y);
    },

    /**
     * @memberOf SelectionModel.prototype
     * @param rect
     * @param x
     * @param y
     * @returns {boolean}
     */
    rectangleContains: function(rect, x, y) { //TODO: explore why this works and contains on rectanglular does not
        var minX = rect.origin.x;
        var minY = rect.origin.y;
        var maxX = minX + rect.extent.x;
        var maxY = minY + rect.extent.y;

        if (rect.extent.x < 0) {
            minX = maxX;
            maxX = rect.origin.x;
        }

        if (rect.extent.y < 0) {
            minY = maxY;
            maxY = rect.origin.y;
        }

        var result =
            x >= minX &&
            y >= minY &&
            x <= maxX &&
            y <= maxY;

        return result;
    }
};

module.exports = SelectionModel;
