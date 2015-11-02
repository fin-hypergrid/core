'use strict';
/**
 *
 * @module cell-editors\textfield
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {string} alias - my lookup alias
         * @instance
         */
        alias: 'textfield',

        /**
        * @function
        * @instance
        * @description
        select everything
        */
        selectAll: function() {
            this.input.setSelectionRange(0, this.input.value.length);
        }
    });

})(); /* jshint ignore:line */
