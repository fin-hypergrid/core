'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            var self = this;
            this.readyInit();
            this.input.onchange = function() {
                self.stopEditing();
            };
        },
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


    });

})(); /* jshint ignore:line */
