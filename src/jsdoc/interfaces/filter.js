/**
 * @interface filterAPI
 * @desc Hypergrid's _data source_ objects transform data row collections (typically by indexing them). These can include _filtering_ data sources.
 *
 * When a filtering data source is found in the transformation pipeline, Hypergrid calls its `set` method with a reference to an object that implements this API.
 *
 * Later, the transformations are executed (by {@link dataModels.JSON#applyAnalytics|applyAnalytics}). The `apply` method of each data source is called in turn. A filtering data source's `apply` method calls this API's {@link filterAPI#test|test} method, once for each data row (typically to build an index of included rows).
 */

/**
 * @method
 * @name filterAPI#test
 * @summary Tests data row for inclusion/exclusion from the grid display.
 * @desc Implementation of this method is required.
 * @param {object} dataRow
 * @returns {boolean} Truthy value means row "passes" the test, _i.e.,_ passes through the filter and should be included in the grid display.
 */

/**
 * @method
 * @name filterAPI#prop
 * @summary Column property accessor.
 * @desc There are two types of calls:
 * * "Getter" call - when `properties.getterName` is defined
 * * "Setter" call - when `properties.getterName` is not defined
 *
 * For "setter" calls only: Assigns the values of all _enumerable_ members of `properties` to the filter properties with the same names, with the following exceptions:
 * * Value is `undefined` - The filter property is deleted instead of being assigned to the filter property.
 * * Value is a function - The function is only assigned to the filter when the property name appears in `this.firstClassProperties`. Otherwise, the function is called and the returned value is assigned to the filter instead.
 *
 * Note: `column` and `getterName` are reserved names in the properties namespace because they have special meaning in the `properties` has passed to this function. Filter developers should not implement properties with these names.
 * @param {object} properties - Contains property values to assign to the filter. This object is required. However, none of the following options are required.
 * @param {object} [properties.column] - If defined, value(s) pertain to the indicated column only. If omitted, value(s) pertain to the whole filter.
 *
 * Note: When a setter type call (`properties.getterName` not defined), this property must be defined as non-enumerable so it won't be copied to the filter.
 * @param {object} [properties.column.index] - Column index as defined by `dataSource.getFields()`.
 * @param {object} [properties.column.name] - Column name as defined in `dataSource.getFields()`.
 * @param {string} [properties.getterName] - "Get" (return) the property with the supplied name. Remaining properties are ignored.
 * @returns One of:
 * * Property value when `getterName` defined.
 * * `undefined` when setting property value(s).
 */
