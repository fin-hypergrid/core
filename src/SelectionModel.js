/* global RangeSelectionModel */
'use strict';

/**
 *
 * @module .\selection-model
 * @description
 We represent selections as a list of rectangles because large areas can be represented and tested against quickly with a minimal amount of memory usage. Also we need to maintain the selection rectangles flattened counter parts so we can test for single dimension contains.  This is how we know to highlight the fixed regions on the edges of the grid.
 */

function SelectionModel() {
    this.selections = [];
    this.flattenedX = [];
    this.flattenedY = [];
    this.rowSelectionModel = new RangeSelectionModel();
    this.columnSelectionModel = new RangeSelectionModel();
    this.setLastSelectionType('');
    this.allRowsSelected = false;
};

SelectionModel.prototype = {};

/**
 *
 * @property {Array} selections - an array containing the selection rectangles
 * @instance
 */
SelectionModel.prototype.selections = null;

/**
 *
 * @property {Array} flattenedX - an array containing the selection rectangles flattend in the x dimension
 * @instance
 */
SelectionModel.prototype.flattenedX = null;

/**
 *
 * @property {Array} flattenedY - an array containing the selection rectangles flattend in the y dimension
 * @instance
 */
SelectionModel.prototype.flattenedY = null;

SelectionModel.prototype.rowSelectionModel = null;

SelectionModel.prototype.columnSelectionModel = null;

SelectionModel.prototype.allRowsSelected = false;


/**
 * @function
 * @instance
 * @description
getter for the [fin-hypergrid](module-._fin-hypergrid.html)
 * #### returns: fin-hypergrid
 */
SelectionModel.prototype.getGrid = function() {
    return null;
};
SelectionModel.prototype.getLastSelection = function() {
    var sels = this.getSelections();
    var sel = sels[sels.length - 1];
    return sel;
};

SelectionModel.prototype.getLastSelectionType = function() {
    return this.lastSelectionType;
};
SelectionModel.prototype.setLastSelectionType = function(type) {
    this.lastSelectionType = type;
};
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
SelectionModel.prototype.select = function(ox, oy, ex, ey) {
    var newSelection = this.getGrid().newRectangle(ox, oy, ex, ey);
    this.selections.push(newSelection);
    this.flattenedX.push(newSelection.flattenXAt(0));
    this.flattenedY.push(newSelection.flattenYAt(0));
    this.setLastSelectionType('cell');
    this.getGrid().selectionChanged();
};

SelectionModel.prototype.toggleSelect = function(ox, oy, ex, ey) {

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

};

/**
 * @function
 * @instance
 * @description
remove the last selection that was created
 */
SelectionModel.prototype.clearMostRecentSelection = function() {
    this.allRowsSelected = false;
    this.selections.length = Math.max(0, this.selections.length - 1);
    this.flattenedX.length = Math.max(0, this.flattenedX.length - 1);
    this.flattenedY.length = Math.max(0, this.flattenedY.length - 1);
    //this.getGrid().selectionChanged();
};

SelectionModel.prototype.clearMostRecentColumnSelection = function() {
    this.columnSelectionModel.clearMostRecentSelection();
    this.setLastSelectionType('column');
};

SelectionModel.prototype.clearMostRecentRowSelection = function() {
    this.rowSelectionModel.clearMostRecentSelection();
    this.setLastSelectionType('row');
};

SelectionModel.prototype.clearRowSelection = function() {
    this.rowSelectionModel.clear();
    this.setLastSelectionType('row');
};

SelectionModel.prototype.getSelections = function() {
    return this.selections;
};

/**
 * @function
 * @instance
 * @description
answer if I have any selections
 *
 * #### returns: boolean
 */
SelectionModel.prototype.hasSelections = function() {
    return this.selections.length !== 0;
};

SelectionModel.prototype.hasRowSelections = function() {
    return !this.rowSelectionModel.isEmpty();
};

SelectionModel.prototype.hasColumnSelections = function() {
    return !this.columnSelectionModel.isEmpty();
};

/**
 * @function
 * @instance
 * @description
answer coordinate x, y is selected
 * #### returns: boolean
 * @param {integer} x - column index
 * @param {integer} y - row index
 */
SelectionModel.prototype.isSelected = function(x, y) {
    return this._isSelected(this.selections, x, y);
};

/**
 * @function
 * @instance
 * @description
answer if we have a selection covering a specific column
 * #### returns: boolean
 * @param {integer} col - column index
 */
SelectionModel.prototype.isCellSelectedInRow = function(r) {
    return this._isCellSelected(this.flattenedX, 0, r);
};

/**
 * @function
 * @instance
 * @description
answer if we have a selection covering a specific row
 * #### returns: boolean
 * @param {integer} row - row index
 */
SelectionModel.prototype.isCellSelectedInColumn = function(c) {
    return this._isCellSelected(this.flattenedY, c, 0);
};

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
SelectionModel.prototype._isSelected = function(selections, x, y) {
    if (this.isColumnSelected(x) || this.isRowSelected(y)) {
        return true;
    }
    return this._isCellSelected(selections, x, y);
};

SelectionModel.prototype.isCellSelected = function(x, y) {
    return this._isCellSelected(this.getSelections(), x, y);
};

SelectionModel.prototype._isCellSelected = function(selections, x, y) {
    for (var i = 0; i < selections.length; i++) {
        var each = selections[i];
        if (this.getGrid().rectangles.rectangle.contains(each, x, y)) {
            return true;
        }
    }
    return false;
};
/**
 * @function
 * @instance
 * @description
empty out all our state
 *
 */
SelectionModel.prototype.clear = function() {
    this.allRowsSelected = false;
    this.selections.length = 0;
    this.flattenedX.length = 0;
    this.flattenedY.length = 0;
    this.rowSelectionModel.clear();
    this.columnSelectionModel.clear();
    //this.getGrid().selectionChanged();
};

SelectionModel.prototype.isRectangleSelected = function(ox, oy, ex, ey) {
    var selections = this.getSelections();
    for (var i = 0; i < selections.length; i++) {
        var each = selections[i];
        if (each.origin.x === ox && each.origin.y === oy && each.extent.x === ex && each.extent.y === ey) {
            return true;
        }
    }
    return false;
};

SelectionModel.prototype.isColumnSelected = function(x) {
    return this.columnSelectionModel.isSelected(x);
};

SelectionModel.prototype.isRowSelected = function(y) {
    return this.allRowsSelected || this.rowSelectionModel.isSelected(y);
};

SelectionModel.prototype.selectColumn = function(x1, x2) {
    this.columnSelectionModel.select(x1, x2);
    this.setLastSelectionType('column');
};

SelectionModel.prototype.selectAllRows = function() {
    this.clear();
    this.allRowsSelected = true;
};

SelectionModel.prototype.areAllRowsSelected = function() {
    return this.allRowsSelected;
};

SelectionModel.prototype.selectRow = function(y1, y2) {
    this.rowSelectionModel.select(y1, y2);
    this.setLastSelectionType('row');
};

SelectionModel.prototype.deselectColumn = function(x1, x2) {
    this.columnSelectionModel.deselect(x1, x2);
    this.setLastSelectionType('column');
};

SelectionModel.prototype.deselectRow = function(y1, y2) {
    this.rowSelectionModel.deselect(y1, y2);
    this.setLastSelectionType('row');
};

SelectionModel.prototype.getSelectedRows = function() {
    return this.rowSelectionModel.getSelections();
};

SelectionModel.prototype.getSelectedColumns = function() {
    return this.columnSelectionModel.getSelections();
};

SelectionModel.prototype.isColumnOrRowSelected = function() {
    return !this.columnSelectionModel.isEmpty() || !this.rowSelectionModel.isEmpty();
};
SelectionModel.prototype.getFlattenedYs = function() {
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
};

SelectionModel.prototype.selectRowsFromCells = function(offset) {
    this.allRowsSelected = false;
    offset = offset || 0;
    var sm = this.rowSelectionModel;
    sm.clear();
    for (var i = 0; i < this.selections.length; i++) {
        var each = this.selections[i];
        var top = each.origin.y;
        var size = each.extent.y;
        sm.select(top + offset, top + size + offset);
    }
};

SelectionModel.prototype.selectColumnsFromCells = function(offset) {
    offset = offset || 0;
    var sm = this.columnSelectionModel;
    sm.clear();
    for (var i = 0; i < this.selections.length; i++) {
        var each = this.selections[i];
        var top = each.origin.x;
        var size = each.extent.x;
        sm.select(top + offset, top + size + offset);
    }
};

SelectionModel.prototype.isInCurrentSelectionRectangle = function(x, y) {
    var last = this.selections[this.selections.length - 1];
    if (last) {
        return this.getGrid().rectangles.rectangle.contains(last, x, y);
    }
    return false;
};

module.exports = SelectionModel;
