'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-base', { /* jshint ignore:line  */

        getValue: function(x, y) {
            return x + ', ' + y;
        },

        setValue: function(x, y, value) {
            console.log('setting (' + x + ', ' + 'y) = ' + value);
        },

        getColumnCount: function() {
            return 20;
        },

        getRowCount: function() {
            return 1000;
        },

    });

})();
