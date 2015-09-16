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

        //no events are fired while the dropdown is open
        //see http://jsfiddle.net/m4tndtu4/6/
        showEditor: function() {
            var self = this;
            this.input.style.display = 'inline';
            setTimeout(function() {
                self.showDropdown(self.input);
            }, 50);
        }
    });

})(); /* jshint ignore:line */


// showDropdown = function (element) {
//     var event;
//     event = document.createEvent('MouseEvents');
//     event.initMouseEvent('mousedown', true, true, window);
//     element.dispatchEvent(event);
// };

// // This isn't magic.
// window.runThis = function () {
//     var dropdown = document.getElementById('dropdown');
//     showDropdown(dropdown);
// };
