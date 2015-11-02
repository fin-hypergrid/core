'use strict';

(function() {

    Polymer({ /* jshint ignore:line */

        /**
         * @property {string} alias - my lookup alias
         * @instance
         */
        alias: 'combo',

        /**
         * @property {Array} items - the list of items to pick from
         * @instance
         */
        items: [],

        /**
        * @function
        * @instance
        * @description
        request focus for my input control
        */
        takeFocus: function() {
            var self = this;
            setTimeout(function() {
                //self.input.focus();
                self.selectAll();
            }, 300);
        },
        selectAll: function() {
            this.input.setSelectionRange(0, this.input.value.length);
        }
    });

})(); /* jshint ignore:line */
