'use strict';


var REGEX_CAMEL_CASE = /([^_A-Z])([A-Z]+)/g; // all instances of xX or _X within a "word"

var columnEnumDecorators = {
    passThrough: function(key) {
        // pass through as is
        return key;
    },

    toAllCaps: function(key) {
        // convert camel case to underscore separated words
        return key.replace(REGEX_CAMEL_CASE, '$1_$2').toUpperCase();
    },

    toCamelCase: function(key) {
        // only convert keys without initial underscores
        if (key[0] !== '_') {
            // if all caps, make lower case
            if (!/[a-z]/.test(key)) {
                key = key.toLowerCase();
            }

            // convert all instances of underscores + char to uppercase char (without underscore)
            key = key.replace(/_([a-z])/ig, function(match, char) {
                return char.toUpperCase();
            });
        }

        return key;
    }
};


module.exports = columnEnumDecorators;
