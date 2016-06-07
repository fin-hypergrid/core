'use strict';

var cellEditors = require('../cellEditors');
var cellRenderers = require('../cellRenderers');
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
     * @param {object} config
     * @param {string} declaredRendererName - The proposed cell renderer name (formthe render properties).
     * @returns {CellRenderer}
     * @memberOf DataModel.prototype
     */
    getCell: function(config, declaredRendererName) {
        return cellRenderers.get(declaredRendererName);
    },

    /**
     * The application developer may override this method to instantiate and return a `CellEditor` to be determined programmatically at run-time and/or to set attributes on the cell editor after instantiation but before it is rendered.
     *
     * An easy way of making all cell editors non-editable regardless of the property settings (either temporarily or permanently) is to override this method with a null method (that returns `undefined`).
     *
     * @param {number} x - Absolute column index.
     * @param {number} y - Row index in `dataRows` (raw `dataSource.data`) array.
     * @param {string} [declaredEditorName] - The proposed cell editor name (from the render properties).
     *
     * @returns {undefined|CellEditor} An object instantiated from a the registered cell editor constructor named in `declaredEditorName`. A falsy return means the cell is not editable because the `declaredEditorName` was `null` or not registered. But note that `undefined` is registered as the default `Textfield` cell editor.
     *
     * @memberOf DataModel.prototype
     */
    getCellEditorAt: function(x, y, declaredEditorName) {
        return cellEditors.create(this.grid, declaredEditorName);
    }

});

module.exports = DataModel;
