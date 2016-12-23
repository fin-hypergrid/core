'use strict';

/**
 * @name fields
 * @module
 */

var REGEXP_META_PREFIX = /^__/, // starts with double underscore
    REGEXP_WORD_SEPARATORS = /[\s\-_]*([^\s\-_])([^\s\-_]+)/g,
    REGEXP_CAPITAL_LETTERS = /[A-Z]/g,
    REGEXP_LOWER_CASE_LETTER = /[a-z]/;

/**
 * @param {object} hash
 * @returns {string[]} Member names from `hash` that do _not_ begin with double-underscore.
 * @memberOf module:fields
 */
function getFieldNames(hash) {
    return Object.keys(hash || []).filter(function(fieldName) {
        return !REGEXP_META_PREFIX.test(fieldName);
    });
}

function capitalize(a, b, c) {
    return b.toUpperCase() + c;
}

/**
 * Separates camel case or white-space-, hypen-, or underscore-separated-words into truly separate words and capitalizing the first letter of each.
 * @param string
 * @returns {string}
 * @memberOf module:fields
 */
function titleize(string) {
    return (REGEXP_LOWER_CASE_LETTER.test(string) ? string : string.toLowerCase())
        .replace(REGEXP_WORD_SEPARATORS, capitalize)
        .replace(REGEXP_CAPITAL_LETTERS, ' $&')
        .trim();
}

function getSchema(data){
    return getFieldNames(data && data[0] || {}).map(function(name) {
        return { name: name, header: titleize(name) };
    });
}

module.exports = {
    getFieldNames: getFieldNames,
    titleize: titleize,
    getSchema: getSchema
};
