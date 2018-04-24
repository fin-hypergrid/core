'use strict';

/**
 * @name fields
 * @module
 */

var REGEXP_META_PREFIX = /^__/; // starts with double underscore

/**
 * @param {object} hash
 * @returns {string[]} Member names from `hash` that do _not_ begin with double-underscore.
 * @memberOf module:fields
 */
exports.getFieldNames = function(hash) {
    return Object.keys(hash || []).filter(function(fieldName) {
        return !REGEXP_META_PREFIX.test(fieldName);
    });
};

exports.titleize = require('synonomous/transformers').toTitle;

exports.getSchema = function(data){
    return exports.getFieldNames(data && data[0] || {}).map(function(name) {
        return { name: name, header: exports.titleize(name) };
    });
};
