/**
 * @module cellEditors
 */

'use strict';


var localization = require('../lib/localization');


/**
 * @summary Hash of cell editor object constructors.
 * @desc This hash's only purpose is to support the convenience methods defined herein: {@link cellEditors.extend|extend}, {@link cellEditors.register|register}, and {@link cellEditors.instantiate|instantiate}. If you do not need these methods' functionality, you do not need to register your cell editors.
 * @type {object}
 */
var constructors = {};

/**
 * @summary Register a cell editor (class).
 * @desc Adds a custom cell editor to the `constructors` hash using the provided name (or the class name) converted to all lower case.
 *
 * > All native cell editors are "preregistered" by constructor. If you plan to instantiate a number of grids, rather than registering all your custom cell editor(s) on all your grids, if that's what you were going to do, you might instead let them "go native" by adding them to `cellEditors` hash _before_ instantiating your grids so the constructor will do the work for you on each grid.
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
 * Must be called with YOUR Hypergrid object as context!
 * @returns {CellEditor} New instance of the named cell editor.
 * @param {string} editorName
 * @this {Hypergrid}
 * @memberOf module:cellEditors
 */
function instantiate(editorName) {
    editorName = editorName && editorName.toLowerCase();
    var CellEditorConstructor = constructors[editorName];
    return CellEditorConstructor && new CellEditorConstructor(this);
}


/**
 * @summary Create a new localized cell editor class.
 *
 * @desc Extend the provided cell editor ('baseClassName') using the named localizer (`localizerName`), naming it after the localizer unless otherwise specified (in `newClassName`)
 *
 * @param {string} localizerName
 *
 * @param {string} [baseClassName='textfield'] - The base class must have been previously registered.
 *
 * @param {string} [newClassName=localizerName] - Provide a value here to name the cell editor differently from its localizer.
 *
 * @returns {function} The new cell editor constructor.
 *
 * @memberOf module:cellEditors
 */
function extend(localizerName, baseClassName, newClassName) {
    baseClassName = baseClassName || 'textfield';
    newClassName = newClassName || localizerName;

    return constructors[baseClassName].extend(newClassName, {
        localizer: localization.get(localizerName)
    });
}


module.exports = {
    constructors: constructors,
    register: register,
    instantiate: instantiate,
    extend: extend
};


register(require('./CellEditor'));
register(require('./ComboBox'));
//register(require('./Combo'));
register(require('./Color'));
register(require('./Date'));
register(require('./FilterBox'));
register(require('./Number'));
register(require('./Slider'));
exports.int = exports.float = register(require('./Spinner'));
register(require('./Textfield'));
