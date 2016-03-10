'use strict';

// `deepClone` is not in use and has not been tested

exports.deepClone = function deepClone(p) {
    var result;

    if (typeof p !== 'object') {
        result = p;
    } else if (p instanceof Array) {
        result = p.reduce(function(memo, value) {
            memo.push(deepClone(value));
            return memo;
        }, []);
    } else {
        result = Object.getOwnPropertyNames(p).reduce(function(memo, key) {
            memo[key] = deepClone(p[key]);
            return memo;
        }, {});
    }

    return result;
};
