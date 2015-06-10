'use strict';
/**
 *
 * @module behaviors\default
 * @description
 this is the simplest example of a behavior
 *
 */
(function() {
    var alphaFor = function(i) {
        // Name the column headers in A, .., AA, AB, AC, .., AZ format
        // quotient/remainder
        //var quo = Math.floor(col/27);
        var quo = Math.floor((i) / 26);
        var rem = (i) % 26;
        var code = '';
        if (quo > 0) {
            code += String.fromCharCode('A'.charCodeAt(0) + quo - 1);
        }
        code += String.fromCharCode('A'.charCodeAt(0) + rem);
        return code;
    };
    //var noop = function() {};
    var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    Polymer({ /* jslint ignore:line */

        /**
        * @function
        * @instance
        * @description
        this is the most important behavior function it returns each data point at x,y coordinates
        * #### returns: Object
         * @param {integer} x - the x coordinate
         * @param {integer} x - the y coordinate
        */
        getValue: function(x, y) {
            return x + ', ' + a[y % 26];
        },

        /**
        * @function
        * @instance
        * @description
        return data point at x,y coordinates in the fixed row area
        * #### returns: object
         * @param {integer} x - the x coordinate
         * @param {integer} x - the y coordinate
        */
        getFixedRowValue: function(x /*, y*/ ) {
            return alphaFor(x);
        },


        /**
        * @function
        * @instance
        * @description
        return the total number of fixed columns
        * #### returns: integer
        */
        getFixedColumnCount: function() {
            return 1;
        },
    });

})(); /* jslint ignore:line */
