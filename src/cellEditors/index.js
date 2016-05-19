/**
 * @module cellEditors
 */

'use strict';


/**
 * @summary Hash of cell editor object constructors.
 * @desc This hash's only purpose is to support the convenience methods defined herein: {@link cellEditors.extend|extend}, {@link cellEditors.register|register}, and {@link cellEditors.instantiate|instantiate}. If you do not need these methods' functionality, you do not need to register your cell editors.
 * @type {object}
 */
var constructors = {};

/**
 * @summary Register a cell editor (class) or a synonym of an already-registered cell editor.
 * @desc Adds a custom cell editor to the `constructors` hash using the provided name (or the class name), converted to all lower case.
 *
 * To register a syonym for an already-registered cell editor, use the following construct:
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
 * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call. (Formal parameter name: `alias`.)
 *
 * @memberOf module:cellEditors
 */
function register(Constructor, editorName) {
    editorName = editorName || Constructor.prototype.$$CLASS_NAME;
    editorName = editorName && editorName.toLowerCase();
    constructors[editorName] = Constructor;
    return Constructor;
}


/**
 * @param {string} editorName
 * @returns {*}
 */
function get(editorName) {
    return constructors[editorName && editorName.toLowerCase()];
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
        throw 'Attempt to instantiate an "abstract" cell editor.';
    }
    return CellEditorConstructor && new CellEditorConstructor(this);
}


// register standard cell editors
register(require('./CellEditor'));
register(require('./ComboBox'));
//register(require('./Combo'));
register(require('./Color'));
register(require('./Date'));
register(require('./FilterBox'));
register(require('./Number'));
register(require('./Slider'));
register(require('./Spinner'));
register(require('./Textfield'));


// Register synonyms for standard type names.
// It is unnecessary to set up synonyms for 'date' and 'number' because there are already suitable cell editor resitrations matching those names.
register(constructors.number, 'int');
register(constructors.number, 'float');
register(constructors.textfield, 'string');


module.exports = {
    constructors: constructors,
    register: register,
    get: get,
    instantiate: instantiate
};
