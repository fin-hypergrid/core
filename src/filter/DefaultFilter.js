'use strict';

var _ = require('object-iterators');

var FilterTree = require('../Shared').FilterTree;
var ParserCQL = require('./parser-CQL');

// Add a property `menuModes` to the tree, defaulting to `operators` as the only active mode
FilterTree.Node.optionsSchema.menuModes = {
    default: {
        operators: 1
    }
};

/** @typedef {function} fieldsProviderFunc
 * @returns {menuOption[]} see jsdoc typedef in pop-menu.js
 */

/**
 * @constructor
 * @extends Operators
 */
var ConditionalsCql = FilterTree.Conditionals.extend({
    makeLIKE: function(beg, end, op, c, originalOp) {
        op = originalOp.toLowerCase();
        return op + ' ' + c.operand;
    },
    makeIN: function(op, c) {
        return op.toLowerCase() + ' ' + c.operand.replace(/\s*,\s*/g, ',');
    },
    make: function(op, c) {
        op = op.toLowerCase();
        if (/\w/.test(op)) { op += ' '; }
        op += c.operand;
        return op;
    }
});

var likeDresses = [
    { regex: /^(NOT )?LIKE %(.+)%$/i, operator: 'contains' },
    { regex: /^(NOT )?LIKE (.+)%$/i, operator: 'begins' },
    { regex: /^(NOT )?LIKE %(.+)$/i, operator: 'ends' }
];
var regexEscapedLikePatternChars = /\[([_\[\]%])\]/g; // capture all _, [, ], and % chars enclosed in []
var regexLikePatternChar = /[_\[\]%]/; // find any _, [, ], and % chars NOT enclosed in []

// convert certain LIKE expressions to BEGINS, ENDS, CONTAINS
function convertLikeToPseudoOp(result) {
    likeDresses.find(function(dress) {
        var match = result.match(dress.regex);

        if (match) {
            // unescape all LIKE pattern chars escaped with brackets
            var not = (match[1] || '').toLowerCase(),
                operator = dress.operator,
                operand = match[2],
                operandWithoutEscapedChars = operand.replace(regexEscapedLikePatternChars, '');

            // if result has no actua remaining LIKE pattern chars, go with the conversion
            if (!regexLikePatternChar.test(operandWithoutEscapedChars)) {
                operand = operand.replace(regexEscapedLikePatternChars, '$1'); // unescape the escaped chars
                result = not + operator + ' ' + operand;
            }

            return true; // break out of loop
        }
    });

    return result;
}
var conditionals = new ConditionalsCql();

// replace the default filter tree terminal node constructor with an extension of same
var CustomFilterLeaf = FilterTree.prototype.addEditor({
    getState: function getState(options) {
        var result,
            syntax = options && options.syntax;

        if (syntax === 'CQL') {
            result = this.getSyntax(conditionals);
            if (result[0] === '=') {
                result = result.substr(1);
            }
            result = convertLikeToPseudoOp(result);
        } else {
            result = FilterTree.Leaf.prototype.getState.call(this, options);
        }

        return result;
    }
});

FilterTree.prototype.addEditor('Columns');

// Add some node templates by updating shared instance of FilterNode's templates. (OK to mutate shared instance; filter-tree not being used for anything else here. Alternatively, we could have instantiated a new Templates object for our DefaultFilter prototype, although this would only affect tree nodes, not leaf nodes, but that would be ok in this case since the additions below are tree node templates.)
_(FilterTree.Node.prototype.templates).extendOwn({
    columnFilter: function() {
/*
 <span class="filter-tree">
     <strong><span>{2} </span></strong><br>
     Match
     <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-or">any</label>
     <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-and">all</label>
     <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-nor">none</label>
     of the following:
     <select>
        <option value="">New expression&hellip;</option>
     </select>
     <ol></ol>
 </span>
*/
    },
    columnFilters: function() {
/*
<span class="filter-tree filter-tree-type-column-filters">
    Match <strong>all</strong> of the following column filter subexpressions:
    <ol></ol>
</span>
*/
    }
});

/** @constructor
 *
 * @desc This extension of FilterTree forces a specific tree structure.
 * See {@link makeNewRoot} for a description.
 *
 * See also {@tutorial filter-api}.
 *
 * @param {FilterTreeOptionsObject} options - You hsould provide a column schema. The easiest approach is to provide a schema for the entire filter tree through `options.schema`.
 *
 * Although not recommended, the column schema can also be embedded in the state object, either at the root, `options.state.schema`, or for any descendant node. For example, a separate schema could be provided for each expression or subexpression that need to render column list drop-downs.
 *
 * NOTE: If `options.state` is undefined, it is defined in `preInitialize()` as a new empty state scaffold (see {@link makeNewRoot}) with the two trunks to hold a table filter and column filters. Expressions and subexpressions can be added to this empty scaffold either programmatically or through the Query Builder UI.
 */

var DefaultFilter = FilterTree.extend('DefaultFilter', {
    preInitialize: function(options) {
        if (options) {

            // Set up the default "Hyperfilter" profile (see function comments)
            options.state = options.state || this.makeNewRoot();

            // Upon creation of a 'columnFilter' node, force the schema to the one column
            if ((options.type || options.state && options.state.type) === 'columnFilter') {
                this.schema = [
                    options.parent.root.schema.findItem(options.state.children[0].column)
                ];
            }
        }
    },

    initialize: function(options) {
        this.cache = {};

        if (!this.parent) {
            this.extractSubtrees();
        }
    },

    postInitialize: function(options) {
        if (this === this.root && !this.parserCQL) {
            this.parserCQL = new ParserCQL({
                schema: this.schema,
                caseSensitiveColumnNames: options.caseSensitiveColumnNames,
                resolveAliases: options.resolveAliases
            });
        }
    },

    /**
     * Create convenience vars to reference the 2 root "Hyperfilter" nodes
     * @memberOf DefaultFilter.prototype
     */
    extractSubtrees: function() {
        var rootNodes = this.root.children;
        this.tableFilter = rootNodes[0];
        this.columnFilters = rootNodes[1];
    },

    /**
     * @summary Make a new empty Hypergrid filter tree state object.
     * @desc This function makes a new default state object as used by Hypergrid, a root with exactly two "trunks."
     *
     * > **Definition:** A *trunk* is defined as a child node with a truthy `keep` property, making this node immune to the usual pruning that would occur when it has no child nodes of its own. To be a true trunk, all ancestor nodes to be trunks as well. Note that the root is a natural trunk; it does not require a `keep` property.
     *
     * The two trunks of the Hypergrid filter are:
     * * The **Table Filter** (left trunk, or `children[0]`), a hierarchy of filter expressions and subexpressions.
     * * The **Column Filters** (right trunk, or `children[1]`), a series of subexpressions, one per active column filter. Each subexpression contains any number of expressions bound to that column but no further subexpressions.
     *
     * The `operator` properties for all subexpressions default to `'op-and'`, which means:
     * * All table filter expressions and subexpressions are AND'd together. (This is just the default and may be changed from the UI.)
     * * All expressions within a column filter subexpression are AND'd together. (This is just the default and may be changed from the UI.)
     * * All column Filters subexpressions are AND'd together. (This may not be changed from UI.)
     * * Finally, the table filter and column filters are AND'd together. (This may not be changed from UI.)
     *
     * @returns {object} A plain object to serve as a filter-tree state object representing a new Hypergrid filter.
     *
     * @memberOf DefaultFilter.prototype
     */
    makeNewRoot: function() {

        this.tableFilter = {
            keep: true,
            children: [
                // table filter expressions and subexpressions go here
            ]
        };

        this.columnFilters = {
            keep: true,
            type: 'columnFilters',
            children: [
                // subexpressions with type 'columnFilter' go here, one for each active column filter
            ]
        };

        var filter = {
            children: [
                this.tableFilter,
                this.columnFilters
            ]
        };

        return filter;
    },

    /**
     * @summary Get the column filter subexpression node.
     * @desc The column filter subexpression nodes are child nodes of the `columnFitlers` branch of the Hypergrid filter tree.
     * Each such node contains all the column filter expressions for the named column. It will never be empty; rather if there is no column filter for the named column, it won't exist in `columnFilters`.
     * @param {string} columnName
     * @returns {undefined|DefaultFilter} Returns `undefined` if the column filter does not exist.
     */
    getColumnFilter: function(columnName) {
        return this.columnFilters.children.find(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column === columnName;
        });
    },

    /** @typedef {object} filterTreeGetStateOptionsObject
     * See filter-tree's {@link http://joneit.github.io/filter-tree/FilterTree.html#getState|getState} options object.
     */

    /** @typedef {object} filterTreeSetStateOptionsObject
     * See filter-tree's {@link http://joneit.github.io/filter-tree/FilterNode.html#setState|setState} options object.
     */

    /**
     *
     * @param columnName
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to `getState`.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state.
     *
     * NOTE: Not all available syntaxes include the meta-data.
     * @memberOf DefaultFilter.prototype
     */
    getColumnFilterState: function(columnName, options) {
        var result,
            subexpression = this.getColumnFilter(columnName);

        if (subexpression) {
            if (!(options && options.syntax)) {
                options = options || {};
                options.syntax = 'CQL';
            }
            result = subexpression.getState(options);
        } else {
            result = '';
        }

        return result;
    },

    /**
     *
     * @param columnName
     * @param {string|object} [state] - If undefined, removes column filter from the filter tree.
     *
     * Otherwise, column filter is replaced (if it already exists) or added (if new).
     * @param {filterTreeSetStateOptionsObject} [options] - You may mix in members of ValidationOptionsObject.
     * @param {boolean} [options.syntax='CQL'] For other possible values, see `filterTreeSetStateOptionsObject`.
     *
     * @returns {undefined|Error|string} `undefined` indicates success.

     * @memberOf DefaultFilter.prototype
     */
    setColumnFilterState: function(columnName, state, options) {
        var error,
            subexpression = this.getColumnFilter(columnName);

        if (state) {
            options = _({}).extend(options); // clone it because we may mutate it below
            options.syntax = options.syntax || 'CQL';

            // on first use, set up a new CQL instance for this column filter's subtree bound to column properties
            if (options.syntax === 'CQL') {
                // Convert some CQL state syntax into a filter tree state object.
                // There must be at least one complete expression or `state` will become undefined.
                try {
                    state = this.root.parserCQL.parse(state, { columnName: columnName });
                    if (state) {
                        options.syntax = 'object';
                    } else {
                        error = new Error('DefaultFilter: No complete expression.');
                    }
                } catch (e) {
                    error = e.message || e;
                    console.warn(error);
                }
            }

            if (!error) { // parse successful
                if (subexpression) { // subexpression already exists
                    // replace subexpression representing this column
                    subexpression.setState(state, options);
                } else {
                    // add a new subexpression representing this column
                    state = this.parseStateString(state, options); // because .add() only takes object syntax
                    subexpression = this.columnFilters.add(state);
                }
                error = subexpression.invalid(options);
            }
        }

        if (error && subexpression) {
            // remove subexpression representing this column
            subexpression.remove();
        }

        return error;
    },

    /**
     *
     * @param {string} [options.syntax='object'] - The syntax to use to describe the filter state.
     *
     * NOTE: Not all available syntaxes include the meta-data.
     *
     * NOTE: The `'CQL'` syntax is intended for column filters only. Do *not* use for table filter state! It does not support subexpressions and will throw an error if it encounters any subexpressions.
     *
     * @returns {*|FilterTreeStateObject}
     *
     * @memberOf DefaultFilter.prototype
     */
    getColumnFiltersState: function(options) {
        return this.root.columnFilters.getState(options);
    },

    /**
     * @param {string} state
     * @param {filterTreeSetStateOptionsObject} [options] - You may mix in members of ValidationOptionsObject.
     * @param {boolean} [options.syntax='CQL'] For other possible values, see `filterTreeSetStateOptionsObject`.
     *
     * @returns {undefined|Error|string} `undefined` indicates success.
     *
     * @memberOf DefaultFilter.prototype
     */
    setColumnFiltersState: function(state, options) {
        var error;

        if (state) {
            this.root.columnFilters.setState(state, options);
            error = this.root.columnFilters.invalid(options);
        }

        return error;
    },

    /**
     *
     * @param {string} [options.syntax='object'] - The syntax to use to describe the filter state.
     *
     * NOTE: Not all available syntaxes include the meta-data.
     *
     * NOTE: The `'CQL'` syntax is intended for column filters only. Do *not* use for table filter state! It does not support subexpressions and will throw an error if it encounters any subexpressions.
     *
     * @returns {*|FilterTreeStateObject}
     *
     * @memberOf DefaultFilter.prototype
     */
    getTableFilterState: function(options) {
        return this.root.tableFilter.getState(options);
    },

    /**
     * @param {string} state
     * @param {filterTreeSetStateOptionsObject} [options] - You may mix in members of ValidationOptionsObject.
     * @param {boolean} [options.syntax='auto'] For other possible values, see  `filterTreeSetStateOptionsObject`.
     *
     * @returns {undefined|Error|string} `undefined` indicates success.
     *
     * @memberOf DefaultFilter.prototype
     */
    setTableFilterState: function(state, options) {
        var error;

        if (state) {
            this.root.tableFilter.setState(state, options);
            error = this.root.tableFilter.invalid(options);
        }

        return error;
    },

    /**
     * @desc The CQL syntax should only be requested for a subtree containing homogeneous column names and no subexpressions.
     *
     * @param {string} [options.syntax='object'] - If `'CQL'`, walks the tree, returning a string suitable for a Hypergrid filter cell. All other values are forwarded to the prototype's `getState` method for further interpretation.
     *
     * @returns {FilterTreeStateObject}
     *
     * @memberOf DefaultFilter.prototype
     */
    getState: function getState(options) {
        var result,
            syntax = options && options.syntax;

        if (syntax === 'CQL') {
            var operator = this.operator.substr(3); // remove the 'op-' prefix
            result = '';
            this.children.forEach(function(child, idx) {
                if (child) {
                    if (child instanceof CustomFilterLeaf) {
                        if (idx) {
                            result += ' ' + operator + ' ';
                        }
                        result += child.getState(options);
                    } else if (child.children.length) {
                        throw new Error('DefaultFilter: Expected a conditional but found a subexpression. Subexpressions are not supported in CQL (Column Query Language, the filter cell syntax).');
                    }
                }
            });
        } else {
            result = FilterTree.prototype.getState.call(this, options);
        }

        return result;
    }
});

module.exports = DefaultFilter;
