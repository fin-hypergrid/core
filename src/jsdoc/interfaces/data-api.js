/**
 * @interface dataSourceHelperAPI
 * @summary Data transformer API.
 * @desc Hypergrid's _data source_ objects transform data row collections (for example, by indexing them). These might include _filter_ data sources that hide data rows and _sorter_ data sources that rearrange data rows.
 *
 * When such a data source is found in the transformation pipeline, Hypergrid sets its `api` property with a reference to an object that implements this interface.
 *
 * Later, the transformations are executed (by {@link dataModels.JSON#applyAnalytics|applyAnalytics}). The `apply` method of each data source is called in turn. A filtering data source's `apply` method calls this API's {@link dataSourceHelperAPI#test|test} method, once for each data row (typically to build an index of included rows).
 */

/**
 * @method
 * @name dataSourceHelperAPI#test
 * @summary Tests data row for inclusion/exclusion from the grid display.
 * @desc Implementation of this method is required.
 * @param {object} dataRow
 * @returns {boolean} Truthy value means row "passes" the test, _i.e.,_ passes through the filter and should be included in the grid display.
 */

/**
 * @method
 * @name dataSourceHelperAPI#properties
 * @summary Column property accessor.
 * @desc There are two types of calls:
 * * "Getter" call - when `properties.getPropName` is defined
 * * "Setter" call - when `properties.getPropName` is not defined
 *
 * For "setter" calls only: Assigns the values of all _enumerable_ members of `properties` to the filter properties with the same names, with the following exceptions:
 * * Value is `undefined` - The filter property is deleted instead of being assigned to the filter property.
 * * Value is a function - The function is only assigned to the filter when the property name appears in `this.firstClassProperties`. Otherwise, the function is called and the returned value is assigned to the filter instead.
 *
 * Note: `column` and `getPropName` are reserved names in the properties namespace because they have special meaning in the `properties` object passed to this function. Filter developers should not implement properties with these names.
 *
 * @param {object} properties - Contains property values to assign to the filter. This object is required. However, none of the following options are required.
 * @param {object} [properties.column] - If defined, value(s) pertain to the indicated column only. If omitted, value(s) pertain to the whole filter.
 *
 * Note that {@link dataModels.JSON~propPrep} defines `column` as non-enumerable. This makes it easy for your helper API's `properties` method implementation to ignore it.
 * .
 * @param {object} [properties.column.index] - Column index as defined by `dataSource.getFields()`.
 * @param {object} [properties.column.name] - Column name as defined in `dataSource.getFields()`.
 * @param {string} [properties.getPropName] - "Get" (return) the value of the property with the supplied name. If undefined,return `null`. (All other members of `properties` are ignored.)
 * @returns One of:
 * * Property value when `getPropName` defined.
 * * `null` when `getPropName` undefined.
 * * `undefined` when setting property value(s).
 */

/** @typedef {object} propObject
 * @property {object} [column] - If omitted, this is a Global API property. If given, both of the following are defined:
 * @property {number} [column.index] - Index of the column in the `fields` array (the `columnIndex` parameter to the `parsePropOverloads` method.
 * @property {string} [column.name] - Name of the column from the `fields` array.
 * @property {object} properties - The name of the property to get or the values of the properties to set.
 * @property {string} [properties.getPropName] - If defined, this is a getter call and this property contains the name of the property value to get; all other defined properties are ignored. If undefined this is setter call.
 */

