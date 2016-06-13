/**
 * @module cellEditors
 */

'use strict';

function CellEditors(grid) {
    this.grid = grid;
}

CellEditors.prototype = {
    constructor: CellEditors.prototype.constructor, // preserve constructor

    /**
     * @summary Register a cell editor (class) or a synonym of an already-registered cell editor.
     * @desc Adds a custom cell editor to the API using the provided name (or the class name), converted to all lower case.
     *
     * To register a synonym for an already-registered cell editor, use the following construct:
     * ```
     * var cellEditors = require('./cellEditors');
     * cellEditors.register(cellEditors.get('spinner'), 'elevator');
     * ```
     * This makes a synonym "elevator" for the "spinner" cell editor.
     *
     * > All native cell editors are "preregistered" in cellEditors/index.js.
     *
     * @param {string} [name] - Case-insensitive editor key. If not given, `YourCellEditor.prototype.$$CLASS_NAME` is used.
     *
     * @param {YourCellEditor.prototype.constructor} Constructor - A constructor, typically extended from `CellEditor` (or a descendant therefrom).
     *
     * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call.
     *
     * @returns {CellEditor} A newly registered constructor extended from {@link CellEditor}.
     *
     * @memberOf module:cellEditors
     */
    add: function(name, Constructor) {
        if (typeof name === 'function') {
            Constructor = name;
            name = undefined;
        }

        name = name || Constructor.prototype.$$CLASS_NAME;
        name = name && name.toLowerCase();
        this.editors[name] = Constructor;
        return Constructor;
    },

    /**
     * @param {string} name - Name of a registered editor.
     * @returns {CellEditor} A registered constructor extended from {@link CellEditor}.
     * @memberOf CellEditors.prototype
     */
    get: function(name) {
        return this.editors[name && name.toLowerCase()];
    },

    /**
     * @summary Lookup registered cell editor and return a new instance thereof.
     * @desc Note: Must be called with the Hypergrid object as context!
     * @returns {CellEditor} New instance of the named cell editor.
     * @param {string} name - Name of a registered editor.
     * @param {string} [options] - Properties to add to the instantiated editor primarily for mustache's use.
     * @memberOf CellEditors.prototype
     */
    create: function(name, options) {
        var cellEditor,
            Constructor = this.get(name);

        if (Constructor) {
            if (Constructor.abstract) {
                throw 'Attempt to instantiate an "abstract" cell editor class.';
            }
            cellEditor = new Constructor(this.grid, options);
        }

        return cellEditor;
    },

    // Pre-register standard cell editors:
    editors: {
        celleditor: require('./CellEditor'),
        combobox: require('./ComboBox'),
        color: require('./Color'),
        date: require('./Date'),
        filterbox: require('./FilterBox'),
        number: require('./Number'),
        slider: require('./Slider'),
        spinner: require('./Spinner'),
        textfield: require('./Textfield')
    }
};

module.exports = CellEditors;
