'use strict';

exports.register = register;

register(require('./CellEditor'));
register(require('./ComboBox'));
//register(require('./Combo'));
register(require('./Color'));
register(require('./Date'));
register(require('./FilterBox'));
register(require('./Number'));
register(require('./Simple'));
register(require('./Slider'));
exports.int = exports.float = register(require('./Spinner'));
register(require('./Textfield'));

/**
 * @memberOf Hypergrid.prototype
 * @summary Register a cell editor.
 * @desc Adds a custom cell editor to the `cellEditors` hash using the provided name or the class name (converted to all lower case).
 *
 * > All native cell editors are "preregistered" by constructor. If you plan to instantiate a number of grids, rather than registering all your custom cell editor(s) on all your grids, if that's what you were going to do, you might instead let them "go native" by adding them to `cellEditors` hash _before_ instantiating your grids so the constructor will do the work for you on each grid.
 *
 * @param {YourCellEditor.prototype.constructor} Constructor - A constructor, typically extended from `CellEditor` (or a descendant therefrom).
 *
 * @param {string} [editorKey] - Case-insensitive editor key. If not given, `YourCellEditor.prototype.$$CLASS_NAME` is used.
 *
 * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call. (Formal parameter name: `alias`.)
 */
function register(Constructor, editorKey) {
    editorKey = editorKey || Constructor.prototype.$$CLASS_NAME;
    exports[editorKey.toLowerCase()] = Constructor;
    return Constructor;
}
register.abstract = true;

