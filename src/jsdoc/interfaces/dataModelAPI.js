/**
 * @interface dataModelAPI
 * @summary Data model API.
 * @desc Blah blah blah.
 */

/**
 * @typedef {function|null|*} interfaceExtender
 * One of:
 * * when a function - Fallback implementation.
 * * when `null` - No fallback (fail silently).
 * * otherwise - Data source will generate a warning fallback function with this return value (which is typically `undefined`).
 */

/**
 * @typedef {sring|string[]|object} interfaceExtenderCollection
 * If string: Data source will generate a warning fallback.
 * If string[]: Data source will generate a warning fallback for each.
 * If object: Hash of additional methods the data source is expected to implement:
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
