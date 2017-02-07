'use strict';

module.exports = {

    /**
     * @summary The behaviors's filter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     * @param {dataControlInterface|undefined|null} filter - One of:
     * * A filter object, turning filter *ON*.
     * * `undefined`, the null filter is reassigned to the grid, turning filtering *OFF.*
     * @memberOf Behavior#
     */
    get filter() {
        return this.getController('filter');
    },
    set filter(filter) {
        this.setController('filter', filter);
    },

    /**
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior#
     */
    getFilter: function(columnIndexOrName, options) {
        return this.dataModel.getFilter(columnIndexOrName, options);
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
     * @memberOf Behavior#
     */
    setFilter: function(columnIndexOrName, state, options) {
        this.dataModel.setFilter(columnIndexOrName, state, options);
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior#
     */
    getFilters: function(options) {
        return this.dataModel.getFilters(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Behavior#
     */
    setFilters: function(state, options) {
        this.dataModel.setFilters(state, options);
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Behavior#
     */
    getTableFilter: function(options) {
        return this.dataModel.getTableFilter(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Behavior#
     */
    setTableFilter: function(state, options) {
        this.dataModel.setTableFilter(state, options);
    },

};
