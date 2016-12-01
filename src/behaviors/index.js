'use strict';

/** @namespace src/behaviors */

module.exports = {
    /**
     * Abstract base class.
     * @see {@link Behavior}
     * @type {Behavior}
     * @memberOf src/behaviors
     */
    Behavior: require('./Behavior'),

    /**
     * Behavior that services the dataModels/JSON data model.
     * @see {@link behaviors.JSON}
     * @type {Behavior}
     * @memberOf src/behaviors
     */
    JSON: require('./JSON'),

    /**
     * Object representing.
     * @see {@link Column}
     * @memberOf src/behaviors
     */
    Column: require('./Column')
};
