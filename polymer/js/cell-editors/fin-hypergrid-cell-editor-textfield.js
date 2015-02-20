'use strict';

(function() {

    Polymer({ /* jshint ignore:line */
        alias: 'textfield',
        selectAll: function() {
            this.input.setSelectionRange(0, this.input.value.length);
        }
    });

})(); /* jshint ignore:line */
