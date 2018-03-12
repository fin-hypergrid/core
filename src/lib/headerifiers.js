'use strict';

var REGEXP_WORD_SEPARATORS = /[\s\-_]*([^\s\-_])([^\s\-_]+)/g,
    REGEXP_CAPITAL_LETTERS = /[A-Z]/g,
    REGEXP_LOWER_CASE_LETTER = /[a-z]/,
    shortWords = ['of', 'at', 'by', 'from', 'and', 'but', 'for', 'a', 'an', 'the'];

// Replacement function for use in the default titleize function below.
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
function capitalize(a, b, c) {
    return b.toUpperCase() + c;
}

/**
 * * Separates camel case or white-space-, hyphen-, or underscore-separated "words' into true (truly separate) words.
 * * Capitalizes the first letter of each word (unless not first word and in `shortWords`).
 * @param string
 * @returns {string}
 * @memberOf namespace:fields
 */
exports.titleize = function(string) {
    var title = (REGEXP_LOWER_CASE_LETTER.test(string) ? string : string.toLowerCase())
        .replace(REGEXP_WORD_SEPARATORS, capitalize)
        .replace(REGEXP_CAPITAL_LETTERS, ' $&')
        .trim();

    shortWords.forEach(function(word) {
        word = ' ' + word + ' ';
        title = title.replace(new RegExp(word, 'gi'), word);
    });

    return title;
};
