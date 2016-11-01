/* eslint-env browser */

'use strict';

var Rectangle = require('rectangular').Rectangle;

module.exports = {
    /**
     * @memberOf Hypergrid#
     * @returns {boolean} We have any selections.
     */
    hasSelections: function() {
        if (!this.getSelectionModel) {
            return; // were not fully initialized yet
        }
        return this.selectionModel.hasSelections();
    },

    /**
     * @memberOf Hypergrid#
     * @returns {string} Tab separated value string from the selection and our data.
     */
    getSelectionAsTSV: function() {
        var sm = this.selectionModel;
        if (sm.hasSelections()) {
            var selections = this.getSelectionMatrix();
            selections = selections[selections.length - 1];
            return this.getMatrixSelectionAsTSV(selections);
        } else if (sm.hasRowSelections()) {
            return this.getMatrixSelectionAsTSV(this.getRowSelectionMatrix());
        } else if (sm.hasColumnSelections()) {
            return this.getMatrixSelectionAsTSV(this.getColumnSelectionMatrix());
        }
    },

    getMatrixSelectionAsTSV: function(selections) {
        var result = '';

        //only use the data from the last selection
        if (selections.length) {
            var width = selections.length,
                height = selections[0].length,
                area = width * height,
                lastCol = width - 1,
                //Whitespace will only be added on non-singular rows, selections
                whiteSpaceDelimiterForRow = (height > 1 ? '\n' : '');

            //disallow if selection is too big
            if (area > 20000) {
                alert('selection size is too big to copy to the paste buffer'); // eslint-disable-line no-alert
                return '';
            }

            for (var h = 0; h < height; h++) {
                for (var w = 0; w < width; w++) {
                    result += selections[w][h] + (w < lastCol ? '\t' : whiteSpaceDelimiterForRow);
                }
            }
        }

        return result;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear all the selections.
     */
    clearSelections: function() {
        var dontClearRows = this.isCheckboxOnlyRowSelections();
        this.selectionModel.clear(dontClearRows);
        this.clearMouseDown();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent selection.
     */
    clearMostRecentSelection: function() {
        var dontClearRows = this.isCheckboxOnlyRowSelections();
        this.selectionModel.clearMostRecentSelection(dontClearRows);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent column selection.
     */
    clearMostRecentColumnSelection: function() {
        this.selectionModel.clearMostRecentColumnSelection();
    },

    /**
     * @memberOf Hypergrid#
     * @desc Clear the most recent row selection.
     */
    clearMostRecentRowSelection: function() {
        //this.selectionModel.clearMostRecentRowSelection(); // commented off as per GRID-112
    },

    clearRowSelection: function() {
        this.selectionModel.clearRowSelection();
        this.behavior.dataModel.clearSelectedData();
    },

    /**
     * @memberOf Hypergrid#
     * @summary Select given region.
     * @param {number} ox - origin x
     * @param {number} oy - origin y
     * @param {number} ex - extent x
     * @param {number} ex - extent y
     */
    select: function(ox, oy, ex, ey) {
        if (ox < 0 || oy < 0) {
            //we don't select negative area
            //also this means there is no origin mouse down for a selection rect
            return;
        }
        this.selectionModel.select(ox, oy, ex, ey);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} Given point is selected.
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     */
    isSelected: function(x, y) {
        return this.selectionModel.isSelected(x, y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The given column is selected anywhere in the entire table.
     * @param {number} y - The row index.
     */
    isCellSelectedInRow: function(y) {
        return this.selectionModel.isCellSelectedInRow(y);
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The given row is selected anywhere in the entire table.
     * @param {number} x - The column index.
     */
    isCellSelectedInColumn: function(x) {
        return this.selectionModel.isCellSelectedInColumn(x);
    },

    getRowSelection: function(includeHiddenColumns) {
        var column, rows, getColumn,
            self = this,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            numColumns = this.getColumnCount(),
            result = {};

        if (includeHiddenColumns) {
            numColumns += this.getHiddenColumns().length;
            getColumn = this.behavior.getColumn;
        } else {
            getColumn = this.behavior.getActiveColumn;
        }
        getColumn = getColumn.bind(this.behavior);

        for (var c = 0; c < numColumns; c++) {
            column = getColumn(c);
            rows = result[column.name] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach(getValue);
        }

        function getValue(selectedRowIndex, j) {
            var dataRow = self.getRow(selectedRowIndex);
            rows[j] = valOrFunc.call(dataRow, column);
        }

        return result;
    },

    getRowSelectionMatrix: function() {
        var self = this,
            selectedRowIndexes = this.selectionModel.getSelectedRows(),
            numCols = this.getColumnCount(),
            result = new Array(numCols);

        for (var c = 0; c < numCols; c++) {
            var column = this.behavior.getActiveColumn(c);
            result[c] = new Array(selectedRowIndexes.length);
            selectedRowIndexes.forEach(getValue);
        }

        function getValue(selectedRowIndex, r) {
            var dataRow = self.getRow(selectedRowIndex);
            result[c][r] = valOrFunc.call(dataRow, column);
        }

        return result;
    },

    getColumnSelectionMatrix: function() {
        var dataRow,
            self = this,
            headerRowCount = this.getHeaderRowCount(),
            selectedColumnIndexes = this.getSelectedColumns(),
            numRows = this.getRowCount(),
            result = new Array(selectedColumnIndexes.length);

        selectedColumnIndexes.forEach(function(selectedColumnIndex, c) {
            var column = self.behavior.getActiveColumn(selectedColumnIndex),
                values = result[c] = new Array(numRows);

            for (var r = headerRowCount; r < numRows; r++) {
                dataRow = self.getRow(r);
                values[r] = valOrFunc.call(dataRow, column);
            }
        });

        return result;
    },

    getColumnSelection: function() {
        var dataRow,
            self = this,
            headerRowCount = this.getHeaderRowCount(),
            selectedColumnIndexes = this.getSelectedColumns(),
            result = {},
            rowCount = this.getRowCount();

        selectedColumnIndexes.forEach(function(selectedColumnIndex) {
            var column = self.behavior.getActiveColumn(selectedColumnIndex),
                values = result[column.name] = new Array(rowCount);

            for (var r = headerRowCount; r < rowCount; r++) {
                dataRow = self.getRow(r);
                values[r] = valOrFunc.call(dataRow, column);
            }
        });

        return result;
    },

    getSelection: function() {
        var dataRow,
            self = this,
            selections = this.getSelections(),
            rects = new Array(selections.length);

        selections.forEach(getRect);

        function getRect(selectionRect, i) {
            var rect = normalizeRect(selectionRect),
                colCount = rect.extent.x + 1,
                rowCount = rect.extent.y + 1,
                columns = {};

            for (var c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                var column = self.behavior.getActiveColumn(x),
                    values = columns[column.name] = new Array(rowCount);

                for (var r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                    dataRow = self.getRow(y);
                    values[r] = valOrFunc.call(dataRow, column);
                }
            }

            rects[i] = columns;
        }

        return rects;
    },

    getSelectionMatrix: function() {
        var dataRow,
            self = this,
            selections = this.getSelections(),
            rects = new Array(selections.length);

        selections.forEach(getRect);

        function getRect(selectionRect, i) {
            var rect = normalizeRect(selectionRect),
                colCount = rect.extent.x + 1,
                rowCount = rect.extent.y + 1,
                rows = [];

            for (var c = 0, x = rect.origin.x; c < colCount; c++, x++) {
                var values = rows[c] = new Array(rowCount),
                    column = self.behavior.getActiveColumn(x);

                for (var r = 0, y = rect.origin.y; r < rowCount; r++, y++) {
                    dataRow = self.getRow(y);
                    values[r] = valOrFunc.call(dataRow, column);
                }
            }

            rects[i] = rows;
        }

        return rects;
    },
};

function normalizeRect(rect) {
    var o = rect.origin,
        c = rect.corner,

        ox = Math.min(o.x, c.x),
        oy = Math.min(o.y, c.y),

        cx = Math.max(o.x, c.x),
        cy = Math.max(o.y, c.y);

    return new Rectangle(ox, oy, cx - ox, cy - oy);
}

/**
 * @this {dataRowObject}
 * @param column
 * @returns {string}
 */
function valOrFunc(column) {
    var result, calculator;
    if (this) {
        result = this[column.name];
        calculator = (typeof result)[0] === 'f' && result || column.calculator;
        if (calculator) {
            result = calculator.call(this, column.name);
        }
    }
    return result || result === 0 || result === false ? result : '';
}
