'use strict';
/**
 *
 * @module cell-editors\choice
 *
 */
(function() {

    Polymer({ /* jshint ignore:line */
        alias: 'choice',
        items: ['Moe', 'Larry', 'Curly', 'Groucho', 'Harpo', 'Zeppo', 'Chico'],
        originOffset: function() {
            return [-1, -1];
        },
    });

})(); /* jshint ignore:line */
