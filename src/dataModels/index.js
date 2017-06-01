'use strict';

/**
 * @namespace
 */
var dataModels = {
    DataModel: require('./DataModel'),
    JSON: require('./JSON'),
    HeaderSubgrid: require('./HeaderSubgrid')
};

// add and get are non-enumerable
Object.defineProperties(dataModels, {
    /**
     * @function
     * @memberOf dataModels
     * @summary Register a data model by name.
     */
    add: {
        value: function(name, Constructor) {
            this[name] = Constructor;
        }
    },
    /**
     * @function
     * @memberOf dataModels
     * @summary Lookup a registered data model by name.
     */
    get: {
        value: function(name) {
            return this[name];
        }
    },
    /**
     * @type {string[]}
     * @memberOf dataModels
     * @summary Array of names of registered data models.
     */
    keys: {
        get: function() {
            return Object.keys(this);
        }
    }
});

module.exports = dataModels;
