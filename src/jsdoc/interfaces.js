

/** @interface localizerInterface
 * @desc Implemented by instances of {@link NumberFormatter} and {@link DateFormatter}.
 * Note however that a custom implementation need to be created by such a factory object; it only needs to implement the required properties.
 */

/**
 * Transform a primitive value into a human-friendly string representation.
 * @method
 * @name localizerInterface#localize
 * @returns {string}
 */

/**
 * Transform a formatted string representation back into a primitive typed value.
 * @method
 * @name localizerInterface#standardize
 * @returns {string} Primitive typed value.
 */

/**
 * Tests string representation for all valid characters.
 * (Implementation optional.)
 * @method
 * @name localizerInterface#isValid
 * @returns {boolean} `true` means valid; `false` means invalid character found.
 */

/**
 * Locale passed to constructor.
 * (Implementation optional.)
 * @type {string}
 * @name localizerInterface#locale
 */
