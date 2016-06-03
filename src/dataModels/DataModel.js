'use strict';

var Base = require('../lib/Base');

var A = 'A'.charCodeAt(0);

/**
 * @constructor
 */
var DataModel = Base.extend('DataModel', {

    next: null,

    grid: null,

    initialize: function(grid) {
        this.grid = grid;
    },

    /** @deprecated Use `.grid` property instead. */
    getGrid: function() {
        return this.deprecated('grid', { since: '0.2' });
    },

    /** @deprecated Use `.grid.behavior` property instead. */
    getBehavior: function() {
        return this.deprecated('grid.behavior', { since: '0.2' });
    },

    changed: function() {
        this.grid.behavior.changed();
    },

    getPrivateState: function() {
        return this.grid.getPrivateState();
    },

    applyState: function() {

    },

    alphaFor: function(i) {
        // Name the column headers in A, .., AA, AB, AC, .., AZ format
        // quotient/remainder
        //var quo = Math.floor(col/27);
        var quo = Math.floor(i / 26);
        var rem = i % 26;
        var code = '';
        if (quo > 0) {
            code += this.alpha(quo - 1);
        }
        code += this.alpha(rem);
        return code;
    },

    alpha: function(i) {
        return String.fromCharCode(A + i);
    },

    /**
     * This method as written returns the `cellEditor` property (containing the cell editor class name) from the cell properties hash or, failing that, the column properties hash. The name is then used to instantiate a cell editor of that name found in the list of registered cel editors. If neither hash has such a property, or if no such editor is registered, returns `undefined` &mdash; which has the effect of making the cell editor non-editable.
     *
     * An easy way of making all cell editors non-editable regardless of the property settings (either temporarily or permanently) is to override this method with a null method (that returns `undefined`).
     *
     * The application developer may also wish to override this method to instantiate and return a `CellEditor` to be determined more precisely at run-time. This selection is usually based on column (`x`) but may in fact vary by row as well. Besides putting off the decision of which cell editor to use, this approach also has the advantage of being able to set attributes on the cell editor after instantiation but before it is rendered.
     *
     * @param {number} x - Absolute column index.
     * @param {number} y - Row index in `dataRows` (raw `dataSource.data`) array.
     *
     * @returns {undefined|CellEditor} An object instantiated from a constructor extended from CellEditor. If return value is `undefined` (or otherwise falsy), the cell will not be editable.
     */
    getCellEditorAt: function(x, y) {
        var cellProperties,
            columnProperties,
            column = this.grid.behavior.getColumn(x);

        var editorName =
            (cellProperties = column.getCellProperties(y)).editor ||
            (columnProperties = column.getProperties()).editor;

        if (!editorName && editorName !== null) { // null means don't fallback to format
            editorName = cellProperties.format || columnProperties.format;
        }

        if (!editorName && editorName !== null) { // null means don't fallback to type
            editorName = column.getType();
        }

        return this.grid.createCellEditor(editorName);
    }

});

module.exports = DataModel;
