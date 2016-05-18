

/** @interface localizerInterface
 * @desc Implemented by instances of {@link NumberFormatter} and {@link DateFormatter}.
 * Note however that a custom implementation need to be created by such a factory object; it only needs to implement the required properties.
 */

/**
 * Transform a primitive value into a human-friendly string representation.
 * @method
 * @name localizerInterface#format
 * @returns {string}
 */

/**
 * Transform a formatted string representation back into a primitive typed value.
 * @method
 * @name localizerInterface#parse
 * @returns {string} Primitive typed value.
 */

/**
 * Tests string representation for all valid characters.
 *
 * Implementation of this method is optional.
 *
 * Overridden by `options.isValid` passed to constructor.
 * @method
 * @name localizerInterface#isValid
 * @returns {boolean} `true` means valid; `false` means invalid character found.
 */

/**
 * An optional string to be displayed in the syntax error alert following the words "Invalid value." (This alert comes upon the third attempt to save an invalid edit.)
 *
 * The string should describe the syntax and semantics of the expected value. Typically it begins with "Expected ..."
 *
 * The implementation of this value is optional. Should you choose to supply a value in the prototype, it should reflect the default syntax.
 *
 * Overridden by `options.expectation` passed to constructor.
 *
 * @type {string}
 * @name localizerInterface#locale
 */

/**
 * Locale passed to constructor.
 * @default 'en-US'
 * @type {string}
 * @name localizerInterface#locale
 */
