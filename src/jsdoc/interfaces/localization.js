

/** @interface localizerInterface
 * @desc Implemented by instances of {@link NumberFormatter} and {@link DateFormatter}.
 * Note however that a custom implementation need to be created by such a factory object; it only needs to implement the required properties.
 */

/**
 * @name localizerInterface#name
 * @summary Name to use for registering the localizer.
 * @desc Implementation of this property is optional.
 * If undefined, a name will need to be supplied at registration time.
 * @type {string}
 */

/**
 * @name localizerInterface#format
 * @summary Transform a primitive value into a human-friendly string representation.
 * @desc Implementation of this method is required.
 * @method
 * @param {*} value
 * @returns {string}
 */

/**
 * @summary Transform a formatted string representation back into a primitive typed value.
 * @desc Implementation of this method is required.
 * @method
 * @name localizerInterface#parse
 * @param {string} editedValue
 * @returns {null|*} Primitive typed value.
 * @throws {boolean|string|Error} Throws an error on parse failure. If the error's `message` is defined, the message will eventually be displayed (every `feedbackCount`th attempt).
 */

/**
 * @name localizerInterface#invalid
 * @summary Tests string representation for invalidity.
 * @desc Implementation of this method is optional.
 *
 * The method may be strict or loose but caller has no way of knowing and must assume loose. Loose means it may return a false negative. This means that while a truthy return means invalid, falsy merely means "not invalid." The parser is the final arbiter and should throw an error on parser jam.
 *
 * Return an error message here only if you can describe what precisely caused the syntax error. If all you know is that there was a syntax error, it would probably be more helpful to the user to define {@link localizerInterface#expectation expectation}, which is appended to all error messages, and should contain a general description of the expected syntax.
 *
 * Overridden by `options.invalid` passed to constructor.
 * @method
 * @returns {boolean|string} Truthy value means invalid. If a string, this will be an error message. If not a string, it merely indicates a generic invalid result.
 * @throws {boolean|string|Error} May throw an error on syntax failure as an alternative to returning truthy. Define the error's `message` field as an alternative to returning string.
 */

/**
 * @name localizerInterface#expectation
 * @summary A string to use when no validation error message is available.
 * @desc Implementation of this property is optional.
 *
 * This string should describe the syntax and semantics of the expected value. Typically it begins with "Expected ..."
 *
 * If undefined and in the absence of an error message, the user will know only that the value is invalid but nothing else.
 *
 * Overridden by `options.expectation` passed to constructor.
 *
 * @type {string}
 */

/**
 * @name localizerInterface#locale
 * @summary Locale provided to constructor. Required.
 * @type {string}
 */
