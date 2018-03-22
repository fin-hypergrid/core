'use strict';

var Base = require('../Base');

/**
 * @constructor
 */
var DataModel = Base.extend('DataModel', {
    grid: null,
    initialize: function(grid, options) {
        this.grid = grid;
    },

    changed: function() {
        this.deprecated('changed()', 'grid.behavior.changed()', '1.1.0');
    },

    getPrivateState: function() {
        return this.deprecated('getPrivateState()', 'grid.properties', '1.2.0');
    },

    getRowMetadata: function(rowIndex, prototype) {
        var dataRow = this.getRow(rowIndex);
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    },

    setRowMetadata: function(rowIndex, metadata) {
        var dataRow = this.getRow(rowIndex);
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
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
     *
     * @param {number} rowIndex - Row index of the data row in the current list of rows, regardless of vertical scroll position, offset by the number of header rows (all the rows above the first data row including the filter row). I.e., after subtracting out the number of header rows, this is the position of the data row in the `index` array of the data source (i.e., the last data source pipeline).
     *
     * @param {string} declaredEditorName - The proposed cell editor name (from the render properties).
     *
     * @param {CellEvent} cellEvent - All enumerable properties of this object will be copied to the new cell editor object for two purposes:
     * * Used in cell editor logic.
     * * For access from the cell editor's HTML template (via mustache).
     *
     * {@link CellEditor} requires both of the following:
     * * **`format`** - The cell's `format` render prop (name of localizer to use to format the editor preload and parse the edited value). May be `undefined` (no formatting or parsing). Added by calling {@link Column#getCellEditorAt|getCellEditorAt} method. Developer's override is free to alter this property.
     * * _CellEvent props_ - `column` ({@link Column} object) is the only enumerable property of the native `CellEvent` object. Read-only.
     * * _Custom props_ - Developer's override of this method may add additional properties, for both purposes listed above.
     *
     * Note that the `editPoint` property previously available to cell editors has been deprecated in favor of options.gridCell. `editPoint` will still work for the time being but with a deprecation warning in the console to use `cellEvent.gridCell` instead.
     *
     * @returns {undefined|CellEditor} An object instantiated from the registered cell editor constructor named in `declaredEditorName`. A falsy return means the cell is not editable because the `declaredEditorName` was not registered.
     *
     * @memberOf DataModel.prototype
     */
    getCellEditorAt: function(columnIndex, rowIndex, declaredEditorName, cellEvent) {
        return this.grid.cellEditors.create(declaredEditorName, cellEvent);
    }

});

module.exports = DataModel;
