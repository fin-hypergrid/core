/**
 * @summary API of cell renderer object constructors, plus some access methods.
 * @module cellRenderers
 */

'use strict';

/**
 * @param {boolean} [privateRegistry=false] - This instance will use a private registry.
 * @constructor
 */
function CellRenderers(privateRegistry) {
    if (privateRegistry) {
        this.singletons = {};
    }

    // preregister the standard cell renderers
    if (privateRegistry || !this.get('emptycell')) {
        this.add('EmptyCell', require('./CellRenderer'));
        this.add(require('./Button'));
        this.add(require('./SimpleCell'));
        this.add(require('./SliderCell'));
        this.add(require('./SparkBar'));
        this.add(require('./LastSelection'));
        this.add(require('./SparkLine'));
        this.add(require('./ErrorCell'));
        this.add(require('./TreeCell'));
    }
}

CellRenderers.prototype = {
    constructor: CellRenderers.prototype.constructor, // preserve constructor

    /**
     * @summary Register and instantiate a cell renderer singleton.
     * @desc Adds a custom cell renderer to the `singletons` hash using the provided name (or the class name), converted to all lower case.
     *
     * > All native cell renderers are "preregistered" in `singletons`. Add more by calling `add`.
     *
     * @param {string} [name] - Case-insensitive renderer key. If not given, `YourCellRenderer.prototype.$$CLASS_NAME` is used.
     *
     * @param {CellRenderer} Constructor - A constructor, typically extended from `CellRenderer` (or a descendant therefrom).
     *
     * > Note: `$$CLASS_NAME` can be easily set up by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|CellEditor.extend} call.
     *
     * @returns {CellRenderers} A newly registered constructor extended from {@link CellRenderers}.
     *
     * @memberOf CellRenderers.prototype
     */
    add: function(name, Constructor) {
        if (typeof name === 'function') {
            Constructor = name;
            name = undefined;
        }

        name = name || Constructor.prototype.$$CLASS_NAME;
        name = name && name.toLowerCase();
        return (this.singletons[name] = new Constructor);
    },

    /**
     * @summary Register a synonym for an existing cell renderer singleton.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {CellRenderers} The previously registered constructor this new synonym points to.
     * @memberOf CellRenderers.prototype
     */
    addSynonym: function(synonymName, existingName) {
        var cellRenderer = this.get(existingName);
        return (this.singletons[synonymName] = cellRenderer);
    },

    /**
     * Fetch a registered cell renderer singleton.
     * @param {string} name
     * @returns {CellRenderers} A registered constructor extended from {@link CellRenderers}.
     * @memberOf CellRenderers.prototype
     */
    get: function(name) {
        var result = this.singletons[name]; // for performance reasons, do not convert to lower case
        if (!result) {
            result = this.singletons[name.toLowerCase()]; // name may differ in case only
            if (result) {
                this.singletons[name] = result; // register found name as a synonym
            }
        }
        return result;
    },

    /**
     * The cell editor registry containing all the "preregistered" cell renderer singletons.
     * @private
     * @memberOf CellRenderers.prototype
     */
    singletons: {}
};


module.exports = CellRenderers;
