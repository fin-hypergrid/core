/**
 * @summary API of cell renderer object constructors, plus some access methods.
 * @module cellRenderers
 */

'use strict';

/**
 * @summary Hash of cell renderer object constructors.
 * @desc This hash's only purpose is to support the convenience methods defined herein: {@link module:cellRenderers~extend|extend}, {@link module:cellRenderers~register|register}, and {@link module:cellRenderers~instantiate|instantiate}. If you do not need these methods' functionality, you do not need to register your cell renderers.
 * @type {object}
 */
var cellRenderers = {
    add: add,
    get: get
};

/**
 * Must be called with YOUR Hypergrid object as context!
 * @summary Register a cell renderer (class) or a synonym of an already-registered cell renderer.
 * @desc Adds a custom cell renderer to the `constructors` hash using the provided name (or the class name), converted to all lower case.
 *
 * To register a synonym for an already-registered cell renderer, use the following construct:
 * ```
 * var cellRenderers = require('./cellRenderers');
 * cellRenderers.register(cellRenderers.get('sparkline'), 'spark');
 * ```
 * This makes a synonym "sparkline" for the "spark" cell renderer.
 *
 * > All native cell renderers are "preregistered" in cellRenderers/index.js.
 *
 * @param {YourCellRenderer.prototype.constructor} Constructor - A constructor, typically extended from `CellRenderer` (or a descendant therefrom).
 *
 * @param {string} [rendererName] - Case-insensitive renderer key. If not given, `YourCellRenderer.prototype.$$CLASS_NAME` is used.
 *
 * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call.
 *
 * @memberOf module:cellRenderers
 */
function add(Constructor, rendererName) {
    rendererName = rendererName || Constructor.prototype.$$CLASS_NAME;
    rendererName = rendererName && rendererName.toLowerCase();
    return (cellRenderers[rendererName] = create(Constructor));
}

/**
 * @param {string} rendererName
 * @returns {*}
 */
function get(rendererName) {
    return cellRenderers[rendererName && rendererName.toLowerCase()];
}

// /**
//  * @desc replace this function with your own implementation
//  * @returns cell
//  * @param {object} config - an object with everything you might need for renderering a cell
//  */
// function getRendererColumnHeaderCell(config) {
// }
//
// /**
//  * @desc replace this function with your own implementation
//  * @returns cell
//  * @param {object} config - an object with everything you might need for renderering a cell
//  */
// function getRowHeaderCell(config) {
// }

 /**
  * Must be called with YOUR Hypergrid object as context!
  * @returns {CellRenderer} New instance of the named cell renderer.
  * @param {string} rendererName
  * @private
  */
function create(CellRendererConstructor) {
    var cellRenderer;

    if (CellRendererConstructor) {
        if (CellRendererConstructor.abstract) {
            throw 'Attempt to instantiate an "abstract" cell renderer.';
        }
        cellRenderer = new CellRendererConstructor;
    }

    return cellRenderer;
}


add(require('./CellRenderer'), 'EmptyCell');
add(require('./Button'));
add(require('./SimpleCell'));
add(require('./SliderCell'));
add(require('./SparkBar'));
add(require('./LastSelection'));
add(require('./SparkLine'));
add(require('./ErrorCell'));
add(require('./TreeCell'));


module.exports = cellRenderers;
