/**
 * @interface dataModelAPI
 * @summary Data model API.
 * @desc Blah blah blah.
 */

/**
 * @typedef interfaceExtender
 * One of:
 * * function - An explicit fallback implementation.
 * * `-Infinity` - No fallback; fail silently.
 * * `Infinity` - No fallback; throw error.
 * * otherwise - Generate a fallback function that issues a one-time "unsupported" warning and returns this value (typically `undefined` but could be anything).
 */

/**
 * @typedef {object} interfaceExtenderCollection
 * Hash of additional method names the data source is expected to implement:
 * * keys — string (the method names)
 * * values — interfaceExtender
 */

/**
 * @method
 * @name dataModelAPI#getRowCount
 * @returns {number} The number of data rows currently contained in the model.
 */

/**
 * @method
 * @name dataModelAPI#getRow
 * @param {number} rowIndex
 * @returns {number|undefined} The data row with the given `rowIndex`; or `undefined` if no such row.
 */

/**
 * @method
 * @name dataModelAPI#getValue
 * @param {number} columnIndex
 * @param {number} rowIndex
 * @returns {string|number|boolean|null} The member with the given `columnIndex` from the data row with the given `rowIndex`.
 */
