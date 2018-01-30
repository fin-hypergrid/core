'use strict';

var Base = require('../Base');

/**
 * @class
 * @param {object} [options] - The following options can alternatively be set in the prototype of an extending class.
 * @param {boolean} [options.singletons=false] - The registry will consist of singletons which will be instantiated as they are added.
 * (Otherwise the registry consists of constructors which are instantiated later on as needed.)
 * @param {boolean} [options.private=false] - This instance will use a private registry.
 */
var Registry = Base.extend('Registry', {
    initialize: function(options) {
        this.options = options;

        if (this.option('private')) {
            this.items = Object.create(this.items);
        }
    },

    option: function(key) {
        return this.options && key in this.options ? this.options[key] : this[key];
    },

    /**
     * @summary Register and instantiate a singleton.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
     * @param {string} [name] - Case-insensitive item key. If not given, `Constructor.prototype.$$CLASS_NAME` is used.
     * @param {function} Constructor
     *
     * > Note: `$$CLASS_NAME` is normally set by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|extend} call.
     *
     * @returns {function|Constructor} A newly registered item, either `Constructor` or singleton created by `new Constructor`.
     *
     * @memberOf Registry#
     */
    add: function(name, Constructor) {
        if (typeof name === 'function') {
            Constructor = name;
            name = undefined;
        }

        name = name || Constructor.prototype.$$CLASS_NAME || Constructor.name; // try Funciton.prototype.name as last resort

        if (!name) {
            throw new this.HypergridError('Expected a registration name.');
        }

        name = name.toLowerCase();

        return (this.items[name] = this.option('singletons') ? this.construct(Constructor) : Constructor);
    },

    /**
     * @summary Register a synonym for an existing item.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {function|Constructor} The previously registered item this new synonym points to.
     * @memberOf Registry#
     */
    addSynonym: function(synonymName, existingName) {
        return (this.items[synonymName] = this.get(existingName));
    },

    /**
     * Fetch a registered singleton.
     * @param {string} [name]
     * @param {boolean} [noThrow] - Avoid throwing error if no such item; just return `undefined`.
     * @returns {function|Constructor|undefined} A registered constructor item or `undefined` if none such.
     * @memberOf Registry#
     */
    get: function(name, noThrow) {
        if (!name) {
            return;
        }

        var result = this.items[name]; // for performance reasons, do not convert to lower case

        if (!result) {
            var lowerName = name.toLowerCase();
            result = this.items[lowerName]; // name may differ in case only
            if (result) {
                this.addSynonym(name, lowerName); // register found name as a synonym for faster access next time around to avoid converting to lower case again
            }
        }

        if (!noThrow && !result) {
            var classDesc = this.$$CLASS_NAME.replace(/[A-Z]/g, ' $1').trim().toLowerCase();
            throw new this.HypergridError('Expected "' + name + '" to be a registered ' + classDesc + '.');
        }

        return result;
    },

    /**
     * @summary Lookup registered item and return a new instance thereof.
     * @returns New instance of the named constructor or `undefined` if none such.
     * @param {string} name - Name of a registered item.
     * @param {string} [options] - Properties to add to the instantiated item primarily for `mustache` use.
     * @memberOf Registry#
     */
    create: function(name, options) {
        var Constructor = this.get(name);

        if (typeof Constructor !== 'function') {
            return;
        }

        if (Constructor.abstract) {
            throw new this.HypergridError('Attempt to instantiate the abstract "' + name + '" class.');
        }

        return this.construct(Constructor, options);
    },

    construct: function(Constructor, options) {
        return new Constructor(Object.assign({}, this.options, options));
    }
});


module.exports = Registry;
