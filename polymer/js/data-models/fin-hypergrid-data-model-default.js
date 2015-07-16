'use strict';

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

    Polymer('fin-hypergrid-data-model-default', { /* jshint ignore:line  */

        dataUpdates: {},

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
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            if (x === 0) {
                if (y === 0) {
                    return '';
                }
                return y;
            }
            if (y === 0) {
                return alphaFor(x - 1);
            }
            return (x - 1) + ', ' + a[(y - 1) % 26];
        },

        setValue: function(x, y, value) {
            this.dataUpdates['p_' + x + '_' + y] = value;
        },

        getColumnCount: function() {
            return 53;
        },

        getRowCount: function() {
            //jeepers batman a quadrillion rows!
            return 53;
        }
    });

})();
