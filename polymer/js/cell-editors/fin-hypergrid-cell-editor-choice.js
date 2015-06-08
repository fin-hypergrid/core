'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        alias: 'choice',

        /**
         * @property {type} varname - description
         * @instance
         */
        items: ['Moe', 'Larry', 'Curly', 'Groucho', 'Harpo', 'Zeppo', 'Chico'],

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        originOffset: function() {
            return [-1, -1];
        },
    });

})(); /* jshint ignore:line */
