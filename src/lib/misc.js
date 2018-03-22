'use strict';

/**
 * For each key in src:
 * * When `src[key]` is defined, assigns it to `object[key]` when the latter does not exist or is writable or is a setter
 * * When `src[key]` is undefined:
 *    * When `object[key]` is a configurable property and not a setter, deletes it
 *    * Else when `object[key]` is writable or is a setter, assigns `undefined` (setter handles deletion)
 * @param {object} dest
 * @param {object} src - Defined values set the corresponding key in `dest`. `undefined` values delete the key from `dest`.
 */
exports.assignOrDelete = function(dest, src) {
    Object.keys(src).forEach(function(key) {
        var descriptor = Object.getOwnPropertyDescriptor(dest, key),
            value = src[key];

        if (value !== undefined) {
            if (!descriptor || descriptor.writable || descriptor.set) {
                dest[key] = value;
            }
        } else if (descriptor) {
            if (descriptor.configurable && !descriptor.set) {
                delete dest[key];
            } else if (descriptor.writable || descriptor.set) {
                dest[key] = undefined;
            }
        } // else no descriptor so no property to delete
    });
};
