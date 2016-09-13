'use strict';

var Base = require('../lib/Base');

/**
 * @constructor
 */
var DataModel = Base.extend('DataModel', {
    grid: null,
    initialize: function(grid) {
        this.grid = grid;
    },

    changed: function() {
        this.grid.behavior.changed();
    },

    getPrivateState: function() {
        var state;
        try {
            state = this.grid.getPrivateState();
        } catch (err) {
            state = {}; // in case no beahvior yet
        }
        return state;
    },

    /**
     * @param {object} config
     * @param {string} declaredRendererName - The proposed cell renderer name (form the render properties).
     * @returns {CellRenderer}
     * @memberOf DataModel.prototype
     */
    getCell: function(config, declaredRendererName) {
        return this.grid.cellRenderers.get(declaredRendererName);
    },

    /**
     * @summary Instantiate a new cell editor.
     * @desc The application developer may override this method to:
     * * Instantiate and return an arbitrary cell editor. The generic implementation here simply returns the declared cell editor. This is `undefined` when there was no such declaration, or if the named cell editor was not registered.
     * * Return `undefined` for no cell editor at all. The cell will not be editable.
     * * Set properties on the instance by passing them in the `options` object. These are applied to the new cell editor object after instantiation but before rendering.
     * * Manipulate the cell editor object (including its DOM elements) after rendering but before DOM insertion.
     *
     * Overriding this method with a null function (that always returns `undefined`) will have the effect of making all cells uneditable.
     *
     * @param {number} columnIndex - Absolute column index. I.e., the position of the column in the data source's original `fields` array, as echoed in `behavior.allColumns[]`.
     * @param {number} rowIndex - Row index of the data row in the currently filtered and sorted list of rows, regardless of vertical scroll position, offset by the number of header rows (all the rows above the first data row including the filter row). I.e., after subtracting out the number of header rows, this is the position of the data row in the `index` array of the data source (i.e., the last data source pipeline).
     * @param {string} declaredEditorName - The proposed cell editor name (from the render properties).
     * @param {object} options - Properties to copy to the new cell editor primarily for mustache's use. Additionally, always includes the following:
     * @param {string} options.format - The value of the `format` render prop. May be `undefined`.
     * @param {object} options.column - For convenience, the column object in `behavior.allColumns[]` to which `columnIndex` refers.
     * @param {Point} options.editPoint - The grid coordinates of the cell to edit.
     * @param {number} options.editPoint.x - The horizontal model coordinate of the cell to edit. This is the grid coordinate regardless of horizontal scroll position. I.e., the position of the column in the ordered list of selected columns (`behavior.columns[]`). (This is the coordinate required by {@link Hypergrid#editAt|editAt}.)
     * @param {number} options.editPoint.y - Same as `rowIndex`.
     *
     * @returns {undefined|CellEditor} An object instantiated from the registered cell editor constructor named in `declaredEditorName`. A falsy return means the cell is not editable because the `declaredEditorName` was not registered.
     *
     * @memberOf DataModel.prototype
     */
    getCellEditorAt: function(columnIndex, rowIndex, declaredEditorName, options) {
        return this.grid.cellEditors.create(declaredEditorName, options);
    }

});

module.exports = DataModel;
