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

    Polymer({ /* jslint ignore:line */
        getValue: function(x, y) {
            return x + ', ' + a[y % 26];
        },
        getFixedRowValue: function(x /*, y*/ ) {
            return alphaFor(x);
        },

        getFixedColumnCount: function() {
            return 1;
        },
    });

})(); /* jslint ignore:line */
