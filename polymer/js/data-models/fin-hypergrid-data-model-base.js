'use strict';

(function() {

    Polymer('fin-hypergrid-data-model-base', { /* jshint ignore:line  */

        scrollPositionX: 0,
        scrollPositionY: 0,

        getValue: function() {

        },
        setValue: function() {

        },

        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        getScrollPositionX: function() {
            return this.scrollPositionX;
        },

        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },

        getScrollPositionY: function() {
            return this.scrollPositionY;
        }
    });
})();
