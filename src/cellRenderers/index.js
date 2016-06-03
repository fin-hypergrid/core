/**
 * @module cellRenderers
 */

'use strict';

/**
 * @summary Hash of cell renderer object constructors.
 * @desc This hash's only purpose is to support the convenience methods defined herein: {@link cellRenderers.extend|extend}, {@link cellRenderers.register|register}, and {@link cellRenderers.instantiate|instantiate}. If you do not need these methods' functionality, you do not need to register your cell renderers.
 * @type {object}
 */
var strategies = {};

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
 * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter in your {@link https://www.npmjs.com/package/extend-me|CellRenderer.extend} call. (Formal parameter name: `alias`.)
 * @this {Hypergrid}
 * @memberOf module:cellRenderers
 */
function register(Constructor, rendererName) {
    rendererName = rendererName || Constructor.prototype.$$CLASS_NAME;
    rendererName = rendererName && rendererName.toLowerCase();
    strategies[rendererName] = instantiate.call(this, Constructor);
    return  strategies[rendererName];
}

/**
 * @param {string} rendererName
 * @returns {*}
 */
function get(rendererName) {
    return strategies[rendererName && rendererName.toLowerCase()];
}

/**
 * @desc replace this function with your own implementation
 * @returns a cell renderer
 * @param {object} config - an object with everything you might need for rendering a cell
 * @memberOf module:cellRenderers
 */
function getRendererForCell(config) {
    var renderer = get('SimpleCell');
    renderer.config = config;
    return renderer;
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

// /**
//  * Must be called with YOUR Hypergrid object as context!
//  * @returns {CellRenderer} New instance of the named cell renderer.
//  * @param {string} rendererName
//  * @this {Hypergrid}
//  * @memberOf module:cellRenderers
//  */
function instantiate(CellRendererConstructor) {
    if (CellRendererConstructor.abstract) {
        throw 'Attempt to instantiate an "abstract" cell renderer.';
    }
    return CellRendererConstructor && new CellRendererConstructor(this);
}

module.exports = {
    strategies: strategies,
    register: register,
    get: get,
    getRendererForCell: getRendererForCell,
    // getRendererColumnHeaderCell: getRendererColumnHeaderCell,
    // getRendererRowHeaderCell: getRendererRowHeaderCell,
    //instantiate: instantiate
};
