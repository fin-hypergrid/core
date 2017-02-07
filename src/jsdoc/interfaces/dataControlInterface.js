/**
 * @interface dataControlInterface
 * @summary Data Control Interface object (data controller).
 * @desc Hypergrid's _data source_ objects transform data row collections (for example, by indexing them). These might include _filter_ data sources that hide data rows and _sorter_ data sources that rearrange data rows.
 *
 * Later, the transformations are executed (by {@link dataModels.JSON#reindex|reindex}). The `apply` method of each data source is called in turn. For example, a filtering data source's `apply` method would call its controller's {@link dataControlInterface#test|test} method, once for each data row (typically to build an index of included rows).
 */

/**
 * @method
 * @name dataControlInterface#properties
 * @summary Column property accessor.
 * @desc There are two types of calls:
 * * "Getter" call - when `properties.GETTER` is defined
 * * "Setter" call - when `properties.GETTER` is not defined
 *
 * For "setter" calls only: Assigns the values of all _enumerable_ members of `properties` to the data controller properties with the same names, with the following exceptions:
 * * Value is a function - Functions should be executed by your implementation to get the actual value to be assigned to the data controller. (If you data controller has properties that are themselves functions and need to be able to have functions assigned to them, it is your responsibility to make exceptions to this rule for such properties.)
 *
 * Note: The `COLUMN` and `GETTER` and name properties are reserved.
 *
 * @param {object} properties - Contains property values to assign to the data controller. This object is required. However, none of the following options are required.
 *
 * @param {object} [properties.COLUMN] - If defined, value(s) pertain to the indicated column only. If omitted, value(s) pertain to the whole data controller.
 *
 * Note that {@link dataModels.JSON#prop} defines `COLUMN` as non-enumerable. This makes it easy for your helper data controller's `properties` method implementation to ignore it.
 *
 * @param {object} [properties.COLUMN.index] - Column index as defined by `dataSource.getFields()`.
 * @param {object} [properties.COLUMN.name] - Column name as defined in `dataSource.getFields()`.
 * @param {string} [properties.GETTER] - "Get" (return) the value of the property with the supplied name. If undefined,return `null`. (All other members of `properties` are ignored.)
 *
 * @returns {undefined|null|*} One of:
 * * Setter: `undefined`
 * * Getter:
 *   * Property value (when the property name in `GETTER` is defined in the data controller).
 *   * `null` (when the property name in `GETTER` is _not_ defined in the data controller).
 *   * `undefined` when `COLUMN` is defined but the column it specifies is not found.
 */

/** @typedef {object} propObject
 * @property {object} [COLUMN] - If omitted, this is a Global data controller property. If given, both of the following are defined:
 * @property {number} [COLUMN.index] - Index of the column in the `fields` array (the `columnIndex` parameter to the `parsePropOverloads` method.
 * @property {string} [COLUMN.name] - Name of the column from the `fields` array.
 * @property {object} properties - The name of the property to get or the values of the properties to set.
 * @property {string} [properties.GETTER] - If defined, this is a getter call and this property contains the name of the property value to get; all other defined properties are ignored. If undefined this is setter call.
 */

