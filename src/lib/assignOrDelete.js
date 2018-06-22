'use strict';

/**
 * For each key in src:
 * * When `src[key]` is defined, assigns it to `object[key]` when the latter does not exist or is writable or is a setter
 * * When `src[key]` is undefined:
 *    * When `object[key]` is a configurable property and not an accessor, deletes it
 *    * Else when `object[key]` is writable or a setter, assigns `undefined` (setter handles deletion)
 * @param {object} dest
 * @param {object} src - Defined values set the corresponding key in `dest`. `undefined` values delete the key from `dest`.
 */
module.exports = function(dest, src) {
    Object.keys(src).forEach(function(key) {
        var descriptor;
        for (var obj = dest; obj; obj = Object.getPrototypeOf(obj)) {
            if ((descriptor = Object.getOwnPropertyDescriptor(obj, key))) {
                break;
            }
        }

        if (src[key] !== undefined) {
            if (!descriptor || descriptor.writable || descriptor.set) {
                dest[key] = src[key];
            }
        } else if (descriptor) {
            if (descriptor.configurable && !descriptor.set && !descriptor.get) {
                delete dest[key];
            } else if (descriptor.writable || descriptor.set) {
                dest[key] = undefined;
            }
        } // else no descriptor so no property to delete
    });
};
