'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {string} alias - my lookup alias
         * @instance
         */
        alias: 'choice',

        /**
         * @property {Array} items - the list of items to pick from
         * @instance
         */
        items: [],

        /**
        * @function
        * @instance
        * @description
        how much should I offset my bounds from 0,0
        */
        originOffset: function() {
            return [-1, -1];
        },
    });

})(); /* jshint ignore:line */
