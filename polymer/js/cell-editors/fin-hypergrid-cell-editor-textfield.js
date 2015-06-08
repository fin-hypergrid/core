'use strict';
/**
 *
 * @module cell-editors\textfield
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {type} varname - description
         * @instance
         */
        alias: 'textfield',

        /**
        * @function
        * @instance
        * @description
        fill this in
        * #### returns: type
        * @param {type} varname - descripton
        */
        selectAll: function() {
            this.input.setSelectionRange(0, this.input.value.length);
        }
    });

})(); /* jshint ignore:line */
