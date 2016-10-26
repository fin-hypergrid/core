/* eslint-env browser */

'use strict';

/**
 *
 * @param {HTMLElement} [containingEl=document]
 * @param {string} [prefix='']
 * @param {string} [separator='']
 * @param {string} [suffix='']
 * @param {function} [transformer=multiLineTrim] - Function to transform each input control's text value.
 */
function copyAll(containingEl, prefix, separator, suffix, transformer) {
    var texts = [], lastTextEl, text;

    Array.prototype.forEach.call((containingEl || document).querySelectorAll(copyAll.selector), function(textEl) {
        text = (transformer || multiLineTrim)(textEl.value);
        if (text) { texts.push(text); }
        lastTextEl = textEl;
    });

    if (lastTextEl) {
        copy(lastTextEl, (prefix || '') + texts.join(separator || '') + (suffix || ''));
    }
}

/**
 * 1. Trim the text in the given input element
 * 2. select it
 * 3. copy it to the clipboard
 * 4. deselect it
 * 5. return it
 * @param {HTMLElement|HTMLTextAreaElement} el
 * @param {string} [text=el.value] - Text to copy.
 * @returns {undefined|string} Trimmed text in element or undefined if unable to copy.
 */
function copy(el, text) {
    var result, textWas;

    if (text) {
        textWas = el.value;
        el.value = text;
    } else {
        text = el.value;
    }

    el.value = multiLineTrim(text);

    try {
        el.select();
        result = document.execCommand('copy');
    } catch (err) {
        result = false;
    } finally {
        if (textWas !== undefined) {
            el.value = textWas;
        }
        el.blur();
    }
    return result;
}

function multiLineTrim(s) {
    return s.replace(/^\s*(.*?)\s*$/, '$1');
}

copy.all = copyAll;
copy.multiLineTrim = multiLineTrim;
copy.selectorTextControls = 'input:not([type]), input[type=text], textarea';

module.exports = copy;
