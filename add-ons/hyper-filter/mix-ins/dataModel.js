'use strict';

var nullFilter = {
    test: function() { return true; } // all rows pass
};

module.exports = {

    _filter: nullFilter,

    /**
     * @summary Get a reference to the filter attached to the Hypergrid.
     * @returns {FilterTree}
     * @memberOf dataModels.JSON.prototype
     */
    get filter() {
        return this._filter;
    },

    /**
     * @summary Attach/detach a filter to a Hypergrid.
     * @param {FilterTree} [filter] - The filter object. If undefined, any attached filter is removed, turning filtering OFF.
     * @memberOf dataModels.JSON.prototype
     */
    set filter(filter) {
        this._filter = filter;
        this.sources.filter.set(filter);
        this.applyAnalytics();
    },

    /**
     * @summary Set a filter property.
     * @desc There are two kinds of filter properties:
     * * *root* properties - Pertain to entire filter.
     * * *column* properties - Pertain to a specific column.
     *
     * NOTE: Not all filter properties are guaranteed to be dynamic; some are set at instantiation time and updating them later will have no effect.
     *
     * @param {number} [columnIndex] - If given, operate on this specific column properties object. If omitted, operate on the whole filter properties object.
     *
     * @param {string|object} [property] - _If `columnIndex` is omitted, this takes first position._
     *
     * One of:
     * * Omitted returns the entire properties object.
     * * *string* - Explicit property name to set on the properties object with `value`.
     * * *object* - Hash of properties to copy to the properties object.
     * Note that fore each member of the has, all values including all falsy values are considered valid with the exception of `undefined` which deletes the property with the same key from the properties object.
     *
     * @param [value] - _If `columnIndex` is omitted, this takes second position._
     *
     * One of:
     * * When `property` is a hash and `value` is given:
     * Unexpected! (Throws error.)
     * * When `property` is a string and `value` is given:
     * Copy this value to properties object using the key in `property`.
     * Note that all values including all falsy values are considered valid with the exception of `undefined` which deletes the property from the properties object.
     * * When `property` is a string and `value` is omitted:
     * Return the value from the properties object of the key in `property`.
     *
     * @returns One of:
     * * Properties object when `property` omitted or when `property` is a hash containing more than one property.
     * * Explicit property value when getting/setting a single property either because property was named explicitly in `property` or because `property` contained a hash with exactly one value.
     * @memberOf dataModels.JSON.prototype
     */
    filterProp: function(columnIndex, property, value) {
        if (!this.filter.prop) {
            return; // fail silently when filter does not support properties
        }

        var invalid, properties,
            isColumnProp = typeof columnIndex === 'number';

        if (!isColumnProp) {
            value = property;
            property = columnIndex;
        }

        switch (arguments.length - isColumnProp) {
            case 0: // getter for whole filter properties object
                if (isColumnProp) {
                    properties = {};
                }
                break;
            case 1: // getter for single filter property (string) or setter (hash)
                if (typeof property === 'object') {
                    properties = property;
                } else {
                    properties = { property: property };
                }
                break;
            case 2: // setter for single filter/column property (string, value)
                if (typeof property !== 'string') {
                    invalid = true;
                } else {
                    properties = {};
                    properties[property] = value;
                }
                break;
            default: // too many args
                invalid = true;
        }

        if (invalid) {
            throw new this.HypergridError('Invalid overload.');
        }

        if (isColumnProp) {
            // non-enumerable property:
            Object.defineProperty(properties, 'column', {
                index: columnIndex,
                name: this.source.getFields()[columnIndex]
            });
        }

        var result = this.filter.prop(properties);

        this.applyAnalytics();

        return result;
    },

    /**
     * @summary Get a particular column filter's state.
     * @param {string} columnName
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getFilter: function(columnIndexOrName, options) {
        var isIndex = !isNaN(Number(columnIndexOrName)),
            columnName = isIndex ? this.getFields()[columnIndexOrName] : columnIndexOrName;

        return this.filter.getColumnFilterState(columnName, options);
    },

    /**
     * @summary Set a particular column filter's state.
     * @desc After setting the new filter state, reapplies the filter to the data source.
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {string|object} [state] - A filter tree object or a JSON, SQL, or CQL subexpression string that describes the a new state for the named column filter. The existing column filter subexpression is replaced with a new node based on this state. If it does not exist, the new subexpression is added to the column filters subtree (`filter.columnFilters`).
     *
     * If undefined, removes the entire column filter subexpression from the column filters subtree.
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @param {string} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `setFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setFilter: function(columnIndexOrName, state, options) {
        var isIndex = !isNaN(Number(columnIndexOrName)),
            columnName = isIndex ? this.getFields()[columnIndexOrName] : columnIndexOrName;

        this.filter.setColumnFilterState(columnName, state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getFilters: function(options) {
        return this.filter.getColumnFiltersState(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setFilters: function(state, options) {
        this.filter.setColumnFiltersState(state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getTableFilter: function(options) {
        return this.filter.getTableFilterState(options);
    },

    /**
     * @summary Set a the table filter state.
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf dataModels.JSON.prototype
     */
    setTableFilter: function(state, options) {
        this.filter.setTableFilterState(state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.applyAnalytics();
    },

};
