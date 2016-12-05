'use strict';

/**
 *
 * @param {Hypergrid} grid
 * @param {boolean} [privateRegistry=false] - This instance will use a private registry.
 * @constructor
 */
function CellEditors(grid, privateRegistry) {
    this.grid = grid;

    if (privateRegistry) {
        this.editors = {};
    }

    // preregister the standard cell editors
    if (privateRegistry || !this.get('celleditor')) {
        this.add(require('./CellEditor'));
        this.add(require('./ComboBox'));
        this.add(require('./Color'));
        this.add(require('./Date'));
        this.add(require('./FilterBox'));
        this.add(require('./Number'));
        this.add(require('./Slider'));
        this.add(require('./Spinner'));
        this.add(require('./Textfield'));
    }
}

CellEditors.prototype = {
    constructor: CellEditors.prototype.constructor, // preserve constructor

    /**
     * @summary Register a cell editor constructor.
     * @desc Adds a custom cell editor constructor to the `editors` hash using the provided name (or the class name), converted to all lower case.
     *
     * > All native cell editors are "preregistered" in `editors`..
     *
     * @param {string} [name] - Case-insensitive editor key. If not given, `YourCellEditor.prototype.$$CLASS_NAME` is used.
     *
     * @param {YourCellEditor.prototype.constructor} Constructor - A constructor, typically extended from `CellEditor` (or a descendant therefrom).
     *
     * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call.
     *
     * @returns {CellEditor} A newly registered constructor extended from {@link CellEditor}.
     *
     * @memberOf CellEditors#
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
     * @summary Register a synonym for an existing cell editor constructor.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {CellEditor} The previously registered constructor this new synonym points to.
     * @memberOf CellEditors#
     */
    addSynonym: function(synonymName, existingName) {
        var cellEditor = this.get(existingName);
        return (this.editors[synonymName] = cellEditor);
    },

    /**
     * @param {string} name - Name of a registered editor.
     * @returns {CellEditor} A registered constructor extended from {@link CellEditor}.
     * @memberOf CellEditors#
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
     * @memberOf CellEditors#
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

    /**
     * The cell editor registry containing all the "preregistered" cell editor constructors.
     * @private
     * @memberOf CellEditors#
     */
    editors: {}
};

module.exports = CellEditors;
