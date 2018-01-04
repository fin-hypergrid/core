'use strict';

var Base = require('../Base');

var Registry = Base.extend('Registry', {
    /**
     * @param {object} [options] - The following options can alternatively be set in the prototype of an extending class.
     * @param {boolean} [options.singletons=false] - The registry will consist of singletons which will be instantiated as they are added.
     * (Otherwise the registry consists of constructors which are instantiated later on as needed.)
     * @param {boolean} [options.private=false] - This instance will use a private registry.
     */
    initialize: function(options) {
        this.options = options;

        if (this.option('private')) {
            this.items = {};
        }
    },

    option: function(key) {
        return this.options && key in this.options ? this.options[key] : this[key];
    },

    /**
     * @summary Register and instantiate a singleton.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
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

        if (!name) {
            throw new this.HypergridError('Expected a registration name.');
        }

        name = name.toLowerCase();

        return (this.items[name] = this.option('singletons') ? this.construct(Constructor) : Constructor);
    },

    /**
     * @summary Register a synonym for an existing singleton.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {CellRenderers} The previously registered constructor this new synonym points to.
     * @memberOf CellRenderers.prototype
     */
    addSynonym: function(synonymName, existingName) {
        return (this.items[synonymName] = this.get(existingName));
    },

    /**
     * Fetch a registered singleton.
     * @param {string} name
     * @returns {CellRenderers} A registered constructor extended from {@link CellRenderers}.
     * @memberOf CellRenderers.prototype
     */
    get: function(name) {
        var result = this.items[name]; // for performance reasons, do not convert to lower case

        if (!result) {
            var lowerName = name.toLowerCase();
            result = this.items[lowerName]; // name may differ in case only
            if (result) {
                this.addSynonym(name, lowerName); // register found name as a synonym for faster access next time around to avoid converting to lower case again
            }
        }

        if (!result) {
            throw new this.HypergridError('Expected a registered ' + this.$$CLASS_NAME.toLowerCase() + ': "' + name + '"');
        }

        return result;
    },

    /**
     * @summary Lookup registered item and return a new instance thereof.
     * @returns New instance of the named item.
     * @param {string} name - Name of a registered item.
     * @param {string} [options] - Properties to add to the instantiated item primarily for `mustache` use.
     * @memberOf CellEditors#
     */
    create: function(name, options) {
        var Constructor = this.get(name);

        if (Constructor.abstract) {
            throw new this.HypergridError('Attempt to instantiate the abstract "' + name + '" class.');
        }

        return this.construct(Constructor, options);
    },

    construct: function(Constructor, options) {
        options = Object.assign({}, this.options, options);
        return new Constructor(Object.keys(options).length && options);
    },

    /**
     * The shared registry. (Not used when `options.private` was truthy.)
     * @private
     * @memberOf CellRenderers.prototype
     */
    items: {}
});


module.exports = Registry;
