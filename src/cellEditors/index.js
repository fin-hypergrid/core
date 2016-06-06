/**
 * @module cellEditors
 */

'use strict';

var cellEditors = {
    register: register,
    get: get,
    instantiate: instantiate
};

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
 * @param {YourCellEditor.prototype.constructor} Constructor - A constructor, typically extended from `CellEditor` (or a descendant therefrom).
 *
 * @param {string} [editorName] - Case-insensitive editor key. If not given, `YourCellEditor.prototype.$$CLASS_NAME` is used.
 *
 * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call.
 *
 * @returns {CellEditor} An class extended from {@link CellEditor}.
 *
 * @memberOf module:cellEditors
 */
function register(Constructor, editorName) {
    editorName = editorName || Constructor.prototype.$$CLASS_NAME;
    editorName = editorName && editorName.toLowerCase();
    cellEditors[editorName] = Constructor;
    return Constructor;
}

/**
 * @param {string} editorName
 * @returns {*}
 * @memberOf module:cellEditors
 */
function get(editorName) {
    return cellEditors[editorName && editorName.toLowerCase()];
}

/**
 * Must be called with YOUR Hypergrid object as context!
 * @returns {CellEditor} New instance of the named cell editor.
 * @param {string} editorName
 * @this {Hypergrid}
 * @memberOf module:cellEditors
 */
function instantiate(editorName) {
    var CellEditorConstructor = get(editorName);
    if (CellEditorConstructor.abstract) {
        throw 'Attempt to instantiate an "abstract" cell editor class.';
    }
    return CellEditorConstructor && new CellEditorConstructor(this);
}


// Register standard cell editors.

/** @name celleditor
 * @see CellEditor
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./CellEditor'));

/** @name combobox
 * @see ComboBox
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./ComboBox'));
//register(require('./Combo'));

/** @name color
 * @see Color
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Color'));

/** @name date
 * @see Date
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Date'));

/** @name filterbox
 * @see FilterBox
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./FilterBox'));

/** @name number
 * @see Number
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Number'));

/** @name slider
 * @see Slider
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Slider'));

/** @name spinner
 * @see Spinner
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Spinner'));

/** @name textfield
 * @see Textfield
 * @constructor
 * @memberOf module:cellEditors
 */
register(require('./Textfield'));


// Register synonyms for standard type names.
// Note that 'date' and 'number' are already registered above.

/** @name int
 * @see module:cellEditors~number
 * @constructor
 * @memberOf module:cellEditors
 */
register(cellEditors.number, 'int');

/** @name float
 * @see module:cellEditors~number
 * @constructor
 * @memberOf module:cellEditors
 */
register(cellEditors.number, 'float');

/** @name string
 * @see module:cellEditors~textfield
 * @constructor
 * @memberOf module:cellEditors
 */
register(cellEditors.textfield, 'string');


module.exports = cellEditors;
