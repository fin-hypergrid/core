'use strict';

var Base = require('../Base');

/**
 * @class
 */
var Registry = Base.extend('Registry', {
    initialize: function() {
        this.items = Object.create(null);
    },

    /**
     * @summary Register an item and return it.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
     * @param {string} [name] - Case-insensitive item key. If not given, fallsback to `item.prototype.$$CLASS_NAME` or `item.prototype.name` or `item.name`.
     * @param [item] - If unregistered or omitted, nothing is added and method returns `undefined`.
     *
     * > Note: `$$CLASS_NAME` is normally set by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|extend} call.
     *
     * @returns Newly registered item or `undefined` if unregistered.
     *
     * @memberOf Registry#
     */
    add: function(name, item) {
        if (arguments.length === 1) {
            item = name;
            name = undefined;
        }

        if (!item) {
            return;
        }

        // getClassName defined if new item derived from extend-me
        name = name || item.getClassName && item.getClassName();

        if (!name) {
            throw new this.HypergridError('Cannot register ' + this.friendlyName() + ' without a name.');
        }

        this.items[name] = item;

        // update existing keys that differ only in case
        name = name.toLowerCase();
        Object.keys(this.items)
            .filter(function(key) { return key.toLowerCase() === name; })
            .forEach(function(key) { this.items[key] = item; }, this);

        return item;
    },

    /**
     * @summary Register a synonym for an existing item.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {function|Constructor} The previously registered item this new synonym points to.
     * @memberOf Registry#
     */
    addSynonym: function(synonymName, existingName) {
        return (this.items[synonymName] = this.items[existingName]);
    },

    /**
     * Create a new item extended from base class. For formal parameters, see {@link Registry#add add}.
     * @memberOf Registry#
     */
    make: function(name, prototype) {
        var last = arguments.length - 1;
        arguments[last] = this.BaseClass.extend(arguments[last]);
        this.add.apply(this, arguments);
    },

    /**
     * Fetch a registered item.
     * @param {string} [name]
     * @returns {*|undefined} A registered item or `undefined` if unregistered.
     * @memberOf Registry#
     */
    get: function(name) {
        if (!name) {
            return;
        }

        var result = this.items[name]; // for performance reasons, do not convert to lower case

        if (!result) {
            var lowerName = name.toLowerCase(); // name may differ in case only
            var foundName = Object.keys(this.items).find(function(key) { return lowerName === key.toLowerCase(); });

            result = this.items[foundName];

            if (result) {
                // Register name as a synonym for the found name for faster access next
                // time without having to convert to lower case on every get.
                this.addSynonym(name, foundName);
            } else {
                throw new this.HypergridError('Expected "' + name + '" to be a case-insensitive match for a registered ' + this.friendlyName() + '.');
            }
        }

        return result;
    },

    friendlyName: function() {
        if (this.BaseClass) {
            var name = this.BaseClass.getClassName();
            name = name && name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        } else {
            name = singularOf(this.getClassName()).toLowerCase();
        }
        name = name || 'item';
        return indefArtOf(name) + ' ' + name;
    }
});

var endings = [
    { plural: /ies$/, singular: 'y' },
    { plural: /s$/, singular: '' }
];

function singularOf(name) {
    endings.find(function(ending) {
        if (ending.plural.test(name)) {
            name = name.replace(ending.plural, ending.singular);
            return true;
        }
    });
    return name;
}

function indefArtOf(name) {
    return /^[aeiou]/.test(name) ? 'an' : 'a';
}


module.exports = Registry;
