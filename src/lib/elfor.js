/* eslint-env browser */

'use strict';

module.exports.each = function(selector, iteratee, context) {
    return Array.prototype.forEach.call((context || document).querySelectorAll(selector), iteratee);
};

module.exports.find = function(selector, iteratee, context) {
    return Array.prototype.find.call((context || document).querySelectorAll(selector), iteratee);
};
