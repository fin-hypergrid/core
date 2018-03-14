(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var DefaultFilter = require('./js/DefaultFilter');
var ColumnSchemaFactory = require('./js/ColumnSchemaFactory');
var FilterSubgrid = require('./js/FilterSubgrid');

/**
 * @param {Hypergrid} grid
 * @param {object} [targets] - Hash of mixin targets. These are typically prototype objects. If not given or any targets are missing, defaults to current grid's various prototypes.
 * @constructor
 */
function Hyperfilter(grid, targets) {
    this.grid = grid;
    this.install(targets);
}

Hyperfilter.prototype = {
    constructor: Hyperfilter.prototype.constructor,

    name: 'Hyperfilter',

    install: function(targets) {
        targets = targets || {};

        var behavior = this.grid.behavior,
            BehaviorPrototype = targets.BehaviorPrototype || targets.Behavior && targets.Behavior.prototype,
            DataModelPrototype = targets.DataModelPrototype || targets.DataModel && targets.DataModel.prototype || Object.getPrototypeOf(behavior.dataModel),
            subgrids = behavior.subgrids;

        if (!BehaviorPrototype) {
            BehaviorPrototype = behavior;
            do {
                BehaviorPrototype = Object.getPrototypeOf(BehaviorPrototype);
            }
                while (BehaviorPrototype.$$CLASS_NAME !== 'Behavior');
        }

        // Register in case a subgrid list is included in state object of a subsequent grid instantiation
        behavior.dataModels.FilterSubgrid = FilterSubgrid;

        if (!subgrids.lookup.filter) {
            var index = subgrids.indexOf(subgrids.lookup.header) + 1,
                subgrid = behavior.createSubgrid(FilterSubgrid);
            subgrids.splice(index, 0, subgrid);
        }

        Object.getPrototypeOf(this.grid).mixIn(require('./mix-ins/grid'));

        BehaviorPrototype.mixIn(require('./mix-ins/behavior'));
        DataModelPrototype.mixIn(require('./mix-ins/dataModel'));
    },

    /**
     * May be adjusted before calling {@link HyperFilter#create|create}.
     * @default
     * @type {boolean}
     */
    caseSensitiveData: true,

    /**
     * May be adjusted before calling {@link HyperFilter#create|create}.
     * @default
     * @type {boolean}
     */
    caseSensitiveColumnNames: true,

    /**
     * May be adjusted before calling {@link HyperFilter#create|create}.
     * @default
     * @type {boolean}
     */
    resolveAliases: false,

    /**
     * May be adjusted before calling {@link HyperFilter#create|create}.
     * @default
     * @type {string}
     */
    defaultColumnFilterOperator: '', // blank means use default ('=')

    /**
     * @param {function|menuItem[]} [schema] - If omitted, derives a schema. If a function, derives a schema and calls it with for possible modifications
     */
    create: function(schema) {
        if (!schema) {
            schema = new ColumnSchemaFactory(this.grid.behavior.allColumns).schema;
        } else if (typeof schema === 'function') {
            var factory = new ColumnSchemaFactory(this.grid.behavior.allColumns);
            schema.call(factory);
            schema = factory.schema;
        }
        return new DefaultFilter({
            schema: schema,
            caseSensitiveData: this.caseSensitiveData,
            caseSensitiveColumnNames: this.caseSensitiveColumnNames,
            resolveAliases: this.resolveAliases,
            defaultColumnFilterOperator: this.defaultColumnFilterOperator
        });
    }
};

window.fin.Hypergrid.Hyperfilter = Hyperfilter;

},{"./js/ColumnSchemaFactory":2,"./js/DefaultFilter":3,"./js/FilterSubgrid":4,"./mix-ins/behavior":6,"./mix-ins/dataModel":7,"./mix-ins/grid":8}],2:[function(require,module,exports){
'use strict';

var popMenu = require('pop-menu');

/**
 * @classdesc Build, organize, and sort a column schema list from a list of columns.
 *
 * FilterTree requires a column schema. As a fallback when you don't have a column schema of your own, the string array returned by behavior.dataModel.getFields() would work as is. This factory object will do a little better than that, taking Hypergrid's column array and creating a more textured column schema, including column aliases and types.
 *
 * CAVEAT: Set up the schema completely before instantiating your filter state. Filter-tree uses the schema (in part) to generate column selection drop-downs as part of its "query builder" UI. Note that the UI is *not* automatically updated if you change the schema later.
 *
 * @param {Column[]} columns
 * @constructor
 */
function ColumnSchemaFactory(columns) {
    /**
     * This is the output produced by the factory.
     * @type {menuItem[]}
     */
    this.schema = columns.map(function(column) {
        var item = {
            name: column.name,
            alias: column.header,
            type: column.getType()
        };

        if (column.calculator) {
            item.calculator = column.calculator;
        }

        return item;
    });

    this.schema.walk = popMenu.walk;
    this.schema.lookup = popMenu.lookup;
}

var placementPrefixMap = {
    top: '\u0000',
    bottom: '\uffff',
    undefined: ''
};

ColumnSchemaFactory.prototype = {

    constructor: ColumnSchemaFactory.prototype.constructor,

    /**
     * Organize schema into submenus.
     * @param {RegExp} columnGroupsRegex - Schema names or aliases that match this are put into a submenu.
     * @param {string} [options.key='name'] - Must be either 'name' or 'alias'.
     */
    organize: function(columnGroupsRegex, options) {
        var key = options && options.key || 'name',
            submenus = {},
            menu = [];

        this.schema.forEach(function(item) {
            var value = item[key],
                group = value.match(columnGroupsRegex);
            if (group) {
                group = group[0];
                if (!(group in submenus)) {
                    submenus[group] = {
                        label: group.toUpperCase(),
                        submenu: []
                    };
                }
                submenus[group].submenu.push(item);
            } else {
                menu.push(item);
            }
        });

        for (var submenuName in submenus) {
            menu.push(submenus[submenuName]);
        }

        this.schema = menu;
    },

    lookup: function(findOptions, value) {
        return popMenu.lookup.apply(this.schema, arguments);
    },

    walk: function(iteratee) {
        return popMenu.walk.apply(this.schema, arguments);
    },

    /**
     * Overlays a custom schema on top of the derived schema.
     * This is an easy way to include hidden columns that might have been omitted from your custom schema.
     * @param customSchema
     */
    overlay: function(customSchema) {
        var lookup = this.schema.lookup;
        this.schema.walk(function(columnSchema) {
            return lookup.call(customSchema, function(customColumnSchema) {
                return customColumnSchema.name === columnSchema.name;
            });
        });
    },

    /**
     * @summary Sort the schema.
     * @desc Walk the menu structure, sorting each submenu until finally the top-level menu is sorted.
     * @param {boolean} [submenuPlacement] - One of:
     * * `'top'` - Place all the submenus at the top of each enclosing submenu.
     * * `'bottom'` - Place all the submenus at the bottom of each enclosing submenu.
     * * `undefined` (or omitted) - Give no special treatment to submenus.
     */
    sort: function(submenuPlacement) {
        var prefix = placementPrefixMap[submenuPlacement];

        this.schema.sort(function recurse(a, b) {
            if (a.label && !a.sorted) {
                a.submenu.sort(recurse);
                a.sorted = true;
            }
            a = a.label ? prefix + a.label : a.alias || a.name || a;
            b = b.label ? prefix + b.label : b.alias || b.name || b;
            return a < b ? -1 : a > b ? 1 : 0;
        });
    }
};

module.exports = ColumnSchemaFactory;

},{"pop-menu":24}],3:[function(require,module,exports){
'use strict';

var FilterTree = require('filter-tree');
var ParserCQL = require('./parser-CQL');

// Add a property `menuModes` to th e tree, defaulting to `operators` as the only active mode
FilterTree.Node.optionsSchema.menuModes = {
    default: {
        operators: 1
    }
};

// Add `opMenuGroups` to prototype because needed by FilterBox.
FilterTree.Node.prototype.opMenuGroups = FilterTree.Conditionals.groups;

function quote(text) {
    var qt = ParserCQL.qt;
    return qt + text.replace(new RegExp(qt, 'g'), qt + qt) + qt;
}

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

var conditionalsCQL = new FilterTree.Conditionals();
conditionalsCQL.makeLIKE = function(beg, end, op, originalOp, c) {
    op = originalOp.toLowerCase();
    return op + ' ' + quote(c.operand);
};
conditionalsCQL.makeIN = function(op, c) {
    return op.toLowerCase() + ' (' + c.operand.replace(/\s*,\s*/g, ', ') + ')';
};
conditionalsCQL.make = function(op, c) {
    var numericOperand;
    op = op.toLowerCase();
    if (/\w/.test(op)) { op += ' '; }
    op += c.getType() === 'number' && !isNaN(numericOperand = Number(c.operand))
        ? numericOperand
        : quote(c.operand);
    return op;
};

// replace the default filter tree terminal node constructor with an extension of same
var CustomFilterLeaf = FilterTree.prototype.addEditor({
    getState: function getState(options) {
        var result,
            syntax = options && options.syntax;

        if (syntax === 'CQL') {
            result = this.getSyntax(conditionalsCQL);
            result = convertLikeToPseudoOp(result);
            var defaultOp = this.schema.lookup(this.column).defaultOp || this.root.parserCQL.defaultOp; // mimics logic in parser-CQL.js, line 110
            if (result.toUpperCase().indexOf(defaultOp) === 0) {
                result = result.substr(defaultOp.length);
            }
        } else {
            result = FilterTree.Leaf.prototype.getState.call(this, options);
        }

        return result;
    }
});

FilterTree.prototype.addEditor('Columns');

// Add some node templates by updating shared instance of FilterNode's templates. (OK to mutate shared instance; filter-tree not being used for anything else here. Alternatively, we could have instantiated a new Templates object for our DefaultFilter prototype, although this would only affect tree nodes, not leaf nodes, but that would be ok in this case since the additions below are tree node templates.)
Object.assign(FilterTree.Node.prototype.templates, {
    columnFilter: [
        '<span class="filter-tree">',
        '   <strong><span>{2} </span></strong><br>',
        '   Match',
        '   <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-or">any</label>',
        '   <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-and">all</label>',
        '   <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-nor">none</label>',
        '   of the following:',
        '   <select>',
        '       <option value="">New expression&hellip;</option>',
        '   </select>',
        '   <ol></ol>',
        '</span>'
    ]
        .join('\n'),

    columnFilters: [
        '<span class="filter-tree filter-tree-type-column-filters">',
        '   Match <strong>all</strong> of the following column filter subexpressions:',
        '   <ol></ol>',
        '</span>'
    ]
        .join('\n')
});

/** @constructor
 *
 * @desc This extension of FilterTree forces a specific tree structure.
 * See {@link makeNewRoot} for a description.
 *
 * See also {@tutorial filter-api}.
 *
 * @param {FilterTreeOptionsObject} options - You should provide a column schema. The easiest approach is to provide a schema for the entire filter tree through `options.schema`.
 *
 * Although not recommended, the column schema can also be embedded in the state object, either at the root, `options.state.schema`, or for any descendant node. For example, a separate schema could be provided for each expression or subexpression that need to render column list drop-downs.
 *
 * NOTE: If `options.state` is undefined, it is defined in `preInitialize()` as a new empty state scaffold (see {@link makeNewRoot}) with the two trunks to hold a table filter and column filters. Expressions and subexpressions can be added to this empty scaffold either programmatically or through the Query Builder UI.
 */
var DefaultFilter = FilterTree.extend('DefaultFilter', {
    preInitialize: function(options) {
        options = options || {};

        // Set up the default "Hyperfilter" profile (see function comments)
        var state = options.state = options.state || this.makeNewRoot();

        // Upon creation of a 'columnFilter' node, force the schema to the one column
        if ((options.type || state && state.type) === 'columnFilter') {
            this.schema = [
                options.parent.root.schema.lookup(state.children[0].column)
            ];
        }

        return [options];
    },

    initialize: function(options) {
        this.cache = {};

        if (!this.parent) {
            this.extractSubtrees();
        }
    },

    postInitialize: function(options) {
        if (this === this.root && !this.parserCQL) {
            this.parserCQL = new ParserCQL(this.conditionals.ops, {
                schema: this.schema,
                defaultOp: options.defaultColumnFilterOperator
            });
        }

        if (this.type === 'columnFilter') {
            this.dontPersist.schema = true;
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
     * @desc Each column filter subexpression node is a child node of the `columnFilters` trunk of the Hypergrid filter tree.
     * Each such node contains all the column filter expressions for the named column. It will never be empty; if there is no column filter for the named column, it won't exist in `columnFilters`.
     *
     * CAUTION: This is the actual node object. Do not confuse it with the column filter _state_ object (for which see the {@link DefaultFilter#getColumnFilterState|getColumnFilterState()} method).
     * @param {string} columnName
     * @returns {undefined|DefaultFilter} Returns `undefined` if the column filter does not exist.
     * @memberOf DefaultFilter.prototype
     */
    getColumnFilter: function(columnName) {
        return this.columnFilters.children.find(function(columnFilter) {
            return columnFilter.children.length && columnFilter.children[0].column === columnName;
        });
    },

    /** @typedef {object} FilterTreeGetStateOptionsObject
     * See the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeGetStateOptionsObject|type definition} in the filter-tree documentation.
     */

    /** @typedef {object} FilterTreeSetStateOptionsObject
     * See the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeSetStateOptionsObject|type definition} in the filter-tree documentation.
     */

    /**
     * @summary Get a particular column filter's state.
     * @param {string} rawColumnName - Column name for case and alias lookup.
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf DefaultFilter.prototype
     */
    getColumnFilterState: function(rawColumnName, options) {
        var result = '',
            columnSchema = this.schema.lookup(rawColumnName);

        if (columnSchema) {
            var subexpression = this.getColumnFilter(columnSchema.name);

            if (subexpression) {
                if (!(options && options.syntax)) {
                    options = options || {};
                    options.syntax = 'CQL';
                }
                result = subexpression.getState(options);
            }
        }

        return result;
    },

    /**
     * @summary Set a particular column filter's state.
     * @desc Adds CQL support to this.getState(). This function throws parser errors.
     *
     * @param {string} columnName
     *
     * @param {string|object} [state] - A filter tree object or a JSON, SQL, or CQL subexpression string that describes the a new state for the named column filter. The existing column filter subexpression is replaced with a new node based on this state. If it does not exist, the new subexpression is added to the column filters subtree (`this.root.columnFilters`).
     *
     * If undefined, removes the entire column filter subexpression from the column filters subtree.
     *
     * @param {string} rawColumnName - Column name for case and alias lookup.
     *
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     *
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `setColumnFilterState`'s default syntax, `'CQL'`, differs from the other get state methods.
     *
     * @memberOf DefaultFilter.prototype
     */
    setColumnFilterState: function(rawColumnName, state, options) {
        var error,
            subexpression;

        var columnName = this.schema.lookup(rawColumnName).name;

        if (!columnName) {
            throw 'Unknown column name "' + rawColumnName + '"';
        }

        subexpression = this.getColumnFilter(columnName);

        if (state) {
            options = Object.assign({}, options); // clone it because we may mutate it below
            options.syntax = options.syntax || 'CQL';

            if (options.syntax === 'CQL') {
                // Convert some CQL state syntax into a filter tree state object.
                // There must be at least one complete expression or `state` will become undefined.
                try {
                    state = this.root.parserCQL.parse(state, columnName);
                    if (state) {
                        options.syntax = 'object';
                    } else {
                        error = new Error('DefaultFilter: No complete expression.');
                    }
                } catch (e) {
                    error = e;
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

        if (subexpression && (!state || error)) {
            // remove subexpression representing this column
            subexpression.remove();
        }

        if (error) {
            throw error;
        }
    },

    /**
     * @summary Get state of all column filters.
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf DefaultFilter.prototype
     */
    getColumnFiltersState: function(options) {
        if (options && options.syntax === 'CQL') {
            throw 'The CQL syntax is intended for use on a single column filter only. It does not support multiple columns or subexpressions.';
        }
        return this.root.columnFilters.getState(options);
    },

    /**
     * @summary Set state of all column filters.
     * @desc Note that the column filters implementation depends on the nodes having certain meta-data; you should not be calling this without these meta-data being in place. Specifically `type = 'columnFilters'` and  `keep = true` for the column filters subtree and`type = 'columnFilter'` for each individual column filter subexpression. In addition the subtree operators should always be `'op-and'`.
     * @param {string} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
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
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf DefaultFilter.prototype
     */
    getTableFilterState: function(options) {
        if (options && options.syntax === 'CQL') {
            throw 'The CQL syntax is intended for use on a single column filter only. It does not support multiple columns or subexpressions.';
        }
        return this.root.tableFilter.getState(options);
    },

    /**
     * @param {string} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf DefaultFilter.prototype
     */
    setTableFilterState: function(state, options) {
        var error;

        if (state) {
            this.root.tableFilter.setState(state, options);
            error = this.root.tableFilter.invalid(options);
        } else {
            this.root.tableFilter.children.length = 0;
        }

        return error;
    },

    /**
     * @desc The CQL syntax should only be requested for a subtree containing homogeneous column names and no subexpressions.
     *
     * @param {string} [options.syntax='object'] - If `'CQL'`, walks the tree, returning a string suitable for a Hypergrid filter cell. All other values are forwarded to the prototype's `getState` method for further interpretation.
     *
     * NOTE: CQL is not intended to be used outside the context of a `columnFilters` subexpression.
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
    },

    /** @summary List of filter properties to be treated as first class objects.
     * @desc On filter property set, for a property value that is a function:
     * * If listed here, function it self is assigned to property.
     * * If _not_ listed here, function will be executed to get value to assign to property.
     * @memberOf DefaultFilter.prototype
     */
    firstClassProperties: {
        calculator: true
    },

    get enabled() {
        return this.columnFilters.children.length > 0 ||
            this.tableFilter.children.length > 0;
    },

    /**
     * @implements dataControlInterface#properties
     * @desc Notes regarding specific properties:
     * * `caseSensitiveData` (root property) pertains to string compares only. This includes untyped columns, columns typed as strings, typed columns containing data that cannot be coerced to type or when the filter expression operand cannot be coerced. This is a shared property and affects all grids managed by this instance of the app.
     * * `calculator` (column property) Computed column calculator.
     *
     * @returns One of:
     * * **Getter** type call: Value of requested property or `null` if undefined.
     * * **Setter** type call: `undefined`
     *
     * @memberOf DefaultFilter.prototype
     */
    properties: function(properties) {
        var result, value,
            object = properties && properties.COLUMN
                ? this.schema.lookup(properties.COLUMN.name)
                : this.root;

        if (properties && object) {
            if (properties.GETTER) {
                result = object[alias(properties.GETTER)];
                if (result === undefined) {
                    result = null;
                }
            } else {
                for (var key in properties) {
                    value = properties[key];
                    if (typeof value === 'function' && !this.firstClassProperties[key]) {
                        object[alias(key)] = value();
                    } else {
                        object[alias(key)] = value;
                    }
                }
            }
        }

        return result;
    }
});

function alias(key) {
    if (key === 'header') {
        key = 'alias';
    }
    return key;
}


module.exports = DefaultFilter;

},{"./parser-CQL":5,"filter-tree":12}],4:[function(require,module,exports){
'use strict';

/**
 * @implements dataModelAPI
 * @param {Hypergrid} grid
 * @param {object} [options]
 * @param {string} [options.name]
 * @constructor
 */
function FilterSubgrid(grid, options) {
    this.grid = grid;
    this.behavior = grid.behavior;

    /**
     * @type {dataRowObject}
     */
    this.dataRow = {}; // for meta data (__HEIGHT)

    if (options && options.name) {
        this.name = options.name;
    }
}

FilterSubgrid.prototype = {
    constructor: FilterSubgrid.prototype.constructor,

    type: 'filter',

    format: 'filter', // override column format

    getRowCount: function() {
        return this.grid.properties.showFilterRow ? 1 : 0;
    },

    getValue: function(x, y) {
        return this.behavior.dataModel.getFilter(x) || '';
    },

    setValue: function(x, y, value) {
        this.behavior.dataModel.setFilter(x, value);
    },

    getRow: function(y) {
        return this.dataRow;
    }
};

module.exports = FilterSubgrid;

},{}],5:[function(require,module,exports){
'use strict';

var _ = require('object-iterators');

var REGEXP_BOOLS = /\b(AND|OR|NOR)\b/gi,
    EXP = '(.*?)', BR = '\\b',
    PREFIX = '^' + EXP + BR,
    INFIX = BR + EXP + BR,
    POSTFIX = BR + EXP + '$';

function ParserCqlError(message) {
    this.message = message;
}
ParserCqlError.prototype = Object.create(Error.prototype);
ParserCqlError.prototype.name = 'ParserCqlError';

/**
 * @constructor
 *
 * @summary Column Query Language (CQL) parser
 *
 * @author Jonathan Eiten jonathan@openfin.com
 *
 * @desc See {@tutorial CQL} for the grammar.
 *
 * @param {object} operatorsHash - Hash of valid operators.
 * @param {object} [options]
 * @param {menuItem[]} [options.schema] - Column schema for column name/alias validation. Throws an error if name fails validation (but see `resolveAliases`). Omit to skip column name validation.
 * @param {boolean} [options.defaultOp='='] - Default operator for column when not defined in column schema.
 */
function ParserCQL(operatorsHash, options) {
    var operators = [];

    this.schema = options && options.schema;
    this.defaultOp = (options && options.defaultOp || '=').toUpperCase();

    _(operatorsHash).each(function(props, op) {
        if (op !== 'undefined') {
            operators.push(op);
        }
    });

    // Put larger ones first so that in case a smaller one is a substring of a larger one (such as '<' is to '<='), larger one will be matched first.
    operators = operators.sort(descendingByLength);

    // Escape all symbolic (non alpha) operators.
    operators = operators.map(function(op) {
        if (/^[^A-Z]/.test(op)) {
            op = '\\' + op.split('').join('\\');
        }
        return op;
    });

    var symbolicOperators = operators.filter(function(op) { return op[0] === '\\'; }),
        alphaOperators = operators.filter(function(op) { return op[0] !== '\\'; }).join('|');

    if (alphaOperators) {
        alphaOperators = '\\b(' + alphaOperators + ')\\b';
    }
    /** @summary Regex to match any operator.
     * @desc Matches symbolic operators (made up of non-alpha characters) or identifier operators (word-boundary-isolated runs of alphanumeric characters).
     * @type {RegExp}
     */
    this.REGEX_OPERATOR = new RegExp(symbolicOperators.concat(alphaOperators).join('|'), 'ig');

    operators = operators.join('|') // pipe them
        .replace(/\s+/g, '\\s+'); // arbitrary string of whitespace chars -> whitespace regex matcher

    /** @summary Regex to match an operator + optional operator
     * @desc THe operator is optional. The operand may (or may not) be enclosed in parentheses.
     * @desc Match list:
     * 0. _input string_
     * 1. operator
     * 2. outer operand (may include parentheses)
     * 3. inner operand without parentheses (when an operand was given with parentheses)
     * 4. inner operand (when an operand was given without parentheses)
     * @type {RegExp}
     * @private
     * @memberOf ParserCQL.prototype
     */
    this.REGEX_EXPRESSION = new RegExp('^\\s*(' + operators + ')?\\s*(\\(\\s*(.+?)\\s*\\)|(.+?))\\s*$', 'i');

    this.REGEX_LITERAL_TOKENS = new RegExp('\\' + ParserCQL.qt + '(\\d+)' + '\\' + ParserCQL.qt, 'g');

}

/** @summary Operand quotation mark character.
 * @desc Should be a single character (length === 1).
 * @default '"'
 * @type {string}
 */
ParserCQL.qt = '"';

ParserCQL.prototype = {

    constructor: ParserCQL.prototype.constructor,

    /**
     * @summary Extract the boolean operators from an expression chain.
     * @desc Returns list of homogeneous operators transformed to lower case.
     *
     * Throws an error if all the boolean operators in the chain are not identical.
     * @param {string} cql
     * @returns {string[]}
     */
    captureBooleans: function(cql) {
        var booleans = cql.match(REGEXP_BOOLS);
        return booleans && booleans.map(function(bool) {
            return bool.toLowerCase();
        });
    },

    validateBooleans: function(booleans) {
        if (booleans) {
            var heterogeneousOperator = booleans.find(function(op, i) {
                return booleans[i] !== booleans[0];
            });

            if (heterogeneousOperator) {
                throw new ParserCqlError('Expected homogeneous boolean operators. You cannot mix AND, OR, and NOR operators here because the order of operations is ambiguous.\nTip: In Manage Filters, you can group operations with subexpressions in the Query Builder tab or by using parentheses in the SQL tab.');
            }
        }
        return booleans;
    },

    /**
     * @summary Break an expression chain into a list of expressions.
     * @param {string} cql
     * @param {string[]} booleans
     * @returns {string[]}
     */
    captureExpressions: function(cql, booleans) {
        var expressions, re;

        if (booleans) {
            re = new RegExp(PREFIX + booleans.join(INFIX) + POSTFIX, 'i');
            expressions = cql.match(re);
            expressions.shift(); // discard [0] (input)
        } else {
            expressions = [cql];
        }

        return expressions;
    },

    /**
     * @summary Make a list of children out of a list of expressions.
     * @desc Uses only _complete_ expressions (a value OR an operator + a value).
     *
     * Ignores _incomplete_ expressions (empty string OR an operator - a value).
     *
     * @param {string} columnName
     * @param {string[]} expressions
     * @param {string[]} literals - list of literals indexed by token
     *
     * @returns {expressionState[]} where `expressionState` is one of:
     * * `{column: string, operator: string, operand: string}`
     * * `{column: string, operator: string, operand: string, editor: 'Columns'}`
     */
    makeChildren: function(columnName, expressions, literals) {
        var self = this;
        return expressions.reduce(function(children, exp) {
            if (exp) {
                var parts = exp.match(self.REGEX_EXPRESSION);
                if (parts) {
                    var op = parts[1],
                        outerLiteral = parts[2],
                        innerLiteral = parts.slice(3).find(function(part) {
                            return part !== undefined;
                        });

                    op = (op || '').replace(/\s+/g, ' ').trim().toUpperCase();

                    var parenthesized = /^\(.*\)$/.test(outerLiteral),
                        innerOperators = innerLiteral.match(self.REGEX_OPERATOR);

                    if (!parenthesized && innerOperators) {
                        if (op === '' && outerLiteral === innerOperators[0]) {
                            throw new ParserCqlError('Expected an operand.');
                        }

                        throw new ParserCqlError(
                            'Expected operand but found additional operator(s): ' +
                            innerOperators
                                .toString() // convert to comma-separated list
                                .toUpperCase()
                                .replace(/,/g, ', ') // add spaces after the commas
                                .replace(/^([^,]+), ([^,]+)$/, '$1 and $2') // replace only comma with "and"
                                .replace(/(.+,.+), ([^,]+)$/, '$1, and $2') // add "and" after last of several commas
                        );
                    }

                    op = op ||
                        self.schema && self.schema.lookup(columnName).defaultOp || // column's default operator from schema
                        self.defaultOp; // grid's default operator

                    var child = {
                        column: columnName,
                        operator: op
                    };

                    var fieldName = self.schema && self.schema.lookup(innerLiteral);
                    if (fieldName) {
                        child.operand = fieldName.name || fieldName;
                        child.editor = 'Columns';
                    } else {
                        // Find and expand all collapsed literals.
                        child.operand = innerLiteral.replace(self.REGEX_LITERAL_TOKENS, function(match, index) {
                            return literals[index];
                        });
                    }

                    children.push(child);
                }

                return children;
            }
        }, []);
    },

    /**
     * @summary The position of the operator of the expression under the cursor.
     * @param {string} cql - CQL expression under construction.
     * @param {number} cursor - Current cursor's starting position (`input.startSelection`)
     * @returns {{start: number, end: number}}
     */
    getOperatorPosition: function(cql, cursor) {
        // first tokenize literals in case they contain booleans...
        var literals = [];
        cql = tokenizeLiterals(cql, ParserCQL.qt, literals);

        // ...then expand tokens but with x's just for length
        cql = cql.replace(this.REGEX_LITERAL_TOKENS, function(match, index) {
            var length = 1 + literals[index].length + 1; // add quote chars
            return Array(length + 1).join('x');
        });

        var booleans, expressions, position, tabs, end, tab, expression, oldOperator, oldOperatorOffset;

        if ((booleans = this.captureBooleans(cql))) {
            // boolean(s) found so concatenated expressions
            expressions = this.captureExpressions(cql, booleans);
            position = 0;
            tabs = expressions.map(function(expr, idx) { // get starting position of each expression
                var bool = booleans[idx - 1] || '';
                position += expr.length + bool.length;
                return position;
            });

            // find beginning of expression under cursor position
            tabs.find(function(tick, idx) {
                tab = idx;
                return cursor <= tick;
            });

            cursor = tabs[tab - 1] || 0;
            end = cursor += (booleans[tab - 1] || '').length;

            expression = expressions[tab];
        } else {
            // booleans not found so single expression
            cursor = 0;
            end = cql.length;
            expression = cql;
        }

        oldOperatorOffset = expression.search(this.REGEX_OPERATOR);
        if (oldOperatorOffset >= 0) {
            oldOperator = expression.match(this.REGEX_OPERATOR)[0];
            cursor += oldOperatorOffset;
            end = cursor + oldOperator.length;
        }

        return {
            start: cursor,
            end: end
        };
    },

    /**
     * @summary Make a "locked" subexpression definition object from an expression chain.
     * @desc _Locked_ means it is locked to a single field.
     *
     * When there is only a single expression in the chain, the `operator` is omitted (defaults to `'op-and'`).
     *
     * @param {string} cql - A compound CQL expression, consisting of one or more simple expressions all separated by the same logical operator).
     *
     * @param {string} columnName

     * @returns {undefined|{operator: string, children: string[], schema: string[]}}
     * `undefined` when there are no complete expressions
     *
     * @memberOf module:CQL
     */
    parse: function(cql, columnName) {
        // reduce all runs of white space to a single space; then trim
        cql = cql.replace(/\s\s+/g, ' ').trim();

        var literals = [];
        cql = tokenizeLiterals(cql, ParserCQL.qt, literals);

        var booleans = this.validateBooleans(this.captureBooleans(cql)),
            expressions = this.captureExpressions(cql, booleans),
            children = this.makeChildren(columnName, expressions, literals),
            operator = booleans && booleans[0],
            state;

        if (children.length) {
            state = {
                type: 'columnFilter',
                children: children
            };

            if (operator) {
                state.operator = 'op-' + operator;
            }
        }

        return state;
    }
};

function descendingByLength(a, b) {
    return b.length - a.length;
}

/**
 * @summary Collapse literals.
 * @desc Allows reserved words to exist inside a quoted string.
 * Literals are collapsed to a quoted numerical index into the `literals` array.
 * @param {string} text
 * @param {string} qt
 * @param {string[]} literals - Empty array in which to return extracted literals.
 * @returns {string}
 * @memberOf ParserCQL
 * @inner
 */
function tokenizeLiterals(text, qt, literals) {
    literals.length = 0;

    for (
        var i = 0, j = 0, k, innerLiteral;
        (j = text.indexOf(qt, j)) >= 0;
        j += 1 + (i + '').length + 1, i++
    ) {
        k = j;
        do {
            k = text.indexOf(qt, k + 1);
            if (k < 0) {
                throw new ParserCqlError('Quotation marks must be paired; nested quotation marks must be doubled.');
            }
        } while (text[++k] === qt);

        innerLiteral = text
            .slice(++j, --k) // extract
            .replace(new RegExp(qt + qt, 'g'), qt); // unescape escaped quotation marks

        literals.push(innerLiteral);

        text = text.substr(0, j) + i + text.substr(k); // collapse
    }

    return text;
}

module.exports = ParserCQL;

},{"object-iterators":22}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
     * @summary Get a particular column filter's state.
     * @param {string} columnName
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @param {boolean} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `getFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {FilterTreeStateObject}
     * @memberOf dataModels.JSON.prototype
     */
    getFilter: function(columnIndexOrName, options) {
        var isIndex = !isNaN(Number(columnIndexOrName)),
            columnName = isIndex ? this.schema[columnIndexOrName].name : columnIndexOrName;

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
            columnName = isIndex ? this.schema[columnIndexOrName].name : columnIndexOrName;

        this.filter.setColumnFilterState(columnName, state, options);
        this.grid.fireSyntheticFilterAppliedEvent();
        this.reindex();
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
        this.reindex();
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
        this.reindex();
    },

};

},{}],8:[function(require,module,exports){
'use strict';

module.exports = {

    /**
     * @summary The grid instance's filter data controller.
     * @desc This getter/setter is syntactic sugar for calls to `getController` and `setController`.
     *
     * In addition to a data model that accepts an data controller of type 'filter', to display the standard filter cells, the filter data controller also requires FilterSubgrid in the subgrids list.
     * @param {dataControlInterface|undefined|null} filter - One of:
     * * A filter object, turning filter *ON*.
     * * `undefined`, the null filter is reassigned to the grid, turning filtering *OFF.*
     * @memberOf Hypergrid#
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
     * @memberOf Hypergrid.prototype
     */
    getFilter: function(columnIndexOrName, options) {
        return this.behavior.getFilter(columnIndexOrName, options);
    },

    /**
     * @summary Set a particular column filter's state.
     * @desc After setting the new filter state:
     * * Reapplies the filter to the data source.
     * * Calls `behaviorChanged()` to update the grid canvas.
     * @param {number|string} columnIndexOrName - The _column filter_ to set.
     * @param {string|object} [state] - A filter tree object or a JSON, SQL, or CQL subexpression string that describes the a new state for the named column filter. The existing column filter subexpression is replaced with a new node based on this state. If it does not exist, the new subexpression is added to the column filters subtree (`filter.columnFilters`).
     *
     * If undefined, removes the entire column filter subexpression from the column filters subtree.
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @param {string} [options.syntax='CQL'] - The syntax to use to describe the filter state. Note that `setFilter`'s default syntax, `'CQL'`, differs from the other get state methods.
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Hypergrid.prototype
     */
    setFilter: function(columnIndexOrName, state, options) {
        if (this.cellEditor) {
            this.cellEditor.hideEditor();
        }
        this.behavior.setFilter(columnIndexOrName, state, options);
        this.behaviorChanged();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Hypergrid.prototype
     */
    getFilters: function(options) {
        return this.behavior.getFilters(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Hypergrid.prototype
     */
    setFilters: function(state, options) {
        if (this.cellEditor) {
            this.cellEditor.hideEditor();
        }
        this.behavior.setFilters(state, options);
        this.behaviorChanged();
    },

    /**
     * @param {FilterTreeGetStateOptionsObject} [options] - Passed to the filter's {@link DefaultFilter#getState|getState} method.
     * @returns {FilterTreeStateObject}
     * @memberOf Hypergrid.prototype
     */
    getTableFilter: function(options) {
        return this.behavior.getTableFilter(options);
    },

    /**
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options] - Passed to the filter's [setState]{@link http://joneit.github.io/filter-tree/FilterTree.html#setState} method. You may mix in members of the {@link http://joneit.github.io/filter-tree/global.html#FilterTreeValidationOptionsObject|FilterTreeValidationOptionsObject}
     * @returns {undefined|Error|string} `undefined` indicates success.
     * @memberOf Hypergrid.prototype
     */
    setTableFilter: function(state, options) {
        this.behavior.setTableFilter(state, options);
        this.behaviorChanged();
    },

};

},{}],9:[function(require,module,exports){
'use strict';

/* eslint-env browser */

/** @namespace cssInjector */

/**
 * @summary Insert base stylesheet into DOM
 *
 * @desc Creates a new `<style>...</style>` element from the named text string(s) and inserts it but only if it does not already exist in the specified container as per `referenceElement`.
 *
 * > Caveat: If stylesheet is for use in a shadow DOM, you must specify a local `referenceElement`.
 *
 * @returns A reference to the newly created `<style>...</style>` element.
 *
 * @param {string|string[]} cssRules
 * @param {string} [ID]
 * @param {undefined|null|Element|string} [referenceElement] - Container for insertion. Overloads:
 * * `undefined` type (or omitted): injects stylesheet at top of `<head>...</head>` element
 * * `null` value: injects stylesheet at bottom of `<head>...</head>` element
 * * `Element` type: injects stylesheet immediately before given element, wherever it is found.
 * * `string` type: injects stylesheet immediately before given first element found that matches the given css selector.
 *
 * @memberOf cssInjector
 */
function cssInjector(cssRules, ID, referenceElement) {
    if (typeof referenceElement === 'string') {
        referenceElement = document.querySelector(referenceElement);
        if (!referenceElement) {
            throw 'Cannot find reference element for CSS injection.';
        }
    } else if (referenceElement && !(referenceElement instanceof Element)) {
        throw 'Given value not a reference element.';
    }

    var container = referenceElement && referenceElement.parentNode || document.head || document.getElementsByTagName('head')[0];

    if (ID) {
        ID = cssInjector.idPrefix + ID;

        if (container.querySelector('#' + ID)) {
            return; // stylesheet already in DOM
        }
    }

    var style = document.createElement('style');
    style.type = 'text/css';
    if (ID) {
        style.id = ID;
    }
    if (cssRules instanceof Array) {
        cssRules = cssRules.join('\n');
    }
    cssRules = '\n' + cssRules + '\n';
    if (style.styleSheet) {
        style.styleSheet.cssText = cssRules;
    } else {
        style.appendChild(document.createTextNode(cssRules));
    }

    if (referenceElement === undefined) {
        referenceElement = container.firstChild;
    }

    container.insertBefore(style, referenceElement);

    return style;
}

/**
 * @summary Optional prefix for `<style>` tag IDs.
 * @desc Defaults to `'injected-stylesheet-'`.
 * @type {string}
 * @memberOf cssInjector
 */
cssInjector.idPrefix = 'injected-stylesheet-';

// Interface
module.exports = cssInjector;

},{}],10:[function(require,module,exports){
'use strict';

var overrider = require('overrider');

/** @namespace extend-me **/

/** @summary Extends an existing constructor into a new constructor.
 *
 * @returns {ChildConstructor} A new constructor, extended from the given context, possibly with some prototype additions.
 *
 * @desc Extends "objects" (constructors), with optional additional code, optional prototype additions, and optional prototype member aliases.
 *
 * > CAVEAT: Not to be confused with Underscore-style .extend() which is something else entirely. I've used the name "extend" here because other packages (like Backbone.js) use it this way. You are free to call it whatever you want when you "require" it, such as `var inherits = require('extend')`.
 *
 * Provide a constructor as the context and any prototype additions you require in the first argument.
 *
 * For example, if you wish to be able to extend `BaseConstructor` to a new constructor with prototype overrides and/or additions, basic usage is:
 *
 * ```javascript
 * var Base = require('extend-me').Base;
 * var BaseConstructor = Base.extend(basePrototype); // mixes in .extend
 * var ChildConstructor = BaseConstructor.extend(childPrototypeOverridesAndAdditions);
 * var GrandchildConstructor = ChildConstructor.extend(grandchildPrototypeOverridesAndAdditions);
 * ```
 *
 * This function (`extend()`) is added to the new extended object constructor as a property `.extend`, essentially making the object constructor itself easily "extendable." (Note: This is a property of each constructor and not a method of its prototype!)
 *
 * @param {string} [extendedClassName] - This is simply added to the prototype as $$CLASS_NAME. Useful for debugging because all derived constructors appear to have the same name ("Constructor") in the debugger.
 *
 * @param {extendedPrototypeAdditionsObject} [prototypeAdditions] - Object with members to copy to new constructor's prototype.
 *
 * @property {boolean} [debug] - See parameter `extendedClassName` _(above)_.
 *
 * @property {object} Base - A convenient base class from which all other classes can be extended.
 *
 * @memberOf extend-me
 */
function extend(extendedClassName, prototypeAdditions) {
    switch (arguments.length) {
        case 0:
            prototypeAdditions = {};
            break;
        case 1:
            switch (typeof extendedClassName) {
                case 'object':
                    prototypeAdditions = extendedClassName;
                    extendedClassName = undefined;
                    break;
                case 'string':
                    prototypeAdditions = {};
                    break;
                default:
                    throw 'Single-parameter overload must be either string or object.';
            }
            break;
        case 2:
            if (typeof extendedClassName !== 'string' || typeof prototypeAdditions !== 'object') {
                throw 'Two-parameter overload must be string, object.';
            }
            break;
        default:
            throw 'Too many parameters';
    }

    function Constructor() {
        if (this.preInitialize) {
            this.preInitialize.apply(this, arguments);
        }

        initializePrototypeChain.apply(this, arguments);

        if (this.postInitialize) {
            this.postInitialize.apply(this, arguments);
        }
    }

    Constructor.extend = extend;

    var prototype = Constructor.prototype = Object.create(this.prototype);
    prototype.constructor = Constructor;

    if (extendedClassName) {
        prototype.$$CLASS_NAME = extendedClassName;
    }

    overrider(prototype, prototypeAdditions);

    return Constructor;
}

function Base() {}
Base.prototype = {

    constructor: Base.prototype.constructor,

    /**
     * Access a member of the super class.
     * @returns {Object}
     */
    get super() {
        return Object.getPrototypeOf(Object.getPrototypeOf(this));
    },

    /**
     * Find member on prototype chain beginning with super class.
     * @param {string} memberName
     * @returns {undefined|*} `undefined` if not found; value otherwise.
     */
    superMember: function(memberName) {
        var parent = this.super;
        do { parent = Object.getPrototypeOf(parent); } while (!parent.hasOwnProperty(memberName));
        return parent && parent[memberName];
    },

    /**
     * Find method on prototype chain beginning with super class.
     * @param {string} methodName
     * @returns {function}
     */
    superMethod: function(methodName) {
        var method = this.superMember(methodName);
        if (typeof method !== 'function') {
            throw new TypeError('this.' + methodName + ' is not a function');
        }
        return method;
    },

    /**
     * Find method on prototype chain beginning with super class and call it with remaining args.
     * @param {string} methodName
     * @returns {*}
     */
    callSuperMethod: function(methodName) {
        return this.superMethod(methodName).apply(this, Array.prototype.slice.call(arguments, 1));
    }
};
Base.extend = extend;
extend.Base = Base;

/** @typedef {function} extendedConstructor
 * @property prototype.super - A reference to the prototype this constructor was extended from.
 * @property [extend] - If `prototypeAdditions.extendable` was truthy, this will be a reference to {@link extend.extend|extend}.
 */

/** @typedef {object} extendedPrototypeAdditionsObject
 * @desc All members are copied to the new object. The following have special meaning.
 * @property {function} [initialize] - Additional constructor code for new object. This method is added to the new constructor's prototype. Gets passed new object as context + same args as constructor itself. Called on instantiation after similar function in all ancestors called with same signature.
 * @property {function} [preInitialize] - Called before the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 * @property {function} [postInitialize] - Called after the `initialize` cascade. Gets passed new object as context + same args as constructor itself. If not defined here, the top-most (and only the top-most) definition found on the prototype chain is called.
 */

/** @summary Call all `initialize` methods found in prototype chain, beginning with the most senior ancestor's first.
 * @desc This recursive routine is called by the constructor.
 * 1. Walks back the prototype chain to `Object`'s prototype
 * 2. Walks forward to new object, calling any `initialize` methods it finds along the way with the same context and arguments with which the constructor was called.
 * @private
 * @memberOf extend-me
 */
function initializePrototypeChain() {
    var term = this,
        args = arguments;
    recur(term);

    function recur(obj) {
        var proto = Object.getPrototypeOf(obj);
        if (proto.constructor !== Object) {
            recur(proto);
            if (proto.hasOwnProperty('initialize')) {
                proto.initialize.apply(term, args);
            }
        }
    }
}

module.exports = extend;

},{"overrider":23}],11:[function(require,module,exports){
'use strict';

exports['column-CQL-syntax'] = [
'<li>',
'	<button type="button" class="copy"></button>',
'	<div class="filter-tree-remove-button" title="delete conditional"></div>',
'	{1}:',
'	<input name="{2}" class="{4}" value="{3:encode}">',
'</li>'
].join('\n');

exports['column-SQL-syntax'] = [
'<li>',
'	<button type="button" class="copy"></button>',
'	<div class="filter-tree-remove-button" title="delete conditional"></div>',
'	{1}:',
'	<textarea name="{2}" rows="1" class="{4}">{3:encode}</textarea>',
'</li>'
].join('\n');

exports.columnFilter = [
'<span class="filter-tree">',
'	 <strong><span>{2} </span>column filter subexpression:</strong><br>',
'	 Match',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-or">any</label>',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-and">all</label>',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-nor">none</label>',
'	 of the following:',
'	 <select>',
'		 <option value="">New expression&hellip;</option>',
'	 </select>',
'	 <ol></ol>',
' </span>'
].join('\n');

exports.columnFilters = [
'<span class="filter-tree filter-tree-type-column-filters">',
'	 Match <strong>all</strong> of the following column filters:',
'	 <ol></ol>',
' </span>'
].join('\n');

exports.lockedColumn = [
'<span>',
'	 {1:encode}',
'	 <input type="hidden" value="{2}">',
' </span>'
].join('\n');

exports.note = [
'<div class="footnotes">',
'	<div class="footnote"></div>',
'	<p>Select a new value or delete the expression altogether.</p>',
'</div>'
].join('\n');

exports.notes = [
'<div class="footnotes">',
'	<p>Note the following error conditions:</p>',
'	<ul class="footnote"></ul>',
'	<p>Select new values or delete the expression altogether.</p>',
'</div>'
].join('\n');

exports.optionMissing = [
'The requested value of <span class="field-name">{1:encode}</span>',
'(<span class="field-value">{2:encode}</span>) is not valid.'
].join('\n');

exports.removeButton = [
'<div class="filter-tree-remove-button" title="delete conditional"></div>'
].join('\n');

exports.subtree = [
'<span class="filter-tree">',
'	 Match',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-or">any</label>',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-and">all</label>',
'	 <label><input type="radio" class="filter-tree-op-choice" name="treeOp{1}" value="op-nor">none</label>',
'	 of the following:',
'	 <select>',
'		 <option value="">New expression&hellip;</option>',
'		 <option value="subexp" style="border-bottom:1px solid black">Subexpression</option>',
'	 </select>',
'	 <ol></ol>',
' </span>'
].join('\n');

},{}],12:[function(require,module,exports){
'use strict';

var _ = require('object-iterators');
var popMenu = require('pop-menu');

var FilterTree = require('./js/FilterTree');
FilterTree.Node = require('./js/FilterNode'); // aka: Object.getPrototypeOf(FilterTree.prototype).constructor
FilterTree.Leaf = require('./js/FilterLeaf'); // aka: FilterTree.prototype.editors.Default

// expose some objects for plug-in access

FilterTree.Conditionals = require('./js/Conditionals');

// FOLLOWING PROPERTIES ARE *** TEMPORARY ***,
// FOR THE DEMO TO ACCESS THESE NODE MODULES.

FilterTree._ = _;
FilterTree.popMenu = popMenu;


module.exports = FilterTree;

},{"./js/Conditionals":13,"./js/FilterLeaf":14,"./js/FilterNode":15,"./js/FilterTree":16,"object-iterators":22,"pop-menu":24}],13:[function(require,module,exports){
/** @module conditionals */

'use strict';

var Base = require('extend-me').Base;
var _ = require('object-iterators');
var regExpLIKE = require('regexp-like');

var IN = 'IN',
    NOT_IN = 'NOT ' + IN,
    LIKE = 'LIKE',
    NOT_LIKE = 'NOT ' + LIKE,
    LIKE_WILD_CARD = '%',
    NIL = '';

var toString;

var defaultIdQts = {
    beg: '"',
    end: '"'
};


/**
 * @constructor
 */
var Conditionals = Base.extend({
    /**
     * @param {sqlIdQtsObject} [options.sqlIdQts={beg:'"',end:'"'}]
     * @memberOf Conditionals#
     */
    initialize: function(options) {
        var idQts = options && options.sqlIdQts;
        if (idQts) {
            this.sqlIdQts = idQts; // only override if defined
        }
    },

    sqlIdQts: defaultIdQts,
    /**
     * @param id
     * @returns {string}
     * @memberOf Conditionals#
     */
    makeSqlIdentifier: function(id) {
        return this.sqlIdQts.beg + id + this.sqlIdQts.end;
    },

    /**
     * @param string
     * @returns {string}
     * @memberOf Conditionals#
     */
    makeSqlString: function(string) {
        return '\'' + sqEsc(string) + '\'';
    },

    /**
     * @memberOf Conditionals#
     */
    makeLIKE: function(beg, end, op, originalOp, c) {
        var escaped = c.operand.replace(/([_\[\]%])/g, '[$1]'); // escape all LIKE reserved chars
        return this.makeSqlIdentifier(c.column) +
            ' ' + op +
            ' ' + this.makeSqlString(beg + escaped + end);
    },

    /**
     * @memberOf Conditionals#
     */
    makeIN: function(op, c) {
        return this.makeSqlIdentifier(c.column) +
            ' ' + op +
            ' ' + '(\'' + sqEsc(c.operand).replace(/\s*,\s*/g, '\', \'') + '\')';
    },

    /**
     * @memberOf Conditionals#
     */
    make: function(op, c) {
        return this.makeSqlIdentifier(c.column) +
            ' ' + op +
            ' ' + c.makeSqlOperand();
    }
});

var ops = Conditionals.prototype.ops = {
    undefined: {
        test: function() { return true; },
        make: function() { return ''; }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '<': {
        test: function(a, b) { return a < b; },
        make: function(c) { return this.make('<', c); }
    },
    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '<=': {
        test: function(a, b) { return a <= b; },
        make: function(c) { return this.make('<=', c); }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '=': {
        test: function(a, b) { return a === b; },
        make: function(c) { return this.make('=', c); }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '>=': {
        test: function(a, b) { return a >= b; },
        make: function(c) { return this.make('>=', c); }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '>': {
        test: function(a, b) { return a > b; },
        make: function(c) { return this.make('>', c); }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    '<>': {
        test: function(a, b) { return a !== b; },
        make: function(c) { return this.make('<>', c); }
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    LIKE: {
        test: function(a, b) { return regExpLIKE.cached(b, true).test(a); },
        make: function(c) { return this.make(LIKE, c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    'NOT LIKE': {
        test: function(a, b) { return !regExpLIKE.cached(b, true).test(a); },
        make: function(c) { return this.make(NOT_LIKE, c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    IN: { // TODO: currently forcing string typing; rework calling code to respect column type
        test: function(a, b) { return inOp(a, b) >= 0; },
        make: function(c) { return this.makeIN(IN, c); },
        operandList: true,
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    'NOT IN': { // TODO: currently forcing string typing; rework calling code to respect column type
        test: function(a, b) { return inOp(a, b) < 0; },
        make: function(c) { return this.makeIN(NOT_IN, c); },
        operandList: true,
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    CONTAINS: {
        test: function(a, b) { return containsOp(a, b) >= 0; },
        make: function(c) { return this.makeLIKE(LIKE_WILD_CARD, LIKE_WILD_CARD, LIKE, 'CONTAINS', c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    'NOT CONTAINS': {
        test: function(a, b) { return containsOp(a, b) < 0; },
        make: function(c) { return this.makeLIKE(LIKE_WILD_CARD, LIKE_WILD_CARD, NOT_LIKE, 'NOT CONTAINS', c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    BEGINS: {
        test: function(a, b) { b = toString(b); return beginsOp(a, b.length) === b; },
        make: function(c) { return this.makeLIKE(NIL, LIKE_WILD_CARD, LIKE, 'BEGINS', c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    'NOT BEGINS': {
        test: function(a, b) { b = toString(b); return beginsOp(a, b.length) !== b; },
        make: function(c) { return this.makeLIKE(NIL, LIKE_WILD_CARD, NOT_LIKE, 'NOT BEGINS', c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    ENDS: {
        test: function(a, b) { b = toString(b); return endsOp(a, b.length) === b; },
        make: function(c) { return this.makeLIKE(LIKE_WILD_CARD, NIL, LIKE, 'ENDS', c); },
        type: 'string'
    },

    /** @type {relationalOperator}
     * @memberOf Conditionals#
     */
    'NOT ENDS': {
        test: function(a, b) { b = toString(b); return endsOp(a, b.length) !== b; },
        make: function(c) { return this.makeLIKE(LIKE_WILD_CARD, NIL, NOT_LIKE, 'NOT ENDS', c); },
        type: 'string'
    }
};

// some synonyms
ops['\u2264'] = ops['<='];  // UNICODE 'LESS-THAN OR EQUAL TO'
ops['\u2265'] = ops['>='];  // UNICODE 'GREATER-THAN OR EQUAL TO'
ops['\u2260'] = ops['<>'];  // UNICODE 'NOT EQUAL TO'

function inOp(a, b) {
    return b
        .trim() // remove leading and trailing space chars
        .replace(/\s*,\s*/g, ',') // remove any white-space chars from around commas
        .split(',') // put in an array
        .indexOf((a + '')); // search array whole matches
}

function containsOp(a, b) {
    return toString(a).indexOf(toString(b));
}

function beginsOp(a, length) {
    return toString(a).substr(0, length);
}

function endsOp(a, length) {
    return toString(a).substr(-length, length);
}

function sqEsc(string) {
    return string.replace(/'/g, '\'\'');
}

var groups = {
    equality: {
        label: 'Equality',
        submenu: ['=']
    },
    inequalities: {
        label: 'Inequalities',
        submenu: [
            '<',
            '\u2264', // UNICODE 'LESS-THAN OR EQUAL TO'; on a Mac, type option-comma (≤)
            '\u2260', // UNICODE 'NOT EQUALS'; on a Mac, type option-equals (≠)
            '\u2265', // UNICODE 'GREATER-THAN OR EQUAL TO'; on a Mac, type option-period (≥)
            '>'
        ]
    },
    sets: {
        label: 'Set scans',
        submenu: ['IN', 'NOT IN']
    },
    strings: {
        label: 'String scans',
        submenu: [
            'CONTAINS', 'NOT CONTAINS',
            'BEGINS', 'NOT BEGINS',
            'ENDS', 'NOT ENDS'
        ]
    },
    patterns: {
        label: 'Pattern scans',
        submenu: ['LIKE', 'NOT LIKE']
    }
};

// add a `name` prop to each group
_(groups).each(function(group, key) { group.name = key; });

/**
 * @memberOf Conditionals
 */
Conditionals.groups = groups;

/** Default operator menu when consisting of all of the groups in {@link module:conditionals.groups|groups}. This menu is used when none of the following is otherwise defined:
 * * The `opMenu` property of the column schema.
 * * The entry in the node's `typeOpMap` hash corresponding to the `type` property of the column schema.
 * * The node's `treeOpMenu` object.
 * @type {menuItem[]}
 * @memberOf Conditionals
 */
Conditionals.defaultOpMenu = [ // hierarchical menu of relational operators
    groups.equality,
    groups.inequalities,
    groups.sets,
    groups.strings,
    groups.patterns
];


// Meant to be called by FilterTree.prototype.setSensitivity only
Conditionals.setToString = function(fn) {
    return (toString = fn);
};

module.exports = Conditionals;

},{"extend-me":10,"object-iterators":22,"regexp-like":25}],14:[function(require,module,exports){
/* eslint-env browser */
/* eslint-disable key-spacing */

'use strict';

var popMenu = require('pop-menu');

var FilterNode = require('./FilterNode');
var Conditionals = require('./Conditionals');


var toString; // set by FilterLeaf.setToString() called from ../index.js


/** @typedef {object} converter
 * @property {function} toType - Returns input value converted to type. Fails silently.
 * @property {function} failed - Tests input value against type, returning `false if type or `true` if not type.
 */

/** @type {converter} */
var numberConverter = {
    toType: Number,
    failed: isNaN
};

/** @type {converter} */
var dateConverter = {
    toType: function(s) { return new Date(s); },
    failed: isNaN
};

/**
 * @typedef {object} filterLeafViewObject
 *
 * @property {HTMLElement} column - A drop-down with options from the `FilterLeaf` instance's schema. Value is the name of the column being tested (i.e., the column to which this conditional expression applies).
 *
 * @property operator - A drop-down with options from {@link columnOpMenu}, {@link typeOpMap}, or {@link treeOpMenu}. Value is the string representation of the operator.
 *
 * @property operand - An input element, such as a drop-down or a text box.
 */

/** @constructor
 * @summary An object that represents a conditional expression node in a filter tree.
 * @desc This object represents a conditional expression. It is always a terminal node in the filter tree; it has no child nodes of its own.
 *
 * A conditional expression is a simple dyadic expression with the following syntax in the UI:
 *
 * > _column operator operand_
 *
 * where:
 * * _column_ is the name of a column from the data row object
 * * _operator_ is the name of an operator from the node's operator list
 * * _operand_ is a literal value to compare against the value in the named column
 *
 * **NOTE:** The {@link ColumnLeaf} extension of this object has a different implementation of _operand_ which is: The name of a column from which to fetch the compare value (from the same data row object) to compare against the value in the named column. See *Extending the conditional expression object* in the {@link http://joneit.github.io/filter-tree/index.html|readme}.
 *
 * The values of the terms of the expression above are stored in the first three properties below. Each of these three properties is set either by `setState()` or by the user via a control in `el`. Note that these properties are not dynamically bound to the UI controls; they are updated by the validation function, `invalid()`.
 *
 * **See also the properties of the superclass:** {@link FilterNode}
 *
 * @property {string} column - Name of the member in the data row objects against which `operand` will be compared. Reflects the value of the `view.column` control after validation.
 *
 * @property {string} operator - Operator symbol. This must match a key in the `this.root.conditionals.ops` hash. Reflects the value of the `view.operator` control after validation.
 *
 * @property {string} operand - Value to compare against the the member of data row named by `column`. Reflects the value of the `view.operand` control, after validation.
 *
 * @property {string} name - Used to describe the object in the UI so user can select an expression editor.
 *
 * @property {string} [type='string'] - The data type of the subexpression if neither the operator nor the column schema defines a type.
 *
 * @property {HTMLElement} el - A `<span>...</span>` element that contains the UI controls. This element is automatically appeneded to the parent `FilterTree`'s `el`. Generated by {@link FilterLeaf#createView|createView}.
 *
 * @property {filterLeafViewObject} view - A hash containing direct references to the controls in `el`. Added by {@link FilterLeaf#createView|createView}.
 */
var FilterLeaf = FilterNode.extend('FilterLeaf', {

    name: 'column = value', // display string for drop-down

    destroy: function() {
        if (this.view) {
            for (var key in this.view) {
                this.view[key].removeEventListener('change', this.onChange);
            }
        }
    },

    /** @summary Create a new view.
     * @desc This new "view" is a group of HTML `Element` controls that completely describe the conditional expression this object represents. This method creates the view, setting `this.el` to point to it, and the members of `this.view` to point to the individual controls therein.
     * @memberOf FilterLeaf#
     */
    createView: function(state) {
        var el = this.el = document.createElement('span');

        el.className = 'filter-tree-editor filter-tree-default';

        if (state && state.column) {
            // State includes column:
            // Operator menu is built later in loadState; we don't need to build it now. The call to
            // getOpMenu below with undefined columnName returns [] resulting in an empty drop-down.
        } else {
            // When state does NOT include column, it's because either:
            // a. column is unknown and op menu will be empty until user chooses a column; or
            // b. column is hard-coded when there's only one possible column as inferable from schema:
            var schema = this.schema && this.schema.length === 1 && this.schema[0],
                columnName = schema && schema.name || schema;
        }

        this.view = {
            column: this.makeElement(this.schema, 'column', this.sortColumnMenu),
            operator: this.makeElement(getOpMenu.call(this, columnName), 'operator'),
            operand: this.makeElement()
        };

        el.appendChild(document.createElement('br'));
    },

    loadState: function(state) {
        var value, el, i, b, selected, ops, thisOp, opMenu, notes;
        if (state) {
            notes = [];
            for (var key in state) {
                if (!FilterNode.optionsSchema[key]) {
                    value = this[key] = state[key];
                    el = this.view[key];
                    switch (el.type) {
                        case 'checkbox':
                        case 'radio':
                            el = document.querySelectorAll('input[name=\'' + el.name + '\']');
                            for (i = 0; i < el.length; i++) {
                                el[i].checked = value.indexOf(el[i].value) >= 0;
                            }
                            break;
                        case 'select-multiple':
                            el = el.options;
                            for (i = 0, b = false; i < el.length; i++, b = b || selected) {
                                selected = value.indexOf(el[i].value) >= 0;
                                el[i].selected = selected;
                            }
                            FilterNode.setWarningClass(el, b);
                            break;
                        default:
                            el.value = value;
                            if (el.value === '' && key === 'operator') {
                                // Operator may be a synonym.
                                ops = this.root.conditionals.ops;
                                thisOp = ops[value];
                                opMenu = getOpMenu.call(this, state.column || this.column);
                                // Check each menu item's op object for equivalency to possible synonym's op object.
                                popMenu.walk.call(opMenu, equiv);
                            }
                            if (!FilterNode.setWarningClass(el)) {
                                notes.push({ key: key, value: value });
                            } else if (key === 'column') {
                                makeOpMenu.call(this, value);
                            }
                    }
                }
            }
            if (notes.length) {
                var multiple = notes.length > 1,
                    templates = this.templates,
                    footnotes = templates.get(multiple ? 'notes' : 'note'),
                    inner = footnotes.querySelector('.footnote');
                notes.forEach(function(note) {
                    var footnote = multiple ? document.createElement('li') : inner;
                    note = templates.get('optionMissing', note.key, note.value);
                    while (note.length) { footnote.appendChild(note[0]); }
                    if (multiple) { inner.appendChild(footnote); }
                });
            }
            this.notesEl = footnotes;
        }
        function equiv(opMenuItem) {
            var opName = opMenuItem.name || opMenuItem;
            if (ops[opName] === thisOp) {
                el.value = opName;
            }
        }
    },

    /**
     * @property {converter} number
     * @property {converter} int - synonym of `number`
     * @property {converter} float - synonym of `number`
     * @property {converter} date
     * @property {converter} string
     */
    converters: {
        number: numberConverter,
        int: numberConverter,
        float: numberConverter,
        date: dateConverter
    },

    /**
     * Called by the parent node's {@link FilterTree#invalid|invalid()} method, which catches the error thrown when invalid.
     *
     * Also performs the following compilation actions:
     * * Copies all `this.view`' values from the DOM to similarly named properties of `this`.
     * * Pre-sets `this.op` and `this.converter` for use in `test`'s tree walk.
     *
     * @param {boolean} [options.throw=false] - Throw an error if missing or invalid value.
     * @param {boolean} [options.focus=false] - Move focus to offending control.
     * @returns {undefined} This is the normal return when valid; otherwise throws error when invalid.
     * @memberOf FilterLeaf#
     */
    invalid: function(options) {
        var elementName, type, focused;

        for (elementName in this.view) {
            var el = this.view[elementName],
                value = controlValue(el).trim();

            if (
                value === '' && elementName === 'operator' && // not in operator menu
                this.root.conditionals.ops[this.operator] && // but valid in operator hash
                !getProperty.call(this, this.column, 'opMustBeInMenu') // and is doesn't have to be in menu to be valid
            ) {
                value = this.operator; // use it as is then
            }

            if (value === '') {
                if (!focused && options && options.focus) {
                    clickIn(el);
                    focused = true;
                }
                if (options && options.throw) {
                    throw new this.Error('Missing or invalid ' + elementName + ' in conditional expression. Complete the expression or remove it.', this);
                }
            } else {
                // Copy each controls's value as a new similarly named property of this object.
                this[elementName] = value;
            }
        }

        this.op = this.root.conditionals.ops[this.operator];

        type = this.getType();

        this.converter = type && type !== 'string' && this.converters[type];

        this.calculator = this.getCalculator();
    },

    getType: function() {
        return this.op.type || getProperty.call(this, this.column, 'type');
    },

    getCalculator: function() {
        return getProperty.call(this, this.column, 'calculator');
    },

    valOrFunc: function(dataRow, columnName, calculator) {
        var result;
        if (dataRow) {
            result = dataRow[columnName];
            calculator = (typeof result)[0] === 'f' ? result : calculator;
            if (calculator) {
                result = calculator(dataRow, columnName);
            }
        }
        return result || result === 0 || result === false ? result : '';
    },

    p: function(dataRow) {
        return this.valOrFunc(dataRow, this.column, this.calculator);
    },

    // To be overridden when operand is a column name (see columns.js).
    q: function() {
        return this.operand;
    },

    test: function(dataRow) {
        var p, q, // untyped versions of args
            P, Q, // typed versions of p and q
            converter;

        // TODO: If a literal (i.e., when this.q is not overridden), q only needs to be fetched ONCE for all rows
        return (
            (p = this.p(dataRow)) === undefined ||
            (q = this.q(dataRow)) === undefined
        )
            ? false // data inaccessible so exclude row
            : (
                (converter = this.converter) &&
                !converter.failed(P = converter.toType(p)) && // attempt to convert data to type
                !converter.failed(Q = converter.toType(q))
            )
                ? this.op.test(P, Q) // both conversions successful: compare as types
                : this.op.test(toString(p), toString(q)); // one or both conversions failed: compare as strings
    },

    toJSON: function() {
        var state = {};
        if (this.editor) {
            state.editor = this.editor;
        }
        for (var key in this.view) {
            state[key] = this[key];
        }
        if (this.schema !== this.parent.schema) {
            state.schema = this.schema;
        }
        return state;
    },

    /**
     * For `'object'` and `'JSON'` note that the subtree's version of `getState` will not call this leaf version of `getState` because the former uses `unstrungify()` and `JSON.stringify()`, respectively, both of which recurse and call `toJSON()` on their own.
     *
     * @param {object} [options='object'] - See the subtree version of {@link FilterTree#getState|getState} for more info.
     *
     * @memberOf FilterLeaf#
     */
    getState: function getState(options) {
        var result = '',
            syntax = options && options.syntax || 'object';

        switch (syntax) {
            case 'object': // see note above
                result = this.toJSON();
                break;
            case 'JSON': // see note above
                result = JSON.stringify(this, null, options && options.space) || '';
                break;
            case 'SQL':
                result = this.getSyntax(this.root.conditionals);
        }

        return result;
    },

    makeSqlOperand: function() {
        return this.root.conditionals.makeSqlString(this.operand); // todo: this should be a number if type is number instead of a string -- but we will have to ensure it is numeric!
    },

    getSyntax: function(conditionals) {
        return this.root.conditionals.ops[this.operator].make.call(conditionals, this);
    },

    /** @summary HTML form controls factory.
     * @desc Creates and appends a text box or a drop-down.
     * > Defined on the FilterTree prototype for access by derived types (alternate filter editors).
     * @returns The new element.
     * @param {menuItem[]} [menu] - Overloads:
     * * If omitted, will create an `<input/>` (text box) element.
     * * If contains only a single option, will create a `<span>...</span>` element containing the string and a `<input type=hidden>` containing the value.
     * * Otherwise, creates a `<select>...</select>` element with these menu items.
     * @param {null|string} [prompt=''] - Adds an initial `<option>...</option>` element to the drop-down with this value, parenthesized, as its `text`; and empty string as its `value`. Omitting creates a blank prompt; `null` suppresses.
     * @param [sort]
     * @memberOf FilterLeaf#
     */
    makeElement: function(menu, prompt, sort) {
        var el, result, options,
            option = menu,
            tagName = menu ? 'SELECT' : 'INPUT';

        // determine if there would be only a single item in the dropdown
        while (option instanceof Array) {
            if (option.length === 1 && !popMenu.isGroupProxy(option[0])) {
                option = option[0];
            } else {
                option = undefined;
            }
        }

        if (option) {
            // hard text when single item
            el = this.templates.get(
                'lockedColumn',
                option.alias || option.header || option.name || option,
                option.name || option.alias || option.header || option
            );
            result = el.querySelector('input');
        } else {
            options = {
                prompt: prompt,
                sort: sort,
                group: function(groupName) { return Conditionals.groups[groupName]; }
            };

            // make an element
            el = popMenu.build(tagName, menu, options);

            // if it's a textbox, listen for keyup events
            if (el.type === 'text' && this.eventHandler) {
                this.el.addEventListener('keyup', this.eventHandler);
            }

            // handle onchange events
            this.onChange = this.onChange || cleanUpAndMoveOn.bind(this);
            this.el.addEventListener('change', this.onChange);

            FilterNode.setWarningClass(el);
            result = el;
        }

        this.el.appendChild(el);

        return result;
    }
});

/** `change` event handler for all form controls.
 * Rebuilds the operator drop-down as needed.
 * Removes error CSS class from control.
 * Adds warning CSS class from control if blank; removes if not blank.
 * Adds warning CSS class from control if blank; removes if not blank.
 * Moves focus to next non-blank sibling control.
 * @this {FilterLeaf}
 */
function cleanUpAndMoveOn(evt) {
    var el = evt.target;

    // remove `error` CSS class, which may have been added by `FilterLeaf.prototype.invalid`
    el.classList.remove('filter-tree-error');

    // set or remove 'warning' CSS class, as per el.value
    FilterNode.setWarningClass(el);

    if (el === this.view.column) {
        // rebuild operator list according to selected column name or type, restoring selected item
        makeOpMenu.call(this, el.value);
    }

    if (el.value) {
        // find next sibling control, if any
        if (!el.multiple) {
            while ((el = el.nextElementSibling) && (!('name' in el) || el.value.trim() !== '')); // eslint-disable-line curly
        }

        // and click in it (opens select list)
        if (el && el.value.trim() === '') {
            el.value = ''; // rid of any white space
            FilterNode.clickIn(el);
        }
    }

    // forward the event to the application's event handler
    if (this.eventHandler) {
        this.eventHandler(evt);
    }
}

/**
 * @summary Get the node property.
 * @desc Priority ladder:
 * 1. Schema property.
 * 2. Mixin (if given).
 * 3. Node property is final priority.
 * @this {FilterLeaf}
 * @param {string} columnName
 * @param {string} propertyName
 * @param {function|boolean} [mixin] - Optional function or value if schema property undefined. If function, called in context with `propertyName` and `columnName`.
 * @returns {object}
 */
function getProperty(columnName, propertyName, mixin) {
    var columnSchema = this.schema.lookup(columnName) || {};
    return (
        columnSchema[propertyName] // the expression's column schema property
            ||
        typeof mixin === 'function' && mixin.call(this, columnSchema, propertyName)
            ||
        typeof mixin !== 'function' && mixin
            ||
        this[propertyName] // the expression node's property
    );
}

/**
 * @this {FilterLeaf}
 * @param {string} columnName
 * @returns {undefined|menuItem[]}
 */
function getOpMenu(columnName) {
    return getProperty.call(this, columnName, 'opMenu', function(columnSchema) {
        return this.typeOpMap && this.typeOpMap[columnSchema.type || this.type];
    });
}

/**
 * @this {FilterLeaf}
 * @param {string} columnName
 */
function makeOpMenu(columnName) {
    var opMenu = getOpMenu.call(this, columnName);

    if (opMenu !== this.renderedOpMenu) {
        var newOpDrop = this.makeElement(opMenu, 'operator');

        newOpDrop.value = this.view.operator.value;
        this.el.replaceChild(newOpDrop, this.view.operator);
        this.view.operator = newOpDrop;

        FilterNode.setWarningClass(newOpDrop);

        this.renderedOpMenu = opMenu;
    }
}

function clickIn(el) {
    setTimeout(function() {
        el.classList.add('filter-tree-error');
        FilterNode.clickIn(el);
    }, 0);
}

function controlValue(el) {
    var value, i;

    switch (el.type) {
        case 'checkbox':
        case 'radio':
            el = document.querySelectorAll('input[name=\'' + el.name + '\']:enabled:checked');
            for (value = [], i = 0; i < el.length; i++) {
                value.push(el[i].value);
            }
            break;

        case 'select-multiple':
            el = el.options;
            for (value = [], i = 0; i < el.length; i++) {
                if (!el.disabled && el.selected) {
                    value.push(el[i].value);
                }
            }
            break;

        default:
            value = el.value;
    }

    return value;
}

// Meant to be called by FilterTree.prototype.setSensitivity only
FilterLeaf.setToString = function(fn) {
    toString = fn;
    return Conditionals.setToString(fn);
};


module.exports = FilterLeaf;

},{"./Conditionals":13,"./FilterNode":15,"pop-menu":24}],15:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var _ = require('object-iterators');
var extend = require('extend-me'), Base = extend.Base; extend.debug = true;
var popMenu = require('pop-menu');

var cssInjector = require('./stylesheet');
var Templates = require('./Templates');
var Conditionals = require('./Conditionals');
var ParserSQL = require('./parser-SQL');


var CHILDREN_TAG = 'OL',
    CHILD_TAG = 'LI';

// JSON-detector: begins _and_ ends with either [ and ] _or_ { and }
var reJSON = /^\s*((\[[^]*\])|(\{[^]*\}))\s*$/;

function FilterTreeError(message, node) {
    this.message = message;
    this.node = node;
}
FilterTreeError.prototype = Object.create(Error.prototype);
FilterTreeError.prototype.name = 'FilterTreeError';

/** @typedef {object} FilterTreeSetStateOptionsObject
 *
 * @property {boolean} [syntax='auto'] - Specify parser to use on `state`. One of:
 * * `'auto'` - Auto-detect; see {@link FilterNode#parseStateString} for algorithm.
 * * `'object'` - A raw state object such as that produced by the [getState()]{@link FilterTree#getState} method.
 * * `'JSON'` - A JSON string version of a state object such as that produced by the [getState()]{@link FilterTree#getState} method.
 * * `'SQL'` - A SQL [search condition expression]{@link https://msdn.microsoft.com/en-us/library/ms173545.aspx} string.
 *
 * @param {Element} [context] If defined, the provided input string is used as a selector to an `HTMLElement` contained in `context`. The `value` property of this element is fetched from the DOM and is used as the input state string; proceed as above.
 */

/** @typedef {object} FilterTreeOptionsObject
 *
 * @property {menuItem[]} [schema] - A default list of column names for field drop-downs of all descendant terminal nodes. Overrides `options.state.schema` (see). May be defined for any node and pertains to all descendants of that node (including terminal nodes). If omitted (and no `ownSchema`), will use the nearest ancestor `schema` definition. However, descendants with their own definition of `types` will override any ancestor definition.
 *
 * > Typically only used by the caller for the top-level (root) tree.
 *
 * @property {menuItem[]} [ownSchema] - A default list of column names for field drop-downs of immediate descendant terminal nodes _only_. Overrides `options.state.ownSchema` (see).
 *
 * Although both `options.schema` and `options.ownSchema` are notated as optional herein, by the time a terminal node tries to render a schema drop-down, a `schema` list should be defined through (in order of priority):
 *
 * * Terminal node's own `options.schema` (or `options.state.schema`) definition.
 * * Terminal node's parent node's `option.ownSchema` (or `option.state.nodesFields`) definition.
 * * Terminal node's parent (or any ancestor) node's `options.schema` (or `options.state.schema`) definition.
 *
 * @property {FilterTreeStateObject} [state] - A data structure that describes a tree, subtree, or leaf (terminal node). If undefined, loads an empty filter, which is a `FilterTree` node consisting the default `operator` value (`'op-and'`).
 *
 * @property {function} [editor='Default'] - The name of the conditional expression's UI "editor." This name must be registered in the parent node's {@link FilterTree#editors|editors} hash, where it maps to a leaf constructor (`FilterLeaf` or a descendant thereof). (Use {@link FilterTree#addEditor} to register new editors.)
 *
 * @property {FilterTree} [parent] - Used internally to insert element when creating nested subtrees. The only time it may be (and must be) omitted is when creating the root node.
 *
 * @property {string|HTMLElement} [cssStylesheetReferenceElement] - passed to cssInsert
 */

/** @typedef {object|string} FilterTreeStateObject
 *
 * @summary State with which to create a new node or replace an existing node.
 *
 * @desc A string or plain object that describes a filter-tree node. If a string, it is parsed into an object by {@link FilterNode~parseStateString}. (See, for available overloads.)
 *
 * The resulting object may be a flat object that describes a terminal node or a childless root or branch node; or may be a hierarchical object to define an entire tree or subtree.
 *
 * In any case, the resulting object may have any of the following properties:
 *
 * @property {menuItem[]} [schema] - See `schema` property of {@link FilterTreeOptionsObject}.
 *
 * @property {string} [editor='Default'] - See `editor` property of {@link FilterTreeOptionsObject}.
 *
 * @property misc - Other miscellaneous properties will be copied directly to the new `FitlerNode` object. (The name "misc" here is just a stand-in; there is no specific property called "misc".)
 *
 * * May describe a non-terminal node with properties:
 *   * `schema` - Overridden on instantiation by `options.schema`. If both unspecified, uses parent's definition.
 *   * `operator` - One of {@link treeOperators}.
 *   * `children` -  Array containing additional terminal and non-terminal nodes.
 *
 * The constructor auto-detects `state`'s type:
 *  * JSON string to be parsed by `JSON.parse()` into a plain object
 *  * SQL WHERE clause string to be parsed into a plain object
 *  * CSS selector of an Element whose `value` contains one of the above
 *  * plain object
 */

/**
 * @constructor
 *
 * @summary A node in a filter tree.
 *
 * @description A filter tree represents a _complex conditional expression_ and consists of a single instance of a {@link FilterTree} object as the _root_ of an _n_-ary tree.
 *
 * Filter trees are comprised of instances of `FilterNode` objects. However, the `FilterNode` constructor is an "abstract class"; filter node objects are never instantiated directly from this constructor. A filter tree is actually comprised of instances of two "subclasses" of `FilterNode` objects:
 * * {@link FilterTree} (or subclass thereof) objects, instances of which represent the root node and all the branch nodes:
 *   * There is always exactly one root node, containing the whole filter tree, which represents the filter expression in its entirety. The root node is distinguished by having no parent node.
 *   * There are zero or more branch nodes, or subtrees, which are child nodes of the root or other branches higher up in the tree, representing subexpressions within the larger filter expression. Each branch node has exactly one parent node.
 *   * These nodes point to zero or more child nodes which are either nested subtrees, or:
 * * {@link FilterLeaf} (or subclass thereof) objects, each instance of which represents a single simple conditional expression. These are terminal nodes, having exactly one parent node, and no child nodes.
 *
 * The programmer may extend the semantics of filter trees by extending the above objects.
 *
 * @property {sqlIdQtsObject} [sqlIdQts={beg:'"',end:'"'}] - Quote characters for SQL identifiers. Used for both parsing and generating SQL. Should be placed on the root node.
 *
 * @property {HTMLElement} el - The DOM element created by the `render` method to represent this node. Contains the `el`s for all child nodes (which are themselves pointed to by those nodes). This is always generated but is only in the page DOM if you put it there.
 */

var FilterNode = Base.extend('FilterNode', {

    /**
     * @summary Create a new node or subtree.
     * @desc Typically used by the application layer to create the entire filter tree; and internally, recursively, to create each node including both subtrees and leaves.
     *
     * **Node properties and options:** Nodes are instantiated with:
     * 1. Certain **required properties** which differ for subtrees and leaves.
     * 2. Arbitrary **non-standard option properties** are defined on the `options` object (so long as their names do not conflict with any standard options) and never persist.
     * 3. Certain **standard options properties** as defined in the {@link FilterNode~optionsSchema|optionsSchema} hash, come from various sources, as prioritized as follows:
     *    1. `options` object; does not persist
     *    2. `state`; object; persists
     *    3. `parent` object; persists
     *    4. `default` object; does not persist
     *
     * Notes:
     * 1. "Persists" means output by {@link FilterTree#getState|getState()}.
     * 2. The `parent` object is generated internally for subtrees. It allows standard options to inherit from the parent node.
     * 3. The `default` object comes from the `default` property, if any, of the {@link FilterNode~optionsSchema|schema object} for the standard option in question. Note that once defined, subtrees will then inherit this value.
     * 4. If not defined by any of the above, the standard option remains undefined on the node.
     *
     * **Query Builder UI support:** If your app wants to make use of the generated UI, you are responsible for inserting the top-level `.el` into the DOM. (Otherwise just ignore it.)
     *
     * @param {FilterTreeOptionsObject} [options] - The node state; or an options object possibly containing `state` among other options. Although you can instantiate a filter without any options, this is generally not useful. See *Instantiating a filter* in the {@link http://joneit.github.io/filter-tree/index.html|readme} for a practical discussion of minimum options.
     *
     * * @memberOf FilterNode#
     */
    initialize: function(options) {
        options = options || {};

        /** @summary Reference to this node's parent node.
         * @desc When this property is undefined, this node is the root node.
         * @type {FilterNode}
         * @memberOf FilterNode#
         */
        var parent = this.parent = this.parent || options.parent,
            root = parent && parent.root;

        if (!root) {
            root = this;

            this.stylesheet = this.stylesheet ||
                cssInjector(options.cssStylesheetReferenceElement);

            this.conditionals = new Conditionals(options); // .sqlIdQts

            this.ParserSQL = new ParserSQL(options); // .schema, .caseSensitiveColumnNames, .resolveAliases

            var keys = ['name'];
            if (options.resolveAliases) {
                keys.push('alias');
            }

            this.findOptions = {
                caseSensitive: options.caseSensitiveColumnNames,
                keys: keys
            };
        }

        /** @summary Convenience reference to the root node.
         * @name root
         * @type {FilterNode}
         * @memberOf FilterNode#
         */
        this.root = root;

        this.dontPersist = {}; // hash of truthy values

        this.setState(options.state, options);
    },

    /** Insert each subtree into its parent node along with a "delete" button.
     *
     * NOTE: The root tree (which has no parent) must be inserted into the DOM by the instantiating code (without a delete button).
     * @memberOf FilterNode#
     */
    render: function() {
        if (this.parent) {
            var newListItem = document.createElement(CHILD_TAG);

            if (this.notesEl) {
                newListItem.appendChild(this.notesEl);
            }

            if (!this.keep) {
                var el = this.templates.get('removeButton');
                el.addEventListener('click', this.remove.bind(this));
                newListItem.appendChild(el);
            }

            newListItem.appendChild(this.el);

            this.parent.el.querySelector(CHILDREN_TAG).appendChild(newListItem);
        }
    },

    /**
     *
     * @param {FilterTreeStateObject} state
     * @param {FilterTreeSetStateOptionsObject} [options]
     * @memberOf FilterNode#
     */
    setState: function(state, options) {
        var oldEl = this.el;

        state = this.parseStateString(state, options);

        this.mixInStandardOptions(state, options);
        this.mixInNonstandardOptions(options);
        this.createView(state);
        this.loadState(state);
        this.render();

        if (oldEl) {
            var newEl = this.el;
            if (this.parent && oldEl.parentElement.tagName === 'LI') {
                oldEl = oldEl.parentNode;
                newEl = newEl.parentNode;
            }
            oldEl.parentNode.replaceChild(newEl, oldEl);
        }
    },

    /**
     * @summary Convert a string to a state object.
     *
     * @desc They string's syntax is inferred as follows:
     * 1. If state is undefined or already an object, return as is.
     * 2. If `options.context` is defined, `state` is assumed to be a CSS selector string (auto-detected) pointing to an HTML form control with a `value` property, such as a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement HTMLInputElement} or a {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement HTMLTextAreaElement}. The element is selected and if found, its value is fetched from the DOM and assigned to `state`.
     * 3. If `options.syntax` is `'auto'`, JSON syntax is detected if `state` begins _and_ ends with either `[` and `]` _or_ `{` and `}` (ignoring leading and trailing white space).
     * 4. If JSON syntax, parse the string into an actual `FilterTreeStateObject` using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse|JSON.parse} and throw an error if unparsable.
     * 5. If not JSON, parse the string as SQL into an actual `FilterTreeStateObject` using parser-SQL's {@link ParserSQL#parser|parser} and throw an error if unparsable.
     *
     * @param {FilterTreeStateObject} [state]
     * @param {FilterTreeSetStateOptionsObject} [options]
     *
     * @returns {FilterTreeStateObject} The unmolested `state` parameter. Throws an error if `state` is unknown or invalid syntax.
     *
     * @memberOf FilterNode#
     * @inner
     */
    parseStateString: function(state, options) {
        if (state) {
            if (typeof state === 'string') {
                var context = options && options.context,
                    syntax = options && options.syntax || 'auto'; // default is 'auto'

                if (context) {
                    state = context.querySelector(state).value;
                }

                if (syntax === 'auto') {
                    syntax = reJSON.test(state) ? 'JSON' : 'SQL';
                }

                switch (syntax) {
                    case 'JSON':
                        try {
                            state = JSON.parse(state);
                        } catch (error) {
                            throw new FilterTreeError('JSON parser: ' + error);
                        }
                        break;
                    case 'SQL':
                        try {
                            state = this.root.ParserSQL.parse(state);
                        } catch (error) {
                            throw new FilterTreeError('SQL WHERE clause parser: ' + error);
                        }
                        break;
                }
            }

            if (typeof state !== 'object') {
                throw new FilterTreeError('Unexpected input state.');
            }
        }

        return state;
    },

    /**
     * Create each standard option from when found on the `options` or `state` objects, respectively; or if not an "own" option, on the `parent` object or from the options schema default (if any)
     * @param state
     * @param options
     */
    mixInStandardOptions: function(state, options) {
        var node = this;

        _(FilterNode.optionsSchema).each(function(optionSchema, key) {
            if (!optionSchema.ignore && (this !== this.root || optionSchema.rootBound)) {
                var option;

                node.dontPersist[key] = // truthy if from `options` or `default`
                    (option = options && options[key]) !== undefined ||
                    (option = state && state[key]) === undefined &&
                    !(optionSchema.own || node.hasOwnProperty(key) && option !== null) &&
                    !(option = node.parent && node.parent[key]) &&
                    (option = optionSchema.default);

                if (option === null) {
                    delete node[key];
                    node.dontPersist[key] = false;
                } else if (option) {
                    if (key === 'schema' && !option.walk) {
                        // attach the `walk` and `find` convenience methods to the `schema` array
                        option.walk = popMenu.walk.bind(option);
                        option.lookup = popMenu.lookup.bind(option, node.root.findOptions);
                    }
                    node[key] = option;
                }
            }
        });
    },

    /**
     * @param options
     */
    mixInNonstandardOptions: function(options) {
        var node = this;

        // copy all remaining options directly to the new instance, overriding prototype members of the same name
        _(options).each(function(value, key) {
            if (!FilterNode.optionsSchema[key]) {
                node[key] = value;
            }
        });
    },

    /** Remove both:
     * * `this` filter node from it's `parent`'s `children` collection; and
     * * `this` filter node's `el`'s container (always a `<li>` element) from its parent element.
     * @memberOf FilterNode#
     */
    remove: function() {
        var avert,
            parent = this.parent;

        if (parent) {
            if (this.eventHandler) {
                this.eventHandler.call(parent, {
                    type: 'delete',
                    preventDefault: function() { avert = true; }
                });
            }
            if (!avert) {
                if (
                    parent.keep || // never "prune" (remove if empty) this particular subexpression
                    parent.children.length > 1 // this node has siblings so will not be empty after this remove
                ) {
                    // proceed with remove
                    this.el.parentNode.remove(); // the parent is always the containing <li> tag
                    parent.children.splice(parent.children.indexOf(this), 1);
                } else {
                    // recurse to prune entire subexpression because it's prune-able and would end up empty (childless)
                    parent.remove();
                }
            }
        }
    },

    /**
     * Work-around for `this.el.querySelector(':scope>' + selector)` because `:scope` not supported in IE11.
     * @param {string} selector
     */
    firstChildOfType: function(selector) {
        var el = this.el.querySelector(selector);
        if (el && el.parentElement !== this.el) {
            el = null;
        }
        return el;
    },

    Error: FilterTreeError,

    templates: new Templates()
});

/** @typedef optionsSchemaObject
 * @summary Standard option schema
 * @desc Standard options are automatically added to nodes. Data sources for standard options include `options`, `state`, `parent` and `default` (in that order). Describes standard options through various properties:
 * @property {boolean} [ignore] - Do not automatically add to nodes (processed elsewhere).
 * @property {boolean} [own] - Do not automatically add from `parent` or `default`.
 * @property {boolean} [rootBound] - Automatically add to root node only.
 * @property {*} [default] - This is the default data source when all other strategies fail.
 */

/**
 * @summary Defines the standard options available to a node.
 * @desc The following properties bear the same names as the node options they define.
 * @type {object}
 * @memberOf FilterNode
 */
FilterNode.optionsSchema = {

    state: { ignore: true },

    cssStylesheetReferenceElement: { ignore: true },

    /** @summary Default column schema for column drop-downs of direct descendant leaf nodes only.
     * @memberOf FilterNode#
     * @type {string[]}
     */
    ownSchema: { own: true },

    /** @summary Column schema for column drop-downs of all descendant nodes. Pertains to leaf nodes only.
     * @memberOf FilterNode#
     * @type {menuItem[]}
     */
    schema: {},

    /** @summary Filter editor for user interface.
     * @desc Name of filter editor used by this and all descendant nodes. Pertains to leaf nodes only.
     * @default 'Default'
     * @memberOf FilterNode#
     * @type {string}
     */
    editor: {},

    /** @summary Event handler for UI events.
     * @desc See *Events* in the {@link http://joneit.github.io/filter-tree/index.html|readme} for more information.
     * @memberOf FilterNode#
     * @type {function}
     */
    eventHandler: {},

    /** @summary Fields data type.
     * @memberOf FilterNode#
     * @type {string}
     */
    type: { own: true },

    /** @summary Undeleteable node.
     * @desc Truthy means don't render a delete button next to the filter editor for this node.
     * @memberOf FilterNode#
     * @type {boolean}
     */
    keep: { own: true },

    /** @summary Override operator list at any node.
     * @desc The default is applied to the root node and any other node without an operator menu.
     * @default {@link Conditionals.defaultOpMenu}.
     * @memberOf FilterNode#
     * @type {menuItem[]}
     */
    opMenu: { default: Conditionals.defaultOpMenu },

    /** @summary Truthy considers op valid only if in menu.
     * @memberOf FilterNode#
     * @type {boolean}
     */
    opMustBeInMenu: {},

    /** @summary Dictionary of operator menus for specific data types.
     * @memberOf FilterNode#
     * @type {object}
     * @desc A hash of type names. Each member thus defined contains a specific operator menu for all descendant leaf nodes that:
     * 1. do not have their own operator menu (`opMenu` property) of their own; and
     * 2. whose columns resolve to that type.
     *
     * The type is determined by (in priority order):
     * 1. the `type` property of the {@link FilterLeaf}; or
     * 2. the `type` property of the element in the nearest node (including the leaf node itself) that has a defined `ownSchema` or `schema` array property with an element having a matching column name.
     */
    typeOpMap: { rootBound: true },

    /** @summary Truthy will sort the column menus.
     * @memberOf FilterNode#
     * @type {boolean}
     */
    sortColumnMenu: {}
};

FilterNode.setWarningClass = function(el, value) {
    if (arguments.length < 2) {
        value = el.value;
    }
    el.classList[value ? 'remove' : 'add']('filter-tree-warning');
    return value;
};

FilterNode.clickIn = function(el) {
    if (el) {
        if (el.tagName === 'SELECT') {
            setTimeout(function() { el.dispatchEvent(new MouseEvent('mousedown')); }, 0);
        } else {
            el.focus();
        }
    }
};

module.exports = FilterNode;

},{"./Conditionals":13,"./Templates":17,"./parser-SQL":19,"./stylesheet":20,"extend-me":10,"object-iterators":22,"pop-menu":24}],16:[function(require,module,exports){
/* eslint-env browser */

// This is the main file, usable as is, such as by /test/index.js.

// For npm: require this file
// For CDN: gulpfile.js browserifies this file with sourcemap to /build/filter-tree.js and uglified without sourcemap to /build/filter-tree.min.js. The CDN is https://joneit.github.io/filter-tree.

'use strict';

var popMenu = require('pop-menu');
var unstrungify = require('unstrungify');

var _ = require('object-iterators');
var FilterNode = require('./FilterNode');
var FilterLeaf = require('./FilterLeaf');
var operators = require('./tree-operators');


var ordinal = 0;

/** @constructor
 * @summary An object that represents the root node or a branch node in a filter tree.
 * @desc A node representing a subexpression in the filter expression. May be thought of as a parenthesized subexpression in algebraic expression syntax. As discussed under {@link FilterNode}, a `FilterTree` instance's child nodes may be either:
 * * Other (nested) `FilterTree` (or subclass thereof) nodes representing subexpressions.
 * * {@link FilterLeaf} (or subclass thereof) terminal nodes representing conditional expressions.
 *
 * The `FilterTree` object also has methods, some of which operate on a specific subtree instance, and some of which recurse through all the subtree's child nodes and all their descendants, _etc._
 *
 * The recursive methods are interesting. They all work similarly, looping through the list of child nodes, recursing when the child node is a nested subtree (which will recurse further when it has its own nested subtrees); and calling the polymorphic method when the child node is a `FilterLeaf` object, which is a terminal node. Such polymorphic methods include `setState()`, `getState()`, `invalid()`, and `test()`.
 *
 * For example, calling `test(dataRow)` on the root tree recurses through any subtrees eventually calling `test(dataRow)` on each of its leaf nodes and concatenating the results together using the subtree's `operator`. The subtree's `test(dataRow)` call then returns the result to it's parent's `test()` call, _etc.,_ eventually bubbling up to the root node's `test(dataRow)` call, which returns the final result to the original caller. This result determines if the given data row passed through the entire filter expression successfully (`true`) and should be displayed, or was blocked somewhere (`false`) and should not be displayed.
 *
 * Note that in practice:
 * 1. `children` may be empty. This represents a an empty subexpression. Normally pointless, empty subexpressions could be pruned. Filter-tree allows them however as harmless placeholders.
 * 1. `operator` may be omitted in which case it defaults to AND.
 * 1. A `false` result from a child node will short-stop an AND operation; a `true` result will short-stop an OR or NOR operation.
 *
 * Additional notes:
 * 1. A `FilterTree` may consist of a single leaf, in which case the concatenation `operator` is not needed and may be left undefined. However, if a second child is added and the operator is still undefined, it will be set to the default (`'op-and'`).
 * 2. The order of the children is undefined as all operators are commutative. For the '`op-or`' operator, evaluation ceases on the first positive result and for efficiency, all simple conditional expressions will be evaluated before any complex subexpressions.
 * 3. A nested `FilterTree` is distinguished (duck-typed) from a leaf node by the presence of a `children` member.
 * 4. Nesting a `FilterTree` containing a single child is valid (albeit pointless).
 *
 * **See also the properties of the superclass:** {@link FilterNode}
 *
 * @property {string} [operator='op-and'] - The operator that concatentates the test results from all the node's `children` (child nodes). Must be one of:
 * * `'op-and'`
 * * `'op-or'`
 * * `'op-nor'`
 *
 * Note that there is only one `operator` per subexpression. If you need to mix operators, create a subordinate subexpression as one of the child nodes.
 *
 * @property {FilterNode[]} children - A list of descendants of this node. As noted, these may be other `FilterTree` (or subclass thereof) nodes; or may be terminal `FilterLeaf` (or subclass thereof) nodes. May be any length including 0 (none; empty).
 *
 * @property {boolean} [keep=false] - Do not automatically prune when last child removed.
 *
 * @property {fieldItem[]} [ownSchema] - Column menu to be used only by leaf nodes that are children (direct descendants) of this node.
 *
 * @property {string} [type='subtree'] - Type of node, for rendering purposes; names the rendering template to use to generate the node's UI representation.
 */
var FilterTree = FilterNode.extend('FilterTree', {

    /**
     * Hash of constructors for objects that extend from {@link FilterLeaf}, which is the `Default` member here.
     *
     * Add additional editors to this object (in the prototype) prior to instantiating a leaf node that refers to it. This object exists in the prototype and additions to it will affect all nodes that don't have their an "own" hash.
     *
     * If you create an "own" hash in your instance be sure to include the default editor, for example: `{ Default: FilterTree.prototype.editors.Default, ... }`. (One way of overriding would be to include such an object in an `editors` member of the options object passed to the constructor on instantiation. This works because all miscellaneous members are simply copied to the new instance. Not to be confused with the standard option `editor` which is a string containing a key from this hash and tells the leaf node what type to use.)
     */
    editors: {
        Default: FilterLeaf
    },

    /**
     * An extension is a hash of prototype overrides (methods, properties) used to extend the default editor.
     * @param {string} [key='Default'] - Nme of the new extension given in `ext` or name of an existing extension in `FilterTree.extensions`. As a constructor, should have an initial capital. If omitted, replaces the default editor (FilterLeaf).
     * @param {object} [ext] An extension hash
     * @param {FilerLeaf} [BaseEditor=this.editors.Default] - Constructor to extend from.
     * @returns {FillterLeaf} A new class extended from `BaseEditor` -- which is initially `FilterLeaf` but may itself have been extended by a call to `.addEditor('Default', extension)`.
     */
    addEditor: function(key, ext, BaseEditor) {
        if (typeof key === 'object') {
            // `key` (string) was omitted
            BaseEditor = ext;
            ext = key;
            key = 'Default';
        }
        BaseEditor = BaseEditor || this.editors.Default;
        ext = ext || FilterTree.extensions[key];
        return (this.editors[key] = BaseEditor.extend(key, ext));
    },

    /**
     * @param {string} key - The name of the existing editor to remove.
     * @memberOf FilterTree#
     */
    removeEditor: function(key) {
        if (key === 'Default') {
            throw 'Cannot remove default editor.';
        }
        delete this.editors[key];
    },

    /**
     *
     * @memberOf FilterTree#
     */
    createView: function() {
        this.el = this.templates.get(
            this.type || 'subtree',
            ++ordinal,
            this.schema[0] && popMenu.formatItem(this.schema[0])
        );

        // Add the expression editors to the "add new" drop-down
        var addNewCtrl = this.firstChildOfType('select');
        if (addNewCtrl) {
            var submenu, optgroup,
                editors = this.editors;

            if (addNewCtrl.length === 1 && this.editors.length === 1) {
                // this editor is the only option besides the null prompt option
                // so make it th eonly item i the drop-down
                submenu = addNewCtrl;
            } else {
                // there are already options and/or multiple editors
                submenu = optgroup = document.createElement('optgroup');
                optgroup.label = 'Conditional Expressions';
            }
            Object.keys(editors).forEach(function(key) {
                var name = editors[key].prototype.name || key;
                submenu.appendChild(new Option(name, key));
            });
            if (optgroup) {
                addNewCtrl.add(optgroup);
            }
            this.el.addEventListener('change', onchange.bind(this));
        }

        this.el.addEventListener('click', onTreeOpClick.bind(this));
    },

    /**
     *
     * @memberOf FilterTree#
     */
    loadState: function(state) {
        this.operator = 'op-and';
        this.children = [];

        if (!state) {
            this.add();
        } else {
            // Validate `state.children` (required)
            if (!(state.children instanceof Array)) {
                throw new this.Error('Expected `children` property to be an array.');
            }

            // Validate `state.operator` (if given)
            if (state.operator) {
                if (!operators[state.operator]) {
                    throw new this.Error('Expected `operator` property to be one of: ' + Object.keys(operators));
                }

                this.operator = state.operator;
            }

            state.children.forEach(this.add.bind(this));
        }
    },

    /**
     *
     * @memberOf FilterTree#
     */
    render: function() {
        var radioButton = this.firstChildOfType('label > input[value=' + this.operator + ']'),
            addFilterLink = this.el.querySelector('.filter-tree-add-conditional');

        if (radioButton) {
            radioButton.checked = true;
            onTreeOpClick.call(this, {
                target: radioButton
            });
        }

        // when multiple filter editors available, simulate click on the new "add conditional" link
        if (addFilterLink && !this.children.length && Object.keys(this.editors).length > 1) {
            this['filter-tree-add-conditional']({
                target: addFilterLink
            });
        }

        // proceed with render
        FilterNode.prototype.render.call(this);
    },

    /**
     * @summary Create a new node as per `state`.
     *
     * @param {object} [options={state:{}}] - May be one of:
     *
     * * an `options` object containing a `state` property
     * * a `state` object (in which case there is no `options` object)
     *
     * In any case, resulting `state` object may be either...
     * * A new subtree (has a `children` property):
     *   Add a new `FilterTree` node.
     * * A new leaf (no `children` property): add a new `FilterLeaf` node:
     *   * If there is an `editor` property:
     *     Add leaf using `this.editors[state.editor]`.
     *   * Otherwise (including the case where `state` is undefined):
     *     Add leaf using `this.editors.Default`.
     *
     * @param {boolean} [options.focus=false] Call invalid() after inserting to focus on first blank control (if any).
     *
     * @returns {FilterNode} The new node.
     *
     * @memberOf FilterTree#
     */
    add: function(options) {
        var Constructor, newNode;

        options = options || {};

        if (!options.state) {
            options = { state: options };
        }

        if (options.state.children) {
            Constructor = this.constructor;
        } else {
            Constructor = this.editors[options.state.editor || 'Default'];
        }

        options.parent = this;
        newNode = new Constructor(options);
        this.children.push(newNode);

        if (options.focus) {
            // focus on blank control a beat after adding it
            setTimeout(function() { newNode.invalid(options); }, 750);
        }

        return newNode;
    },

    /** @typedef {object} FilterTreeValidationOptionsObject
     * @property {boolean} [throw=false] - Throw (do not catch) `FilterTreeError`s.
     * @property {boolean} [alert=false] - Announce error via window.alert() before returning.
     * @property {boolean} [focus=false] - Place the focus on the offending control and give it error color.
     */

    /**
     * @param {FilterTreeValidationOptionsObject} [options]
     * @returns {undefined|FilterTreeError} `undefined` if valid; or the caught `FilterTreeError` if error.
     * @memberOf FilterTree#
     */
    invalid: function(options) {
        options = options || {};

        var result, throwWas;

        throwWas = options.throw;
        options.throw = true;

        try {
            invalid.call(this, options);
        } catch (err) {
            result = err;

            // Throw when unexpected (not a filter tree error)
            if (!(err instanceof this.Error)) {
                throw err;
            }
        }

        options.throw = throwWas;

        // Alter and/or throw when requested
        if (result) {
            if (options.alert) {
                window.alert(result.message || result); // eslint-disable-line no-alert
            }
            if (options.throw) {
                throw result;
            }
        }

        return result;
    },

    /**
     *
     * @param dataRow
     * @returns {boolean}
     * @memberOf FilterTree#
     */
    test: function test(dataRow) {
        var operator = operators[this.operator],
            result = operator.seed,
            noChildrenDefined = true;

        this.children.find(function(child) {
            if (child) {
                noChildrenDefined = false;
                if (child instanceof FilterLeaf) {
                    result = operator.reduce(result, child.test(dataRow));
                } else if (child.children.length) {
                    result = operator.reduce(result, test.call(child, dataRow));
                }
                return result === operator.abort;
            }

            return false;
        });

        return noChildrenDefined || (operator.negate ? !result : result);
    },

    /**
     * @returns {number} Number of filters (terminal nodes) defined in this subtree.
     */
    filterCount: function filterCount() {
        var n = 0;

        this.children.forEach(function(child) {
            n += child instanceof FilterLeaf ? 1 : filterCount.call(child);
        });

        return n;
    },

    /** @typedef {object} FilterTreeGetStateOptionsObject
     *
     * @summary Object containing options for producing a state object.
     *
     * @desc State is commonly used for two purposes:
     * 1. To persist the filter state so that it can be reloaded later.
     * 2. To send a query to a database engine.
     *
     * @property {boolean} [syntax='object'] - A case-sensitive string indicating the expected type and format of a state object to be generated from a filter tree. One of:
     * * `'object'` (default) A raw state object produced by walking the tree using `{@link https://www.npmjs.com/package/unstrungify|unstrungify()}`, respecting `JSON.stringify()`'s "{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior|toJSON() behavior}," and returning a plain object suitable for resubmitting to {@link FilterNode#setState|setState}. This is an "essential" version of the actual node objects in the tree.
     * * `'JSON'` - A stringified state object produced by walking the tree using `{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior|JSON.stringify()}`, returning a JSON string by calling `toJSON` at every node. This is a string representation of the same "essential" object as that produced by the `'object'` option, but "stringified" and therefore suitable for text-based storage media.
     * * `'SQL'` - The subexpression in SQL conditional syntax produced by walking the tree and returning a SQL [search condition expression]{@link https://msdn.microsoft.com/en-us/library/ms173545.aspx}. Suitable for use in the WHERE clause of a SQL `SELECT` statement used to query a database for a filtered result set.
     *
     * @param {number|string} [space] - When `options.syntax === 'JSON'`, forwarded to `JSON.stringify` as the third parameter, `space` (see).
     *
     * NOTE: The SQL syntax result cannot accommodate node meta-data. While meta-data such as `type` typically comes from the column schema, meta-data can be installed directly on a node. Such meta-data will not be part of the resulting SQL expression. For this reason, SQL should not be used to persist filter state but rather its use should be limited to generating a filter query for a remote data server.
     */

    /**
     * @summary Get a representation of filter state.
     * @desc Calling this on the root will get the entire tree's state; calling this on any subtree will get just that subtree's state.
     *
     * Only _essential_ properties will be output:
     *
     * 1. `FilterTree` nodes will output at least 2 properties:
     *    * `operator`
     *    * `children`
     * 2. `FilterLeaf` nodes will output (via {@link FilterLeaf#getState|getState}) at least 3 properties, one property for each item in it's `view`:
     *    * `column`
     *    * `operator`
     *    * `operand`
     * 3. Additional node properties will be output when:
     *    1. When the property was **NOT** externally sourced:
     *       1. Did *not* come from the `options` object on node instantiation.
     *       2. Did *not* come from the options schema `default` object, if any.
     *    2. **AND** at least one of the following is true:
     *       1. When it's an "own" property.
     *       2. When its value differs from it's parent's.
     *       3. When this is the root node.
     *
     * @param {FilterTreeGetStateOptionsObject} [options]
     * @param {object} [options.sqlIdQts] - When `options.syntax === 'SQL'`, forwarded to `conditionals.pushSqlIdQts()`.
     * @returns {object|string} Returns object when `options.syntax === 'object'`; otherwise returns string.
     * @memberOf FilterTree#
     */
    getState: function getState(options) {
        var result = '',
            syntax = options && options.syntax || 'object';

        switch (syntax) {
            case 'object':
                result = unstrungify.call(this);
                break;

            case 'JSON':
                result = JSON.stringify(this, null, options && options.space) || '';
                break;

            case 'SQL':
                var lexeme = operators[this.operator].SQL;

                this.children.forEach(function(child, idx) {
                    var op = idx ? ' ' + lexeme.op + ' ' : '';
                    if (child instanceof FilterLeaf) {
                        result += op + child.getState(options);
                    } else if (child.children.length) {
                        result += op + getState.call(child, options);
                    }
                });

                if (result) {
                    result = lexeme.beg + result + lexeme.end;
                }
                break;

            default:
                throw new this.Error('Unknown syntax option "' + syntax + '"');
        }

        return result;
    },

    toJSON: function toJSON() {
        var self = this,
            state = {
                operator: this.operator,
                children: []
            };

        this.children.forEach(function(child) {
            state.children.push(child instanceof FilterLeaf ? child : toJSON.call(child));
        });

        _(FilterNode.optionsSchema).each(function(optionSchema, key) {
            if (
                self[key] && // there is a standard option on the node which may need to be output
                !self.dontPersist[key] && (
                    optionSchema.own || // output because it's an "own" option (belongs to the node)
                    !self.parent || // output because it's the root node
                    self[key] !== self.parent[key] // output because it differs from its parent's version
                )
            ) {
                state[key] = self[key];
            }
        });

        return state;
    },

    /**
     * @summary Set the case sensitivity of filter tests against data.
     * @desc Case sensitivity pertains to string compares only. This includes untyped columns, columns typed as strings, typed columns containing data that cannot be coerced to type or when the filter expression operand cannot be coerced.
     *
     * NOTE: This is a shared property and affects all filter-tree instances constructed by this code instance.
     * @param {boolean} isSensitive
     * @memberOf Filtertree#.prototype
     */
    set caseSensitiveData(isSensitive) {
        var toString = isSensitive ? toStringCaseSensitive : toStringCaseInsensitive;
        FilterLeaf.setToString(toString);
    }

});

function toStringCaseInsensitive(s) { return (s + '').toUpperCase(); }
function toStringCaseSensitive(s) { return s + ''; }

// Some event handlers bound to FilterTree object

function onchange(evt) { // called in context
    var ctrl = evt.target;
    if (ctrl.parentElement === this.el) {
        if (ctrl.value === 'subexp') {
            this.children.push(new FilterTree({
                parent: this
            }));
        } else {
            this.add({
                state: { editor: ctrl.value },
                focus: true
            });
        }
        ctrl.selectedIndex = 0;
    }
}

function onTreeOpClick(evt) { // called in context
    var ctrl = evt.target;

    if (ctrl.className === 'filter-tree-op-choice') {
        this.operator = ctrl.value;

        // display strike-through
        var radioButtons = this.el.querySelectorAll('label>input.filter-tree-op-choice[name=' + ctrl.name + ']');
        Array.prototype.forEach.call(radioButtons, function(ctrl) {
            ctrl.parentElement.style.textDecoration = ctrl.checked ? 'none' : 'line-through';
        });

        // display operator between filters by adding operator string as a CSS class of this tree
        for (var key in operators) {
            this.el.classList.remove(key);
        }
        this.el.classList.add(this.operator);
    }
}

/**
 * Throws error if invalid expression tree.
 * Caught by {@link FilterTree#invalid|FilterTree.prototype.invalid()}.
 * @param {boolean} [options.focus=false] - Move focus to offending control.
 * @returns {undefined} if valid
 * @private
 */
function invalid(options) { // called in context
    //if (this instanceof FilterTree && !this.children.length) {
    //    throw new this.Error('Empty subexpression (no filters).');
    //}

    this.children.forEach(function(child) {
        if (child instanceof FilterLeaf) {
            child.invalid(options);
        } else if (child.children.length) {
            invalid.call(child, options);
        }
    });
}

FilterTree.extensions = {
    Columns: require('./extensions/columns')
};

// module initialization
FilterTree.prototype.caseSensitiveData = true;  // default is case-sensitive which is more efficient; may be reset at will


module.exports = FilterTree;

},{"./FilterLeaf":14,"./FilterNode":15,"./extensions/columns":18,"./tree-operators":21,"object-iterators":22,"pop-menu":24,"unstrungify":27}],17:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var templex = require('templex');

var templates = require('../html');

var encoders = /\{(\d+)\:encode\}/g;

function Templates() {}
var constructor = Templates.prototype.constructor;
Templates.prototype = templates;
Templates.prototype.constructor = constructor; // restore it
Templates.prototype.get = function(templateName) { // mix it in
    var keys,
        matches = {},
        temp = document.createElement('div'),
        text = this[templateName],
        args = Array.prototype.slice.call(arguments, 1);

    encoders.lastIndex = 0;

    while ((keys = encoders.exec(text))) {
        matches[keys[1]] = true;
    }

    keys = Object.keys(matches);

    if (keys.length) {
        keys.forEach(function(key) {
            temp.textContent = args[key];
            args[key] = temp.innerHTML;
        });
        text = text.replace(encoders, '{$1}');
    }

    temp.innerHTML = templex.apply(this, [text].concat(args));

    // if only one HTMLElement, return it; otherwise entire list of nodes
    return temp.children.length === 1 && temp.childNodes.length === 1
        ? temp.firstChild
        : temp.childNodes;
};

module.exports = Templates;

},{"../html":11,"templex":26}],18:[function(require,module,exports){
'use strict';

var Conditionals = require('../Conditionals');
var FilterLeaf = require('../FilterLeaf');

/**
 * @summary Prototype additions object for extending {@link FilterLeaf}.
 * @desc Resulting object is similar to {@link FilterLeaf} except:
 * 1. The `operand` property names another column rather than contains a literal.
 * 2. Operators are limited to equality, inequalities, and sets (IN/NOT IN). Omitted are the string and pattern scans (BEGINS/NOT BEGINS, ENDS/NOT ENDS, CONTAINS/NOT CONTAINS, and LIKE/NOT LIKE).
 *
 * @extends FilterLeaf
 *
 * @property {string} identifier - Name of column (member of data row object) to compare against this column (member of data row object named by `column`).
 */
var ColumnLeaf = {
    name: 'column = column', // display string for drop-down

    createView: function() {
        // Create the `view` hash and insert the three default elements (`column`, `operator`, `operand`) into `.el`
        FilterLeaf.prototype.createView.call(this);

        // Replace the `operand` element from the `view` hash
        var oldOperand = this.view.operand,
            newOperand = this.view.operand = this.makeElement(this.root.schema, 'column', this.sortColumnMenu);

        // Replace the operand element with the new one. There are no event listeners to worry about.
        this.el.replaceChild(newOperand, oldOperand);
    },

    makeSqlOperand: function() {
        return this.root.conditionals.makeSqlIdentifier(this.operand);
    },

    opMenu: [
        Conditionals.groups.equality,
        Conditionals.groups.inequalities,
        Conditionals.groups.sets
    ],

    q: function(dataRow) {
        return this.valOrFunc(dataRow, this.operand, this.calculator);
    }
};

module.exports = ColumnLeaf;

},{"../Conditionals":13,"../FilterLeaf":14}],19:[function(require,module,exports){
'use strict';

var reOp = /^((=|>=?|<[>=]?)|(NOT )?(LIKE|IN)\b)/i, // match[1]
    reFloat = /^([+-]?(\d+(\.\d*)?|\d*\.\d+)(e[+-]\d+)?)[^\d]?/i,
    reLit = /^'(\d+)'/,
    reLitAnywhere = /'(\d+)'/,
    reIn = /^\((.*?)\)/,
    reBool = /^(AND|OR)\b/i,
    reGroup = /^(NOT ?)?\(/i;

var SQT = '\'';

var defaultIdQts = {
    beg: '"',
    end: '"'
};

function ParserSqlError(message) {
    this.message = message;
}
ParserSqlError.prototype = Object.create(Error.prototype);
ParserSqlError.prototype.name = 'ParserSqlError';

/** @typedef {object} sqlIdQtsObject
 * @desc On a practical level, the useful characters are:
 * * SQL-92 standard: "double quotes"
 * * SQL Server: "double quotes" or \[square brackets\]
 * * mySQL: \`tick marks\`
 * @property {string} beg - The open quote character.
 * @property {string} end - The close quote character.
 */

/**
 * @constructor
 * @summary Structured Query Language (SQL) parser
 * @author Jonathan Eiten <jonathan@openfin.com>
 * @desc This is a subset of SQL conditional expression syntax.
 *
 * @see {@link https://msdn.microsoft.com/en-us/library/ms173545.aspx SQL Search Condition}
 *
 * @param {menuItem[]} [options.schema] - Column schema for column name validation. Throws an error if name fails validation (but see `resolveAliases`). Omit to skip column name validation.
 * @param {boolean} [options.resolveAliases] - Validate column aliases against schema and use the associated column name in the returned expression state object. Requires `options.schema`. Throws error if no such column found.
 * @param {boolean} [options.caseSensitiveColumnNames] - Ignore case while validating column names and aliases.
 * @param {sqlIdQtsObject} [options.sqlIdQts={beg:'"',end:'"'}]
 */
function ParserSQL(options) {
    options = options || {};

    this.schema = options.schema;

    var idQts = options.sqlIdQts || defaultIdQts;
    this.reName = new RegExp('^(' + idQts.beg + '(.+?)' + idQts.end + '|([A-Z_][A-Z_@\\$#]*)\\b)', 'i'); // match[2] || match[3]
}

ParserSQL.prototype = {

    constructor: ParserSQL.prototype.constructor,

    /**
     * @param {string} sql
     * @returns {*}
     * @memberOf module:sqlSearchCondition
     */
    parse: function(sql) {
        var state;

        // reduce all runs of white space to a single space; then trim
        sql = sql.replace(/\s\s+/g, ' ').trim();

        sql = stripLiterals.call(this, sql);
        state = walk.call(this, sql);

        if (!state.children) {
            state = { children: [ state ] };
        }

        return state;
    }
};

function walk(t) {
    var m, name, op, operand, editor, bool, token, tokens = [];
    var i = 0;

    t = t.trim();

    while (i < t.length) {
        m = t.substr(i).match(reGroup);
        if (m) {
            var not = !!m[1];

            i += m[0].length;
            for (var j = i, v = 1; j < t.length && v; ++j) {
                if (t[j] === '(') {
                    ++v;
                } else if (t[j] === ')') {
                    --v;
                }
            }

            if (v) {
                throw new ParserSqlError('Expected ")"');
            }
            token = walk.call(this, t.substr(i, j - 1 - i));
            if (typeof token !== 'object') {
                return token;
            }

            if (not) {
                if (token.operator !== 'op-or') {
                    throw new ParserSqlError('Expected OR in NOT(...) subexpression but found ' + token.operator.substr(3).toUpperCase() + '.');
                }
                token.operator = 'op-nor';
            }

            i = j;
        } else {

            // column:

            m = t.substr(i).match(this.reName);
            if (!m) {
                throw new ParserSqlError('Expected identifier or quoted identifier.');
            }
            name = m[2] || m[3];
            if (!/^[A-Z_]/i.test(t[i])) { i += 2; }
            i += name.length;

            // operator:

            if (t[i] === ' ') { ++i; }
            m = t.substr(i).match(reOp);
            if (!m) {
                throw new ParserSqlError('Expected relational operator.');
            }
            op = m[1].toUpperCase();
            i += op.length;

            // operand:

            editor = undefined;
            if (t[i] === ' ') { ++i; }
            if (m[4] && m[4].toUpperCase() === 'IN') {
                m = t.substr(i).match(reIn);
                if (!m) {
                    throw new ParserSqlError('Expected parenthesized list.');
                }
                operand = m[1];
                i += operand.length + 2;
                while ((m = operand.match(reLitAnywhere))) {
                    operand = operand.replace(reLitAnywhere, this.literals[m[1]]);
                }
            } else if ((m = t.substr(i).match(reLit))) {
                operand = m[1];
                i += operand.length + 2;
                operand = this.literals[operand];
            } else if ((m = t.substr(i).match(reFloat))) {
                operand = m[1];
                i += operand.length;
            } else if ((m = t.substr(i).match(this.reName))) {
                operand = m[2] || m[3];
                i += operand.length;
                editor = 'Columns';
            } else {
                throw new ParserSqlError('Expected number or string literal or column.');
            }

            if (this.schema) {
                name = lookup.call(this, name);

                if (editor) {
                    operand = lookup.call(this, operand);
                }
            }

            token = {
                column: name,
                operator: op,
                operand: operand
            };

            if (editor) {
                token.editor = editor;
            }
        }

        tokens.push(token);

        if (i < t.length) {
            if (t[i] === ' ') { ++i; }
            m = t.substr(i).match(reBool);
            if (!m) {
                throw new ParserSqlError('Expected boolean operator.');
            }
            bool = m[1].toLowerCase();
            i += bool.length;
            bool = 'op-' + bool;
            if (tokens.operator && tokens.operator !== bool) {
                throw new ParserSqlError('Expected same boolean operator throughout subexpression.');
            }
            tokens.operator = bool;
        }

        if (t[i] === ' ') { ++i; }
    }

    return (
        tokens.length === 1 ? tokens[0] : {
            operator: tokens.operator,
            children: tokens
        }
    );
}

function lookup(name) {
    var item = this.schema.lookup(name);

    if (!item) {
        throw new ParserSqlError(this.resolveAliases
            ? 'Expected valid column name.'
            : 'Expected valid column name or alias.'
        );
    }

    return item.name;
}

function stripLiterals(t) {
    var i = 0, j = 0, k;

    this.literals = [];

    while ((j = t.indexOf(SQT, j)) >= 0) {
        k = j;
        do {
            k = t.indexOf(SQT, k + 1);
            if (k < 0) {
                throw new ParserSqlError('Expected ' + SQT + ' (single quote).');
            }
        } while (t[++k] === SQT);
        this.literals.push(t.slice(++j, --k).replace(/''/g, SQT));
        t = t.substr(0, j) + i + t.substr(k);
        j = j + 1 + (i + '').length + 1;
        i++;
    }

    return t;
}

module.exports = ParserSQL;

},{}],20:[function(require,module,exports){
'use strict';

var cssInjector = require('css-injector');

var css; // defined by code inserted by gulpfile between following comments
/* inject:css */
css = '.filter-tree{font-family:sans-serif;font-size:10pt;line-height:1.5em}.filter-tree label{font-weight:400}.filter-tree input[type=checkbox],.filter-tree input[type=radio]{margin-left:3px;margin-right:3px}.filter-tree ol{margin-top:0}.filter-tree>select{float:right;border:1px dotted grey;background-color:transparent;box-shadow:none}.filter-tree-remove-button{display:inline-block;width:15px;height:15px;border-radius:8px;background-color:#e88;font-size:11.5px;color:#fff;text-align:center;line-height:normal;font-style:normal;font-family:sans-serif;margin-right:4px;cursor:pointer}.filter-tree-remove-button:hover{background-color:transparent;color:#e88;font-weight:700;box-shadow:red 0 0 2px inset}.filter-tree-remove-button::before{content:\'\\d7\'}.filter-tree li::after{font-size:70%;font-style:italic;font-weight:700;color:#080}.filter-tree>ol>li:last-child::after{display:none}.op-and>ol,.op-nor>ol,.op-or>ol{padding-left:5px;margin-left:27px}.op-or>ol>li::after{margin-left:2.5em;content:\'— OR —\'}.op-and>ol>li::after{margin-left:2.5em;content:\'— AND —\'}.op-nor>ol>li::after{margin-left:2.5em;content:\'— NOR —\'}.filter-tree-editor>*{font-weight:700}.filter-tree-editor>span{font-size:smaller}.filter-tree-editor>input[type=text]{width:8em;padding:1px 5px 2px}.filter-tree-warning{background-color:#ffc!important;border-color:#edb!important;font-weight:400!important}.filter-tree-error{background-color:#fcc!important;border-color:#c99!important;font-weight:400!important}.filter-tree-default>:enabled{margin:0 .4em;background-color:#ddd;border:1px solid transparent}.filter-tree.filter-tree-type-column-filters>ol>li:not(:last-child){padding-bottom:.75em;border-bottom:3px double #080;margin-bottom:.75em}.filter-tree .footnotes{margin:0 0 6px;font-size:8pt;font-weight:400;line-height:normal;white-space:normal;color:#c00}.filter-tree .footnotes>p{margin:0}.filter-tree .footnotes>ul{margin:-3px 0 0;padding-left:17px;text-index:-6px}.filter-tree .footnotes>ul>li{margin:2px 0}.filter-tree .footnotes .field-name,.filter-tree .footnotes .field-value{font-weight:700;font-style:normal}.filter-tree .footnotes .field-value{font-family:monospace;color:#000;background-color:#ddd;padding:0 5px;margin:0 3px;border-radius:3px}';
/* endinject */

module.exports = cssInjector.bind(this, css, 'filter-tree-base');

},{"css-injector":9}],21:[function(require,module,exports){
'use strict';

/** @typedef {function} operationReducer
 * @param {boolean} p
 * @param {boolean} q
 * @returns {boolean} The result of applying the operator to the two parameters.
 */

/**
 * @private
 * @type {operationReducer}
 */
function AND(p, q) {
    return p && q;
}

/**
 * @private
 * @type {operationReducer}
 */
function OR(p, q) {
    return p || q;
}

/** @typedef {obejct} treeOperator
 * @desc Each `treeOperator` object describes two things:
 *
 * 1. How to take the test results of _n_ child nodes by applying the operator to all the results to "reduce" it down to a single result.
 * 2. How to generate SQL WHERE clause syntax that applies the operator to _n_ child nodes.
 *
 * @property {operationReducer} reduce
 * @property {boolean} seed -
 * @property {boolean} abort -
 * @property {boolean} negate -
 * @property {string} SQL.op -
 * @property {string} SQL.beg -
 * @property {string} SQL.end -
 */

/** A hash of {@link treeOperator} objects.
 * @type {object}
 */
var treeOperators = {
    'op-and': {
        reduce: AND,
        seed: true,
        abort: false,
        negate: false,
        SQL: {
            op: 'AND',
            beg: '(',
            end: ')'
        }
    },
    'op-or': {
        reduce: OR,
        seed: false,
        abort: true,
        negate: false,
        SQL: {
            op: 'OR',
            beg: '(',
            end: ')'
        }
    },
    'op-nor': {
        reduce: OR,
        seed: false,
        abort: true,
        negate: true,
        SQL: {
            op: 'OR',
            beg: 'NOT (',
            end: ')'
        }
    }
};

module.exports = treeOperators;

},{}],22:[function(require,module,exports){
/* object-iterators.js - Mini Underscore library
 * by Jonathan Eiten
 *
 * The methods below operate on objects (but not arrays) similarly
 * to Underscore (http://underscorejs.org/#collections).
 *
 * For more information:
 * https://github.com/joneit/object-iterators
 */

'use strict';

/**
 * @constructor
 * @summary Wrap an object for one method call.
 * @Desc Note that the `new` keyword is not necessary.
 * @param {object|null|undefined} object - `null` or `undefined` is treated as an empty plain object.
 * @return {Wrapper} The wrapped object.
 */
function Wrapper(object) {
    if (object instanceof Wrapper) {
        return object;
    }
    if (!(this instanceof Wrapper)) {
        return new Wrapper(object);
    }
    this.originalValue = object;
    this.o = object || {};
}

/**
 * @name Wrapper.chain
 * @summary Wrap an object for a chain of method calls.
 * @Desc Calls the constructor `Wrapper()` and modifies the wrapper for chaining.
 * @param {object} object
 * @return {Wrapper} The wrapped object.
 */
Wrapper.chain = function (object) {
    var wrapped = Wrapper(object); // eslint-disable-line new-cap
    wrapped.chaining = true;
    return wrapped;
};

Wrapper.prototype = {
    /**
     * Unwrap an object wrapped with {@link Wrapper.chain|Wrapper.chain()}.
     * @return {object|null|undefined} The value originally wrapped by the constructor.
     * @memberOf Wrapper.prototype
     */
    value: function () {
        return this.originalValue;
    },

    /**
     * @desc Mimics Underscore's [each](http://underscorejs.org/#each) method: Iterate over the members of the wrapped object, calling `iteratee()` with each.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is undefined; an `.each` loop cannot be broken out of (use {@link Wrapper#find|.find} instead).
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {Wrapper} The wrapped object for chaining.
     * @memberOf Wrapper.prototype
     */
    each: function (iteratee, context) {
        var o = this.o;
        Object.keys(o).forEach(function (key) {
            iteratee.call(this, o[key], key, o);
        }, context || o);
        return this;
    },

    /**
     * @desc Mimics Underscore's [find](http://underscorejs.org/#find) method: Look through each member of the wrapped object, returning the first one that passes a truth test (`predicate`), or `undefined` if no value passes the test. The function returns the value of the first acceptable member, and doesn't necessarily traverse the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The found property's value, or undefined if not found.
     * @memberOf Wrapper.prototype
     */
    find: function (predicate, context) {
        var o = this.o;
        var result;
        if (o) {
            result = Object.keys(o).find(function (key) {
                return predicate.call(this, o[key], key, o);
            }, context || o);
            if (result !== undefined) {
                result = o[result];
            }
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [filter](http://underscorejs.org/#filter) method: Look through each member of the wrapped object, returning the values of all members that pass a truth test (`predicate`), or empty array if no value passes the test. The function always traverses the entire object.
     * @param {function} predicate - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function should be truthy if the member passes the test and falsy otherwise.
     * @param {object} [context] - If given, `predicate` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    filter: function (predicate, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                if (predicate.call(this, o[key], key, o)) {
                    result.push(o[key]);
                }
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [map](http://underscorejs.org/#map) method: Produces a new array of values by mapping each value in list through a transformation function (`iteratee`). The function always traverses the entire object.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with three arguments: `(value, key, object)`. The return value of this function is concatenated to the end of the new array.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `predicate`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} An array containing the filtered values.
     * @memberOf Wrapper.prototype
     */
    map: function (iteratee, context) {
        var o = this.o;
        var result = [];
        if (o) {
            Object.keys(o).forEach(function (key) {
                result.push(iteratee.call(this, o[key], key, o));
            }, context || o);
        }
        return result;
    },

    /**
     * @desc Mimics Underscore's [reduce](http://underscorejs.org/#reduce) method: Boil down the values of all the members of the wrapped object into a single value. `memo` is the initial state of the reduction, and each successive step of it should be returned by `iteratee()`.
     * @param {function} iteratee - For each member of the wrapped object, this function is called with four arguments: `(memo, value, key, object)`. The return value of this function becomes the new value of `memo` for the next iteration.
     * @param {*} [memo] - If no memo is passed to the initial invocation of reduce, the iteratee is not invoked on the first element of the list. The first element is instead passed as the memo in the invocation of the iteratee on the next element in the list.
     * @param {object} [context] - If given, `iteratee` is bound to this object. In other words, this object becomes the `this` value in the calls to `iteratee`. (Otherwise, the `this` value will be the unwrapped object.)
     * @return {*} The value of `memo` "reduced" as per `iteratee`.
     * @memberOf Wrapper.prototype
     */
    reduce: function (iteratee, memo, context) {
        var o = this.o;
        if (o) {
            Object.keys(o).forEach(function (key, idx) {
                memo = (!idx && memo === undefined) ? o[key] : iteratee(memo, o[key], key, o);
            }, context || o);
        }
        return memo;
    },

    /**
     * @desc Mimics Underscore's [extend](http://underscorejs.org/#extend) method: Copy all of the properties in each of the `source` object parameter(s) over to the (wrapped) destination object (thus mutating it). It's in-order, so the properties of the last `source` object will override properties with the same name in previous arguments or in the destination object.
     * > This method copies own members as well as members inherited from prototype chain.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extend: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            if (object) {
                for (var key in object) {
                    o[key] = object[key];
                }
            }
        });
        return this.chaining ? this : o;
    },

    /**
     * @desc Mimics Underscore's [extendOwn](http://underscorejs.org/#extendOwn) method: Like {@link Wrapper#extend|extend}, but only copies its "own" properties over to the destination object.
     * @param {...object|null|undefined} source - Values of `null` or `undefined` are treated as empty plain objects.
     * @return {Wrapper|object} The wrapped destination object if chaining is in effect; otherwise the unwrapped destination object.
     * @memberOf Wrapper.prototype
     */
    extendOwn: function (source) {
        var o = this.o;
        Array.prototype.slice.call(arguments).forEach(function (object) {
            Wrapper(object).each(function (val, key) { // eslint-disable-line new-cap
                o[key] = val;
            });
        });
        return this.chaining ? this : o;
    }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) { // eslint-disable-line no-extend-native
        if (this === null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

module.exports = Wrapper;

},{}],23:[function(require,module,exports){
'use strict';

/** @module overrider */

/**
 * Mixes members of all `sources` into `target`, handling getters and setters properly.
 *
 * Any number of `sources` objects may be given and each is copied in turn.
 *
 * @example
 * var overrider = require('overrider');
 * var target = { a: 1 }, source1 = { b: 2 }, source2 = { c: 3 };
 * target === overrider(target, source1, source2); // true
 * // target object now has a, b, and c; source objects untouched
 *
 * @param {object} object - The target object to receive sources.
 * @param {...object} [sources] - Object(s) containing members to copy to `target`. (Omitting is a no-op.)
 * @returns {object} The target object (`target`)
 */
function overrider(target, sources) { // eslint-disable-line no-unused-vars
    for (var i = 1; i < arguments.length; ++i) {
        mixIn.call(target, arguments[i]);
    }

    return target;
}

/**
 * Mix `this` members into `target`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixInTo.call(source, target); // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the source hosts the method):
 * var mixInTo = require('overrider').mixInTo;
 * var target = { a: 1 }, source = { b: 2, mixInTo: mixInTo };
 * target === source.mixInTo(target); // true
 * // target object now has both a and b; source object untouched
 *
 * @this {object} Target.
 * @param target
 * @returns {object} The target object (`target`)
 * @memberOf module:overrider
 */
function mixInTo(target) {
    var descriptor;
    for (var key in this) {
        if ((descriptor = Object.getOwnPropertyDescriptor(this, key))) {
            Object.defineProperty(target, key, descriptor);
        }
    }
    return target;
}

/**
 * Mix `source` members into `this`.
 *
 * @example
 * // A. Simple usage (using .call):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1 }, source = { b: 2 };
 * target === overrider.mixIn.call(target, source) // true
 * // target object now has both a and b; source object untouched
 *
 * @example
 * // B. Semantic usage (when the target hosts the method):
 * var mixIn = require('overrider').mixIn;
 * var target = { a: 1, mixIn: mixIn }, source = { b: 2 };
 * target === target.mixIn(source) // true
 * // target now has both a and b (and mixIn); source untouched
 *
 * @param source
 * @returns {object} The target object (`this`)
 * @memberOf overrider
 * @memberOf module:overrider
 */
function mixIn(source) {
    var descriptor;
    for (var key in source) {
        if ((descriptor = Object.getOwnPropertyDescriptor(source, key))) {
            Object.defineProperty(this, key, descriptor);
        }
    }
    return this;
}

overrider.mixInTo = mixInTo;
overrider.mixIn = mixIn;

module.exports = overrider;

},{}],24:[function(require,module,exports){
/* eslint-env browser */

'use strict';

var REGEXP_INDIRECTION = /^(\w+)\((\w+)\)$/;  // finds complete pattern a(b) where both a and b are regex "words"

/** @typedef {object} valueItem
 * You should supply both `name` and `alias` but you could omit one or the other and whichever you provide will be used for both.
 * > If you only give the `name` property, you might as well just give a string for {@link menuItem} rather than this object.
 * @property {string} [name=alias] - Value of `value` attribute of `<option>...</option>` element.
 * @property {string} [alias=name] - Text of `<option>...</option>` element.
 * @property {string} [type] One of the keys of `this.converters`. If not one of these (including `undefined`), field values will be tested with a string comparison.
 * @property {boolean} [hidden=false]
 */

/** @typedef {object|menuItem[]} submenuItem
 * @summary Hierarchical array of select list items.
 * @desc Data structure representing the list of `<option>...</option>` and `<optgroup>...</optgroup>` elements that make up a `<select>...</select>` element.
 *
 * > Alternate form: Instead of an object with a `menu` property containing an array, may itself be that array. Both forms have the optional `label` property.
 * @property {string} [label] - Defaults to a generated string of the form "Group n[.m]..." where each decimal position represents a level of the optgroup hierarchy.
 * @property {menuItem[]} submenu
 */

/** @typedef {string|valueItem|submenuItem} menuItem
 * May be one of three possible types that specify either an `<option>....</option>` element or an `<optgroup>....</optgroup>` element as follows:
 * * If a `string`, specifies the text of an `<option>....</option>` element with no `value` attribute. (In the absence of a `value` attribute, the `value` property of the element defaults to the text.)
 * * If shaped like a {@link valueItem} object, specifies both the text and value of an `<option....</option>` element.
 * * If shaped like a {@link submenuItem} object (or its alternate array form), specifies an `<optgroup>....</optgroup>` element.
 */

/**
 * @summary Builds a new menu pre-populated with items and groups.
 * @desc This function creates a new pop-up menu (a.k.a. "drop-down"). This is a `<select>...</select>` element, pre-populated with items (`<option>...</option>` elements) and groups (`<optgroup>...</optgroup>` elements).
 * > Bonus: This function also builds `input type=text` elements.
 * > NOTE: This function generates OPTGROUP elements for subtrees. However, note that HTML5 specifies that OPTGROUP elemnents made not nest! This function generates the markup for them but they are not rendered by most browsers, or not completely. Therefore, for now, do not specify more than one level subtrees. Future versions of HTML may support it. I also plan to add here options to avoid OPTGROUPS entirely either by indenting option text, or by creating alternate DOM nodes using `<li>` instead of `<select>`, or both.
 * @memberOf popMenu
 *
 * @param {Element|string} el - Must be one of (case-sensitive):
 * * text box - an `HTMLInputElement` to use an existing element or `'INPUT'` to create a new one
 * * drop-down - an `HTMLSelectElement` to use an existing element or `'SELECT'` to create a new one
 * * submenu - an `HTMLOptGroupElement` to use an existing element or `'OPTGROUP'` to create a new one (meant for internal use only)
 *
 * @param {menuItem[]} [menu] - Hierarchical list of strings to add as `<option>...</option>` or `<optgroup>....</optgroup>` elements. Omitting creates a text box.
 *
 * @param {null|string} [options.prompt=''] - Adds an initial `<option>...</option>` element to the drop-down with this value in parentheses as its `text`; and empty string as its `value`. Default is empty string, which creates a blank prompt; `null` suppresses prompt altogether.
 *
 * @param {boolean} [options.sort] - Whether to alpha sort or not. If truthy, sorts each optgroup on its `label`; and each select option on its text (its `alias` if given; or its `name` if not).
 *
 * @param {string[]} [options.blacklist] - Optional list of menu item names to be ignored.
 *
 * @param {number[]} [options.breadcrumbs] - List of option group section numbers (root is section 0). (For internal use.)
 *
 * @param {boolean} [options.append=false] - When `el` is an existing `<select>` Element, giving truthy value adds the new children without first removing existing children.
 *
 * @returns {Element} Either a `<select>` or `<optgroup>` element.
 */
function build(el, menu, options) {
    options = options || {};

    var prompt = options.prompt,
        blacklist = options.blacklist,
        sort = options.sort,
        breadcrumbs = options.breadcrumbs || [],
        path = breadcrumbs.length ? breadcrumbs.join('.') + '.' : '',
        subtreeName = popMenu.subtree,
        groupIndex = 0,
        tagName;

    if (el instanceof Element) {
        tagName = el.tagName;
        if (!options.append) {
            el.innerHTML = ''; // remove all <option> and <optgroup> elements
        }
    } else {
        tagName = el;
        el = document.createElement(tagName);
    }

    if (menu) {
        var add, newOption;
        if (tagName === 'SELECT') {
            add = el.add;
            if (prompt) {
                newOption = new Option(prompt, '');
                newOption.innerHTML += '&hellip;';
                el.add(newOption);
            } else if (prompt !== null) {
                el.add(new Option());
            }
        } else {
            add = el.appendChild;
            el.label = prompt;
        }

        if (sort) {
            menu = menu.slice().sort(itemComparator); // sorted clone
        }

        menu.forEach(function(item) {
            // if item is of form a(b) and there is an function a in options, then item = options.a(b)
            if (options && typeof item === 'string') {
                var indirection = item.match(REGEXP_INDIRECTION);
                if (indirection) {
                    var a = indirection[1],
                        b = indirection[2],
                        f = options[a];
                    if (typeof f === 'function') {
                        item = f(b);
                    } else {
                        throw 'build: Expected options.' + a + ' to be a function.';
                    }
                }
            }

            var subtree = item[subtreeName] || item;
            if (subtree instanceof Array) {

                var groupOptions = {
                    breadcrumbs: breadcrumbs.concat(++groupIndex),
                    prompt: item.label || 'Group ' + path + groupIndex,
                    options: sort,
                    blacklist: blacklist
                };

                var optgroup = build('OPTGROUP', subtree, groupOptions);

                if (optgroup.childElementCount) {
                    el.appendChild(optgroup);
                }

            } else if (typeof item !== 'object') {

                if (!(blacklist && blacklist.indexOf(item) >= 0)) {
                    add.call(el, new Option(item));
                }

            } else if (!item.hidden) {

                var name = item.name || item.alias;
                if (!(blacklist && blacklist.indexOf(name) >= 0)) {
                    add.call(el, new Option(
                        item.alias || item.name,
                        name
                    ));
                }

            }
        });
    } else {
        el.type = 'text';
    }

    return el;
}

function itemComparator(a, b) {
    a = a.alias || a.name || a.label || a;
    b = b.alias || b.name || b.label || b;
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @summary Recursively searches the context array of `menuItem`s for a named `item`.
 * @memberOf popMenu
 * @this Array
 * @param {object} [options]
 * @param {string} [options.keys=[popMenu.defaultKey]] - Properties to search each menuItem when it is an object.
 * @param {boolean} [options.caseSensitive=false] - Ignore case while searching.
 * @param {string} value - Value to search for.
 * @returns {undefined|menuItem} The found item or `undefined` if not found.
 */
function lookup(options, value) {
    if (arguments.length === 1) {
        value = options;
        options = undefined;
    }

    var shallow, deep, item, prop,
        keys = options && options.keys || [popMenu.defaultKey],
        caseSensitive = options && options.caseSensitive;

    value = toString(value, caseSensitive);

    shallow = this.find(function(item) {
        var subtree = item[popMenu.subtree] || item;

        if (subtree instanceof Array) {
            return (deep = lookup.call(subtree, options, value));
        }

        if (typeof item !== 'object') {
            return toString(item, caseSensitive) === value;
        } else {
            for (var i = 0; i < keys.length; ++i) {
                prop = item[keys[i]];
                if (prop && toString(prop, caseSensitive) === value) {
                    return true;
                }
            }
        }
    });

    item = deep || shallow;

    return item && (item.name ? item : { name: item });
}

function toString(s, caseSensitive) {
    var result = '';
    if (s) {
        result += s; // convert s to string
        if (!caseSensitive) {
            result = result.toUpperCase();
        }
    }
    return result;
}

/**
 * @summary Recursively walks the context array of `menuItem`s and calls `iteratee` on each item therein.
 * @desc `iteratee` is called with each item (terminal node) in the menu tree and a flat 0-based index. Recurses on member with name of `popMenu.subtree`.
 *
 * The node will always be a {@link valueItem} object; when a `string`, it is boxed for you.
 *
 * @memberOf popMenu
 *
 * @this Array
 *
 * @param {function} iteratee - For each item in the menu, `iteratee` is called with:
 * * the `valueItem` (if the item is a primative string, it is wrapped up for you)
 * * a 0-based `ordinal`
 *
 * The `iteratee` return value can be used to replace the item, as follows:
 * * `undefined` - do nothing
 * * `null` - splice out the item; resulting empty submenus are also spliced out (see note)
 * * anything else - replace the item with this value; if value is a subtree (i.e., an array) `iteratee` will then be called to walk it as well (see note)
 *
 * > Note: Returning anything (other than `undefined`) from `iteratee` will (deeply) mutate the original `menu` so you may want to copy it first (deeply, including all levels of array nesting but not the terminal node objects).
 *
 * @returns {number} Number of items (terminal nodes) in the menu tree.
 */
function walk(iteratee) {
    var menu = this,
        ordinal = 0,
        subtreeName = popMenu.subtree,
        i, item, subtree, newVal;

    for (i = menu.length - 1; i >= 0; --i) {
        item = menu[i];
        subtree = item[subtreeName] || item;

        if (!(subtree instanceof Array)) {
            subtree = undefined;
        }

        if (!subtree) {
            newVal = iteratee(item.name ? item : { name: item }, ordinal);
            ordinal += 1;

            if (newVal !== undefined) {
                if (newVal === null) {
                    menu.splice(i, 1);
                    ordinal -= 1;
                } else {
                    menu[i] = item = newVal;
                    subtree = item[subtreeName] || item;
                    if (!(subtree instanceof Array)) {
                        subtree = undefined;
                    }
                }
            }
        }

        if (subtree) {
            ordinal += walk.call(subtree, iteratee);
            if (subtree.length === 0) {
                menu.splice(i, 1);
                ordinal -= 1;
            }
        }
    }

    return ordinal;
}

/**
 * @summary Format item name with it's alias when available.
 * @memberOf popMenu
 * @param {string|valueItem} item
 * @returns {string} The formatted name and alias.
 */
function formatItem(item) {
    var result = item.name || item;
    if (item.alias) {
        result = '"' + item.alias + '" (' + result + ')';
    }
    return result;
}


function isGroupProxy(s) {
    return REGEXP_INDIRECTION.test(s);
}

/**
 * @namespace
 */
var popMenu = {
    build: build,
    walk: walk,
    lookup: lookup,
    formatItem: formatItem,
    isGroupProxy: isGroupProxy,
    subtree: 'submenu',
    defaultKey: 'name'
};

module.exports = popMenu;

},{}],25:[function(require,module,exports){
'use strict';

var // a regex search pattern that matches all the reserved chars of a regex search pattern
    reserved = /([\.\\\+\*\?\^\$\(\)\{\}\=\!\<\>\|\:\[\]])/g,

    // regex wildcard search patterns
    REGEXP_WILDCARD = '.*',
    REGEXP_WILDCHAR = '.',
    REGEXP_WILDCARD_MATCHER = '(' + REGEXP_WILDCARD + ')',

    // LIKE search patterns
    LIKE_WILDCHAR = '_',
    LIKE_WILDCARD = '%',

    // regex search patterns that match LIKE search patterns
    REGEXP_LIKE_PATTERN_MATCHER = new RegExp('(' + [
        LIKE_WILDCHAR,
        LIKE_WILDCARD,
        '\\[\\^?[^-\\]]+]', // matches a LIKE set (same syntax as a RegExp set)
        '\\[\\^?[^-\\]]\\-[^\\]]]' // matches a LIKE range (same syntax as a RegExp range)
    ].join('|') + ')', 'g');

function regExpLIKE(pattern, ignoreCase) {
    var i, parts;

    // Find all LIKE patterns
    parts = pattern.match(REGEXP_LIKE_PATTERN_MATCHER);

    if (parts) {
        // Translate found LIKE patterns to regex patterns, escaped intervening non-patterns, and interleave the two

        for (i = 0; i < parts.length; ++i) {
            // Escape left brackets (unpaired right brackets are OK)
            if (parts[i][0] === '[') {
                parts[i] = regExpLIKE.reserve(parts[i]);
            }

            // Make each found pattern matchable by enclosing in parentheses
            parts[i] = '(' + parts[i] + ')';
        }

        // Match these precise patterns again with their intervening non-patterns (i.e., text)
        parts = pattern.match(new RegExp(
            REGEXP_WILDCARD_MATCHER +
            parts.join(REGEXP_WILDCARD_MATCHER)  +
            REGEXP_WILDCARD_MATCHER
        ));

        // Discard first match of non-global search (which is the whole string)
        parts.shift();

        // For each re-found pattern part, translate % and _ to regex equivalent
        for (i = 1; i < parts.length; i += 2) {
            var part = parts[i];
            switch (part) {
                case LIKE_WILDCARD: part = REGEXP_WILDCARD; break;
                case LIKE_WILDCHAR: part = REGEXP_WILDCHAR; break;
                default:
                    var j = part[1] === '^' ? 2 : 1;
                    part = '[' + regExpLIKE.reserve(part.substr(j, part.length - (j + 1))) + ']';
            }
            parts[i] = part;
        }
    } else {
        parts = [pattern];
    }

    // For each surrounding text part, escape reserved regex chars
    for (i = 0; i < parts.length; i += 2) {
        parts[i] = regExpLIKE.reserve(parts[i]);
    }

    // Join all the interleaved parts
    parts = parts.join('');

    // Optimize or anchor the pattern at each end as needed
    if (parts.substr(0, 2) === REGEXP_WILDCARD) { parts = parts.substr(2); } else { parts = '^' + parts; }
    if (parts.substr(-2, 2) === REGEXP_WILDCARD) { parts = parts.substr(0, parts.length - 2); } else { parts += '$'; }

    // Return the new regex
    return new RegExp(parts, ignoreCase ? 'i' : undefined);
}

regExpLIKE.reserve = function (s) {
    return s.replace(reserved, '\\$1');
};

var cache, size;

/**
 * @summary Delete a pattern from the cache; or clear the whole cache.
 * @param {string} [pattern] - The LIKE pattern to remove from the cache. Fails silently if not found in the cache. If pattern omitted, clears whole cache.
 */
(regExpLIKE.clearCache = function (pattern) {
    if (!pattern) {
        cache = {};
        size = 0;
    } else if (cache[pattern]) {
        delete cache[pattern];
        size--;
    }
    return size;
})(); // init the cache

regExpLIKE.getCacheSize = function () { return size; };

/**
 * @summary Cached version of `regExpLIKE()`.
 * @desc Cached entries are subject to garbage collection if `keep` is `undefined` or `false` on insertion or `false` on most recent reference. Garbage collection will occur iff `regExpLIKE.cacheMax` is defined and it equals the number of cached patterns. The garbage collector sorts the patterns based on most recent reference; the oldest 10% of the entries are deleted. Alternatively, you can manage the cache yourself to a limited extent (see {@link regeExpLIKE.clearCache|clearCache}).
 * @param pattern - the LIKE pattern (to be) converted to a RegExp
 * @param [keep] - If given, changes the keep status for this pattern as follows:
 * * `true` permanently caches the pattern (not subject to garbage collection) until `false` is given on a subsequent call
 * * `false` allows garbage collection on the cached pattern
 * * `undefined` no change to keep status
 * @returns {RegExp}
 */
regExpLIKE.cached = function (keep, pattern, ignoreCase) {
    if (typeof keep === 'string') {
        ignoreCase = pattern;
        pattern = keep;
        keep = false;
    }
    var patternAndCase = pattern + (ignoreCase ? 'i' : 'c'),
        item = cache[patternAndCase];
    if (item) {
        item.when = new Date().getTime();
        if (keep !== undefined) {
            item.keep = keep;
        }
    } else {
        if (size === regExpLIKE.cacheMax) {
            var age = [], ages = 0, key, i;
            for (key in cache) {
                item = cache[key];
                if (!item.keep) {
                    for (i = 0; i < ages; ++i) {
                        if (item.when < age[i].item.when) {
                            break;
                        }
                    }
                    age.splice(i, 0, { key: key, item: item });
                    ages++;
                }
            }
            if (!age.length) {
                return regExpLIKE(pattern, ignoreCase); // cache is full!
            }
            i = Math.ceil(age.length / 10); // will always be at least 1
            size -= i;
            while (i--) {
                delete cache[age[i].key];
            }
        }
        item = cache[patternAndCase] = {
            regex: regExpLIKE(pattern, ignoreCase),
            keep: keep,
            when: new Date().getTime()
        };
        size++;
    }
    return item.regex;
};

module.exports = regExpLIKE;

},{}],26:[function(require,module,exports){
// templex node module
// https://github.com/joneit/templex

/* eslint-env node */

/**
 * Merges values of execution context properties named in template by {prop1},
 * {prop2}, etc., or any javascript expression incorporating such prop names.
 * The context always includes the global object. In addition you can specify a single
 * context or an array of contexts to search (in the order given) before finally
 * searching the global context.
 *
 * Merge expressions consisting of simple numeric terms, such as {0}, {1}, etc., deref
 * the first context given, which is assumed to be an array. As a convenience feature,
 * if additional args are given after `template`, `arguments` is unshifted onto the context
 * array, thus making first additional arg available as {1}, second as {2}, etc., as in
 * `templex('Hello, {1}!', 'World')`. ({0} is the template so consider this to be 1-based.)
 *
 * If you prefer something other than braces, redefine `templex.regexp`.
 *
 * See tests for examples.
 *
 * @param {string} template
 * @param {...string} [args]
 */
function templex(template) {
    var contexts = this instanceof Array ? this : [this];
    if (arguments.length > 1) { contexts.unshift(arguments); }
    return template.replace(templex.regexp, templex.merger.bind(contexts));
}

templex.regexp = /\{(.*?)\}/g;

templex.with = function (i, s) {
    return 'with(this[' + i + ']){' + s + '}';
};

templex.cache = [];

templex.deref = function (key) {
    if (!(this.length in templex.cache)) {
        var code = 'return eval(expr)';

        for (var i = 0; i < this.length; ++i) {
            code = templex.with(i, code);
        }

        templex.cache[this.length] = eval('(function(expr){' + code + '})'); // eslint-disable-line no-eval
    }
    return templex.cache[this.length].call(this, key);
};

templex.merger = function (match, key) {
    // Advanced features: Context can be a list of contexts which are searched in order.
    var replacement;

    try {
        replacement = isNaN(key) ? templex.deref.call(this, key) : this[0][key];
    } catch (e) {
        replacement = '{' + key + '}';
    }

    return replacement;
};

// this interface consists solely of the templex function (and it's properties)
module.exports = templex;

},{}],27:[function(require,module,exports){
// Created by Jonathan Eiten on 1/7/16.

'use strict';

/**
 * Very fast array test.
 * For cross-frame scripting; use `crossFramesIsArray` instead.
 * @param {*} arr - The object to test.
 * @returns {boolean}
 */
unstrungify.isArray = function(arr) { return arr.constructor === Array; };

/**
 * @summary Walk a hierarchical object as JSON.stringify does but without serializing.
 *
 * @desc Usage:
 * * var myDistilledObject = unstrungify.call(myObject);
 * * var myDistilledObject = myApi.getState(); // where myApi.prototype.getState = unstrungify
 *
 * Result equivalent to `JSON.parse(JSON.stringify(this))`.
 *
 * > Do not use this function to get a JSON string; use `JSON.stringify(this)` instead.
 *
 * @this {*|object|*[]} - Object to walk; typically an object or array.
 *
 * @param {boolean} [options.nullElements==false] - Preserve undefined array elements as `null`s.
 * Use this when precise index matters (not merely the order of the elements).
 *
 * @param {boolean} [options.nullProperties==false] - Preserve undefined object properties as `null`s.
 *
 * @returns {object} - Distilled object.
 */
function unstrungify(options) {
    var clone, preserve,
        object = (typeof this.toJSON === 'function') ? this.toJSON() : this;

    if (unstrungify.isArray(object)) {
        clone = [];
        preserve = options && options.nullElements;
        object.forEach(function(obj) {
            var value = unstrungify.call(obj);
            if (value !== undefined) {
                clone.push(value);
            } else if (preserve) {
                clone.push(null); // undefined not a valid JSON value
            }
        });
    } else  if (typeof object === 'object') {
        clone = {};
        preserve = options && options.nullProperties;
        Object.keys(object).forEach(function(key) {
            var value = object[key];
            if (value !== undefined) {
                value = unstrungify.call(object[key]);
            }
            if (value !== undefined) {
                clone[key] = value;
            } else if (preserve) {
                clone[key] = null; // undefined not a valid JSON value
            }
        });
    } else {
        clone = object;
    }

    return clone;
}

/**
 * Very slow array test. Suitable for cross-frame scripting.
 *
 * Suggestion: If you need this and have jQuery loaded, use `jQuery.isArray` instead which is reasonably fast.
 *
 * @param {*} arr - The object to test.
 * @returns {boolean}
 */
unstrungify.crossFramesIsArray = function(arr) { return toString.call(arr) === arrString; }; // eslint-disable-line no-unused-vars

var toString = Object.prototype.toString, arrString = '[object Array]';

module.exports = unstrungify;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2h5cGVyLWZpbHRlci9mYWtlXzQ4MTk1ZTdkLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9oeXBlci1maWx0ZXIvanMvQ29sdW1uU2NoZW1hRmFjdG9yeS5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvaHlwZXItZmlsdGVyL2pzL0RlZmF1bHRGaWx0ZXIuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2h5cGVyLWZpbHRlci9qcy9GaWx0ZXJTdWJncmlkLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvYWRkLW9ucy9oeXBlci1maWx0ZXIvanMvcGFyc2VyLUNRTC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvaHlwZXItZmlsdGVyL21peC1pbnMvYmVoYXZpb3IuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9hZGQtb25zL2h5cGVyLWZpbHRlci9taXgtaW5zL2RhdGFNb2RlbC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL2FkZC1vbnMvaHlwZXItZmlsdGVyL21peC1pbnMvZ3JpZC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9jc3MtaW5qZWN0b3IvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvZXh0ZW5kLW1lL2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2ZpbHRlci10cmVlL2h0bWwvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvZmlsdGVyLXRyZWUvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvZmlsdGVyLXRyZWUvanMvQ29uZGl0aW9uYWxzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2ZpbHRlci10cmVlL2pzL0ZpbHRlckxlYWYuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvZmlsdGVyLXRyZWUvanMvRmlsdGVyTm9kZS5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9maWx0ZXItdHJlZS9qcy9GaWx0ZXJUcmVlLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2ZpbHRlci10cmVlL2pzL1RlbXBsYXRlcy5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9maWx0ZXItdHJlZS9qcy9leHRlbnNpb25zL2NvbHVtbnMuanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvZmlsdGVyLXRyZWUvanMvcGFyc2VyLVNRTC5qcyIsIi9Vc2Vycy9qb25hdGhhbi9yZXBvcy9maW4taHlwZXJncmlkL25vZGVfbW9kdWxlcy9maWx0ZXItdHJlZS9qcy9zdHlsZXNoZWV0LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL2ZpbHRlci10cmVlL2pzL3RyZWUtb3BlcmF0b3JzLmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL29iamVjdC1pdGVyYXRvcnMvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvb3ZlcnJpZGVyL2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL3BvcC1tZW51L2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL3JlZ2V4cC1saWtlL2luZGV4LmpzIiwiL1VzZXJzL2pvbmF0aGFuL3JlcG9zL2Zpbi1oeXBlcmdyaWQvbm9kZV9tb2R1bGVzL3RlbXBsZXgvaW5kZXguanMiLCIvVXNlcnMvam9uYXRoYW4vcmVwb3MvZmluLWh5cGVyZ3JpZC9ub2RlX21vZHVsZXMvdW5zdHJ1bmdpZnkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2poQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBEZWZhdWx0RmlsdGVyID0gcmVxdWlyZSgnLi9qcy9EZWZhdWx0RmlsdGVyJyk7XG52YXIgQ29sdW1uU2NoZW1hRmFjdG9yeSA9IHJlcXVpcmUoJy4vanMvQ29sdW1uU2NoZW1hRmFjdG9yeScpO1xudmFyIEZpbHRlclN1YmdyaWQgPSByZXF1aXJlKCcuL2pzL0ZpbHRlclN1YmdyaWQnKTtcblxuLyoqXG4gKiBAcGFyYW0ge0h5cGVyZ3JpZH0gZ3JpZFxuICogQHBhcmFtIHtvYmplY3R9IFt0YXJnZXRzXSAtIEhhc2ggb2YgbWl4aW4gdGFyZ2V0cy4gVGhlc2UgYXJlIHR5cGljYWxseSBwcm90b3R5cGUgb2JqZWN0cy4gSWYgbm90IGdpdmVuIG9yIGFueSB0YXJnZXRzIGFyZSBtaXNzaW5nLCBkZWZhdWx0cyB0byBjdXJyZW50IGdyaWQncyB2YXJpb3VzIHByb3RvdHlwZXMuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSHlwZXJmaWx0ZXIoZ3JpZCwgdGFyZ2V0cykge1xuICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XG4gICAgdGhpcy5pbnN0YWxsKHRhcmdldHMpO1xufVxuXG5IeXBlcmZpbHRlci5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IEh5cGVyZmlsdGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIG5hbWU6ICdIeXBlcmZpbHRlcicsXG5cbiAgICBpbnN0YWxsOiBmdW5jdGlvbih0YXJnZXRzKSB7XG4gICAgICAgIHRhcmdldHMgPSB0YXJnZXRzIHx8IHt9O1xuXG4gICAgICAgIHZhciBiZWhhdmlvciA9IHRoaXMuZ3JpZC5iZWhhdmlvcixcbiAgICAgICAgICAgIEJlaGF2aW9yUHJvdG90eXBlID0gdGFyZ2V0cy5CZWhhdmlvclByb3RvdHlwZSB8fCB0YXJnZXRzLkJlaGF2aW9yICYmIHRhcmdldHMuQmVoYXZpb3IucHJvdG90eXBlLFxuICAgICAgICAgICAgRGF0YU1vZGVsUHJvdG90eXBlID0gdGFyZ2V0cy5EYXRhTW9kZWxQcm90b3R5cGUgfHwgdGFyZ2V0cy5EYXRhTW9kZWwgJiYgdGFyZ2V0cy5EYXRhTW9kZWwucHJvdG90eXBlIHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihiZWhhdmlvci5kYXRhTW9kZWwpLFxuICAgICAgICAgICAgc3ViZ3JpZHMgPSBiZWhhdmlvci5zdWJncmlkcztcblxuICAgICAgICBpZiAoIUJlaGF2aW9yUHJvdG90eXBlKSB7XG4gICAgICAgICAgICBCZWhhdmlvclByb3RvdHlwZSA9IGJlaGF2aW9yO1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIEJlaGF2aW9yUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKEJlaGF2aW9yUHJvdG90eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3aGlsZSAoQmVoYXZpb3JQcm90b3R5cGUuJCRDTEFTU19OQU1FICE9PSAnQmVoYXZpb3InKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlZ2lzdGVyIGluIGNhc2UgYSBzdWJncmlkIGxpc3QgaXMgaW5jbHVkZWQgaW4gc3RhdGUgb2JqZWN0IG9mIGEgc3Vic2VxdWVudCBncmlkIGluc3RhbnRpYXRpb25cbiAgICAgICAgYmVoYXZpb3IuZGF0YU1vZGVscy5GaWx0ZXJTdWJncmlkID0gRmlsdGVyU3ViZ3JpZDtcblxuICAgICAgICBpZiAoIXN1YmdyaWRzLmxvb2t1cC5maWx0ZXIpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHN1YmdyaWRzLmluZGV4T2Yoc3ViZ3JpZHMubG9va3VwLmhlYWRlcikgKyAxLFxuICAgICAgICAgICAgICAgIHN1YmdyaWQgPSBiZWhhdmlvci5jcmVhdGVTdWJncmlkKEZpbHRlclN1YmdyaWQpO1xuICAgICAgICAgICAgc3ViZ3JpZHMuc3BsaWNlKGluZGV4LCAwLCBzdWJncmlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzLmdyaWQpLm1peEluKHJlcXVpcmUoJy4vbWl4LWlucy9ncmlkJykpO1xuXG4gICAgICAgIEJlaGF2aW9yUHJvdG90eXBlLm1peEluKHJlcXVpcmUoJy4vbWl4LWlucy9iZWhhdmlvcicpKTtcbiAgICAgICAgRGF0YU1vZGVsUHJvdG90eXBlLm1peEluKHJlcXVpcmUoJy4vbWl4LWlucy9kYXRhTW9kZWwnKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1heSBiZSBhZGp1c3RlZCBiZWZvcmUgY2FsbGluZyB7QGxpbmsgSHlwZXJGaWx0ZXIjY3JlYXRlfGNyZWF0ZX0uXG4gICAgICogQGRlZmF1bHRcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYXNlU2Vuc2l0aXZlRGF0YTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIE1heSBiZSBhZGp1c3RlZCBiZWZvcmUgY2FsbGluZyB7QGxpbmsgSHlwZXJGaWx0ZXIjY3JlYXRlfGNyZWF0ZX0uXG4gICAgICogQGRlZmF1bHRcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYXNlU2Vuc2l0aXZlQ29sdW1uTmFtZXM6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBNYXkgYmUgYWRqdXN0ZWQgYmVmb3JlIGNhbGxpbmcge0BsaW5rIEh5cGVyRmlsdGVyI2NyZWF0ZXxjcmVhdGV9LlxuICAgICAqIEBkZWZhdWx0XG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgcmVzb2x2ZUFsaWFzZXM6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogTWF5IGJlIGFkanVzdGVkIGJlZm9yZSBjYWxsaW5nIHtAbGluayBIeXBlckZpbHRlciNjcmVhdGV8Y3JlYXRlfS5cbiAgICAgKiBAZGVmYXVsdFxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgZGVmYXVsdENvbHVtbkZpbHRlck9wZXJhdG9yOiAnJywgLy8gYmxhbmsgbWVhbnMgdXNlIGRlZmF1bHQgKCc9JylcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb258bWVudUl0ZW1bXX0gW3NjaGVtYV0gLSBJZiBvbWl0dGVkLCBkZXJpdmVzIGEgc2NoZW1hLiBJZiBhIGZ1bmN0aW9uLCBkZXJpdmVzIGEgc2NoZW1hIGFuZCBjYWxscyBpdCB3aXRoIGZvciBwb3NzaWJsZSBtb2RpZmljYXRpb25zXG4gICAgICovXG4gICAgY3JlYXRlOiBmdW5jdGlvbihzY2hlbWEpIHtcbiAgICAgICAgaWYgKCFzY2hlbWEpIHtcbiAgICAgICAgICAgIHNjaGVtYSA9IG5ldyBDb2x1bW5TY2hlbWFGYWN0b3J5KHRoaXMuZ3JpZC5iZWhhdmlvci5hbGxDb2x1bW5zKS5zY2hlbWE7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNjaGVtYSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIGZhY3RvcnkgPSBuZXcgQ29sdW1uU2NoZW1hRmFjdG9yeSh0aGlzLmdyaWQuYmVoYXZpb3IuYWxsQ29sdW1ucyk7XG4gICAgICAgICAgICBzY2hlbWEuY2FsbChmYWN0b3J5KTtcbiAgICAgICAgICAgIHNjaGVtYSA9IGZhY3Rvcnkuc2NoZW1hO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgRGVmYXVsdEZpbHRlcih7XG4gICAgICAgICAgICBzY2hlbWE6IHNjaGVtYSxcbiAgICAgICAgICAgIGNhc2VTZW5zaXRpdmVEYXRhOiB0aGlzLmNhc2VTZW5zaXRpdmVEYXRhLFxuICAgICAgICAgICAgY2FzZVNlbnNpdGl2ZUNvbHVtbk5hbWVzOiB0aGlzLmNhc2VTZW5zaXRpdmVDb2x1bW5OYW1lcyxcbiAgICAgICAgICAgIHJlc29sdmVBbGlhc2VzOiB0aGlzLnJlc29sdmVBbGlhc2VzLFxuICAgICAgICAgICAgZGVmYXVsdENvbHVtbkZpbHRlck9wZXJhdG9yOiB0aGlzLmRlZmF1bHRDb2x1bW5GaWx0ZXJPcGVyYXRvclxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEh5cGVyZmlsdGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcG9wTWVudSA9IHJlcXVpcmUoJ3BvcC1tZW51Jyk7XG5cbi8qKlxuICogQGNsYXNzZGVzYyBCdWlsZCwgb3JnYW5pemUsIGFuZCBzb3J0IGEgY29sdW1uIHNjaGVtYSBsaXN0IGZyb20gYSBsaXN0IG9mIGNvbHVtbnMuXG4gKlxuICogRmlsdGVyVHJlZSByZXF1aXJlcyBhIGNvbHVtbiBzY2hlbWEuIEFzIGEgZmFsbGJhY2sgd2hlbiB5b3UgZG9uJ3QgaGF2ZSBhIGNvbHVtbiBzY2hlbWEgb2YgeW91ciBvd24sIHRoZSBzdHJpbmcgYXJyYXkgcmV0dXJuZWQgYnkgYmVoYXZpb3IuZGF0YU1vZGVsLmdldEZpZWxkcygpIHdvdWxkIHdvcmsgYXMgaXMuIFRoaXMgZmFjdG9yeSBvYmplY3Qgd2lsbCBkbyBhIGxpdHRsZSBiZXR0ZXIgdGhhbiB0aGF0LCB0YWtpbmcgSHlwZXJncmlkJ3MgY29sdW1uIGFycmF5IGFuZCBjcmVhdGluZyBhIG1vcmUgdGV4dHVyZWQgY29sdW1uIHNjaGVtYSwgaW5jbHVkaW5nIGNvbHVtbiBhbGlhc2VzIGFuZCB0eXBlcy5cbiAqXG4gKiBDQVZFQVQ6IFNldCB1cCB0aGUgc2NoZW1hIGNvbXBsZXRlbHkgYmVmb3JlIGluc3RhbnRpYXRpbmcgeW91ciBmaWx0ZXIgc3RhdGUuIEZpbHRlci10cmVlIHVzZXMgdGhlIHNjaGVtYSAoaW4gcGFydCkgdG8gZ2VuZXJhdGUgY29sdW1uIHNlbGVjdGlvbiBkcm9wLWRvd25zIGFzIHBhcnQgb2YgaXRzIFwicXVlcnkgYnVpbGRlclwiIFVJLiBOb3RlIHRoYXQgdGhlIFVJIGlzICpub3QqIGF1dG9tYXRpY2FsbHkgdXBkYXRlZCBpZiB5b3UgY2hhbmdlIHRoZSBzY2hlbWEgbGF0ZXIuXG4gKlxuICogQHBhcmFtIHtDb2x1bW5bXX0gY29sdW1uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbHVtblNjaGVtYUZhY3RvcnkoY29sdW1ucykge1xuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdGhlIG91dHB1dCBwcm9kdWNlZCBieSB0aGUgZmFjdG9yeS5cbiAgICAgKiBAdHlwZSB7bWVudUl0ZW1bXX1cbiAgICAgKi9cbiAgICB0aGlzLnNjaGVtYSA9IGNvbHVtbnMubWFwKGZ1bmN0aW9uKGNvbHVtbikge1xuICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgIG5hbWU6IGNvbHVtbi5uYW1lLFxuICAgICAgICAgICAgYWxpYXM6IGNvbHVtbi5oZWFkZXIsXG4gICAgICAgICAgICB0eXBlOiBjb2x1bW4uZ2V0VHlwZSgpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGNvbHVtbi5jYWxjdWxhdG9yKSB7XG4gICAgICAgICAgICBpdGVtLmNhbGN1bGF0b3IgPSBjb2x1bW4uY2FsY3VsYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zY2hlbWEud2FsayA9IHBvcE1lbnUud2FsaztcbiAgICB0aGlzLnNjaGVtYS5sb29rdXAgPSBwb3BNZW51Lmxvb2t1cDtcbn1cblxudmFyIHBsYWNlbWVudFByZWZpeE1hcCA9IHtcbiAgICB0b3A6ICdcXHUwMDAwJyxcbiAgICBib3R0b206ICdcXHVmZmZmJyxcbiAgICB1bmRlZmluZWQ6ICcnXG59O1xuXG5Db2x1bW5TY2hlbWFGYWN0b3J5LnByb3RvdHlwZSA9IHtcblxuICAgIGNvbnN0cnVjdG9yOiBDb2x1bW5TY2hlbWFGYWN0b3J5LnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIE9yZ2FuaXplIHNjaGVtYSBpbnRvIHN1Ym1lbnVzLlxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBjb2x1bW5Hcm91cHNSZWdleCAtIFNjaGVtYSBuYW1lcyBvciBhbGlhc2VzIHRoYXQgbWF0Y2ggdGhpcyBhcmUgcHV0IGludG8gYSBzdWJtZW51LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5rZXk9J25hbWUnXSAtIE11c3QgYmUgZWl0aGVyICduYW1lJyBvciAnYWxpYXMnLlxuICAgICAqL1xuICAgIG9yZ2FuaXplOiBmdW5jdGlvbihjb2x1bW5Hcm91cHNSZWdleCwgb3B0aW9ucykge1xuICAgICAgICB2YXIga2V5ID0gb3B0aW9ucyAmJiBvcHRpb25zLmtleSB8fCAnbmFtZScsXG4gICAgICAgICAgICBzdWJtZW51cyA9IHt9LFxuICAgICAgICAgICAgbWVudSA9IFtdO1xuXG4gICAgICAgIHRoaXMuc2NoZW1hLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlbVtrZXldLFxuICAgICAgICAgICAgICAgIGdyb3VwID0gdmFsdWUubWF0Y2goY29sdW1uR3JvdXBzUmVnZXgpO1xuICAgICAgICAgICAgaWYgKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXAgPSBncm91cFswXTtcbiAgICAgICAgICAgICAgICBpZiAoIShncm91cCBpbiBzdWJtZW51cykpIHtcbiAgICAgICAgICAgICAgICAgICAgc3VibWVudXNbZ3JvdXBdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGdyb3VwLnRvVXBwZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51OiBbXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdWJtZW51c1tncm91cF0uc3VibWVudS5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZW51LnB1c2goaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAodmFyIHN1Ym1lbnVOYW1lIGluIHN1Ym1lbnVzKSB7XG4gICAgICAgICAgICBtZW51LnB1c2goc3VibWVudXNbc3VibWVudU5hbWVdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2NoZW1hID0gbWVudTtcbiAgICB9LFxuXG4gICAgbG9va3VwOiBmdW5jdGlvbihmaW5kT3B0aW9ucywgdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHBvcE1lbnUubG9va3VwLmFwcGx5KHRoaXMuc2NoZW1hLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICB3YWxrOiBmdW5jdGlvbihpdGVyYXRlZSkge1xuICAgICAgICByZXR1cm4gcG9wTWVudS53YWxrLmFwcGx5KHRoaXMuc2NoZW1hLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPdmVybGF5cyBhIGN1c3RvbSBzY2hlbWEgb24gdG9wIG9mIHRoZSBkZXJpdmVkIHNjaGVtYS5cbiAgICAgKiBUaGlzIGlzIGFuIGVhc3kgd2F5IHRvIGluY2x1ZGUgaGlkZGVuIGNvbHVtbnMgdGhhdCBtaWdodCBoYXZlIGJlZW4gb21pdHRlZCBmcm9tIHlvdXIgY3VzdG9tIHNjaGVtYS5cbiAgICAgKiBAcGFyYW0gY3VzdG9tU2NoZW1hXG4gICAgICovXG4gICAgb3ZlcmxheTogZnVuY3Rpb24oY3VzdG9tU2NoZW1hKSB7XG4gICAgICAgIHZhciBsb29rdXAgPSB0aGlzLnNjaGVtYS5sb29rdXA7XG4gICAgICAgIHRoaXMuc2NoZW1hLndhbGsoZnVuY3Rpb24oY29sdW1uU2NoZW1hKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9va3VwLmNhbGwoY3VzdG9tU2NoZW1hLCBmdW5jdGlvbihjdXN0b21Db2x1bW5TY2hlbWEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VzdG9tQ29sdW1uU2NoZW1hLm5hbWUgPT09IGNvbHVtblNjaGVtYS5uYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTb3J0IHRoZSBzY2hlbWEuXG4gICAgICogQGRlc2MgV2FsayB0aGUgbWVudSBzdHJ1Y3R1cmUsIHNvcnRpbmcgZWFjaCBzdWJtZW51IHVudGlsIGZpbmFsbHkgdGhlIHRvcC1sZXZlbCBtZW51IGlzIHNvcnRlZC5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzdWJtZW51UGxhY2VtZW50XSAtIE9uZSBvZjpcbiAgICAgKiAqIGAndG9wJ2AgLSBQbGFjZSBhbGwgdGhlIHN1Ym1lbnVzIGF0IHRoZSB0b3Agb2YgZWFjaCBlbmNsb3Npbmcgc3VibWVudS5cbiAgICAgKiAqIGAnYm90dG9tJ2AgLSBQbGFjZSBhbGwgdGhlIHN1Ym1lbnVzIGF0IHRoZSBib3R0b20gb2YgZWFjaCBlbmNsb3Npbmcgc3VibWVudS5cbiAgICAgKiAqIGB1bmRlZmluZWRgIChvciBvbWl0dGVkKSAtIEdpdmUgbm8gc3BlY2lhbCB0cmVhdG1lbnQgdG8gc3VibWVudXMuXG4gICAgICovXG4gICAgc29ydDogZnVuY3Rpb24oc3VibWVudVBsYWNlbWVudCkge1xuICAgICAgICB2YXIgcHJlZml4ID0gcGxhY2VtZW50UHJlZml4TWFwW3N1Ym1lbnVQbGFjZW1lbnRdO1xuXG4gICAgICAgIHRoaXMuc2NoZW1hLnNvcnQoZnVuY3Rpb24gcmVjdXJzZShhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYS5sYWJlbCAmJiAhYS5zb3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBhLnN1Ym1lbnUuc29ydChyZWN1cnNlKTtcbiAgICAgICAgICAgICAgICBhLnNvcnRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhID0gYS5sYWJlbCA/IHByZWZpeCArIGEubGFiZWwgOiBhLmFsaWFzIHx8IGEubmFtZSB8fCBhO1xuICAgICAgICAgICAgYiA9IGIubGFiZWwgPyBwcmVmaXggKyBiLmxhYmVsIDogYi5hbGlhcyB8fCBiLm5hbWUgfHwgYjtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5TY2hlbWFGYWN0b3J5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRmlsdGVyVHJlZSA9IHJlcXVpcmUoJ2ZpbHRlci10cmVlJyk7XG52YXIgUGFyc2VyQ1FMID0gcmVxdWlyZSgnLi9wYXJzZXItQ1FMJyk7XG5cbi8vIEFkZCBhIHByb3BlcnR5IGBtZW51TW9kZXNgIHRvIHRoIGUgdHJlZSwgZGVmYXVsdGluZyB0byBgb3BlcmF0b3JzYCBhcyB0aGUgb25seSBhY3RpdmUgbW9kZVxuRmlsdGVyVHJlZS5Ob2RlLm9wdGlvbnNTY2hlbWEubWVudU1vZGVzID0ge1xuICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgb3BlcmF0b3JzOiAxXG4gICAgfVxufTtcblxuLy8gQWRkIGBvcE1lbnVHcm91cHNgIHRvIHByb3RvdHlwZSBiZWNhdXNlIG5lZWRlZCBieSBGaWx0ZXJCb3guXG5GaWx0ZXJUcmVlLk5vZGUucHJvdG90eXBlLm9wTWVudUdyb3VwcyA9IEZpbHRlclRyZWUuQ29uZGl0aW9uYWxzLmdyb3VwcztcblxuZnVuY3Rpb24gcXVvdGUodGV4dCkge1xuICAgIHZhciBxdCA9IFBhcnNlckNRTC5xdDtcbiAgICByZXR1cm4gcXQgKyB0ZXh0LnJlcGxhY2UobmV3IFJlZ0V4cChxdCwgJ2cnKSwgcXQgKyBxdCkgKyBxdDtcbn1cblxudmFyIGxpa2VEcmVzc2VzID0gW1xuICAgIHsgcmVnZXg6IC9eKE5PVCApP0xJS0UgJSguKyklJC9pLCBvcGVyYXRvcjogJ2NvbnRhaW5zJyB9LFxuICAgIHsgcmVnZXg6IC9eKE5PVCApP0xJS0UgKC4rKSUkL2ksIG9wZXJhdG9yOiAnYmVnaW5zJyB9LFxuICAgIHsgcmVnZXg6IC9eKE5PVCApP0xJS0UgJSguKykkL2ksIG9wZXJhdG9yOiAnZW5kcycgfVxuXTtcbnZhciByZWdleEVzY2FwZWRMaWtlUGF0dGVybkNoYXJzID0gL1xcWyhbX1xcW1xcXSVdKVxcXS9nOyAvLyBjYXB0dXJlIGFsbCBfLCBbLCBdLCBhbmQgJSBjaGFycyBlbmNsb3NlZCBpbiBbXVxudmFyIHJlZ2V4TGlrZVBhdHRlcm5DaGFyID0gL1tfXFxbXFxdJV0vOyAvLyBmaW5kIGFueSBfLCBbLCBdLCBhbmQgJSBjaGFycyBOT1QgZW5jbG9zZWQgaW4gW11cblxuLy8gY29udmVydCBjZXJ0YWluIExJS0UgZXhwcmVzc2lvbnMgdG8gQkVHSU5TLCBFTkRTLCBDT05UQUlOU1xuZnVuY3Rpb24gY29udmVydExpa2VUb1BzZXVkb09wKHJlc3VsdCkge1xuICAgIGxpa2VEcmVzc2VzLmZpbmQoZnVuY3Rpb24oZHJlc3MpIHtcbiAgICAgICAgdmFyIG1hdGNoID0gcmVzdWx0Lm1hdGNoKGRyZXNzLnJlZ2V4KTtcblxuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIC8vIHVuZXNjYXBlIGFsbCBMSUtFIHBhdHRlcm4gY2hhcnMgZXNjYXBlZCB3aXRoIGJyYWNrZXRzXG4gICAgICAgICAgICB2YXIgbm90ID0gKG1hdGNoWzFdIHx8ICcnKS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gZHJlc3Mub3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgb3BlcmFuZCA9IG1hdGNoWzJdLFxuICAgICAgICAgICAgICAgIG9wZXJhbmRXaXRob3V0RXNjYXBlZENoYXJzID0gb3BlcmFuZC5yZXBsYWNlKHJlZ2V4RXNjYXBlZExpa2VQYXR0ZXJuQ2hhcnMsICcnKTtcblxuICAgICAgICAgICAgLy8gaWYgcmVzdWx0IGhhcyBubyBhY3R1YSByZW1haW5pbmcgTElLRSBwYXR0ZXJuIGNoYXJzLCBnbyB3aXRoIHRoZSBjb252ZXJzaW9uXG4gICAgICAgICAgICBpZiAoIXJlZ2V4TGlrZVBhdHRlcm5DaGFyLnRlc3Qob3BlcmFuZFdpdGhvdXRFc2NhcGVkQ2hhcnMpKSB7XG4gICAgICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQucmVwbGFjZShyZWdleEVzY2FwZWRMaWtlUGF0dGVybkNoYXJzLCAnJDEnKTsgLy8gdW5lc2NhcGUgdGhlIGVzY2FwZWQgY2hhcnNcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBub3QgKyBvcGVyYXRvciArICcgJyArIG9wZXJhbmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBicmVhayBvdXQgb2YgbG9vcFxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIgY29uZGl0aW9uYWxzQ1FMID0gbmV3IEZpbHRlclRyZWUuQ29uZGl0aW9uYWxzKCk7XG5jb25kaXRpb25hbHNDUUwubWFrZUxJS0UgPSBmdW5jdGlvbihiZWcsIGVuZCwgb3AsIG9yaWdpbmFsT3AsIGMpIHtcbiAgICBvcCA9IG9yaWdpbmFsT3AudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gb3AgKyAnICcgKyBxdW90ZShjLm9wZXJhbmQpO1xufTtcbmNvbmRpdGlvbmFsc0NRTC5tYWtlSU4gPSBmdW5jdGlvbihvcCwgYykge1xuICAgIHJldHVybiBvcC50b0xvd2VyQ2FzZSgpICsgJyAoJyArIGMub3BlcmFuZC5yZXBsYWNlKC9cXHMqLFxccyovZywgJywgJykgKyAnKSc7XG59O1xuY29uZGl0aW9uYWxzQ1FMLm1ha2UgPSBmdW5jdGlvbihvcCwgYykge1xuICAgIHZhciBudW1lcmljT3BlcmFuZDtcbiAgICBvcCA9IG9wLnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKC9cXHcvLnRlc3Qob3ApKSB7IG9wICs9ICcgJzsgfVxuICAgIG9wICs9IGMuZ2V0VHlwZSgpID09PSAnbnVtYmVyJyAmJiAhaXNOYU4obnVtZXJpY09wZXJhbmQgPSBOdW1iZXIoYy5vcGVyYW5kKSlcbiAgICAgICAgPyBudW1lcmljT3BlcmFuZFxuICAgICAgICA6IHF1b3RlKGMub3BlcmFuZCk7XG4gICAgcmV0dXJuIG9wO1xufTtcblxuLy8gcmVwbGFjZSB0aGUgZGVmYXVsdCBmaWx0ZXIgdHJlZSB0ZXJtaW5hbCBub2RlIGNvbnN0cnVjdG9yIHdpdGggYW4gZXh0ZW5zaW9uIG9mIHNhbWVcbnZhciBDdXN0b21GaWx0ZXJMZWFmID0gRmlsdGVyVHJlZS5wcm90b3R5cGUuYWRkRWRpdG9yKHtcbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24gZ2V0U3RhdGUob3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzdWx0LFxuICAgICAgICAgICAgc3ludGF4ID0gb3B0aW9ucyAmJiBvcHRpb25zLnN5bnRheDtcblxuICAgICAgICBpZiAoc3ludGF4ID09PSAnQ1FMJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5nZXRTeW50YXgoY29uZGl0aW9uYWxzQ1FMKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGNvbnZlcnRMaWtlVG9Qc2V1ZG9PcChyZXN1bHQpO1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRPcCA9IHRoaXMuc2NoZW1hLmxvb2t1cCh0aGlzLmNvbHVtbikuZGVmYXVsdE9wIHx8IHRoaXMucm9vdC5wYXJzZXJDUUwuZGVmYXVsdE9wOyAvLyBtaW1pY3MgbG9naWMgaW4gcGFyc2VyLUNRTC5qcywgbGluZSAxMTBcbiAgICAgICAgICAgIGlmIChyZXN1bHQudG9VcHBlckNhc2UoKS5pbmRleE9mKGRlZmF1bHRPcCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuc3Vic3RyKGRlZmF1bHRPcC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gRmlsdGVyVHJlZS5MZWFmLnByb3RvdHlwZS5nZXRTdGF0ZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59KTtcblxuRmlsdGVyVHJlZS5wcm90b3R5cGUuYWRkRWRpdG9yKCdDb2x1bW5zJyk7XG5cbi8vIEFkZCBzb21lIG5vZGUgdGVtcGxhdGVzIGJ5IHVwZGF0aW5nIHNoYXJlZCBpbnN0YW5jZSBvZiBGaWx0ZXJOb2RlJ3MgdGVtcGxhdGVzLiAoT0sgdG8gbXV0YXRlIHNoYXJlZCBpbnN0YW5jZTsgZmlsdGVyLXRyZWUgbm90IGJlaW5nIHVzZWQgZm9yIGFueXRoaW5nIGVsc2UgaGVyZS4gQWx0ZXJuYXRpdmVseSwgd2UgY291bGQgaGF2ZSBpbnN0YW50aWF0ZWQgYSBuZXcgVGVtcGxhdGVzIG9iamVjdCBmb3Igb3VyIERlZmF1bHRGaWx0ZXIgcHJvdG90eXBlLCBhbHRob3VnaCB0aGlzIHdvdWxkIG9ubHkgYWZmZWN0IHRyZWUgbm9kZXMsIG5vdCBsZWFmIG5vZGVzLCBidXQgdGhhdCB3b3VsZCBiZSBvayBpbiB0aGlzIGNhc2Ugc2luY2UgdGhlIGFkZGl0aW9ucyBiZWxvdyBhcmUgdHJlZSBub2RlIHRlbXBsYXRlcy4pXG5PYmplY3QuYXNzaWduKEZpbHRlclRyZWUuTm9kZS5wcm90b3R5cGUudGVtcGxhdGVzLCB7XG4gICAgY29sdW1uRmlsdGVyOiBbXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImZpbHRlci10cmVlXCI+JyxcbiAgICAgICAgJyAgIDxzdHJvbmc+PHNwYW4+ezJ9IDwvc3Bhbj48L3N0cm9uZz48YnI+JyxcbiAgICAgICAgJyAgIE1hdGNoJyxcbiAgICAgICAgJyAgIDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgY2xhc3M9XCJmaWx0ZXItdHJlZS1vcC1jaG9pY2VcIiBuYW1lPVwidHJlZU9wezF9XCIgdmFsdWU9XCJvcC1vclwiPmFueTwvbGFiZWw+JyxcbiAgICAgICAgJyAgIDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgY2xhc3M9XCJmaWx0ZXItdHJlZS1vcC1jaG9pY2VcIiBuYW1lPVwidHJlZU9wezF9XCIgdmFsdWU9XCJvcC1hbmRcIj5hbGw8L2xhYmVsPicsXG4gICAgICAgICcgICA8bGFiZWw+PGlucHV0IHR5cGU9XCJyYWRpb1wiIGNsYXNzPVwiZmlsdGVyLXRyZWUtb3AtY2hvaWNlXCIgbmFtZT1cInRyZWVPcHsxfVwiIHZhbHVlPVwib3Atbm9yXCI+bm9uZTwvbGFiZWw+JyxcbiAgICAgICAgJyAgIG9mIHRoZSBmb2xsb3dpbmc6JyxcbiAgICAgICAgJyAgIDxzZWxlY3Q+JyxcbiAgICAgICAgJyAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+TmV3IGV4cHJlc3Npb24maGVsbGlwOzwvb3B0aW9uPicsXG4gICAgICAgICcgICA8L3NlbGVjdD4nLFxuICAgICAgICAnICAgPG9sPjwvb2w+JyxcbiAgICAgICAgJzwvc3Bhbj4nXG4gICAgXVxuICAgICAgICAuam9pbignXFxuJyksXG5cbiAgICBjb2x1bW5GaWx0ZXJzOiBbXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImZpbHRlci10cmVlIGZpbHRlci10cmVlLXR5cGUtY29sdW1uLWZpbHRlcnNcIj4nLFxuICAgICAgICAnICAgTWF0Y2ggPHN0cm9uZz5hbGw8L3N0cm9uZz4gb2YgdGhlIGZvbGxvd2luZyBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb25zOicsXG4gICAgICAgICcgICA8b2w+PC9vbD4nLFxuICAgICAgICAnPC9zcGFuPidcbiAgICBdXG4gICAgICAgIC5qb2luKCdcXG4nKVxufSk7XG5cbi8qKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAZGVzYyBUaGlzIGV4dGVuc2lvbiBvZiBGaWx0ZXJUcmVlIGZvcmNlcyBhIHNwZWNpZmljIHRyZWUgc3RydWN0dXJlLlxuICogU2VlIHtAbGluayBtYWtlTmV3Um9vdH0gZm9yIGEgZGVzY3JpcHRpb24uXG4gKlxuICogU2VlIGFsc28ge0B0dXRvcmlhbCBmaWx0ZXItYXBpfS5cbiAqXG4gKiBAcGFyYW0ge0ZpbHRlclRyZWVPcHRpb25zT2JqZWN0fSBvcHRpb25zIC0gWW91IHNob3VsZCBwcm92aWRlIGEgY29sdW1uIHNjaGVtYS4gVGhlIGVhc2llc3QgYXBwcm9hY2ggaXMgdG8gcHJvdmlkZSBhIHNjaGVtYSBmb3IgdGhlIGVudGlyZSBmaWx0ZXIgdHJlZSB0aHJvdWdoIGBvcHRpb25zLnNjaGVtYWAuXG4gKlxuICogQWx0aG91Z2ggbm90IHJlY29tbWVuZGVkLCB0aGUgY29sdW1uIHNjaGVtYSBjYW4gYWxzbyBiZSBlbWJlZGRlZCBpbiB0aGUgc3RhdGUgb2JqZWN0LCBlaXRoZXIgYXQgdGhlIHJvb3QsIGBvcHRpb25zLnN0YXRlLnNjaGVtYWAsIG9yIGZvciBhbnkgZGVzY2VuZGFudCBub2RlLiBGb3IgZXhhbXBsZSwgYSBzZXBhcmF0ZSBzY2hlbWEgY291bGQgYmUgcHJvdmlkZWQgZm9yIGVhY2ggZXhwcmVzc2lvbiBvciBzdWJleHByZXNzaW9uIHRoYXQgbmVlZCB0byByZW5kZXIgY29sdW1uIGxpc3QgZHJvcC1kb3ducy5cbiAqXG4gKiBOT1RFOiBJZiBgb3B0aW9ucy5zdGF0ZWAgaXMgdW5kZWZpbmVkLCBpdCBpcyBkZWZpbmVkIGluIGBwcmVJbml0aWFsaXplKClgIGFzIGEgbmV3IGVtcHR5IHN0YXRlIHNjYWZmb2xkIChzZWUge0BsaW5rIG1ha2VOZXdSb290fSkgd2l0aCB0aGUgdHdvIHRydW5rcyB0byBob2xkIGEgdGFibGUgZmlsdGVyIGFuZCBjb2x1bW4gZmlsdGVycy4gRXhwcmVzc2lvbnMgYW5kIHN1YmV4cHJlc3Npb25zIGNhbiBiZSBhZGRlZCB0byB0aGlzIGVtcHR5IHNjYWZmb2xkIGVpdGhlciBwcm9ncmFtbWF0aWNhbGx5IG9yIHRocm91Z2ggdGhlIFF1ZXJ5IEJ1aWxkZXIgVUkuXG4gKi9cbnZhciBEZWZhdWx0RmlsdGVyID0gRmlsdGVyVHJlZS5leHRlbmQoJ0RlZmF1bHRGaWx0ZXInLCB7XG4gICAgcHJlSW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvLyBTZXQgdXAgdGhlIGRlZmF1bHQgXCJIeXBlcmZpbHRlclwiIHByb2ZpbGUgKHNlZSBmdW5jdGlvbiBjb21tZW50cylcbiAgICAgICAgdmFyIHN0YXRlID0gb3B0aW9ucy5zdGF0ZSA9IG9wdGlvbnMuc3RhdGUgfHwgdGhpcy5tYWtlTmV3Um9vdCgpO1xuXG4gICAgICAgIC8vIFVwb24gY3JlYXRpb24gb2YgYSAnY29sdW1uRmlsdGVyJyBub2RlLCBmb3JjZSB0aGUgc2NoZW1hIHRvIHRoZSBvbmUgY29sdW1uXG4gICAgICAgIGlmICgob3B0aW9ucy50eXBlIHx8IHN0YXRlICYmIHN0YXRlLnR5cGUpID09PSAnY29sdW1uRmlsdGVyJykge1xuICAgICAgICAgICAgdGhpcy5zY2hlbWEgPSBbXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5wYXJlbnQucm9vdC5zY2hlbWEubG9va3VwKHN0YXRlLmNoaWxkcmVuWzBdLmNvbHVtbilcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW29wdGlvbnNdO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcblxuICAgICAgICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmV4dHJhY3RTdWJ0cmVlcygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHBvc3RJbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGlmICh0aGlzID09PSB0aGlzLnJvb3QgJiYgIXRoaXMucGFyc2VyQ1FMKSB7XG4gICAgICAgICAgICB0aGlzLnBhcnNlckNRTCA9IG5ldyBQYXJzZXJDUUwodGhpcy5jb25kaXRpb25hbHMub3BzLCB7XG4gICAgICAgICAgICAgICAgc2NoZW1hOiB0aGlzLnNjaGVtYSxcbiAgICAgICAgICAgICAgICBkZWZhdWx0T3A6IG9wdGlvbnMuZGVmYXVsdENvbHVtbkZpbHRlck9wZXJhdG9yXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT09ICdjb2x1bW5GaWx0ZXInKSB7XG4gICAgICAgICAgICB0aGlzLmRvbnRQZXJzaXN0LnNjaGVtYSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGNvbnZlbmllbmNlIHZhcnMgdG8gcmVmZXJlbmNlIHRoZSAyIHJvb3QgXCJIeXBlcmZpbHRlclwiIG5vZGVzXG4gICAgICogQG1lbWJlck9mIERlZmF1bHRGaWx0ZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZXh0cmFjdFN1YnRyZWVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJvb3ROb2RlcyA9IHRoaXMucm9vdC5jaGlsZHJlbjtcbiAgICAgICAgdGhpcy50YWJsZUZpbHRlciA9IHJvb3ROb2Rlc1swXTtcbiAgICAgICAgdGhpcy5jb2x1bW5GaWx0ZXJzID0gcm9vdE5vZGVzWzFdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBNYWtlIGEgbmV3IGVtcHR5IEh5cGVyZ3JpZCBmaWx0ZXIgdHJlZSBzdGF0ZSBvYmplY3QuXG4gICAgICogQGRlc2MgVGhpcyBmdW5jdGlvbiBtYWtlcyBhIG5ldyBkZWZhdWx0IHN0YXRlIG9iamVjdCBhcyB1c2VkIGJ5IEh5cGVyZ3JpZCwgYSByb290IHdpdGggZXhhY3RseSB0d28gXCJ0cnVua3MuXCJcbiAgICAgKlxuICAgICAqID4gKipEZWZpbml0aW9uOioqIEEgKnRydW5rKiBpcyBkZWZpbmVkIGFzIGEgY2hpbGQgbm9kZSB3aXRoIGEgdHJ1dGh5IGBrZWVwYCBwcm9wZXJ0eSwgbWFraW5nIHRoaXMgbm9kZSBpbW11bmUgdG8gdGhlIHVzdWFsIHBydW5pbmcgdGhhdCB3b3VsZCBvY2N1ciB3aGVuIGl0IGhhcyBubyBjaGlsZCBub2RlcyBvZiBpdHMgb3duLiBUbyBiZSBhIHRydWUgdHJ1bmssIGFsbCBhbmNlc3RvciBub2RlcyB0byBiZSB0cnVua3MgYXMgd2VsbC4gTm90ZSB0aGF0IHRoZSByb290IGlzIGEgbmF0dXJhbCB0cnVuazsgaXQgZG9lcyBub3QgcmVxdWlyZSBhIGBrZWVwYCBwcm9wZXJ0eS5cbiAgICAgKlxuICAgICAqIFRoZSB0d28gdHJ1bmtzIG9mIHRoZSBIeXBlcmdyaWQgZmlsdGVyIGFyZTpcbiAgICAgKiAqIFRoZSAqKlRhYmxlIEZpbHRlcioqIChsZWZ0IHRydW5rLCBvciBgY2hpbGRyZW5bMF1gKSwgYSBoaWVyYXJjaHkgb2YgZmlsdGVyIGV4cHJlc3Npb25zIGFuZCBzdWJleHByZXNzaW9ucy5cbiAgICAgKiAqIFRoZSAqKkNvbHVtbiBGaWx0ZXJzKiogKHJpZ2h0IHRydW5rLCBvciBgY2hpbGRyZW5bMV1gKSwgYSBzZXJpZXMgb2Ygc3ViZXhwcmVzc2lvbnMsIG9uZSBwZXIgYWN0aXZlIGNvbHVtbiBmaWx0ZXIuIEVhY2ggc3ViZXhwcmVzc2lvbiBjb250YWlucyBhbnkgbnVtYmVyIG9mIGV4cHJlc3Npb25zIGJvdW5kIHRvIHRoYXQgY29sdW1uIGJ1dCBubyBmdXJ0aGVyIHN1YmV4cHJlc3Npb25zLlxuICAgICAqXG4gICAgICogVGhlIGBvcGVyYXRvcmAgcHJvcGVydGllcyBmb3IgYWxsIHN1YmV4cHJlc3Npb25zIGRlZmF1bHQgdG8gYCdvcC1hbmQnYCwgd2hpY2ggbWVhbnM6XG4gICAgICogKiBBbGwgdGFibGUgZmlsdGVyIGV4cHJlc3Npb25zIGFuZCBzdWJleHByZXNzaW9ucyBhcmUgQU5EJ2QgdG9nZXRoZXIuIChUaGlzIGlzIGp1c3QgdGhlIGRlZmF1bHQgYW5kIG1heSBiZSBjaGFuZ2VkIGZyb20gdGhlIFVJLilcbiAgICAgKiAqIEFsbCBleHByZXNzaW9ucyB3aXRoaW4gYSBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb24gYXJlIEFORCdkIHRvZ2V0aGVyLiAoVGhpcyBpcyBqdXN0IHRoZSBkZWZhdWx0IGFuZCBtYXkgYmUgY2hhbmdlZCBmcm9tIHRoZSBVSS4pXG4gICAgICogKiBBbGwgY29sdW1uIEZpbHRlcnMgc3ViZXhwcmVzc2lvbnMgYXJlIEFORCdkIHRvZ2V0aGVyLiAoVGhpcyBtYXkgbm90IGJlIGNoYW5nZWQgZnJvbSBVSS4pXG4gICAgICogKiBGaW5hbGx5LCB0aGUgdGFibGUgZmlsdGVyIGFuZCBjb2x1bW4gZmlsdGVycyBhcmUgQU5EJ2QgdG9nZXRoZXIuIChUaGlzIG1heSBub3QgYmUgY2hhbmdlZCBmcm9tIFVJLilcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IEEgcGxhaW4gb2JqZWN0IHRvIHNlcnZlIGFzIGEgZmlsdGVyLXRyZWUgc3RhdGUgb2JqZWN0IHJlcHJlc2VudGluZyBhIG5ldyBIeXBlcmdyaWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIERlZmF1bHRGaWx0ZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgbWFrZU5ld1Jvb3Q6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHRoaXMudGFibGVGaWx0ZXIgPSB7XG4gICAgICAgICAgICBrZWVwOiB0cnVlLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAvLyB0YWJsZSBmaWx0ZXIgZXhwcmVzc2lvbnMgYW5kIHN1YmV4cHJlc3Npb25zIGdvIGhlcmVcbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmNvbHVtbkZpbHRlcnMgPSB7XG4gICAgICAgICAgICBrZWVwOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ2NvbHVtbkZpbHRlcnMnLFxuICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAvLyBzdWJleHByZXNzaW9ucyB3aXRoIHR5cGUgJ2NvbHVtbkZpbHRlcicgZ28gaGVyZSwgb25lIGZvciBlYWNoIGFjdGl2ZSBjb2x1bW4gZmlsdGVyXG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGZpbHRlciA9IHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgdGhpcy50YWJsZUZpbHRlcixcbiAgICAgICAgICAgICAgICB0aGlzLmNvbHVtbkZpbHRlcnNcbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBHZXQgdGhlIGNvbHVtbiBmaWx0ZXIgc3ViZXhwcmVzc2lvbiBub2RlLlxuICAgICAqIEBkZXNjIEVhY2ggY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uIG5vZGUgaXMgYSBjaGlsZCBub2RlIG9mIHRoZSBgY29sdW1uRmlsdGVyc2AgdHJ1bmsgb2YgdGhlIEh5cGVyZ3JpZCBmaWx0ZXIgdHJlZS5cbiAgICAgKiBFYWNoIHN1Y2ggbm9kZSBjb250YWlucyBhbGwgdGhlIGNvbHVtbiBmaWx0ZXIgZXhwcmVzc2lvbnMgZm9yIHRoZSBuYW1lZCBjb2x1bW4uIEl0IHdpbGwgbmV2ZXIgYmUgZW1wdHk7IGlmIHRoZXJlIGlzIG5vIGNvbHVtbiBmaWx0ZXIgZm9yIHRoZSBuYW1lZCBjb2x1bW4sIGl0IHdvbid0IGV4aXN0IGluIGBjb2x1bW5GaWx0ZXJzYC5cbiAgICAgKlxuICAgICAqIENBVVRJT046IFRoaXMgaXMgdGhlIGFjdHVhbCBub2RlIG9iamVjdC4gRG8gbm90IGNvbmZ1c2UgaXQgd2l0aCB0aGUgY29sdW1uIGZpbHRlciBfc3RhdGVfIG9iamVjdCAoZm9yIHdoaWNoIHNlZSB0aGUge0BsaW5rIERlZmF1bHRGaWx0ZXIjZ2V0Q29sdW1uRmlsdGVyU3RhdGV8Z2V0Q29sdW1uRmlsdGVyU3RhdGUoKX0gbWV0aG9kKS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sdW1uTmFtZVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RGVmYXVsdEZpbHRlcn0gUmV0dXJucyBgdW5kZWZpbmVkYCBpZiB0aGUgY29sdW1uIGZpbHRlciBkb2VzIG5vdCBleGlzdC5cbiAgICAgKiBAbWVtYmVyT2YgRGVmYXVsdEZpbHRlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRDb2x1bW5GaWx0ZXI6IGZ1bmN0aW9uKGNvbHVtbk5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uRmlsdGVycy5jaGlsZHJlbi5maW5kKGZ1bmN0aW9uKGNvbHVtbkZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbHVtbkZpbHRlci5jaGlsZHJlbi5sZW5ndGggJiYgY29sdW1uRmlsdGVyLmNoaWxkcmVuWzBdLmNvbHVtbiA9PT0gY29sdW1uTmFtZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKiBAdHlwZWRlZiB7b2JqZWN0fSBGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0XG4gICAgICogU2VlIHRoZSB7QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvZ2xvYmFsLmh0bWwjRmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdHx0eXBlIGRlZmluaXRpb259IGluIHRoZSBmaWx0ZXItdHJlZSBkb2N1bWVudGF0aW9uLlxuICAgICAqL1xuXG4gICAgLyoqIEB0eXBlZGVmIHtvYmplY3R9IEZpbHRlclRyZWVTZXRTdGF0ZU9wdGlvbnNPYmplY3RcbiAgICAgKiBTZWUgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fHR5cGUgZGVmaW5pdGlvbn0gaW4gdGhlIGZpbHRlci10cmVlIGRvY3VtZW50YXRpb24uXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBHZXQgYSBwYXJ0aWN1bGFyIGNvbHVtbiBmaWx0ZXIncyBzdGF0ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmF3Q29sdW1uTmFtZSAtIENvbHVtbiBuYW1lIGZvciBjYXNlIGFuZCBhbGlhcyBsb29rdXAuXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIHtAbGluayBEZWZhdWx0RmlsdGVyI2dldFN0YXRlfGdldFN0YXRlfSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zeW50YXg9J0NRTCddIC0gVGhlIHN5bnRheCB0byB1c2UgdG8gZGVzY3JpYmUgdGhlIGZpbHRlciBzdGF0ZS4gTm90ZSB0aGF0IGBnZXRGaWx0ZXJgJ3MgZGVmYXVsdCBzeW50YXgsIGAnQ1FMJ2AsIGRpZmZlcnMgZnJvbSB0aGUgb3RoZXIgZ2V0IHN0YXRlIG1ldGhvZHMuXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKiBAbWVtYmVyT2YgRGVmYXVsdEZpbHRlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRDb2x1bW5GaWx0ZXJTdGF0ZTogZnVuY3Rpb24ocmF3Q29sdW1uTmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gJycsXG4gICAgICAgICAgICBjb2x1bW5TY2hlbWEgPSB0aGlzLnNjaGVtYS5sb29rdXAocmF3Q29sdW1uTmFtZSk7XG5cbiAgICAgICAgaWYgKGNvbHVtblNjaGVtYSkge1xuICAgICAgICAgICAgdmFyIHN1YmV4cHJlc3Npb24gPSB0aGlzLmdldENvbHVtbkZpbHRlcihjb2x1bW5TY2hlbWEubmFtZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWJleHByZXNzaW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEob3B0aW9ucyAmJiBvcHRpb25zLnN5bnRheCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuc3ludGF4ID0gJ0NRTCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHN1YmV4cHJlc3Npb24uZ2V0U3RhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTZXQgYSBwYXJ0aWN1bGFyIGNvbHVtbiBmaWx0ZXIncyBzdGF0ZS5cbiAgICAgKiBAZGVzYyBBZGRzIENRTCBzdXBwb3J0IHRvIHRoaXMuZ2V0U3RhdGUoKS4gVGhpcyBmdW5jdGlvbiB0aHJvd3MgcGFyc2VyIGVycm9ycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2x1bW5OYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IFtzdGF0ZV0gLSBBIGZpbHRlciB0cmVlIG9iamVjdCBvciBhIEpTT04sIFNRTCwgb3IgQ1FMIHN1YmV4cHJlc3Npb24gc3RyaW5nIHRoYXQgZGVzY3JpYmVzIHRoZSBhIG5ldyBzdGF0ZSBmb3IgdGhlIG5hbWVkIGNvbHVtbiBmaWx0ZXIuIFRoZSBleGlzdGluZyBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb24gaXMgcmVwbGFjZWQgd2l0aCBhIG5ldyBub2RlIGJhc2VkIG9uIHRoaXMgc3RhdGUuIElmIGl0IGRvZXMgbm90IGV4aXN0LCB0aGUgbmV3IHN1YmV4cHJlc3Npb24gaXMgYWRkZWQgdG8gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUgKGB0aGlzLnJvb3QuY29sdW1uRmlsdGVyc2ApLlxuICAgICAqXG4gICAgICogSWYgdW5kZWZpbmVkLCByZW1vdmVzIHRoZSBlbnRpcmUgY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uIGZyb20gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcmF3Q29sdW1uTmFtZSAtIENvbHVtbiBuYW1lIGZvciBjYXNlIGFuZCBhbGlhcyBsb29rdXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVTZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3MgW3NldFN0YXRlXXtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9GaWx0ZXJUcmVlLmh0bWwjc2V0U3RhdGV9IG1ldGhvZC4gWW91IG1heSBtaXggaW4gbWVtYmVycyBvZiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2dsb2JhbC5odG1sI0ZpbHRlclRyZWVWYWxpZGF0aW9uT3B0aW9uc09iamVjdHxGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R9XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnN5bnRheD0nQ1FMJ10gLSBUaGUgc3ludGF4IHRvIHVzZSB0byBkZXNjcmliZSB0aGUgZmlsdGVyIHN0YXRlLiBOb3RlIHRoYXQgYHNldENvbHVtbkZpbHRlclN0YXRlYCdzIGRlZmF1bHQgc3ludGF4LCBgJ0NRTCdgLCBkaWZmZXJzIGZyb20gdGhlIG90aGVyIGdldCBzdGF0ZSBtZXRob2RzLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIERlZmF1bHRGaWx0ZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgc2V0Q29sdW1uRmlsdGVyU3RhdGU6IGZ1bmN0aW9uKHJhd0NvbHVtbk5hbWUsIHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBlcnJvcixcbiAgICAgICAgICAgIHN1YmV4cHJlc3Npb247XG5cbiAgICAgICAgdmFyIGNvbHVtbk5hbWUgPSB0aGlzLnNjaGVtYS5sb29rdXAocmF3Q29sdW1uTmFtZSkubmFtZTtcblxuICAgICAgICBpZiAoIWNvbHVtbk5hbWUpIHtcbiAgICAgICAgICAgIHRocm93ICdVbmtub3duIGNvbHVtbiBuYW1lIFwiJyArIHJhd0NvbHVtbk5hbWUgKyAnXCInO1xuICAgICAgICB9XG5cbiAgICAgICAgc3ViZXhwcmVzc2lvbiA9IHRoaXMuZ2V0Q29sdW1uRmlsdGVyKGNvbHVtbk5hbWUpO1xuXG4gICAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpOyAvLyBjbG9uZSBpdCBiZWNhdXNlIHdlIG1heSBtdXRhdGUgaXQgYmVsb3dcbiAgICAgICAgICAgIG9wdGlvbnMuc3ludGF4ID0gb3B0aW9ucy5zeW50YXggfHwgJ0NRTCc7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN5bnRheCA9PT0gJ0NRTCcpIHtcbiAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IHNvbWUgQ1FMIHN0YXRlIHN5bnRheCBpbnRvIGEgZmlsdGVyIHRyZWUgc3RhdGUgb2JqZWN0LlxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIG11c3QgYmUgYXQgbGVhc3Qgb25lIGNvbXBsZXRlIGV4cHJlc3Npb24gb3IgYHN0YXRlYCB3aWxsIGJlY29tZSB1bmRlZmluZWQuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSB0aGlzLnJvb3QucGFyc2VyQ1FMLnBhcnNlKHN0YXRlLCBjb2x1bW5OYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN5bnRheCA9ICdvYmplY3QnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoJ0RlZmF1bHRGaWx0ZXI6IE5vIGNvbXBsZXRlIGV4cHJlc3Npb24uJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yID0gZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZXJyb3IpIHsgLy8gcGFyc2Ugc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgICAgIGlmIChzdWJleHByZXNzaW9uKSB7IC8vIHN1YmV4cHJlc3Npb24gYWxyZWFkeSBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBzdWJleHByZXNzaW9uIHJlcHJlc2VudGluZyB0aGlzIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICBzdWJleHByZXNzaW9uLnNldFN0YXRlKHN0YXRlLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgYSBuZXcgc3ViZXhwcmVzc2lvbiByZXByZXNlbnRpbmcgdGhpcyBjb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSB0aGlzLnBhcnNlU3RhdGVTdHJpbmcoc3RhdGUsIG9wdGlvbnMpOyAvLyBiZWNhdXNlIC5hZGQoKSBvbmx5IHRha2VzIG9iamVjdCBzeW50YXhcbiAgICAgICAgICAgICAgICAgICAgc3ViZXhwcmVzc2lvbiA9IHRoaXMuY29sdW1uRmlsdGVycy5hZGQoc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGVycm9yID0gc3ViZXhwcmVzc2lvbi5pbnZhbGlkKG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1YmV4cHJlc3Npb24gJiYgKCFzdGF0ZSB8fCBlcnJvcikpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBzdWJleHByZXNzaW9uIHJlcHJlc2VudGluZyB0aGlzIGNvbHVtblxuICAgICAgICAgICAgc3ViZXhwcmVzc2lvbi5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgR2V0IHN0YXRlIG9mIGFsbCBjb2x1bW4gZmlsdGVycy5cbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVHZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3Mge0BsaW5rIERlZmF1bHRGaWx0ZXIjZ2V0U3RhdGV8Z2V0U3RhdGV9IG1ldGhvZC5cbiAgICAgKiBAcmV0dXJucyB7RmlsdGVyVHJlZVN0YXRlT2JqZWN0fVxuICAgICAqIEBtZW1iZXJPZiBEZWZhdWx0RmlsdGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGdldENvbHVtbkZpbHRlcnNTdGF0ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnN5bnRheCA9PT0gJ0NRTCcpIHtcbiAgICAgICAgICAgIHRocm93ICdUaGUgQ1FMIHN5bnRheCBpcyBpbnRlbmRlZCBmb3IgdXNlIG9uIGEgc2luZ2xlIGNvbHVtbiBmaWx0ZXIgb25seS4gSXQgZG9lcyBub3Qgc3VwcG9ydCBtdWx0aXBsZSBjb2x1bW5zIG9yIHN1YmV4cHJlc3Npb25zLic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jb2x1bW5GaWx0ZXJzLmdldFN0YXRlKG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBTZXQgc3RhdGUgb2YgYWxsIGNvbHVtbiBmaWx0ZXJzLlxuICAgICAqIEBkZXNjIE5vdGUgdGhhdCB0aGUgY29sdW1uIGZpbHRlcnMgaW1wbGVtZW50YXRpb24gZGVwZW5kcyBvbiB0aGUgbm9kZXMgaGF2aW5nIGNlcnRhaW4gbWV0YS1kYXRhOyB5b3Ugc2hvdWxkIG5vdCBiZSBjYWxsaW5nIHRoaXMgd2l0aG91dCB0aGVzZSBtZXRhLWRhdGEgYmVpbmcgaW4gcGxhY2UuIFNwZWNpZmljYWxseSBgdHlwZSA9ICdjb2x1bW5GaWx0ZXJzJ2AgYW5kICBga2VlcCA9IHRydWVgIGZvciB0aGUgY29sdW1uIGZpbHRlcnMgc3VidHJlZSBhbmRgdHlwZSA9ICdjb2x1bW5GaWx0ZXInYCBmb3IgZWFjaCBpbmRpdmlkdWFsIGNvbHVtbiBmaWx0ZXIgc3ViZXhwcmVzc2lvbi4gSW4gYWRkaXRpb24gdGhlIHN1YnRyZWUgb3BlcmF0b3JzIHNob3VsZCBhbHdheXMgYmUgYCdvcC1hbmQnYC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVcbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVTZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3MgW3NldFN0YXRlXXtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9GaWx0ZXJUcmVlLmh0bWwjc2V0U3RhdGV9IG1ldGhvZC4gWW91IG1heSBtaXggaW4gbWVtYmVycyBvZiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2dsb2JhbC5odG1sI0ZpbHRlclRyZWVWYWxpZGF0aW9uT3B0aW9uc09iamVjdHxGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R9XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfEVycm9yfHN0cmluZ30gYHVuZGVmaW5lZGAgaW5kaWNhdGVzIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgRGVmYXVsdEZpbHRlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBzZXRDb2x1bW5GaWx0ZXJzU3RhdGU6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBlcnJvcjtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdC5jb2x1bW5GaWx0ZXJzLnNldFN0YXRlKHN0YXRlLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGVycm9yID0gdGhpcy5yb290LmNvbHVtbkZpbHRlcnMuaW52YWxpZChvcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIHtAbGluayBEZWZhdWx0RmlsdGVyI2dldFN0YXRlfGdldFN0YXRlfSBtZXRob2QuXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKiBAbWVtYmVyT2YgRGVmYXVsdEZpbHRlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRUYWJsZUZpbHRlclN0YXRlOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuc3ludGF4ID09PSAnQ1FMJykge1xuICAgICAgICAgICAgdGhyb3cgJ1RoZSBDUUwgc3ludGF4IGlzIGludGVuZGVkIGZvciB1c2Ugb24gYSBzaW5nbGUgY29sdW1uIGZpbHRlciBvbmx5LiBJdCBkb2VzIG5vdCBzdXBwb3J0IG11bHRpcGxlIGNvbHVtbnMgb3Igc3ViZXhwcmVzc2lvbnMuJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yb290LnRhYmxlRmlsdGVyLmdldFN0YXRlKG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVcbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVTZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3MgW3NldFN0YXRlXXtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9GaWx0ZXJUcmVlLmh0bWwjc2V0U3RhdGV9IG1ldGhvZC4gWW91IG1heSBtaXggaW4gbWVtYmVycyBvZiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2dsb2JhbC5odG1sI0ZpbHRlclRyZWVWYWxpZGF0aW9uT3B0aW9uc09iamVjdHxGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R9XG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZHxFcnJvcnxzdHJpbmd9IGB1bmRlZmluZWRgIGluZGljYXRlcyBzdWNjZXNzLlxuICAgICAqIEBtZW1iZXJPZiBEZWZhdWx0RmlsdGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldFRhYmxlRmlsdGVyU3RhdGU6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBlcnJvcjtcblxuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdC50YWJsZUZpbHRlci5zZXRTdGF0ZShzdGF0ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBlcnJvciA9IHRoaXMucm9vdC50YWJsZUZpbHRlci5pbnZhbGlkKG9wdGlvbnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yb290LnRhYmxlRmlsdGVyLmNoaWxkcmVuLmxlbmd0aCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXNjIFRoZSBDUUwgc3ludGF4IHNob3VsZCBvbmx5IGJlIHJlcXVlc3RlZCBmb3IgYSBzdWJ0cmVlIGNvbnRhaW5pbmcgaG9tb2dlbmVvdXMgY29sdW1uIG5hbWVzIGFuZCBubyBzdWJleHByZXNzaW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zeW50YXg9J29iamVjdCddIC0gSWYgYCdDUUwnYCwgd2Fsa3MgdGhlIHRyZWUsIHJldHVybmluZyBhIHN0cmluZyBzdWl0YWJsZSBmb3IgYSBIeXBlcmdyaWQgZmlsdGVyIGNlbGwuIEFsbCBvdGhlciB2YWx1ZXMgYXJlIGZvcndhcmRlZCB0byB0aGUgcHJvdG90eXBlJ3MgYGdldFN0YXRlYCBtZXRob2QgZm9yIGZ1cnRoZXIgaW50ZXJwcmV0YXRpb24uXG4gICAgICpcbiAgICAgKiBOT1RFOiBDUUwgaXMgbm90IGludGVuZGVkIHRvIGJlIHVzZWQgb3V0c2lkZSB0aGUgY29udGV4dCBvZiBhIGBjb2x1bW5GaWx0ZXJzYCBzdWJleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBEZWZhdWx0RmlsdGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGdldFN0YXRlOiBmdW5jdGlvbiBnZXRTdGF0ZShvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXN1bHQsXG4gICAgICAgICAgICBzeW50YXggPSBvcHRpb25zICYmIG9wdGlvbnMuc3ludGF4O1xuXG4gICAgICAgIGlmIChzeW50YXggPT09ICdDUUwnKSB7XG4gICAgICAgICAgICB2YXIgb3BlcmF0b3IgPSB0aGlzLm9wZXJhdG9yLnN1YnN0cigzKTsgLy8gcmVtb3ZlIHRoZSAnb3AtJyBwcmVmaXhcbiAgICAgICAgICAgIHJlc3VsdCA9ICcnO1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkLCBpZHgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgQ3VzdG9tRmlsdGVyTGVhZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSAnICcgKyBvcGVyYXRvciArICcgJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBjaGlsZC5nZXRTdGF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGVmYXVsdEZpbHRlcjogRXhwZWN0ZWQgYSBjb25kaXRpb25hbCBidXQgZm91bmQgYSBzdWJleHByZXNzaW9uLiBTdWJleHByZXNzaW9ucyBhcmUgbm90IHN1cHBvcnRlZCBpbiBDUUwgKENvbHVtbiBRdWVyeSBMYW5ndWFnZSwgdGhlIGZpbHRlciBjZWxsIHN5bnRheCkuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IEZpbHRlclRyZWUucHJvdG90eXBlLmdldFN0YXRlLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKiogQHN1bW1hcnkgTGlzdCBvZiBmaWx0ZXIgcHJvcGVydGllcyB0byBiZSB0cmVhdGVkIGFzIGZpcnN0IGNsYXNzIG9iamVjdHMuXG4gICAgICogQGRlc2MgT24gZmlsdGVyIHByb3BlcnR5IHNldCwgZm9yIGEgcHJvcGVydHkgdmFsdWUgdGhhdCBpcyBhIGZ1bmN0aW9uOlxuICAgICAqICogSWYgbGlzdGVkIGhlcmUsIGZ1bmN0aW9uIGl0IHNlbGYgaXMgYXNzaWduZWQgdG8gcHJvcGVydHkuXG4gICAgICogKiBJZiBfbm90XyBsaXN0ZWQgaGVyZSwgZnVuY3Rpb24gd2lsbCBiZSBleGVjdXRlZCB0byBnZXQgdmFsdWUgdG8gYXNzaWduIHRvIHByb3BlcnR5LlxuICAgICAqIEBtZW1iZXJPZiBEZWZhdWx0RmlsdGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGZpcnN0Q2xhc3NQcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNhbGN1bGF0b3I6IHRydWVcbiAgICB9LFxuXG4gICAgZ2V0IGVuYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbkZpbHRlcnMuY2hpbGRyZW4ubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgdGhpcy50YWJsZUZpbHRlci5jaGlsZHJlbi5sZW5ndGggPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAaW1wbGVtZW50cyBkYXRhQ29udHJvbEludGVyZmFjZSNwcm9wZXJ0aWVzXG4gICAgICogQGRlc2MgTm90ZXMgcmVnYXJkaW5nIHNwZWNpZmljIHByb3BlcnRpZXM6XG4gICAgICogKiBgY2FzZVNlbnNpdGl2ZURhdGFgIChyb290IHByb3BlcnR5KSBwZXJ0YWlucyB0byBzdHJpbmcgY29tcGFyZXMgb25seS4gVGhpcyBpbmNsdWRlcyB1bnR5cGVkIGNvbHVtbnMsIGNvbHVtbnMgdHlwZWQgYXMgc3RyaW5ncywgdHlwZWQgY29sdW1ucyBjb250YWluaW5nIGRhdGEgdGhhdCBjYW5ub3QgYmUgY29lcmNlZCB0byB0eXBlIG9yIHdoZW4gdGhlIGZpbHRlciBleHByZXNzaW9uIG9wZXJhbmQgY2Fubm90IGJlIGNvZXJjZWQuIFRoaXMgaXMgYSBzaGFyZWQgcHJvcGVydHkgYW5kIGFmZmVjdHMgYWxsIGdyaWRzIG1hbmFnZWQgYnkgdGhpcyBpbnN0YW5jZSBvZiB0aGUgYXBwLlxuICAgICAqICogYGNhbGN1bGF0b3JgIChjb2x1bW4gcHJvcGVydHkpIENvbXB1dGVkIGNvbHVtbiBjYWxjdWxhdG9yLlxuICAgICAqXG4gICAgICogQHJldHVybnMgT25lIG9mOlxuICAgICAqICogKipHZXR0ZXIqKiB0eXBlIGNhbGw6IFZhbHVlIG9mIHJlcXVlc3RlZCBwcm9wZXJ0eSBvciBgbnVsbGAgaWYgdW5kZWZpbmVkLlxuICAgICAqICogKipTZXR0ZXIqKiB0eXBlIGNhbGw6IGB1bmRlZmluZWRgXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgRGVmYXVsdEZpbHRlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBwcm9wZXJ0aWVzOiBmdW5jdGlvbihwcm9wZXJ0aWVzKSB7XG4gICAgICAgIHZhciByZXN1bHQsIHZhbHVlLFxuICAgICAgICAgICAgb2JqZWN0ID0gcHJvcGVydGllcyAmJiBwcm9wZXJ0aWVzLkNPTFVNTlxuICAgICAgICAgICAgICAgID8gdGhpcy5zY2hlbWEubG9va3VwKHByb3BlcnRpZXMuQ09MVU1OLm5hbWUpXG4gICAgICAgICAgICAgICAgOiB0aGlzLnJvb3Q7XG5cbiAgICAgICAgaWYgKHByb3BlcnRpZXMgJiYgb2JqZWN0KSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydGllcy5HRVRURVIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBvYmplY3RbYWxpYXMocHJvcGVydGllcy5HRVRURVIpXTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcHJvcGVydGllc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmICF0aGlzLmZpcnN0Q2xhc3NQcm9wZXJ0aWVzW2tleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFthbGlhcyhrZXkpXSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbYWxpYXMoa2V5KV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIGFsaWFzKGtleSkge1xuICAgIGlmIChrZXkgPT09ICdoZWFkZXInKSB7XG4gICAgICAgIGtleSA9ICdhbGlhcyc7XG4gICAgfVxuICAgIHJldHVybiBrZXk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0RmlsdGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBpbXBsZW1lbnRzIGRhdGFNb2RlbEFQSVxuICogQHBhcmFtIHtIeXBlcmdyaWR9IGdyaWRcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5uYW1lXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEZpbHRlclN1YmdyaWQoZ3JpZCwgb3B0aW9ucykge1xuICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XG4gICAgdGhpcy5iZWhhdmlvciA9IGdyaWQuYmVoYXZpb3I7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7ZGF0YVJvd09iamVjdH1cbiAgICAgKi9cbiAgICB0aGlzLmRhdGFSb3cgPSB7fTsgLy8gZm9yIG1ldGEgZGF0YSAoX19IRUlHSFQpXG5cbiAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLm5hbWUpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgIH1cbn1cblxuRmlsdGVyU3ViZ3JpZC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IEZpbHRlclN1YmdyaWQucHJvdG90eXBlLmNvbnN0cnVjdG9yLFxuXG4gICAgdHlwZTogJ2ZpbHRlcicsXG5cbiAgICBmb3JtYXQ6ICdmaWx0ZXInLCAvLyBvdmVycmlkZSBjb2x1bW4gZm9ybWF0XG5cbiAgICBnZXRSb3dDb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdyaWQucHJvcGVydGllcy5zaG93RmlsdGVyUm93ID8gMSA6IDA7XG4gICAgfSxcblxuICAgIGdldFZhbHVlOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlaGF2aW9yLmRhdGFNb2RlbC5nZXRGaWx0ZXIoeCkgfHwgJyc7XG4gICAgfSxcblxuICAgIHNldFZhbHVlOiBmdW5jdGlvbih4LCB5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmJlaGF2aW9yLmRhdGFNb2RlbC5zZXRGaWx0ZXIoeCwgdmFsdWUpO1xuICAgIH0sXG5cbiAgICBnZXRSb3c6IGZ1bmN0aW9uKHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVJvdztcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlclN1YmdyaWQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnb2JqZWN0LWl0ZXJhdG9ycycpO1xuXG52YXIgUkVHRVhQX0JPT0xTID0gL1xcYihBTkR8T1J8Tk9SKVxcYi9naSxcbiAgICBFWFAgPSAnKC4qPyknLCBCUiA9ICdcXFxcYicsXG4gICAgUFJFRklYID0gJ14nICsgRVhQICsgQlIsXG4gICAgSU5GSVggPSBCUiArIEVYUCArIEJSLFxuICAgIFBPU1RGSVggPSBCUiArIEVYUCArICckJztcblxuZnVuY3Rpb24gUGFyc2VyQ3FsRXJyb3IobWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG59XG5QYXJzZXJDcWxFcnJvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG5QYXJzZXJDcWxFcnJvci5wcm90b3R5cGUubmFtZSA9ICdQYXJzZXJDcWxFcnJvcic7XG5cbi8qKlxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHN1bW1hcnkgQ29sdW1uIFF1ZXJ5IExhbmd1YWdlIChDUUwpIHBhcnNlclxuICpcbiAqIEBhdXRob3IgSm9uYXRoYW4gRWl0ZW4gam9uYXRoYW5Ab3BlbmZpbi5jb21cbiAqXG4gKiBAZGVzYyBTZWUge0B0dXRvcmlhbCBDUUx9IGZvciB0aGUgZ3JhbW1hci5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb3BlcmF0b3JzSGFzaCAtIEhhc2ggb2YgdmFsaWQgb3BlcmF0b3JzLlxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHttZW51SXRlbVtdfSBbb3B0aW9ucy5zY2hlbWFdIC0gQ29sdW1uIHNjaGVtYSBmb3IgY29sdW1uIG5hbWUvYWxpYXMgdmFsaWRhdGlvbi4gVGhyb3dzIGFuIGVycm9yIGlmIG5hbWUgZmFpbHMgdmFsaWRhdGlvbiAoYnV0IHNlZSBgcmVzb2x2ZUFsaWFzZXNgKS4gT21pdCB0byBza2lwIGNvbHVtbiBuYW1lIHZhbGlkYXRpb24uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmRlZmF1bHRPcD0nPSddIC0gRGVmYXVsdCBvcGVyYXRvciBmb3IgY29sdW1uIHdoZW4gbm90IGRlZmluZWQgaW4gY29sdW1uIHNjaGVtYS5cbiAqL1xuZnVuY3Rpb24gUGFyc2VyQ1FMKG9wZXJhdG9yc0hhc2gsIG9wdGlvbnMpIHtcbiAgICB2YXIgb3BlcmF0b3JzID0gW107XG5cbiAgICB0aGlzLnNjaGVtYSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5zY2hlbWE7XG4gICAgdGhpcy5kZWZhdWx0T3AgPSAob3B0aW9ucyAmJiBvcHRpb25zLmRlZmF1bHRPcCB8fCAnPScpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICBfKG9wZXJhdG9yc0hhc2gpLmVhY2goZnVuY3Rpb24ocHJvcHMsIG9wKSB7XG4gICAgICAgIGlmIChvcCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIG9wZXJhdG9ycy5wdXNoKG9wKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gUHV0IGxhcmdlciBvbmVzIGZpcnN0IHNvIHRoYXQgaW4gY2FzZSBhIHNtYWxsZXIgb25lIGlzIGEgc3Vic3RyaW5nIG9mIGEgbGFyZ2VyIG9uZSAoc3VjaCBhcyAnPCcgaXMgdG8gJzw9JyksIGxhcmdlciBvbmUgd2lsbCBiZSBtYXRjaGVkIGZpcnN0LlxuICAgIG9wZXJhdG9ycyA9IG9wZXJhdG9ycy5zb3J0KGRlc2NlbmRpbmdCeUxlbmd0aCk7XG5cbiAgICAvLyBFc2NhcGUgYWxsIHN5bWJvbGljIChub24gYWxwaGEpIG9wZXJhdG9ycy5cbiAgICBvcGVyYXRvcnMgPSBvcGVyYXRvcnMubWFwKGZ1bmN0aW9uKG9wKSB7XG4gICAgICAgIGlmICgvXlteQS1aXS8udGVzdChvcCkpIHtcbiAgICAgICAgICAgIG9wID0gJ1xcXFwnICsgb3Auc3BsaXQoJycpLmpvaW4oJ1xcXFwnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3A7XG4gICAgfSk7XG5cbiAgICB2YXIgc3ltYm9saWNPcGVyYXRvcnMgPSBvcGVyYXRvcnMuZmlsdGVyKGZ1bmN0aW9uKG9wKSB7IHJldHVybiBvcFswXSA9PT0gJ1xcXFwnOyB9KSxcbiAgICAgICAgYWxwaGFPcGVyYXRvcnMgPSBvcGVyYXRvcnMuZmlsdGVyKGZ1bmN0aW9uKG9wKSB7IHJldHVybiBvcFswXSAhPT0gJ1xcXFwnOyB9KS5qb2luKCd8Jyk7XG5cbiAgICBpZiAoYWxwaGFPcGVyYXRvcnMpIHtcbiAgICAgICAgYWxwaGFPcGVyYXRvcnMgPSAnXFxcXGIoJyArIGFscGhhT3BlcmF0b3JzICsgJylcXFxcYic7XG4gICAgfVxuICAgIC8qKiBAc3VtbWFyeSBSZWdleCB0byBtYXRjaCBhbnkgb3BlcmF0b3IuXG4gICAgICogQGRlc2MgTWF0Y2hlcyBzeW1ib2xpYyBvcGVyYXRvcnMgKG1hZGUgdXAgb2Ygbm9uLWFscGhhIGNoYXJhY3RlcnMpIG9yIGlkZW50aWZpZXIgb3BlcmF0b3JzICh3b3JkLWJvdW5kYXJ5LWlzb2xhdGVkIHJ1bnMgb2YgYWxwaGFudW1lcmljIGNoYXJhY3RlcnMpLlxuICAgICAqIEB0eXBlIHtSZWdFeHB9XG4gICAgICovXG4gICAgdGhpcy5SRUdFWF9PUEVSQVRPUiA9IG5ldyBSZWdFeHAoc3ltYm9saWNPcGVyYXRvcnMuY29uY2F0KGFscGhhT3BlcmF0b3JzKS5qb2luKCd8JyksICdpZycpO1xuXG4gICAgb3BlcmF0b3JzID0gb3BlcmF0b3JzLmpvaW4oJ3wnKSAvLyBwaXBlIHRoZW1cbiAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJ1xcXFxzKycpOyAvLyBhcmJpdHJhcnkgc3RyaW5nIG9mIHdoaXRlc3BhY2UgY2hhcnMgLT4gd2hpdGVzcGFjZSByZWdleCBtYXRjaGVyXG5cbiAgICAvKiogQHN1bW1hcnkgUmVnZXggdG8gbWF0Y2ggYW4gb3BlcmF0b3IgKyBvcHRpb25hbCBvcGVyYXRvclxuICAgICAqIEBkZXNjIFRIZSBvcGVyYXRvciBpcyBvcHRpb25hbC4gVGhlIG9wZXJhbmQgbWF5IChvciBtYXkgbm90KSBiZSBlbmNsb3NlZCBpbiBwYXJlbnRoZXNlcy5cbiAgICAgKiBAZGVzYyBNYXRjaCBsaXN0OlxuICAgICAqIDAuIF9pbnB1dCBzdHJpbmdfXG4gICAgICogMS4gb3BlcmF0b3JcbiAgICAgKiAyLiBvdXRlciBvcGVyYW5kIChtYXkgaW5jbHVkZSBwYXJlbnRoZXNlcylcbiAgICAgKiAzLiBpbm5lciBvcGVyYW5kIHdpdGhvdXQgcGFyZW50aGVzZXMgKHdoZW4gYW4gb3BlcmFuZCB3YXMgZ2l2ZW4gd2l0aCBwYXJlbnRoZXNlcylcbiAgICAgKiA0LiBpbm5lciBvcGVyYW5kICh3aGVuIGFuIG9wZXJhbmQgd2FzIGdpdmVuIHdpdGhvdXQgcGFyZW50aGVzZXMpXG4gICAgICogQHR5cGUge1JlZ0V4cH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBtZW1iZXJPZiBQYXJzZXJDUUwucHJvdG90eXBlXG4gICAgICovXG4gICAgdGhpcy5SRUdFWF9FWFBSRVNTSU9OID0gbmV3IFJlZ0V4cCgnXlxcXFxzKignICsgb3BlcmF0b3JzICsgJyk/XFxcXHMqKFxcXFwoXFxcXHMqKC4rPylcXFxccypcXFxcKXwoLis/KSlcXFxccyokJywgJ2knKTtcblxuICAgIHRoaXMuUkVHRVhfTElURVJBTF9UT0tFTlMgPSBuZXcgUmVnRXhwKCdcXFxcJyArIFBhcnNlckNRTC5xdCArICcoXFxcXGQrKScgKyAnXFxcXCcgKyBQYXJzZXJDUUwucXQsICdnJyk7XG5cbn1cblxuLyoqIEBzdW1tYXJ5IE9wZXJhbmQgcXVvdGF0aW9uIG1hcmsgY2hhcmFjdGVyLlxuICogQGRlc2MgU2hvdWxkIGJlIGEgc2luZ2xlIGNoYXJhY3RlciAobGVuZ3RoID09PSAxKS5cbiAqIEBkZWZhdWx0ICdcIidcbiAqIEB0eXBlIHtzdHJpbmd9XG4gKi9cblBhcnNlckNRTC5xdCA9ICdcIic7XG5cblBhcnNlckNRTC5wcm90b3R5cGUgPSB7XG5cbiAgICBjb25zdHJ1Y3RvcjogUGFyc2VyQ1FMLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IEV4dHJhY3QgdGhlIGJvb2xlYW4gb3BlcmF0b3JzIGZyb20gYW4gZXhwcmVzc2lvbiBjaGFpbi5cbiAgICAgKiBAZGVzYyBSZXR1cm5zIGxpc3Qgb2YgaG9tb2dlbmVvdXMgb3BlcmF0b3JzIHRyYW5zZm9ybWVkIHRvIGxvd2VyIGNhc2UuXG4gICAgICpcbiAgICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgYWxsIHRoZSBib29sZWFuIG9wZXJhdG9ycyBpbiB0aGUgY2hhaW4gYXJlIG5vdCBpZGVudGljYWwuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNxbFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAgICAgKi9cbiAgICBjYXB0dXJlQm9vbGVhbnM6IGZ1bmN0aW9uKGNxbCkge1xuICAgICAgICB2YXIgYm9vbGVhbnMgPSBjcWwubWF0Y2goUkVHRVhQX0JPT0xTKTtcbiAgICAgICAgcmV0dXJuIGJvb2xlYW5zICYmIGJvb2xlYW5zLm1hcChmdW5jdGlvbihib29sKSB7XG4gICAgICAgICAgICByZXR1cm4gYm9vbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVCb29sZWFuczogZnVuY3Rpb24oYm9vbGVhbnMpIHtcbiAgICAgICAgaWYgKGJvb2xlYW5zKSB7XG4gICAgICAgICAgICB2YXIgaGV0ZXJvZ2VuZW91c09wZXJhdG9yID0gYm9vbGVhbnMuZmluZChmdW5jdGlvbihvcCwgaSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBib29sZWFuc1tpXSAhPT0gYm9vbGVhbnNbMF07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGhldGVyb2dlbmVvdXNPcGVyYXRvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZXJDcWxFcnJvcignRXhwZWN0ZWQgaG9tb2dlbmVvdXMgYm9vbGVhbiBvcGVyYXRvcnMuIFlvdSBjYW5ub3QgbWl4IEFORCwgT1IsIGFuZCBOT1Igb3BlcmF0b3JzIGhlcmUgYmVjYXVzZSB0aGUgb3JkZXIgb2Ygb3BlcmF0aW9ucyBpcyBhbWJpZ3VvdXMuXFxuVGlwOiBJbiBNYW5hZ2UgRmlsdGVycywgeW91IGNhbiBncm91cCBvcGVyYXRpb25zIHdpdGggc3ViZXhwcmVzc2lvbnMgaW4gdGhlIFF1ZXJ5IEJ1aWxkZXIgdGFiIG9yIGJ5IHVzaW5nIHBhcmVudGhlc2VzIGluIHRoZSBTUUwgdGFiLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBib29sZWFucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgQnJlYWsgYW4gZXhwcmVzc2lvbiBjaGFpbiBpbnRvIGEgbGlzdCBvZiBleHByZXNzaW9ucy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3FsXG4gICAgICogQHBhcmFtIHtzdHJpbmdbXX0gYm9vbGVhbnNcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nW119XG4gICAgICovXG4gICAgY2FwdHVyZUV4cHJlc3Npb25zOiBmdW5jdGlvbihjcWwsIGJvb2xlYW5zKSB7XG4gICAgICAgIHZhciBleHByZXNzaW9ucywgcmU7XG5cbiAgICAgICAgaWYgKGJvb2xlYW5zKSB7XG4gICAgICAgICAgICByZSA9IG5ldyBSZWdFeHAoUFJFRklYICsgYm9vbGVhbnMuam9pbihJTkZJWCkgKyBQT1NURklYLCAnaScpO1xuICAgICAgICAgICAgZXhwcmVzc2lvbnMgPSBjcWwubWF0Y2gocmUpO1xuICAgICAgICAgICAgZXhwcmVzc2lvbnMuc2hpZnQoKTsgLy8gZGlzY2FyZCBbMF0gKGlucHV0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwcmVzc2lvbnMgPSBbY3FsXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleHByZXNzaW9ucztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgTWFrZSBhIGxpc3Qgb2YgY2hpbGRyZW4gb3V0IG9mIGEgbGlzdCBvZiBleHByZXNzaW9ucy5cbiAgICAgKiBAZGVzYyBVc2VzIG9ubHkgX2NvbXBsZXRlXyBleHByZXNzaW9ucyAoYSB2YWx1ZSBPUiBhbiBvcGVyYXRvciArIGEgdmFsdWUpLlxuICAgICAqXG4gICAgICogSWdub3JlcyBfaW5jb21wbGV0ZV8gZXhwcmVzc2lvbnMgKGVtcHR5IHN0cmluZyBPUiBhbiBvcGVyYXRvciAtIGEgdmFsdWUpLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcbiAgICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBleHByZXNzaW9uc1xuICAgICAqIEBwYXJhbSB7c3RyaW5nW119IGxpdGVyYWxzIC0gbGlzdCBvZiBsaXRlcmFscyBpbmRleGVkIGJ5IHRva2VuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7ZXhwcmVzc2lvblN0YXRlW119IHdoZXJlIGBleHByZXNzaW9uU3RhdGVgIGlzIG9uZSBvZjpcbiAgICAgKiAqIGB7Y29sdW1uOiBzdHJpbmcsIG9wZXJhdG9yOiBzdHJpbmcsIG9wZXJhbmQ6IHN0cmluZ31gXG4gICAgICogKiBge2NvbHVtbjogc3RyaW5nLCBvcGVyYXRvcjogc3RyaW5nLCBvcGVyYW5kOiBzdHJpbmcsIGVkaXRvcjogJ0NvbHVtbnMnfWBcbiAgICAgKi9cbiAgICBtYWtlQ2hpbGRyZW46IGZ1bmN0aW9uKGNvbHVtbk5hbWUsIGV4cHJlc3Npb25zLCBsaXRlcmFscykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiBleHByZXNzaW9ucy5yZWR1Y2UoZnVuY3Rpb24oY2hpbGRyZW4sIGV4cCkge1xuICAgICAgICAgICAgaWYgKGV4cCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IGV4cC5tYXRjaChzZWxmLlJFR0VYX0VYUFJFU1NJT04pO1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0cykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3AgPSBwYXJ0c1sxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGVyTGl0ZXJhbCA9IHBhcnRzWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJMaXRlcmFsID0gcGFydHMuc2xpY2UoMykuZmluZChmdW5jdGlvbihwYXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnQgIT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIG9wID0gKG9wIHx8ICcnKS5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudGhlc2l6ZWQgPSAvXlxcKC4qXFwpJC8udGVzdChvdXRlckxpdGVyYWwpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJPcGVyYXRvcnMgPSBpbm5lckxpdGVyYWwubWF0Y2goc2VsZi5SRUdFWF9PUEVSQVRPUik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnRoZXNpemVkICYmIGlubmVyT3BlcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3AgPT09ICcnICYmIG91dGVyTGl0ZXJhbCA9PT0gaW5uZXJPcGVyYXRvcnNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyQ3FsRXJyb3IoJ0V4cGVjdGVkIGFuIG9wZXJhbmQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZXJDcWxFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnRXhwZWN0ZWQgb3BlcmFuZCBidXQgZm91bmQgYWRkaXRpb25hbCBvcGVyYXRvcihzKTogJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5uZXJPcGVyYXRvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKCkgLy8gY29udmVydCB0byBjb21tYS1zZXBhcmF0ZWQgbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvLC9nLCAnLCAnKSAvLyBhZGQgc3BhY2VzIGFmdGVyIHRoZSBjb21tYXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL14oW14sXSspLCAoW14sXSspJC8sICckMSBhbmQgJDInKSAvLyByZXBsYWNlIG9ubHkgY29tbWEgd2l0aCBcImFuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oLissLispLCAoW14sXSspJC8sICckMSwgYW5kICQyJykgLy8gYWRkIFwiYW5kXCIgYWZ0ZXIgbGFzdCBvZiBzZXZlcmFsIGNvbW1hc1xuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9wID0gb3AgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZW1hICYmIHNlbGYuc2NoZW1hLmxvb2t1cChjb2x1bW5OYW1lKS5kZWZhdWx0T3AgfHwgLy8gY29sdW1uJ3MgZGVmYXVsdCBvcGVyYXRvciBmcm9tIHNjaGVtYVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0T3A7IC8vIGdyaWQncyBkZWZhdWx0IG9wZXJhdG9yXG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sdW1uOiBjb2x1bW5OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IG9wXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpZWxkTmFtZSA9IHNlbGYuc2NoZW1hICYmIHNlbGYuc2NoZW1hLmxvb2t1cChpbm5lckxpdGVyYWwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmllbGROYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vcGVyYW5kID0gZmllbGROYW1lLm5hbWUgfHwgZmllbGROYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuZWRpdG9yID0gJ0NvbHVtbnMnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBhbmQgZXhwYW5kIGFsbCBjb2xsYXBzZWQgbGl0ZXJhbHMuXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vcGVyYW5kID0gaW5uZXJMaXRlcmFsLnJlcGxhY2Uoc2VsZi5SRUdFWF9MSVRFUkFMX1RPS0VOUywgZnVuY3Rpb24obWF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxpdGVyYWxzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBbXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFRoZSBwb3NpdGlvbiBvZiB0aGUgb3BlcmF0b3Igb2YgdGhlIGV4cHJlc3Npb24gdW5kZXIgdGhlIGN1cnNvci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY3FsIC0gQ1FMIGV4cHJlc3Npb24gdW5kZXIgY29uc3RydWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJzb3IgLSBDdXJyZW50IGN1cnNvcidzIHN0YXJ0aW5nIHBvc2l0aW9uIChgaW5wdXQuc3RhcnRTZWxlY3Rpb25gKVxuICAgICAqIEByZXR1cm5zIHt7c3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXJ9fVxuICAgICAqL1xuICAgIGdldE9wZXJhdG9yUG9zaXRpb246IGZ1bmN0aW9uKGNxbCwgY3Vyc29yKSB7XG4gICAgICAgIC8vIGZpcnN0IHRva2VuaXplIGxpdGVyYWxzIGluIGNhc2UgdGhleSBjb250YWluIGJvb2xlYW5zLi4uXG4gICAgICAgIHZhciBsaXRlcmFscyA9IFtdO1xuICAgICAgICBjcWwgPSB0b2tlbml6ZUxpdGVyYWxzKGNxbCwgUGFyc2VyQ1FMLnF0LCBsaXRlcmFscyk7XG5cbiAgICAgICAgLy8gLi4udGhlbiBleHBhbmQgdG9rZW5zIGJ1dCB3aXRoIHgncyBqdXN0IGZvciBsZW5ndGhcbiAgICAgICAgY3FsID0gY3FsLnJlcGxhY2UodGhpcy5SRUdFWF9MSVRFUkFMX1RPS0VOUywgZnVuY3Rpb24obWF0Y2gsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gMSArIGxpdGVyYWxzW2luZGV4XS5sZW5ndGggKyAxOyAvLyBhZGQgcXVvdGUgY2hhcnNcbiAgICAgICAgICAgIHJldHVybiBBcnJheShsZW5ndGggKyAxKS5qb2luKCd4Jyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBib29sZWFucywgZXhwcmVzc2lvbnMsIHBvc2l0aW9uLCB0YWJzLCBlbmQsIHRhYiwgZXhwcmVzc2lvbiwgb2xkT3BlcmF0b3IsIG9sZE9wZXJhdG9yT2Zmc2V0O1xuXG4gICAgICAgIGlmICgoYm9vbGVhbnMgPSB0aGlzLmNhcHR1cmVCb29sZWFucyhjcWwpKSkge1xuICAgICAgICAgICAgLy8gYm9vbGVhbihzKSBmb3VuZCBzbyBjb25jYXRlbmF0ZWQgZXhwcmVzc2lvbnNcbiAgICAgICAgICAgIGV4cHJlc3Npb25zID0gdGhpcy5jYXB0dXJlRXhwcmVzc2lvbnMoY3FsLCBib29sZWFucyk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IDA7XG4gICAgICAgICAgICB0YWJzID0gZXhwcmVzc2lvbnMubWFwKGZ1bmN0aW9uKGV4cHIsIGlkeCkgeyAvLyBnZXQgc3RhcnRpbmcgcG9zaXRpb24gb2YgZWFjaCBleHByZXNzaW9uXG4gICAgICAgICAgICAgICAgdmFyIGJvb2wgPSBib29sZWFuc1tpZHggLSAxXSB8fCAnJztcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiArPSBleHByLmxlbmd0aCArIGJvb2wubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBmaW5kIGJlZ2lubmluZyBvZiBleHByZXNzaW9uIHVuZGVyIGN1cnNvciBwb3NpdGlvblxuICAgICAgICAgICAgdGFicy5maW5kKGZ1bmN0aW9uKHRpY2ssIGlkeCkge1xuICAgICAgICAgICAgICAgIHRhYiA9IGlkeDtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3Vyc29yIDw9IHRpY2s7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY3Vyc29yID0gdGFic1t0YWIgLSAxXSB8fCAwO1xuICAgICAgICAgICAgZW5kID0gY3Vyc29yICs9IChib29sZWFuc1t0YWIgLSAxXSB8fCAnJykubGVuZ3RoO1xuXG4gICAgICAgICAgICBleHByZXNzaW9uID0gZXhwcmVzc2lvbnNbdGFiXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGJvb2xlYW5zIG5vdCBmb3VuZCBzbyBzaW5nbGUgZXhwcmVzc2lvblxuICAgICAgICAgICAgY3Vyc29yID0gMDtcbiAgICAgICAgICAgIGVuZCA9IGNxbC5sZW5ndGg7XG4gICAgICAgICAgICBleHByZXNzaW9uID0gY3FsO1xuICAgICAgICB9XG5cbiAgICAgICAgb2xkT3BlcmF0b3JPZmZzZXQgPSBleHByZXNzaW9uLnNlYXJjaCh0aGlzLlJFR0VYX09QRVJBVE9SKTtcbiAgICAgICAgaWYgKG9sZE9wZXJhdG9yT2Zmc2V0ID49IDApIHtcbiAgICAgICAgICAgIG9sZE9wZXJhdG9yID0gZXhwcmVzc2lvbi5tYXRjaCh0aGlzLlJFR0VYX09QRVJBVE9SKVswXTtcbiAgICAgICAgICAgIGN1cnNvciArPSBvbGRPcGVyYXRvck9mZnNldDtcbiAgICAgICAgICAgIGVuZCA9IGN1cnNvciArIG9sZE9wZXJhdG9yLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGFydDogY3Vyc29yLFxuICAgICAgICAgICAgZW5kOiBlbmRcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgTWFrZSBhIFwibG9ja2VkXCIgc3ViZXhwcmVzc2lvbiBkZWZpbml0aW9uIG9iamVjdCBmcm9tIGFuIGV4cHJlc3Npb24gY2hhaW4uXG4gICAgICogQGRlc2MgX0xvY2tlZF8gbWVhbnMgaXQgaXMgbG9ja2VkIHRvIGEgc2luZ2xlIGZpZWxkLlxuICAgICAqXG4gICAgICogV2hlbiB0aGVyZSBpcyBvbmx5IGEgc2luZ2xlIGV4cHJlc3Npb24gaW4gdGhlIGNoYWluLCB0aGUgYG9wZXJhdG9yYCBpcyBvbWl0dGVkIChkZWZhdWx0cyB0byBgJ29wLWFuZCdgKS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjcWwgLSBBIGNvbXBvdW5kIENRTCBleHByZXNzaW9uLCBjb25zaXN0aW5nIG9mIG9uZSBvciBtb3JlIHNpbXBsZSBleHByZXNzaW9ucyBhbGwgc2VwYXJhdGVkIGJ5IHRoZSBzYW1lIGxvZ2ljYWwgb3BlcmF0b3IpLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcblxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8e29wZXJhdG9yOiBzdHJpbmcsIGNoaWxkcmVuOiBzdHJpbmdbXSwgc2NoZW1hOiBzdHJpbmdbXX19XG4gICAgICogYHVuZGVmaW5lZGAgd2hlbiB0aGVyZSBhcmUgbm8gY29tcGxldGUgZXhwcmVzc2lvbnNcbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBtb2R1bGU6Q1FMXG4gICAgICovXG4gICAgcGFyc2U6IGZ1bmN0aW9uKGNxbCwgY29sdW1uTmFtZSkge1xuICAgICAgICAvLyByZWR1Y2UgYWxsIHJ1bnMgb2Ygd2hpdGUgc3BhY2UgdG8gYSBzaW5nbGUgc3BhY2U7IHRoZW4gdHJpbVxuICAgICAgICBjcWwgPSBjcWwucmVwbGFjZSgvXFxzXFxzKy9nLCAnICcpLnRyaW0oKTtcblxuICAgICAgICB2YXIgbGl0ZXJhbHMgPSBbXTtcbiAgICAgICAgY3FsID0gdG9rZW5pemVMaXRlcmFscyhjcWwsIFBhcnNlckNRTC5xdCwgbGl0ZXJhbHMpO1xuXG4gICAgICAgIHZhciBib29sZWFucyA9IHRoaXMudmFsaWRhdGVCb29sZWFucyh0aGlzLmNhcHR1cmVCb29sZWFucyhjcWwpKSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25zID0gdGhpcy5jYXB0dXJlRXhwcmVzc2lvbnMoY3FsLCBib29sZWFucyksXG4gICAgICAgICAgICBjaGlsZHJlbiA9IHRoaXMubWFrZUNoaWxkcmVuKGNvbHVtbk5hbWUsIGV4cHJlc3Npb25zLCBsaXRlcmFscyksXG4gICAgICAgICAgICBvcGVyYXRvciA9IGJvb2xlYW5zICYmIGJvb2xlYW5zWzBdLFxuICAgICAgICAgICAgc3RhdGU7XG5cbiAgICAgICAgaWYgKGNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2NvbHVtbkZpbHRlcicsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IGNoaWxkcmVuXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAob3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5vcGVyYXRvciA9ICdvcC0nICsgb3BlcmF0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gZGVzY2VuZGluZ0J5TGVuZ3RoKGEsIGIpIHtcbiAgICByZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBDb2xsYXBzZSBsaXRlcmFscy5cbiAqIEBkZXNjIEFsbG93cyByZXNlcnZlZCB3b3JkcyB0byBleGlzdCBpbnNpZGUgYSBxdW90ZWQgc3RyaW5nLlxuICogTGl0ZXJhbHMgYXJlIGNvbGxhcHNlZCB0byBhIHF1b3RlZCBudW1lcmljYWwgaW5kZXggaW50byB0aGUgYGxpdGVyYWxzYCBhcnJheS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gcXRcbiAqIEBwYXJhbSB7c3RyaW5nW119IGxpdGVyYWxzIC0gRW1wdHkgYXJyYXkgaW4gd2hpY2ggdG8gcmV0dXJuIGV4dHJhY3RlZCBsaXRlcmFscy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKiBAbWVtYmVyT2YgUGFyc2VyQ1FMXG4gKiBAaW5uZXJcbiAqL1xuZnVuY3Rpb24gdG9rZW5pemVMaXRlcmFscyh0ZXh0LCBxdCwgbGl0ZXJhbHMpIHtcbiAgICBsaXRlcmFscy5sZW5ndGggPSAwO1xuXG4gICAgZm9yIChcbiAgICAgICAgdmFyIGkgPSAwLCBqID0gMCwgaywgaW5uZXJMaXRlcmFsO1xuICAgICAgICAoaiA9IHRleHQuaW5kZXhPZihxdCwgaikpID49IDA7XG4gICAgICAgIGogKz0gMSArIChpICsgJycpLmxlbmd0aCArIDEsIGkrK1xuICAgICkge1xuICAgICAgICBrID0gajtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgayA9IHRleHQuaW5kZXhPZihxdCwgayArIDEpO1xuICAgICAgICAgICAgaWYgKGsgPCAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlckNxbEVycm9yKCdRdW90YXRpb24gbWFya3MgbXVzdCBiZSBwYWlyZWQ7IG5lc3RlZCBxdW90YXRpb24gbWFya3MgbXVzdCBiZSBkb3VibGVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlICh0ZXh0Wysra10gPT09IHF0KTtcblxuICAgICAgICBpbm5lckxpdGVyYWwgPSB0ZXh0XG4gICAgICAgICAgICAuc2xpY2UoKytqLCAtLWspIC8vIGV4dHJhY3RcbiAgICAgICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAocXQgKyBxdCwgJ2cnKSwgcXQpOyAvLyB1bmVzY2FwZSBlc2NhcGVkIHF1b3RhdGlvbiBtYXJrc1xuXG4gICAgICAgIGxpdGVyYWxzLnB1c2goaW5uZXJMaXRlcmFsKTtcblxuICAgICAgICB0ZXh0ID0gdGV4dC5zdWJzdHIoMCwgaikgKyBpICsgdGV4dC5zdWJzdHIoayk7IC8vIGNvbGxhcHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHRleHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyc2VyQ1FMO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFRoZSBiZWhhdmlvcnMncyBmaWx0ZXIgZGF0YSBjb250cm9sbGVyLlxuICAgICAqIEBkZXNjIFRoaXMgZ2V0dGVyL3NldHRlciBpcyBzeW50YWN0aWMgc3VnYXIgZm9yIGNhbGxzIHRvIGBnZXRDb250cm9sbGVyYCBhbmQgYHNldENvbnRyb2xsZXJgLlxuICAgICAqIEBwYXJhbSB7ZGF0YUNvbnRyb2xJbnRlcmZhY2V8dW5kZWZpbmVkfG51bGx9IGZpbHRlciAtIE9uZSBvZjpcbiAgICAgKiAqIEEgZmlsdGVyIG9iamVjdCwgdHVybmluZyBmaWx0ZXIgKk9OKi5cbiAgICAgKiAqIGB1bmRlZmluZWRgLCB0aGUgbnVsbCBmaWx0ZXIgaXMgcmVhc3NpZ25lZCB0byB0aGUgZ3JpZCwgdHVybmluZyBmaWx0ZXJpbmcgKk9GRi4qXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yI1xuICAgICAqL1xuICAgIGdldCBmaWx0ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbnRyb2xsZXIoJ2ZpbHRlcicpO1xuICAgIH0sXG4gICAgc2V0IGZpbHRlcihmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5zZXRDb250cm9sbGVyKCdmaWx0ZXInLCBmaWx0ZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IGNvbHVtbkluZGV4T3JOYW1lIC0gVGhlIF9jb2x1bW4gZmlsdGVyXyB0byBzZXQuXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIHtAbGluayBEZWZhdWx0RmlsdGVyI2dldFN0YXRlfGdldFN0YXRlfSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zeW50YXg9J0NRTCddIC0gVGhlIHN5bnRheCB0byB1c2UgdG8gZGVzY3JpYmUgdGhlIGZpbHRlciBzdGF0ZS4gTm90ZSB0aGF0IGBnZXRGaWx0ZXJgJ3MgZGVmYXVsdCBzeW50YXgsIGAnQ1FMJ2AsIGRpZmZlcnMgZnJvbSB0aGUgb3RoZXIgZ2V0IHN0YXRlIG1ldGhvZHMuXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IjXG4gICAgICovXG4gICAgZ2V0RmlsdGVyOiBmdW5jdGlvbihjb2x1bW5JbmRleE9yTmFtZSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhTW9kZWwuZ2V0RmlsdGVyKGNvbHVtbkluZGV4T3JOYW1lLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgU2V0IGEgcGFydGljdWxhciBjb2x1bW4gZmlsdGVyJ3Mgc3RhdGUuXG4gICAgICogQGRlc2MgQWZ0ZXIgc2V0dGluZyB0aGUgbmV3IGZpbHRlciBzdGF0ZSwgcmVhcHBsaWVzIHRoZSBmaWx0ZXIgdG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gY29sdW1uSW5kZXhPck5hbWUgLSBUaGUgX2NvbHVtbiBmaWx0ZXJfIHRvIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IFtzdGF0ZV0gLSBBIGZpbHRlciB0cmVlIG9iamVjdCBvciBhIEpTT04sIFNRTCwgb3IgQ1FMIHN1YmV4cHJlc3Npb24gc3RyaW5nIHRoYXQgZGVzY3JpYmVzIHRoZSBhIG5ldyBzdGF0ZSBmb3IgdGhlIG5hbWVkIGNvbHVtbiBmaWx0ZXIuIFRoZSBleGlzdGluZyBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb24gaXMgcmVwbGFjZWQgd2l0aCBhIG5ldyBub2RlIGJhc2VkIG9uIHRoaXMgc3RhdGUuIElmIGl0IGRvZXMgbm90IGV4aXN0LCB0aGUgbmV3IHN1YmV4cHJlc3Npb24gaXMgYWRkZWQgdG8gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUgKGBmaWx0ZXIuY29sdW1uRmlsdGVyc2ApLlxuICAgICAqXG4gICAgICogSWYgdW5kZWZpbmVkLCByZW1vdmVzIHRoZSBlbnRpcmUgY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uIGZyb20gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUuXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zeW50YXg9J0NRTCddIC0gVGhlIHN5bnRheCB0byB1c2UgdG8gZGVzY3JpYmUgdGhlIGZpbHRlciBzdGF0ZS4gTm90ZSB0aGF0IGBzZXRGaWx0ZXJgJ3MgZGVmYXVsdCBzeW50YXgsIGAnQ1FMJ2AsIGRpZmZlcnMgZnJvbSB0aGUgb3RoZXIgZ2V0IHN0YXRlIG1ldGhvZHMuXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZHxFcnJvcnxzdHJpbmd9IGB1bmRlZmluZWRgIGluZGljYXRlcyBzdWNjZXNzLlxuICAgICAqIEBtZW1iZXJPZiBCZWhhdmlvciNcbiAgICAgKi9cbiAgICBzZXRGaWx0ZXI6IGZ1bmN0aW9uKGNvbHVtbkluZGV4T3JOYW1lLCBzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmRhdGFNb2RlbC5zZXRGaWx0ZXIoY29sdW1uSW5kZXhPck5hbWUsIHN0YXRlLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIHtAbGluayBEZWZhdWx0RmlsdGVyI2dldFN0YXRlfGdldFN0YXRlfSBtZXRob2QuXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IjXG4gICAgICovXG4gICAgZ2V0RmlsdGVyczogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhTW9kZWwuZ2V0RmlsdGVycyhvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9IHN0YXRlXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RXJyb3J8c3RyaW5nfSBgdW5kZWZpbmVkYCBpbmRpY2F0ZXMgc3VjY2Vzcy5cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IjXG4gICAgICovXG4gICAgc2V0RmlsdGVyczogZnVuY3Rpb24oc3RhdGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5kYXRhTW9kZWwuc2V0RmlsdGVycyhzdGF0ZSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyB7QGxpbmsgRGVmYXVsdEZpbHRlciNnZXRTdGF0ZXxnZXRTdGF0ZX0gbWV0aG9kLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9XG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yI1xuICAgICAqL1xuICAgIGdldFRhYmxlRmlsdGVyOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFNb2RlbC5nZXRUYWJsZUZpbHRlcihvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9IHN0YXRlXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RXJyb3J8c3RyaW5nfSBgdW5kZWZpbmVkYCBpbmRpY2F0ZXMgc3VjY2Vzcy5cbiAgICAgKiBAbWVtYmVyT2YgQmVoYXZpb3IjXG4gICAgICovXG4gICAgc2V0VGFibGVGaWx0ZXI6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZGF0YU1vZGVsLnNldFRhYmxlRmlsdGVyKHN0YXRlLCBvcHRpb25zKTtcbiAgICB9LFxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFRoZSBiZWhhdmlvcnMncyBmaWx0ZXIgZGF0YSBjb250cm9sbGVyLlxuICAgICAqIEBkZXNjIFRoaXMgZ2V0dGVyL3NldHRlciBpcyBzeW50YWN0aWMgc3VnYXIgZm9yIGNhbGxzIHRvIGBnZXRDb250cm9sbGVyYCBhbmQgYHNldENvbnRyb2xsZXJgLlxuICAgICAqIEBwYXJhbSB7ZGF0YUNvbnRyb2xJbnRlcmZhY2V8dW5kZWZpbmVkfG51bGx9IGZpbHRlciAtIE9uZSBvZjpcbiAgICAgKiAqIEEgZmlsdGVyIG9iamVjdCwgdHVybmluZyBmaWx0ZXIgKk9OKi5cbiAgICAgKiAqIGB1bmRlZmluZWRgLCB0aGUgbnVsbCBmaWx0ZXIgaXMgcmVhc3NpZ25lZCB0byB0aGUgZ3JpZCwgdHVybmluZyBmaWx0ZXJpbmcgKk9GRi4qXG4gICAgICogQG1lbWJlck9mIEJlaGF2aW9yI1xuICAgICAqL1xuICAgIGdldCBmaWx0ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbnRyb2xsZXIoJ2ZpbHRlcicpO1xuICAgIH0sXG4gICAgc2V0IGZpbHRlcihmaWx0ZXIpIHtcbiAgICAgICAgdGhpcy5zZXRDb250cm9sbGVyKCdmaWx0ZXInLCBmaWx0ZXIpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBHZXQgYSBwYXJ0aWN1bGFyIGNvbHVtbiBmaWx0ZXIncyBzdGF0ZS5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY29sdW1uTmFtZVxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyB7QGxpbmsgRGVmYXVsdEZpbHRlciNnZXRTdGF0ZXxnZXRTdGF0ZX0gbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc3ludGF4PSdDUUwnXSAtIFRoZSBzeW50YXggdG8gdXNlIHRvIGRlc2NyaWJlIHRoZSBmaWx0ZXIgc3RhdGUuIE5vdGUgdGhhdCBgZ2V0RmlsdGVyYCdzIGRlZmF1bHQgc3ludGF4LCBgJ0NRTCdgLCBkaWZmZXJzIGZyb20gdGhlIG90aGVyIGdldCBzdGF0ZSBtZXRob2RzLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9XG4gICAgICogQG1lbWJlck9mIGRhdGFNb2RlbHMuSlNPTi5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKGNvbHVtbkluZGV4T3JOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpc0luZGV4ID0gIWlzTmFOKE51bWJlcihjb2x1bW5JbmRleE9yTmFtZSkpLFxuICAgICAgICAgICAgY29sdW1uTmFtZSA9IGlzSW5kZXggPyB0aGlzLnNjaGVtYVtjb2x1bW5JbmRleE9yTmFtZV0ubmFtZSA6IGNvbHVtbkluZGV4T3JOYW1lO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlci5nZXRDb2x1bW5GaWx0ZXJTdGF0ZShjb2x1bW5OYW1lLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgU2V0IGEgcGFydGljdWxhciBjb2x1bW4gZmlsdGVyJ3Mgc3RhdGUuXG4gICAgICogQGRlc2MgQWZ0ZXIgc2V0dGluZyB0aGUgbmV3IGZpbHRlciBzdGF0ZSwgcmVhcHBsaWVzIHRoZSBmaWx0ZXIgdG8gdGhlIGRhdGEgc291cmNlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gY29sdW1uSW5kZXhPck5hbWUgLSBUaGUgX2NvbHVtbiBmaWx0ZXJfIHRvIHNldC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IFtzdGF0ZV0gLSBBIGZpbHRlciB0cmVlIG9iamVjdCBvciBhIEpTT04sIFNRTCwgb3IgQ1FMIHN1YmV4cHJlc3Npb24gc3RyaW5nIHRoYXQgZGVzY3JpYmVzIHRoZSBhIG5ldyBzdGF0ZSBmb3IgdGhlIG5hbWVkIGNvbHVtbiBmaWx0ZXIuIFRoZSBleGlzdGluZyBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb24gaXMgcmVwbGFjZWQgd2l0aCBhIG5ldyBub2RlIGJhc2VkIG9uIHRoaXMgc3RhdGUuIElmIGl0IGRvZXMgbm90IGV4aXN0LCB0aGUgbmV3IHN1YmV4cHJlc3Npb24gaXMgYWRkZWQgdG8gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUgKGBmaWx0ZXIuY29sdW1uRmlsdGVyc2ApLlxuICAgICAqXG4gICAgICogSWYgdW5kZWZpbmVkLCByZW1vdmVzIHRoZSBlbnRpcmUgY29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uIGZyb20gdGhlIGNvbHVtbiBmaWx0ZXJzIHN1YnRyZWUuXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zeW50YXg9J0NRTCddIC0gVGhlIHN5bnRheCB0byB1c2UgdG8gZGVzY3JpYmUgdGhlIGZpbHRlciBzdGF0ZS4gTm90ZSB0aGF0IGBzZXRGaWx0ZXJgJ3MgZGVmYXVsdCBzeW50YXgsIGAnQ1FMJ2AsIGRpZmZlcnMgZnJvbSB0aGUgb3RoZXIgZ2V0IHN0YXRlIG1ldGhvZHMuXG4gICAgICogQHJldHVybnMge3VuZGVmaW5lZHxFcnJvcnxzdHJpbmd9IGB1bmRlZmluZWRgIGluZGljYXRlcyBzdWNjZXNzLlxuICAgICAqIEBtZW1iZXJPZiBkYXRhTW9kZWxzLkpTT04ucHJvdG90eXBlXG4gICAgICovXG4gICAgc2V0RmlsdGVyOiBmdW5jdGlvbihjb2x1bW5JbmRleE9yTmFtZSwgc3RhdGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGlzSW5kZXggPSAhaXNOYU4oTnVtYmVyKGNvbHVtbkluZGV4T3JOYW1lKSksXG4gICAgICAgICAgICBjb2x1bW5OYW1lID0gaXNJbmRleCA/IHRoaXMuc2NoZW1hW2NvbHVtbkluZGV4T3JOYW1lXS5uYW1lIDogY29sdW1uSW5kZXhPck5hbWU7XG5cbiAgICAgICAgdGhpcy5maWx0ZXIuc2V0Q29sdW1uRmlsdGVyU3RhdGUoY29sdW1uTmFtZSwgc3RhdGUsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmdyaWQuZmlyZVN5bnRoZXRpY0ZpbHRlckFwcGxpZWRFdmVudCgpO1xuICAgICAgICB0aGlzLnJlaW5kZXgoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIHtAbGluayBEZWZhdWx0RmlsdGVyI2dldFN0YXRlfGdldFN0YXRlfSBtZXRob2QuXG4gICAgICogQHJldHVybnMge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH1cbiAgICAgKiBAbWVtYmVyT2YgZGF0YU1vZGVscy5KU09OLnByb3RvdHlwZVxuICAgICAqL1xuICAgIGdldEZpbHRlcnM6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyLmdldENvbHVtbkZpbHRlcnNTdGF0ZShvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9IHN0YXRlXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RXJyb3J8c3RyaW5nfSBgdW5kZWZpbmVkYCBpbmRpY2F0ZXMgc3VjY2Vzcy5cbiAgICAgKiBAbWVtYmVyT2YgZGF0YU1vZGVscy5KU09OLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldEZpbHRlcnM6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZmlsdGVyLnNldENvbHVtbkZpbHRlcnNTdGF0ZShzdGF0ZSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZ3JpZC5maXJlU3ludGhldGljRmlsdGVyQXBwbGllZEV2ZW50KCk7XG4gICAgICAgIHRoaXMucmVpbmRleCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVHZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3Mge0BsaW5rIERlZmF1bHRGaWx0ZXIjZ2V0U3RhdGV8Z2V0U3RhdGV9IG1ldGhvZC5cbiAgICAgKiBAcmV0dXJucyB7RmlsdGVyVHJlZVN0YXRlT2JqZWN0fVxuICAgICAqIEBtZW1iZXJPZiBkYXRhTW9kZWxzLkpTT04ucHJvdG90eXBlXG4gICAgICovXG4gICAgZ2V0VGFibGVGaWx0ZXI6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyLmdldFRhYmxlRmlsdGVyU3RhdGUob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFNldCBhIHRoZSB0YWJsZSBmaWx0ZXIgc3RhdGUuXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9IHN0YXRlXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RXJyb3J8c3RyaW5nfSBgdW5kZWZpbmVkYCBpbmRpY2F0ZXMgc3VjY2Vzcy5cbiAgICAgKiBAbWVtYmVyT2YgZGF0YU1vZGVscy5KU09OLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldFRhYmxlRmlsdGVyOiBmdW5jdGlvbihzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmZpbHRlci5zZXRUYWJsZUZpbHRlclN0YXRlKHN0YXRlLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5ncmlkLmZpcmVTeW50aGV0aWNGaWx0ZXJBcHBsaWVkRXZlbnQoKTtcbiAgICAgICAgdGhpcy5yZWluZGV4KCk7XG4gICAgfSxcblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBAc3VtbWFyeSBUaGUgZ3JpZCBpbnN0YW5jZSdzIGZpbHRlciBkYXRhIGNvbnRyb2xsZXIuXG4gICAgICogQGRlc2MgVGhpcyBnZXR0ZXIvc2V0dGVyIGlzIHN5bnRhY3RpYyBzdWdhciBmb3IgY2FsbHMgdG8gYGdldENvbnRyb2xsZXJgIGFuZCBgc2V0Q29udHJvbGxlcmAuXG4gICAgICpcbiAgICAgKiBJbiBhZGRpdGlvbiB0byBhIGRhdGEgbW9kZWwgdGhhdCBhY2NlcHRzIGFuIGRhdGEgY29udHJvbGxlciBvZiB0eXBlICdmaWx0ZXInLCB0byBkaXNwbGF5IHRoZSBzdGFuZGFyZCBmaWx0ZXIgY2VsbHMsIHRoZSBmaWx0ZXIgZGF0YSBjb250cm9sbGVyIGFsc28gcmVxdWlyZXMgRmlsdGVyU3ViZ3JpZCBpbiB0aGUgc3ViZ3JpZHMgbGlzdC5cbiAgICAgKiBAcGFyYW0ge2RhdGFDb250cm9sSW50ZXJmYWNlfHVuZGVmaW5lZHxudWxsfSBmaWx0ZXIgLSBPbmUgb2Y6XG4gICAgICogKiBBIGZpbHRlciBvYmplY3QsIHR1cm5pbmcgZmlsdGVyICpPTiouXG4gICAgICogKiBgdW5kZWZpbmVkYCwgdGhlIG51bGwgZmlsdGVyIGlzIHJlYXNzaWduZWQgdG8gdGhlIGdyaWQsIHR1cm5pbmcgZmlsdGVyaW5nICpPRkYuKlxuICAgICAqIEBtZW1iZXJPZiBIeXBlcmdyaWQjXG4gICAgICovXG4gICAgZ2V0IGZpbHRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29udHJvbGxlcignZmlsdGVyJyk7XG4gICAgfSxcbiAgICBzZXQgZmlsdGVyKGZpbHRlcikge1xuICAgICAgICB0aGlzLnNldENvbnRyb2xsZXIoJ2ZpbHRlcicsIGZpbHRlcik7XG4gICAgfSxcblxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBjb2x1bW5JbmRleE9yTmFtZSAtIFRoZSBfY29sdW1uIGZpbHRlcl8gdG8gc2V0LlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyB7QGxpbmsgRGVmYXVsdEZpbHRlciNnZXRTdGF0ZXxnZXRTdGF0ZX0gbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc3ludGF4PSdDUUwnXSAtIFRoZSBzeW50YXggdG8gdXNlIHRvIGRlc2NyaWJlIHRoZSBmaWx0ZXIgc3RhdGUuIE5vdGUgdGhhdCBgZ2V0RmlsdGVyYCdzIGRlZmF1bHQgc3ludGF4LCBgJ0NRTCdgLCBkaWZmZXJzIGZyb20gdGhlIG90aGVyIGdldCBzdGF0ZSBtZXRob2RzLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9XG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZC5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKGNvbHVtbkluZGV4T3JOYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlaGF2aW9yLmdldEZpbHRlcihjb2x1bW5JbmRleE9yTmFtZSwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IFNldCBhIHBhcnRpY3VsYXIgY29sdW1uIGZpbHRlcidzIHN0YXRlLlxuICAgICAqIEBkZXNjIEFmdGVyIHNldHRpbmcgdGhlIG5ldyBmaWx0ZXIgc3RhdGU6XG4gICAgICogKiBSZWFwcGxpZXMgdGhlIGZpbHRlciB0byB0aGUgZGF0YSBzb3VyY2UuXG4gICAgICogKiBDYWxscyBgYmVoYXZpb3JDaGFuZ2VkKClgIHRvIHVwZGF0ZSB0aGUgZ3JpZCBjYW52YXMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBjb2x1bW5JbmRleE9yTmFtZSAtIFRoZSBfY29sdW1uIGZpbHRlcl8gdG8gc2V0LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gW3N0YXRlXSAtIEEgZmlsdGVyIHRyZWUgb2JqZWN0IG9yIGEgSlNPTiwgU1FMLCBvciBDUUwgc3ViZXhwcmVzc2lvbiBzdHJpbmcgdGhhdCBkZXNjcmliZXMgdGhlIGEgbmV3IHN0YXRlIGZvciB0aGUgbmFtZWQgY29sdW1uIGZpbHRlci4gVGhlIGV4aXN0aW5nIGNvbHVtbiBmaWx0ZXIgc3ViZXhwcmVzc2lvbiBpcyByZXBsYWNlZCB3aXRoIGEgbmV3IG5vZGUgYmFzZWQgb24gdGhpcyBzdGF0ZS4gSWYgaXQgZG9lcyBub3QgZXhpc3QsIHRoZSBuZXcgc3ViZXhwcmVzc2lvbiBpcyBhZGRlZCB0byB0aGUgY29sdW1uIGZpbHRlcnMgc3VidHJlZSAoYGZpbHRlci5jb2x1bW5GaWx0ZXJzYCkuXG4gICAgICpcbiAgICAgKiBJZiB1bmRlZmluZWQsIHJlbW92ZXMgdGhlIGVudGlyZSBjb2x1bW4gZmlsdGVyIHN1YmV4cHJlc3Npb24gZnJvbSB0aGUgY29sdW1uIGZpbHRlcnMgc3VidHJlZS5cbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVTZXRTdGF0ZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFBhc3NlZCB0byB0aGUgZmlsdGVyJ3MgW3NldFN0YXRlXXtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9GaWx0ZXJUcmVlLmh0bWwjc2V0U3RhdGV9IG1ldGhvZC4gWW91IG1heSBtaXggaW4gbWVtYmVycyBvZiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2dsb2JhbC5odG1sI0ZpbHRlclRyZWVWYWxpZGF0aW9uT3B0aW9uc09iamVjdHxGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R9XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN5bnRheD0nQ1FMJ10gLSBUaGUgc3ludGF4IHRvIHVzZSB0byBkZXNjcmliZSB0aGUgZmlsdGVyIHN0YXRlLiBOb3RlIHRoYXQgYHNldEZpbHRlcmAncyBkZWZhdWx0IHN5bnRheCwgYCdDUUwnYCwgZGlmZmVycyBmcm9tIHRoZSBvdGhlciBnZXQgc3RhdGUgbWV0aG9kcy5cbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfEVycm9yfHN0cmluZ30gYHVuZGVmaW5lZGAgaW5kaWNhdGVzIHN1Y2Nlc3MuXG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZC5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBzZXRGaWx0ZXI6IGZ1bmN0aW9uKGNvbHVtbkluZGV4T3JOYW1lLCBzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodGhpcy5jZWxsRWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxFZGl0b3IuaGlkZUVkaXRvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmVoYXZpb3Iuc2V0RmlsdGVyKGNvbHVtbkluZGV4T3JOYW1lLCBzdGF0ZSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYmVoYXZpb3JDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyB7QGxpbmsgRGVmYXVsdEZpbHRlciNnZXRTdGF0ZXxnZXRTdGF0ZX0gbWV0aG9kLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9XG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZC5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRGaWx0ZXJzOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJlaGF2aW9yLmdldEZpbHRlcnMob3B0aW9ucyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVN0YXRlT2JqZWN0fSBzdGF0ZVxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVNldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyBbc2V0U3RhdGVde0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL0ZpbHRlclRyZWUuaHRtbCNzZXRTdGF0ZX0gbWV0aG9kLiBZb3UgbWF5IG1peCBpbiBtZW1iZXJzIG9mIHRoZSB7QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvZ2xvYmFsLmh0bWwjRmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fEZpbHRlclRyZWVWYWxpZGF0aW9uT3B0aW9uc09iamVjdH1cbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfEVycm9yfHN0cmluZ30gYHVuZGVmaW5lZGAgaW5kaWNhdGVzIHN1Y2Nlc3MuXG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZC5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBzZXRGaWx0ZXJzOiBmdW5jdGlvbihzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodGhpcy5jZWxsRWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxFZGl0b3IuaGlkZUVkaXRvcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmVoYXZpb3Iuc2V0RmlsdGVycyhzdGF0ZSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYmVoYXZpb3JDaGFuZ2VkKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdIC0gUGFzc2VkIHRvIHRoZSBmaWx0ZXIncyB7QGxpbmsgRGVmYXVsdEZpbHRlciNnZXRTdGF0ZXxnZXRTdGF0ZX0gbWV0aG9kLlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9XG4gICAgICogQG1lbWJlck9mIEh5cGVyZ3JpZC5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBnZXRUYWJsZUZpbHRlcjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5iZWhhdmlvci5nZXRUYWJsZUZpbHRlcihvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU3RhdGVPYmplY3R9IHN0YXRlXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlU2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc10gLSBQYXNzZWQgdG8gdGhlIGZpbHRlcidzIFtzZXRTdGF0ZV17QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvRmlsdGVyVHJlZS5odG1sI3NldFN0YXRlfSBtZXRob2QuIFlvdSBtYXkgbWl4IGluIG1lbWJlcnMgb2YgdGhlIHtAbGluayBodHRwOi8vam9uZWl0LmdpdGh1Yi5pby9maWx0ZXItdHJlZS9nbG9iYWwuaHRtbCNGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3R8RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8RXJyb3J8c3RyaW5nfSBgdW5kZWZpbmVkYCBpbmRpY2F0ZXMgc3VjY2Vzcy5cbiAgICAgKiBAbWVtYmVyT2YgSHlwZXJncmlkLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHNldFRhYmxlRmlsdGVyOiBmdW5jdGlvbihzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmJlaGF2aW9yLnNldFRhYmxlRmlsdGVyKHN0YXRlLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5iZWhhdmlvckNoYW5nZWQoKTtcbiAgICB9LFxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuLyoqIEBuYW1lc3BhY2UgY3NzSW5qZWN0b3IgKi9cblxuLyoqXG4gKiBAc3VtbWFyeSBJbnNlcnQgYmFzZSBzdHlsZXNoZWV0IGludG8gRE9NXG4gKlxuICogQGRlc2MgQ3JlYXRlcyBhIG5ldyBgPHN0eWxlPi4uLjwvc3R5bGU+YCBlbGVtZW50IGZyb20gdGhlIG5hbWVkIHRleHQgc3RyaW5nKHMpIGFuZCBpbnNlcnRzIGl0IGJ1dCBvbmx5IGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QgaW4gdGhlIHNwZWNpZmllZCBjb250YWluZXIgYXMgcGVyIGByZWZlcmVuY2VFbGVtZW50YC5cbiAqXG4gKiA+IENhdmVhdDogSWYgc3R5bGVzaGVldCBpcyBmb3IgdXNlIGluIGEgc2hhZG93IERPTSwgeW91IG11c3Qgc3BlY2lmeSBhIGxvY2FsIGByZWZlcmVuY2VFbGVtZW50YC5cbiAqXG4gKiBAcmV0dXJucyBBIHJlZmVyZW5jZSB0byB0aGUgbmV3bHkgY3JlYXRlZCBgPHN0eWxlPi4uLjwvc3R5bGU+YCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBjc3NSdWxlc1xuICogQHBhcmFtIHtzdHJpbmd9IFtJRF1cbiAqIEBwYXJhbSB7dW5kZWZpbmVkfG51bGx8RWxlbWVudHxzdHJpbmd9IFtyZWZlcmVuY2VFbGVtZW50XSAtIENvbnRhaW5lciBmb3IgaW5zZXJ0aW9uLiBPdmVybG9hZHM6XG4gKiAqIGB1bmRlZmluZWRgIHR5cGUgKG9yIG9taXR0ZWQpOiBpbmplY3RzIHN0eWxlc2hlZXQgYXQgdG9wIG9mIGA8aGVhZD4uLi48L2hlYWQ+YCBlbGVtZW50XG4gKiAqIGBudWxsYCB2YWx1ZTogaW5qZWN0cyBzdHlsZXNoZWV0IGF0IGJvdHRvbSBvZiBgPGhlYWQ+Li4uPC9oZWFkPmAgZWxlbWVudFxuICogKiBgRWxlbWVudGAgdHlwZTogaW5qZWN0cyBzdHlsZXNoZWV0IGltbWVkaWF0ZWx5IGJlZm9yZSBnaXZlbiBlbGVtZW50LCB3aGVyZXZlciBpdCBpcyBmb3VuZC5cbiAqICogYHN0cmluZ2AgdHlwZTogaW5qZWN0cyBzdHlsZXNoZWV0IGltbWVkaWF0ZWx5IGJlZm9yZSBnaXZlbiBmaXJzdCBlbGVtZW50IGZvdW5kIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gY3NzIHNlbGVjdG9yLlxuICpcbiAqIEBtZW1iZXJPZiBjc3NJbmplY3RvclxuICovXG5mdW5jdGlvbiBjc3NJbmplY3Rvcihjc3NSdWxlcywgSUQsIHJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIHJlZmVyZW5jZUVsZW1lbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHJlZmVyZW5jZUVsZW1lbnQpO1xuICAgICAgICBpZiAoIXJlZmVyZW5jZUVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93ICdDYW5ub3QgZmluZCByZWZlcmVuY2UgZWxlbWVudCBmb3IgQ1NTIGluamVjdGlvbi4nO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChyZWZlcmVuY2VFbGVtZW50ICYmICEocmVmZXJlbmNlRWxlbWVudCBpbnN0YW5jZW9mIEVsZW1lbnQpKSB7XG4gICAgICAgIHRocm93ICdHaXZlbiB2YWx1ZSBub3QgYSByZWZlcmVuY2UgZWxlbWVudC4nO1xuICAgIH1cblxuICAgIHZhciBjb250YWluZXIgPSByZWZlcmVuY2VFbGVtZW50ICYmIHJlZmVyZW5jZUVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG5cbiAgICBpZiAoSUQpIHtcbiAgICAgICAgSUQgPSBjc3NJbmplY3Rvci5pZFByZWZpeCArIElEO1xuXG4gICAgICAgIGlmIChjb250YWluZXIucXVlcnlTZWxlY3RvcignIycgKyBJRCkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gc3R5bGVzaGVldCBhbHJlYWR5IGluIERPTVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICBpZiAoSUQpIHtcbiAgICAgICAgc3R5bGUuaWQgPSBJRDtcbiAgICB9XG4gICAgaWYgKGNzc1J1bGVzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgY3NzUnVsZXMgPSBjc3NSdWxlcy5qb2luKCdcXG4nKTtcbiAgICB9XG4gICAgY3NzUnVsZXMgPSAnXFxuJyArIGNzc1J1bGVzICsgJ1xcbic7XG4gICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzUnVsZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzUnVsZXMpKTtcbiAgICB9XG5cbiAgICBpZiAocmVmZXJlbmNlRWxlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlZmVyZW5jZUVsZW1lbnQgPSBjb250YWluZXIuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKHN0eWxlLCByZWZlcmVuY2VFbGVtZW50KTtcblxuICAgIHJldHVybiBzdHlsZTtcbn1cblxuLyoqXG4gKiBAc3VtbWFyeSBPcHRpb25hbCBwcmVmaXggZm9yIGA8c3R5bGU+YCB0YWcgSURzLlxuICogQGRlc2MgRGVmYXVsdHMgdG8gYCdpbmplY3RlZC1zdHlsZXNoZWV0LSdgLlxuICogQHR5cGUge3N0cmluZ31cbiAqIEBtZW1iZXJPZiBjc3NJbmplY3RvclxuICovXG5jc3NJbmplY3Rvci5pZFByZWZpeCA9ICdpbmplY3RlZC1zdHlsZXNoZWV0LSc7XG5cbi8vIEludGVyZmFjZVxubW9kdWxlLmV4cG9ydHMgPSBjc3NJbmplY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIG92ZXJyaWRlciA9IHJlcXVpcmUoJ292ZXJyaWRlcicpO1xuXG4vKiogQG5hbWVzcGFjZSBleHRlbmQtbWUgKiovXG5cbi8qKiBAc3VtbWFyeSBFeHRlbmRzIGFuIGV4aXN0aW5nIGNvbnN0cnVjdG9yIGludG8gYSBuZXcgY29uc3RydWN0b3IuXG4gKlxuICogQHJldHVybnMge0NoaWxkQ29uc3RydWN0b3J9IEEgbmV3IGNvbnN0cnVjdG9yLCBleHRlbmRlZCBmcm9tIHRoZSBnaXZlbiBjb250ZXh0LCBwb3NzaWJseSB3aXRoIHNvbWUgcHJvdG90eXBlIGFkZGl0aW9ucy5cbiAqXG4gKiBAZGVzYyBFeHRlbmRzIFwib2JqZWN0c1wiIChjb25zdHJ1Y3RvcnMpLCB3aXRoIG9wdGlvbmFsIGFkZGl0aW9uYWwgY29kZSwgb3B0aW9uYWwgcHJvdG90eXBlIGFkZGl0aW9ucywgYW5kIG9wdGlvbmFsIHByb3RvdHlwZSBtZW1iZXIgYWxpYXNlcy5cbiAqXG4gKiA+IENBVkVBVDogTm90IHRvIGJlIGNvbmZ1c2VkIHdpdGggVW5kZXJzY29yZS1zdHlsZSAuZXh0ZW5kKCkgd2hpY2ggaXMgc29tZXRoaW5nIGVsc2UgZW50aXJlbHkuIEkndmUgdXNlZCB0aGUgbmFtZSBcImV4dGVuZFwiIGhlcmUgYmVjYXVzZSBvdGhlciBwYWNrYWdlcyAobGlrZSBCYWNrYm9uZS5qcykgdXNlIGl0IHRoaXMgd2F5LiBZb3UgYXJlIGZyZWUgdG8gY2FsbCBpdCB3aGF0ZXZlciB5b3Ugd2FudCB3aGVuIHlvdSBcInJlcXVpcmVcIiBpdCwgc3VjaCBhcyBgdmFyIGluaGVyaXRzID0gcmVxdWlyZSgnZXh0ZW5kJylgLlxuICpcbiAqIFByb3ZpZGUgYSBjb25zdHJ1Y3RvciBhcyB0aGUgY29udGV4dCBhbmQgYW55IHByb3RvdHlwZSBhZGRpdGlvbnMgeW91IHJlcXVpcmUgaW4gdGhlIGZpcnN0IGFyZ3VtZW50LlxuICpcbiAqIEZvciBleGFtcGxlLCBpZiB5b3Ugd2lzaCB0byBiZSBhYmxlIHRvIGV4dGVuZCBgQmFzZUNvbnN0cnVjdG9yYCB0byBhIG5ldyBjb25zdHJ1Y3RvciB3aXRoIHByb3RvdHlwZSBvdmVycmlkZXMgYW5kL29yIGFkZGl0aW9ucywgYmFzaWMgdXNhZ2UgaXM6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIEJhc2UgPSByZXF1aXJlKCdleHRlbmQtbWUnKS5CYXNlO1xuICogdmFyIEJhc2VDb25zdHJ1Y3RvciA9IEJhc2UuZXh0ZW5kKGJhc2VQcm90b3R5cGUpOyAvLyBtaXhlcyBpbiAuZXh0ZW5kXG4gKiB2YXIgQ2hpbGRDb25zdHJ1Y3RvciA9IEJhc2VDb25zdHJ1Y3Rvci5leHRlbmQoY2hpbGRQcm90b3R5cGVPdmVycmlkZXNBbmRBZGRpdGlvbnMpO1xuICogdmFyIEdyYW5kY2hpbGRDb25zdHJ1Y3RvciA9IENoaWxkQ29uc3RydWN0b3IuZXh0ZW5kKGdyYW5kY2hpbGRQcm90b3R5cGVPdmVycmlkZXNBbmRBZGRpdGlvbnMpO1xuICogYGBgXG4gKlxuICogVGhpcyBmdW5jdGlvbiAoYGV4dGVuZCgpYCkgaXMgYWRkZWQgdG8gdGhlIG5ldyBleHRlbmRlZCBvYmplY3QgY29uc3RydWN0b3IgYXMgYSBwcm9wZXJ0eSBgLmV4dGVuZGAsIGVzc2VudGlhbGx5IG1ha2luZyB0aGUgb2JqZWN0IGNvbnN0cnVjdG9yIGl0c2VsZiBlYXNpbHkgXCJleHRlbmRhYmxlLlwiIChOb3RlOiBUaGlzIGlzIGEgcHJvcGVydHkgb2YgZWFjaCBjb25zdHJ1Y3RvciBhbmQgbm90IGEgbWV0aG9kIG9mIGl0cyBwcm90b3R5cGUhKVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZXh0ZW5kZWRDbGFzc05hbWVdIC0gVGhpcyBpcyBzaW1wbHkgYWRkZWQgdG8gdGhlIHByb3RvdHlwZSBhcyAkJENMQVNTX05BTUUuIFVzZWZ1bCBmb3IgZGVidWdnaW5nIGJlY2F1c2UgYWxsIGRlcml2ZWQgY29uc3RydWN0b3JzIGFwcGVhciB0byBoYXZlIHRoZSBzYW1lIG5hbWUgKFwiQ29uc3RydWN0b3JcIikgaW4gdGhlIGRlYnVnZ2VyLlxuICpcbiAqIEBwYXJhbSB7ZXh0ZW5kZWRQcm90b3R5cGVBZGRpdGlvbnNPYmplY3R9IFtwcm90b3R5cGVBZGRpdGlvbnNdIC0gT2JqZWN0IHdpdGggbWVtYmVycyB0byBjb3B5IHRvIG5ldyBjb25zdHJ1Y3RvcidzIHByb3RvdHlwZS5cbiAqXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtkZWJ1Z10gLSBTZWUgcGFyYW1ldGVyIGBleHRlbmRlZENsYXNzTmFtZWAgXyhhYm92ZSlfLlxuICpcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBCYXNlIC0gQSBjb252ZW5pZW50IGJhc2UgY2xhc3MgZnJvbSB3aGljaCBhbGwgb3RoZXIgY2xhc3NlcyBjYW4gYmUgZXh0ZW5kZWQuXG4gKlxuICogQG1lbWJlck9mIGV4dGVuZC1tZVxuICovXG5mdW5jdGlvbiBleHRlbmQoZXh0ZW5kZWRDbGFzc05hbWUsIHByb3RvdHlwZUFkZGl0aW9ucykge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBwcm90b3R5cGVBZGRpdGlvbnMgPSB7fTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiBleHRlbmRlZENsYXNzTmFtZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZUFkZGl0aW9ucyA9IGV4dGVuZGVkQ2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgICAgICBleHRlbmRlZENsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgICAgICAgICAgcHJvdG90eXBlQWRkaXRpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdTaW5nbGUtcGFyYW1ldGVyIG92ZXJsb2FkIG11c3QgYmUgZWl0aGVyIHN0cmluZyBvciBvYmplY3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4dGVuZGVkQ2xhc3NOYW1lICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgcHJvdG90eXBlQWRkaXRpb25zICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRocm93ICdUd28tcGFyYW1ldGVyIG92ZXJsb2FkIG11c3QgYmUgc3RyaW5nLCBvYmplY3QuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgJ1RvbyBtYW55IHBhcmFtZXRlcnMnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIENvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZiAodGhpcy5wcmVJbml0aWFsaXplKSB7XG4gICAgICAgICAgICB0aGlzLnByZUluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGluaXRpYWxpemVQcm90b3R5cGVDaGFpbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIGlmICh0aGlzLnBvc3RJbml0aWFsaXplKSB7XG4gICAgICAgICAgICB0aGlzLnBvc3RJbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBDb25zdHJ1Y3Rvci5leHRlbmQgPSBleHRlbmQ7XG5cbiAgICB2YXIgcHJvdG90eXBlID0gQ29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSh0aGlzLnByb3RvdHlwZSk7XG4gICAgcHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29uc3RydWN0b3I7XG5cbiAgICBpZiAoZXh0ZW5kZWRDbGFzc05hbWUpIHtcbiAgICAgICAgcHJvdG90eXBlLiQkQ0xBU1NfTkFNRSA9IGV4dGVuZGVkQ2xhc3NOYW1lO1xuICAgIH1cblxuICAgIG92ZXJyaWRlcihwcm90b3R5cGUsIHByb3RvdHlwZUFkZGl0aW9ucyk7XG5cbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG59XG5cbmZ1bmN0aW9uIEJhc2UoKSB7fVxuQmFzZS5wcm90b3R5cGUgPSB7XG5cbiAgICBjb25zdHJ1Y3RvcjogQmFzZS5wcm90b3R5cGUuY29uc3RydWN0b3IsXG5cbiAgICAvKipcbiAgICAgKiBBY2Nlc3MgYSBtZW1iZXIgb2YgdGhlIHN1cGVyIGNsYXNzLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9XG4gICAgICovXG4gICAgZ2V0IHN1cGVyKCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEZpbmQgbWVtYmVyIG9uIHByb3RvdHlwZSBjaGFpbiBiZWdpbm5pbmcgd2l0aCBzdXBlciBjbGFzcy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWVtYmVyTmFtZVxuICAgICAqIEByZXR1cm5zIHt1bmRlZmluZWR8Kn0gYHVuZGVmaW5lZGAgaWYgbm90IGZvdW5kOyB2YWx1ZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgc3VwZXJNZW1iZXI6IGZ1bmN0aW9uKG1lbWJlck5hbWUpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMuc3VwZXI7XG4gICAgICAgIGRvIHsgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHBhcmVudCk7IH0gd2hpbGUgKCFwYXJlbnQuaGFzT3duUHJvcGVydHkobWVtYmVyTmFtZSkpO1xuICAgICAgICByZXR1cm4gcGFyZW50ICYmIHBhcmVudFttZW1iZXJOYW1lXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRmluZCBtZXRob2Qgb24gcHJvdG90eXBlIGNoYWluIGJlZ2lubmluZyB3aXRoIHN1cGVyIGNsYXNzLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2ROYW1lXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9ufVxuICAgICAqL1xuICAgIHN1cGVyTWV0aG9kOiBmdW5jdGlvbihtZXRob2ROYW1lKSB7XG4gICAgICAgIHZhciBtZXRob2QgPSB0aGlzLnN1cGVyTWVtYmVyKG1ldGhvZE5hbWUpO1xuICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigndGhpcy4nICsgbWV0aG9kTmFtZSArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWV0aG9kO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGaW5kIG1ldGhvZCBvbiBwcm90b3R5cGUgY2hhaW4gYmVnaW5uaW5nIHdpdGggc3VwZXIgY2xhc3MgYW5kIGNhbGwgaXQgd2l0aCByZW1haW5pbmcgYXJncy5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kTmFtZVxuICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAqL1xuICAgIGNhbGxTdXBlck1ldGhvZDogZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdXBlck1ldGhvZChtZXRob2ROYW1lKS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB9XG59O1xuQmFzZS5leHRlbmQgPSBleHRlbmQ7XG5leHRlbmQuQmFzZSA9IEJhc2U7XG5cbi8qKiBAdHlwZWRlZiB7ZnVuY3Rpb259IGV4dGVuZGVkQ29uc3RydWN0b3JcbiAqIEBwcm9wZXJ0eSBwcm90b3R5cGUuc3VwZXIgLSBBIHJlZmVyZW5jZSB0byB0aGUgcHJvdG90eXBlIHRoaXMgY29uc3RydWN0b3Igd2FzIGV4dGVuZGVkIGZyb20uXG4gKiBAcHJvcGVydHkgW2V4dGVuZF0gLSBJZiBgcHJvdG90eXBlQWRkaXRpb25zLmV4dGVuZGFibGVgIHdhcyB0cnV0aHksIHRoaXMgd2lsbCBiZSBhIHJlZmVyZW5jZSB0byB7QGxpbmsgZXh0ZW5kLmV4dGVuZHxleHRlbmR9LlxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBleHRlbmRlZFByb3RvdHlwZUFkZGl0aW9uc09iamVjdFxuICogQGRlc2MgQWxsIG1lbWJlcnMgYXJlIGNvcGllZCB0byB0aGUgbmV3IG9iamVjdC4gVGhlIGZvbGxvd2luZyBoYXZlIHNwZWNpYWwgbWVhbmluZy5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IFtpbml0aWFsaXplXSAtIEFkZGl0aW9uYWwgY29uc3RydWN0b3IgY29kZSBmb3IgbmV3IG9iamVjdC4gVGhpcyBtZXRob2QgaXMgYWRkZWQgdG8gdGhlIG5ldyBjb25zdHJ1Y3RvcidzIHByb3RvdHlwZS4gR2V0cyBwYXNzZWQgbmV3IG9iamVjdCBhcyBjb250ZXh0ICsgc2FtZSBhcmdzIGFzIGNvbnN0cnVjdG9yIGl0c2VsZi4gQ2FsbGVkIG9uIGluc3RhbnRpYXRpb24gYWZ0ZXIgc2ltaWxhciBmdW5jdGlvbiBpbiBhbGwgYW5jZXN0b3JzIGNhbGxlZCB3aXRoIHNhbWUgc2lnbmF0dXJlLlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW3ByZUluaXRpYWxpemVdIC0gQ2FsbGVkIGJlZm9yZSB0aGUgYGluaXRpYWxpemVgIGNhc2NhZGUuIEdldHMgcGFzc2VkIG5ldyBvYmplY3QgYXMgY29udGV4dCArIHNhbWUgYXJncyBhcyBjb25zdHJ1Y3RvciBpdHNlbGYuIElmIG5vdCBkZWZpbmVkIGhlcmUsIHRoZSB0b3AtbW9zdCAoYW5kIG9ubHkgdGhlIHRvcC1tb3N0KSBkZWZpbml0aW9uIGZvdW5kIG9uIHRoZSBwcm90b3R5cGUgY2hhaW4gaXMgY2FsbGVkLlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gW3Bvc3RJbml0aWFsaXplXSAtIENhbGxlZCBhZnRlciB0aGUgYGluaXRpYWxpemVgIGNhc2NhZGUuIEdldHMgcGFzc2VkIG5ldyBvYmplY3QgYXMgY29udGV4dCArIHNhbWUgYXJncyBhcyBjb25zdHJ1Y3RvciBpdHNlbGYuIElmIG5vdCBkZWZpbmVkIGhlcmUsIHRoZSB0b3AtbW9zdCAoYW5kIG9ubHkgdGhlIHRvcC1tb3N0KSBkZWZpbml0aW9uIGZvdW5kIG9uIHRoZSBwcm90b3R5cGUgY2hhaW4gaXMgY2FsbGVkLlxuICovXG5cbi8qKiBAc3VtbWFyeSBDYWxsIGFsbCBgaW5pdGlhbGl6ZWAgbWV0aG9kcyBmb3VuZCBpbiBwcm90b3R5cGUgY2hhaW4sIGJlZ2lubmluZyB3aXRoIHRoZSBtb3N0IHNlbmlvciBhbmNlc3RvcidzIGZpcnN0LlxuICogQGRlc2MgVGhpcyByZWN1cnNpdmUgcm91dGluZSBpcyBjYWxsZWQgYnkgdGhlIGNvbnN0cnVjdG9yLlxuICogMS4gV2Fsa3MgYmFjayB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGBPYmplY3RgJ3MgcHJvdG90eXBlXG4gKiAyLiBXYWxrcyBmb3J3YXJkIHRvIG5ldyBvYmplY3QsIGNhbGxpbmcgYW55IGBpbml0aWFsaXplYCBtZXRob2RzIGl0IGZpbmRzIGFsb25nIHRoZSB3YXkgd2l0aCB0aGUgc2FtZSBjb250ZXh0IGFuZCBhcmd1bWVudHMgd2l0aCB3aGljaCB0aGUgY29uc3RydWN0b3Igd2FzIGNhbGxlZC5cbiAqIEBwcml2YXRlXG4gKiBAbWVtYmVyT2YgZXh0ZW5kLW1lXG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVQcm90b3R5cGVDaGFpbigpIHtcbiAgICB2YXIgdGVybSA9IHRoaXMsXG4gICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgcmVjdXIodGVybSk7XG5cbiAgICBmdW5jdGlvbiByZWN1cihvYmopIHtcbiAgICAgICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG4gICAgICAgIGlmIChwcm90by5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICAgICAgICByZWN1cihwcm90byk7XG4gICAgICAgICAgICBpZiAocHJvdG8uaGFzT3duUHJvcGVydHkoJ2luaXRpYWxpemUnKSkge1xuICAgICAgICAgICAgICAgIHByb3RvLmluaXRpYWxpemUuYXBwbHkodGVybSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnRzWydjb2x1bW4tQ1FMLXN5bnRheCddID0gW1xuJzxsaT4nLFxuJ1x0PGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJjb3B5XCI+PC9idXR0b24+JyxcbidcdDxkaXYgY2xhc3M9XCJmaWx0ZXItdHJlZS1yZW1vdmUtYnV0dG9uXCIgdGl0bGU9XCJkZWxldGUgY29uZGl0aW9uYWxcIj48L2Rpdj4nLFxuJ1x0ezF9OicsXG4nXHQ8aW5wdXQgbmFtZT1cInsyfVwiIGNsYXNzPVwiezR9XCIgdmFsdWU9XCJ7MzplbmNvZGV9XCI+Jyxcbic8L2xpPidcbl0uam9pbignXFxuJyk7XG5cbmV4cG9ydHNbJ2NvbHVtbi1TUUwtc3ludGF4J10gPSBbXG4nPGxpPicsXG4nXHQ8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNvcHlcIj48L2J1dHRvbj4nLFxuJ1x0PGRpdiBjbGFzcz1cImZpbHRlci10cmVlLXJlbW92ZS1idXR0b25cIiB0aXRsZT1cImRlbGV0ZSBjb25kaXRpb25hbFwiPjwvZGl2PicsXG4nXHR7MX06JyxcbidcdDx0ZXh0YXJlYSBuYW1lPVwiezJ9XCIgcm93cz1cIjFcIiBjbGFzcz1cIns0fVwiPnszOmVuY29kZX08L3RleHRhcmVhPicsXG4nPC9saT4nXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnRzLmNvbHVtbkZpbHRlciA9IFtcbic8c3BhbiBjbGFzcz1cImZpbHRlci10cmVlXCI+JyxcbidcdCA8c3Ryb25nPjxzcGFuPnsyfSA8L3NwYW4+Y29sdW1uIGZpbHRlciBzdWJleHByZXNzaW9uOjwvc3Ryb25nPjxicj4nLFxuJ1x0IE1hdGNoJyxcbidcdCA8bGFiZWw+PGlucHV0IHR5cGU9XCJyYWRpb1wiIGNsYXNzPVwiZmlsdGVyLXRyZWUtb3AtY2hvaWNlXCIgbmFtZT1cInRyZWVPcHsxfVwiIHZhbHVlPVwib3Atb3JcIj5hbnk8L2xhYmVsPicsXG4nXHQgPGxhYmVsPjxpbnB1dCB0eXBlPVwicmFkaW9cIiBjbGFzcz1cImZpbHRlci10cmVlLW9wLWNob2ljZVwiIG5hbWU9XCJ0cmVlT3B7MX1cIiB2YWx1ZT1cIm9wLWFuZFwiPmFsbDwvbGFiZWw+JyxcbidcdCA8bGFiZWw+PGlucHV0IHR5cGU9XCJyYWRpb1wiIGNsYXNzPVwiZmlsdGVyLXRyZWUtb3AtY2hvaWNlXCIgbmFtZT1cInRyZWVPcHsxfVwiIHZhbHVlPVwib3Atbm9yXCI+bm9uZTwvbGFiZWw+JyxcbidcdCBvZiB0aGUgZm9sbG93aW5nOicsXG4nXHQgPHNlbGVjdD4nLFxuJ1x0XHQgPG9wdGlvbiB2YWx1ZT1cIlwiPk5ldyBleHByZXNzaW9uJmhlbGxpcDs8L29wdGlvbj4nLFxuJ1x0IDwvc2VsZWN0PicsXG4nXHQgPG9sPjwvb2w+JyxcbicgPC9zcGFuPidcbl0uam9pbignXFxuJyk7XG5cbmV4cG9ydHMuY29sdW1uRmlsdGVycyA9IFtcbic8c3BhbiBjbGFzcz1cImZpbHRlci10cmVlIGZpbHRlci10cmVlLXR5cGUtY29sdW1uLWZpbHRlcnNcIj4nLFxuJ1x0IE1hdGNoIDxzdHJvbmc+YWxsPC9zdHJvbmc+IG9mIHRoZSBmb2xsb3dpbmcgY29sdW1uIGZpbHRlcnM6JyxcbidcdCA8b2w+PC9vbD4nLFxuJyA8L3NwYW4+J1xuXS5qb2luKCdcXG4nKTtcblxuZXhwb3J0cy5sb2NrZWRDb2x1bW4gPSBbXG4nPHNwYW4+JyxcbidcdCB7MTplbmNvZGV9JyxcbidcdCA8aW5wdXQgdHlwZT1cImhpZGRlblwiIHZhbHVlPVwiezJ9XCI+JyxcbicgPC9zcGFuPidcbl0uam9pbignXFxuJyk7XG5cbmV4cG9ydHMubm90ZSA9IFtcbic8ZGl2IGNsYXNzPVwiZm9vdG5vdGVzXCI+JyxcbidcdDxkaXYgY2xhc3M9XCJmb290bm90ZVwiPjwvZGl2PicsXG4nXHQ8cD5TZWxlY3QgYSBuZXcgdmFsdWUgb3IgZGVsZXRlIHRoZSBleHByZXNzaW9uIGFsdG9nZXRoZXIuPC9wPicsXG4nPC9kaXY+J1xuXS5qb2luKCdcXG4nKTtcblxuZXhwb3J0cy5ub3RlcyA9IFtcbic8ZGl2IGNsYXNzPVwiZm9vdG5vdGVzXCI+JyxcbidcdDxwPk5vdGUgdGhlIGZvbGxvd2luZyBlcnJvciBjb25kaXRpb25zOjwvcD4nLFxuJ1x0PHVsIGNsYXNzPVwiZm9vdG5vdGVcIj48L3VsPicsXG4nXHQ8cD5TZWxlY3QgbmV3IHZhbHVlcyBvciBkZWxldGUgdGhlIGV4cHJlc3Npb24gYWx0b2dldGhlci48L3A+Jyxcbic8L2Rpdj4nXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnRzLm9wdGlvbk1pc3NpbmcgPSBbXG4nVGhlIHJlcXVlc3RlZCB2YWx1ZSBvZiA8c3BhbiBjbGFzcz1cImZpZWxkLW5hbWVcIj57MTplbmNvZGV9PC9zcGFuPicsXG4nKDxzcGFuIGNsYXNzPVwiZmllbGQtdmFsdWVcIj57MjplbmNvZGV9PC9zcGFuPikgaXMgbm90IHZhbGlkLidcbl0uam9pbignXFxuJyk7XG5cbmV4cG9ydHMucmVtb3ZlQnV0dG9uID0gW1xuJzxkaXYgY2xhc3M9XCJmaWx0ZXItdHJlZS1yZW1vdmUtYnV0dG9uXCIgdGl0bGU9XCJkZWxldGUgY29uZGl0aW9uYWxcIj48L2Rpdj4nXG5dLmpvaW4oJ1xcbicpO1xuXG5leHBvcnRzLnN1YnRyZWUgPSBbXG4nPHNwYW4gY2xhc3M9XCJmaWx0ZXItdHJlZVwiPicsXG4nXHQgTWF0Y2gnLFxuJ1x0IDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgY2xhc3M9XCJmaWx0ZXItdHJlZS1vcC1jaG9pY2VcIiBuYW1lPVwidHJlZU9wezF9XCIgdmFsdWU9XCJvcC1vclwiPmFueTwvbGFiZWw+JyxcbidcdCA8bGFiZWw+PGlucHV0IHR5cGU9XCJyYWRpb1wiIGNsYXNzPVwiZmlsdGVyLXRyZWUtb3AtY2hvaWNlXCIgbmFtZT1cInRyZWVPcHsxfVwiIHZhbHVlPVwib3AtYW5kXCI+YWxsPC9sYWJlbD4nLFxuJ1x0IDxsYWJlbD48aW5wdXQgdHlwZT1cInJhZGlvXCIgY2xhc3M9XCJmaWx0ZXItdHJlZS1vcC1jaG9pY2VcIiBuYW1lPVwidHJlZU9wezF9XCIgdmFsdWU9XCJvcC1ub3JcIj5ub25lPC9sYWJlbD4nLFxuJ1x0IG9mIHRoZSBmb2xsb3dpbmc6JyxcbidcdCA8c2VsZWN0PicsXG4nXHRcdCA8b3B0aW9uIHZhbHVlPVwiXCI+TmV3IGV4cHJlc3Npb24maGVsbGlwOzwvb3B0aW9uPicsXG4nXHRcdCA8b3B0aW9uIHZhbHVlPVwic3ViZXhwXCIgc3R5bGU9XCJib3JkZXItYm90dG9tOjFweCBzb2xpZCBibGFja1wiPlN1YmV4cHJlc3Npb248L29wdGlvbj4nLFxuJ1x0IDwvc2VsZWN0PicsXG4nXHQgPG9sPjwvb2w+JyxcbicgPC9zcGFuPidcbl0uam9pbignXFxuJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnb2JqZWN0LWl0ZXJhdG9ycycpO1xudmFyIHBvcE1lbnUgPSByZXF1aXJlKCdwb3AtbWVudScpO1xuXG52YXIgRmlsdGVyVHJlZSA9IHJlcXVpcmUoJy4vanMvRmlsdGVyVHJlZScpO1xuRmlsdGVyVHJlZS5Ob2RlID0gcmVxdWlyZSgnLi9qcy9GaWx0ZXJOb2RlJyk7IC8vIGFrYTogT2JqZWN0LmdldFByb3RvdHlwZU9mKEZpbHRlclRyZWUucHJvdG90eXBlKS5jb25zdHJ1Y3RvclxuRmlsdGVyVHJlZS5MZWFmID0gcmVxdWlyZSgnLi9qcy9GaWx0ZXJMZWFmJyk7IC8vIGFrYTogRmlsdGVyVHJlZS5wcm90b3R5cGUuZWRpdG9ycy5EZWZhdWx0XG5cbi8vIGV4cG9zZSBzb21lIG9iamVjdHMgZm9yIHBsdWctaW4gYWNjZXNzXG5cbkZpbHRlclRyZWUuQ29uZGl0aW9uYWxzID0gcmVxdWlyZSgnLi9qcy9Db25kaXRpb25hbHMnKTtcblxuLy8gRk9MTE9XSU5HIFBST1BFUlRJRVMgQVJFICoqKiBURU1QT1JBUlkgKioqLFxuLy8gRk9SIFRIRSBERU1PIFRPIEFDQ0VTUyBUSEVTRSBOT0RFIE1PRFVMRVMuXG5cbkZpbHRlclRyZWUuXyA9IF87XG5GaWx0ZXJUcmVlLnBvcE1lbnUgPSBwb3BNZW51O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyVHJlZTtcbiIsIi8qKiBAbW9kdWxlIGNvbmRpdGlvbmFscyAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBCYXNlID0gcmVxdWlyZSgnZXh0ZW5kLW1lJykuQmFzZTtcbnZhciBfID0gcmVxdWlyZSgnb2JqZWN0LWl0ZXJhdG9ycycpO1xudmFyIHJlZ0V4cExJS0UgPSByZXF1aXJlKCdyZWdleHAtbGlrZScpO1xuXG52YXIgSU4gPSAnSU4nLFxuICAgIE5PVF9JTiA9ICdOT1QgJyArIElOLFxuICAgIExJS0UgPSAnTElLRScsXG4gICAgTk9UX0xJS0UgPSAnTk9UICcgKyBMSUtFLFxuICAgIExJS0VfV0lMRF9DQVJEID0gJyUnLFxuICAgIE5JTCA9ICcnO1xuXG52YXIgdG9TdHJpbmc7XG5cbnZhciBkZWZhdWx0SWRRdHMgPSB7XG4gICAgYmVnOiAnXCInLFxuICAgIGVuZDogJ1wiJ1xufTtcblxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICovXG52YXIgQ29uZGl0aW9uYWxzID0gQmFzZS5leHRlbmQoe1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3FsSWRRdHNPYmplY3R9IFtvcHRpb25zLnNxbElkUXRzPXtiZWc6J1wiJyxlbmQ6J1wiJ31dXG4gICAgICogQG1lbWJlck9mIENvbmRpdGlvbmFscyNcbiAgICAgKi9cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBpZFF0cyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5zcWxJZFF0cztcbiAgICAgICAgaWYgKGlkUXRzKSB7XG4gICAgICAgICAgICB0aGlzLnNxbElkUXRzID0gaWRRdHM7IC8vIG9ubHkgb3ZlcnJpZGUgaWYgZGVmaW5lZFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNxbElkUXRzOiBkZWZhdWx0SWRRdHMsXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGlkXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgIG1ha2VTcWxJZGVudGlmaWVyOiBmdW5jdGlvbihpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zcWxJZFF0cy5iZWcgKyBpZCArIHRoaXMuc3FsSWRRdHMuZW5kO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gc3RyaW5nXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgIG1ha2VTcWxTdHJpbmc6IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgICByZXR1cm4gJ1xcJycgKyBzcUVzYyhzdHJpbmcpICsgJ1xcJyc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgbWFrZUxJS0U6IGZ1bmN0aW9uKGJlZywgZW5kLCBvcCwgb3JpZ2luYWxPcCwgYykge1xuICAgICAgICB2YXIgZXNjYXBlZCA9IGMub3BlcmFuZC5yZXBsYWNlKC8oW19cXFtcXF0lXSkvZywgJ1skMV0nKTsgLy8gZXNjYXBlIGFsbCBMSUtFIHJlc2VydmVkIGNoYXJzXG4gICAgICAgIHJldHVybiB0aGlzLm1ha2VTcWxJZGVudGlmaWVyKGMuY29sdW1uKSArXG4gICAgICAgICAgICAnICcgKyBvcCArXG4gICAgICAgICAgICAnICcgKyB0aGlzLm1ha2VTcWxTdHJpbmcoYmVnICsgZXNjYXBlZCArIGVuZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgbWFrZUlOOiBmdW5jdGlvbihvcCwgYykge1xuICAgICAgICByZXR1cm4gdGhpcy5tYWtlU3FsSWRlbnRpZmllcihjLmNvbHVtbikgK1xuICAgICAgICAgICAgJyAnICsgb3AgK1xuICAgICAgICAgICAgJyAnICsgJyhcXCcnICsgc3FFc2MoYy5vcGVyYW5kKS5yZXBsYWNlKC9cXHMqLFxccyovZywgJ1xcJywgXFwnJykgKyAnXFwnKSc7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgbWFrZTogZnVuY3Rpb24ob3AsIGMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFrZVNxbElkZW50aWZpZXIoYy5jb2x1bW4pICtcbiAgICAgICAgICAgICcgJyArIG9wICtcbiAgICAgICAgICAgICcgJyArIGMubWFrZVNxbE9wZXJhbmQoKTtcbiAgICB9XG59KTtcblxudmFyIG9wcyA9IENvbmRpdGlvbmFscy5wcm90b3R5cGUub3BzID0ge1xuICAgIHVuZGVmaW5lZDoge1xuICAgICAgICB0ZXN0OiBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH0sXG4gICAgICAgIG1ha2U6IGZ1bmN0aW9uKCkgeyByZXR1cm4gJyc7IH1cbiAgICB9LFxuXG4gICAgLyoqIEB0eXBlIHtyZWxhdGlvbmFsT3BlcmF0b3J9XG4gICAgICogQG1lbWJlck9mIENvbmRpdGlvbmFscyNcbiAgICAgKi9cbiAgICAnPCc6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSA8IGI7IH0sXG4gICAgICAgIG1ha2U6IGZ1bmN0aW9uKGMpIHsgcmV0dXJuIHRoaXMubWFrZSgnPCcsIGMpOyB9XG4gICAgfSxcbiAgICAvKiogQHR5cGUge3JlbGF0aW9uYWxPcGVyYXRvcn1cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgICc8PSc6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSA8PSBiOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2UoJzw9JywgYyk7IH1cbiAgICB9LFxuXG4gICAgLyoqIEB0eXBlIHtyZWxhdGlvbmFsT3BlcmF0b3J9XG4gICAgICogQG1lbWJlck9mIENvbmRpdGlvbmFscyNcbiAgICAgKi9cbiAgICAnPSc6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSA9PT0gYjsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlKCc9JywgYyk7IH1cbiAgICB9LFxuXG4gICAgLyoqIEB0eXBlIHtyZWxhdGlvbmFsT3BlcmF0b3J9XG4gICAgICogQG1lbWJlck9mIENvbmRpdGlvbmFscyNcbiAgICAgKi9cbiAgICAnPj0nOiB7XG4gICAgICAgIHRlc3Q6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgPj0gYjsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlKCc+PScsIGMpOyB9XG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgJz4nOiB7XG4gICAgICAgIHRlc3Q6IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgPiBiOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2UoJz4nLCBjKTsgfVxuICAgIH0sXG5cbiAgICAvKiogQHR5cGUge3JlbGF0aW9uYWxPcGVyYXRvcn1cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgICc8Pic6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAhPT0gYjsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlKCc8PicsIGMpOyB9XG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgTElLRToge1xuICAgICAgICB0ZXN0OiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiByZWdFeHBMSUtFLmNhY2hlZChiLCB0cnVlKS50ZXN0KGEpOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2UoTElLRSwgYyk7IH0sXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgJ05PVCBMSUtFJzoge1xuICAgICAgICB0ZXN0OiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiAhcmVnRXhwTElLRS5jYWNoZWQoYiwgdHJ1ZSkudGVzdChhKTsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlKE5PVF9MSUtFLCBjKTsgfSxcbiAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICB9LFxuXG4gICAgLyoqIEB0eXBlIHtyZWxhdGlvbmFsT3BlcmF0b3J9XG4gICAgICogQG1lbWJlck9mIENvbmRpdGlvbmFscyNcbiAgICAgKi9cbiAgICBJTjogeyAvLyBUT0RPOiBjdXJyZW50bHkgZm9yY2luZyBzdHJpbmcgdHlwaW5nOyByZXdvcmsgY2FsbGluZyBjb2RlIHRvIHJlc3BlY3QgY29sdW1uIHR5cGVcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gaW5PcChhLCBiKSA+PSAwOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2VJTihJTiwgYyk7IH0sXG4gICAgICAgIG9wZXJhbmRMaXN0OiB0cnVlLFxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH0sXG5cbiAgICAvKiogQHR5cGUge3JlbGF0aW9uYWxPcGVyYXRvcn1cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgICdOT1QgSU4nOiB7IC8vIFRPRE86IGN1cnJlbnRseSBmb3JjaW5nIHN0cmluZyB0eXBpbmc7IHJld29yayBjYWxsaW5nIGNvZGUgdG8gcmVzcGVjdCBjb2x1bW4gdHlwZVxuICAgICAgICB0ZXN0OiBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBpbk9wKGEsIGIpIDwgMDsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlSU4oTk9UX0lOLCBjKTsgfSxcbiAgICAgICAgb3BlcmFuZExpc3Q6IHRydWUsXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgQ09OVEFJTlM6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gY29udGFpbnNPcChhLCBiKSA+PSAwOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2VMSUtFKExJS0VfV0lMRF9DQVJELCBMSUtFX1dJTERfQ0FSRCwgTElLRSwgJ0NPTlRBSU5TJywgYyk7IH0sXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgJ05PVCBDT05UQUlOUyc6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gY29udGFpbnNPcChhLCBiKSA8IDA7IH0sXG4gICAgICAgIG1ha2U6IGZ1bmN0aW9uKGMpIHsgcmV0dXJuIHRoaXMubWFrZUxJS0UoTElLRV9XSUxEX0NBUkQsIExJS0VfV0lMRF9DQVJELCBOT1RfTElLRSwgJ05PVCBDT05UQUlOUycsIGMpOyB9LFxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH0sXG5cbiAgICAvKiogQHR5cGUge3JlbGF0aW9uYWxPcGVyYXRvcn1cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgIEJFR0lOUzoge1xuICAgICAgICB0ZXN0OiBmdW5jdGlvbihhLCBiKSB7IGIgPSB0b1N0cmluZyhiKTsgcmV0dXJuIGJlZ2luc09wKGEsIGIubGVuZ3RoKSA9PT0gYjsgfSxcbiAgICAgICAgbWFrZTogZnVuY3Rpb24oYykgeyByZXR1cm4gdGhpcy5tYWtlTElLRShOSUwsIExJS0VfV0lMRF9DQVJELCBMSUtFLCAnQkVHSU5TJywgYyk7IH0sXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgJ05PVCBCRUdJTlMnOiB7XG4gICAgICAgIHRlc3Q6IGZ1bmN0aW9uKGEsIGIpIHsgYiA9IHRvU3RyaW5nKGIpOyByZXR1cm4gYmVnaW5zT3AoYSwgYi5sZW5ndGgpICE9PSBiOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2VMSUtFKE5JTCwgTElLRV9XSUxEX0NBUkQsIE5PVF9MSUtFLCAnTk9UIEJFR0lOUycsIGMpOyB9LFxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH0sXG5cbiAgICAvKiogQHR5cGUge3JlbGF0aW9uYWxPcGVyYXRvcn1cbiAgICAgKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzI1xuICAgICAqL1xuICAgIEVORFM6IHtcbiAgICAgICAgdGVzdDogZnVuY3Rpb24oYSwgYikgeyBiID0gdG9TdHJpbmcoYik7IHJldHVybiBlbmRzT3AoYSwgYi5sZW5ndGgpID09PSBiOyB9LFxuICAgICAgICBtYWtlOiBmdW5jdGlvbihjKSB7IHJldHVybiB0aGlzLm1ha2VMSUtFKExJS0VfV0lMRF9DQVJELCBOSUwsIExJS0UsICdFTkRTJywgYyk7IH0sXG4gICAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgfSxcblxuICAgIC8qKiBAdHlwZSB7cmVsYXRpb25hbE9wZXJhdG9yfVxuICAgICAqIEBtZW1iZXJPZiBDb25kaXRpb25hbHMjXG4gICAgICovXG4gICAgJ05PVCBFTkRTJzoge1xuICAgICAgICB0ZXN0OiBmdW5jdGlvbihhLCBiKSB7IGIgPSB0b1N0cmluZyhiKTsgcmV0dXJuIGVuZHNPcChhLCBiLmxlbmd0aCkgIT09IGI7IH0sXG4gICAgICAgIG1ha2U6IGZ1bmN0aW9uKGMpIHsgcmV0dXJuIHRoaXMubWFrZUxJS0UoTElLRV9XSUxEX0NBUkQsIE5JTCwgTk9UX0xJS0UsICdOT1QgRU5EUycsIGMpOyB9LFxuICAgICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH1cbn07XG5cbi8vIHNvbWUgc3lub255bXNcbm9wc1snXFx1MjI2NCddID0gb3BzWyc8PSddOyAgLy8gVU5JQ09ERSAnTEVTUy1USEFOIE9SIEVRVUFMIFRPJ1xub3BzWydcXHUyMjY1J10gPSBvcHNbJz49J107ICAvLyBVTklDT0RFICdHUkVBVEVSLVRIQU4gT1IgRVFVQUwgVE8nXG5vcHNbJ1xcdTIyNjAnXSA9IG9wc1snPD4nXTsgIC8vIFVOSUNPREUgJ05PVCBFUVVBTCBUTydcblxuZnVuY3Rpb24gaW5PcChhLCBiKSB7XG4gICAgcmV0dXJuIGJcbiAgICAgICAgLnRyaW0oKSAvLyByZW1vdmUgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2UgY2hhcnNcbiAgICAgICAgLnJlcGxhY2UoL1xccyosXFxzKi9nLCAnLCcpIC8vIHJlbW92ZSBhbnkgd2hpdGUtc3BhY2UgY2hhcnMgZnJvbSBhcm91bmQgY29tbWFzXG4gICAgICAgIC5zcGxpdCgnLCcpIC8vIHB1dCBpbiBhbiBhcnJheVxuICAgICAgICAuaW5kZXhPZigoYSArICcnKSk7IC8vIHNlYXJjaCBhcnJheSB3aG9sZSBtYXRjaGVzXG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zT3AoYSwgYikge1xuICAgIHJldHVybiB0b1N0cmluZyhhKS5pbmRleE9mKHRvU3RyaW5nKGIpKTtcbn1cblxuZnVuY3Rpb24gYmVnaW5zT3AoYSwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nKGEpLnN1YnN0cigwLCBsZW5ndGgpO1xufVxuXG5mdW5jdGlvbiBlbmRzT3AoYSwgbGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nKGEpLnN1YnN0cigtbGVuZ3RoLCBsZW5ndGgpO1xufVxuXG5mdW5jdGlvbiBzcUVzYyhzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLycvZywgJ1xcJ1xcJycpO1xufVxuXG52YXIgZ3JvdXBzID0ge1xuICAgIGVxdWFsaXR5OiB7XG4gICAgICAgIGxhYmVsOiAnRXF1YWxpdHknLFxuICAgICAgICBzdWJtZW51OiBbJz0nXVxuICAgIH0sXG4gICAgaW5lcXVhbGl0aWVzOiB7XG4gICAgICAgIGxhYmVsOiAnSW5lcXVhbGl0aWVzJyxcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgICAgJzwnLFxuICAgICAgICAgICAgJ1xcdTIyNjQnLCAvLyBVTklDT0RFICdMRVNTLVRIQU4gT1IgRVFVQUwgVE8nOyBvbiBhIE1hYywgdHlwZSBvcHRpb24tY29tbWEgKOKJpClcbiAgICAgICAgICAgICdcXHUyMjYwJywgLy8gVU5JQ09ERSAnTk9UIEVRVUFMUyc7IG9uIGEgTWFjLCB0eXBlIG9wdGlvbi1lcXVhbHMgKOKJoClcbiAgICAgICAgICAgICdcXHUyMjY1JywgLy8gVU5JQ09ERSAnR1JFQVRFUi1USEFOIE9SIEVRVUFMIFRPJzsgb24gYSBNYWMsIHR5cGUgb3B0aW9uLXBlcmlvZCAo4omlKVxuICAgICAgICAgICAgJz4nXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHNldHM6IHtcbiAgICAgICAgbGFiZWw6ICdTZXQgc2NhbnMnLFxuICAgICAgICBzdWJtZW51OiBbJ0lOJywgJ05PVCBJTiddXG4gICAgfSxcbiAgICBzdHJpbmdzOiB7XG4gICAgICAgIGxhYmVsOiAnU3RyaW5nIHNjYW5zJyxcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgICAgJ0NPTlRBSU5TJywgJ05PVCBDT05UQUlOUycsXG4gICAgICAgICAgICAnQkVHSU5TJywgJ05PVCBCRUdJTlMnLFxuICAgICAgICAgICAgJ0VORFMnLCAnTk9UIEVORFMnXG4gICAgICAgIF1cbiAgICB9LFxuICAgIHBhdHRlcm5zOiB7XG4gICAgICAgIGxhYmVsOiAnUGF0dGVybiBzY2FucycsXG4gICAgICAgIHN1Ym1lbnU6IFsnTElLRScsICdOT1QgTElLRSddXG4gICAgfVxufTtcblxuLy8gYWRkIGEgYG5hbWVgIHByb3AgdG8gZWFjaCBncm91cFxuXyhncm91cHMpLmVhY2goZnVuY3Rpb24oZ3JvdXAsIGtleSkgeyBncm91cC5uYW1lID0ga2V5OyB9KTtcblxuLyoqXG4gKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzXG4gKi9cbkNvbmRpdGlvbmFscy5ncm91cHMgPSBncm91cHM7XG5cbi8qKiBEZWZhdWx0IG9wZXJhdG9yIG1lbnUgd2hlbiBjb25zaXN0aW5nIG9mIGFsbCBvZiB0aGUgZ3JvdXBzIGluIHtAbGluayBtb2R1bGU6Y29uZGl0aW9uYWxzLmdyb3Vwc3xncm91cHN9LiBUaGlzIG1lbnUgaXMgdXNlZCB3aGVuIG5vbmUgb2YgdGhlIGZvbGxvd2luZyBpcyBvdGhlcndpc2UgZGVmaW5lZDpcbiAqICogVGhlIGBvcE1lbnVgIHByb3BlcnR5IG9mIHRoZSBjb2x1bW4gc2NoZW1hLlxuICogKiBUaGUgZW50cnkgaW4gdGhlIG5vZGUncyBgdHlwZU9wTWFwYCBoYXNoIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGB0eXBlYCBwcm9wZXJ0eSBvZiB0aGUgY29sdW1uIHNjaGVtYS5cbiAqICogVGhlIG5vZGUncyBgdHJlZU9wTWVudWAgb2JqZWN0LlxuICogQHR5cGUge21lbnVJdGVtW119XG4gKiBAbWVtYmVyT2YgQ29uZGl0aW9uYWxzXG4gKi9cbkNvbmRpdGlvbmFscy5kZWZhdWx0T3BNZW51ID0gWyAvLyBoaWVyYXJjaGljYWwgbWVudSBvZiByZWxhdGlvbmFsIG9wZXJhdG9yc1xuICAgIGdyb3Vwcy5lcXVhbGl0eSxcbiAgICBncm91cHMuaW5lcXVhbGl0aWVzLFxuICAgIGdyb3Vwcy5zZXRzLFxuICAgIGdyb3Vwcy5zdHJpbmdzLFxuICAgIGdyb3Vwcy5wYXR0ZXJuc1xuXTtcblxuXG4vLyBNZWFudCB0byBiZSBjYWxsZWQgYnkgRmlsdGVyVHJlZS5wcm90b3R5cGUuc2V0U2Vuc2l0aXZpdHkgb25seVxuQ29uZGl0aW9uYWxzLnNldFRvU3RyaW5nID0gZnVuY3Rpb24oZm4pIHtcbiAgICByZXR1cm4gKHRvU3RyaW5nID0gZm4pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb25kaXRpb25hbHM7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbi8qIGVzbGludC1kaXNhYmxlIGtleS1zcGFjaW5nICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBvcE1lbnUgPSByZXF1aXJlKCdwb3AtbWVudScpO1xuXG52YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4vRmlsdGVyTm9kZScpO1xudmFyIENvbmRpdGlvbmFscyA9IHJlcXVpcmUoJy4vQ29uZGl0aW9uYWxzJyk7XG5cblxudmFyIHRvU3RyaW5nOyAvLyBzZXQgYnkgRmlsdGVyTGVhZi5zZXRUb1N0cmluZygpIGNhbGxlZCBmcm9tIC4uL2luZGV4LmpzXG5cblxuLyoqIEB0eXBlZGVmIHtvYmplY3R9IGNvbnZlcnRlclxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gdG9UeXBlIC0gUmV0dXJucyBpbnB1dCB2YWx1ZSBjb252ZXJ0ZWQgdG8gdHlwZS4gRmFpbHMgc2lsZW50bHkuXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBmYWlsZWQgLSBUZXN0cyBpbnB1dCB2YWx1ZSBhZ2FpbnN0IHR5cGUsIHJldHVybmluZyBgZmFsc2UgaWYgdHlwZSBvciBgdHJ1ZWAgaWYgbm90IHR5cGUuXG4gKi9cblxuLyoqIEB0eXBlIHtjb252ZXJ0ZXJ9ICovXG52YXIgbnVtYmVyQ29udmVydGVyID0ge1xuICAgIHRvVHlwZTogTnVtYmVyLFxuICAgIGZhaWxlZDogaXNOYU5cbn07XG5cbi8qKiBAdHlwZSB7Y29udmVydGVyfSAqL1xudmFyIGRhdGVDb252ZXJ0ZXIgPSB7XG4gICAgdG9UeXBlOiBmdW5jdGlvbihzKSB7IHJldHVybiBuZXcgRGF0ZShzKTsgfSxcbiAgICBmYWlsZWQ6IGlzTmFOXG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IGZpbHRlckxlYWZWaWV3T2JqZWN0XG4gKlxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gY29sdW1uIC0gQSBkcm9wLWRvd24gd2l0aCBvcHRpb25zIGZyb20gdGhlIGBGaWx0ZXJMZWFmYCBpbnN0YW5jZSdzIHNjaGVtYS4gVmFsdWUgaXMgdGhlIG5hbWUgb2YgdGhlIGNvbHVtbiBiZWluZyB0ZXN0ZWQgKGkuZS4sIHRoZSBjb2x1bW4gdG8gd2hpY2ggdGhpcyBjb25kaXRpb25hbCBleHByZXNzaW9uIGFwcGxpZXMpLlxuICpcbiAqIEBwcm9wZXJ0eSBvcGVyYXRvciAtIEEgZHJvcC1kb3duIHdpdGggb3B0aW9ucyBmcm9tIHtAbGluayBjb2x1bW5PcE1lbnV9LCB7QGxpbmsgdHlwZU9wTWFwfSwgb3Ige0BsaW5rIHRyZWVPcE1lbnV9LiBWYWx1ZSBpcyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBvcGVyYXRvci5cbiAqXG4gKiBAcHJvcGVydHkgb3BlcmFuZCAtIEFuIGlucHV0IGVsZW1lbnQsIHN1Y2ggYXMgYSBkcm9wLWRvd24gb3IgYSB0ZXh0IGJveC5cbiAqL1xuXG4vKiogQGNvbnN0cnVjdG9yXG4gKiBAc3VtbWFyeSBBbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgY29uZGl0aW9uYWwgZXhwcmVzc2lvbiBub2RlIGluIGEgZmlsdGVyIHRyZWUuXG4gKiBAZGVzYyBUaGlzIG9iamVjdCByZXByZXNlbnRzIGEgY29uZGl0aW9uYWwgZXhwcmVzc2lvbi4gSXQgaXMgYWx3YXlzIGEgdGVybWluYWwgbm9kZSBpbiB0aGUgZmlsdGVyIHRyZWU7IGl0IGhhcyBubyBjaGlsZCBub2RlcyBvZiBpdHMgb3duLlxuICpcbiAqIEEgY29uZGl0aW9uYWwgZXhwcmVzc2lvbiBpcyBhIHNpbXBsZSBkeWFkaWMgZXhwcmVzc2lvbiB3aXRoIHRoZSBmb2xsb3dpbmcgc3ludGF4IGluIHRoZSBVSTpcbiAqXG4gKiA+IF9jb2x1bW4gb3BlcmF0b3Igb3BlcmFuZF9cbiAqXG4gKiB3aGVyZTpcbiAqICogX2NvbHVtbl8gaXMgdGhlIG5hbWUgb2YgYSBjb2x1bW4gZnJvbSB0aGUgZGF0YSByb3cgb2JqZWN0XG4gKiAqIF9vcGVyYXRvcl8gaXMgdGhlIG5hbWUgb2YgYW4gb3BlcmF0b3IgZnJvbSB0aGUgbm9kZSdzIG9wZXJhdG9yIGxpc3RcbiAqICogX29wZXJhbmRfIGlzIGEgbGl0ZXJhbCB2YWx1ZSB0byBjb21wYXJlIGFnYWluc3QgdGhlIHZhbHVlIGluIHRoZSBuYW1lZCBjb2x1bW5cbiAqXG4gKiAqKk5PVEU6KiogVGhlIHtAbGluayBDb2x1bW5MZWFmfSBleHRlbnNpb24gb2YgdGhpcyBvYmplY3QgaGFzIGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uIG9mIF9vcGVyYW5kXyB3aGljaCBpczogVGhlIG5hbWUgb2YgYSBjb2x1bW4gZnJvbSB3aGljaCB0byBmZXRjaCB0aGUgY29tcGFyZSB2YWx1ZSAoZnJvbSB0aGUgc2FtZSBkYXRhIHJvdyBvYmplY3QpIHRvIGNvbXBhcmUgYWdhaW5zdCB0aGUgdmFsdWUgaW4gdGhlIG5hbWVkIGNvbHVtbi4gU2VlICpFeHRlbmRpbmcgdGhlIGNvbmRpdGlvbmFsIGV4cHJlc3Npb24gb2JqZWN0KiBpbiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2luZGV4Lmh0bWx8cmVhZG1lfS5cbiAqXG4gKiBUaGUgdmFsdWVzIG9mIHRoZSB0ZXJtcyBvZiB0aGUgZXhwcmVzc2lvbiBhYm92ZSBhcmUgc3RvcmVkIGluIHRoZSBmaXJzdCB0aHJlZSBwcm9wZXJ0aWVzIGJlbG93LiBFYWNoIG9mIHRoZXNlIHRocmVlIHByb3BlcnRpZXMgaXMgc2V0IGVpdGhlciBieSBgc2V0U3RhdGUoKWAgb3IgYnkgdGhlIHVzZXIgdmlhIGEgY29udHJvbCBpbiBgZWxgLiBOb3RlIHRoYXQgdGhlc2UgcHJvcGVydGllcyBhcmUgbm90IGR5bmFtaWNhbGx5IGJvdW5kIHRvIHRoZSBVSSBjb250cm9sczsgdGhleSBhcmUgdXBkYXRlZCBieSB0aGUgdmFsaWRhdGlvbiBmdW5jdGlvbiwgYGludmFsaWQoKWAuXG4gKlxuICogKipTZWUgYWxzbyB0aGUgcHJvcGVydGllcyBvZiB0aGUgc3VwZXJjbGFzczoqKiB7QGxpbmsgRmlsdGVyTm9kZX1cbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29sdW1uIC0gTmFtZSBvZiB0aGUgbWVtYmVyIGluIHRoZSBkYXRhIHJvdyBvYmplY3RzIGFnYWluc3Qgd2hpY2ggYG9wZXJhbmRgIHdpbGwgYmUgY29tcGFyZWQuIFJlZmxlY3RzIHRoZSB2YWx1ZSBvZiB0aGUgYHZpZXcuY29sdW1uYCBjb250cm9sIGFmdGVyIHZhbGlkYXRpb24uXG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IG9wZXJhdG9yIC0gT3BlcmF0b3Igc3ltYm9sLiBUaGlzIG11c3QgbWF0Y2ggYSBrZXkgaW4gdGhlIGB0aGlzLnJvb3QuY29uZGl0aW9uYWxzLm9wc2AgaGFzaC4gUmVmbGVjdHMgdGhlIHZhbHVlIG9mIHRoZSBgdmlldy5vcGVyYXRvcmAgY29udHJvbCBhZnRlciB2YWxpZGF0aW9uLlxuICpcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBvcGVyYW5kIC0gVmFsdWUgdG8gY29tcGFyZSBhZ2FpbnN0IHRoZSB0aGUgbWVtYmVyIG9mIGRhdGEgcm93IG5hbWVkIGJ5IGBjb2x1bW5gLiBSZWZsZWN0cyB0aGUgdmFsdWUgb2YgdGhlIGB2aWV3Lm9wZXJhbmRgIGNvbnRyb2wsIGFmdGVyIHZhbGlkYXRpb24uXG4gKlxuICogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgLSBVc2VkIHRvIGRlc2NyaWJlIHRoZSBvYmplY3QgaW4gdGhlIFVJIHNvIHVzZXIgY2FuIHNlbGVjdCBhbiBleHByZXNzaW9uIGVkaXRvci5cbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3R5cGU9J3N0cmluZyddIC0gVGhlIGRhdGEgdHlwZSBvZiB0aGUgc3ViZXhwcmVzc2lvbiBpZiBuZWl0aGVyIHRoZSBvcGVyYXRvciBub3IgdGhlIGNvbHVtbiBzY2hlbWEgZGVmaW5lcyBhIHR5cGUuXG4gKlxuICogQHByb3BlcnR5IHtIVE1MRWxlbWVudH0gZWwgLSBBIGA8c3Bhbj4uLi48L3NwYW4+YCBlbGVtZW50IHRoYXQgY29udGFpbnMgdGhlIFVJIGNvbnRyb2xzLiBUaGlzIGVsZW1lbnQgaXMgYXV0b21hdGljYWxseSBhcHBlbmVkZWQgdG8gdGhlIHBhcmVudCBgRmlsdGVyVHJlZWAncyBgZWxgLiBHZW5lcmF0ZWQgYnkge0BsaW5rIEZpbHRlckxlYWYjY3JlYXRlVmlld3xjcmVhdGVWaWV3fS5cbiAqXG4gKiBAcHJvcGVydHkge2ZpbHRlckxlYWZWaWV3T2JqZWN0fSB2aWV3IC0gQSBoYXNoIGNvbnRhaW5pbmcgZGlyZWN0IHJlZmVyZW5jZXMgdG8gdGhlIGNvbnRyb2xzIGluIGBlbGAuIEFkZGVkIGJ5IHtAbGluayBGaWx0ZXJMZWFmI2NyZWF0ZVZpZXd8Y3JlYXRlVmlld30uXG4gKi9cbnZhciBGaWx0ZXJMZWFmID0gRmlsdGVyTm9kZS5leHRlbmQoJ0ZpbHRlckxlYWYnLCB7XG5cbiAgICBuYW1lOiAnY29sdW1uID0gdmFsdWUnLCAvLyBkaXNwbGF5IHN0cmluZyBmb3IgZHJvcC1kb3duXG5cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMudmlldykge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmlldykge1xuICAgICAgICAgICAgICAgIHRoaXMudmlld1trZXldLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMub25DaGFuZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKiBAc3VtbWFyeSBDcmVhdGUgYSBuZXcgdmlldy5cbiAgICAgKiBAZGVzYyBUaGlzIG5ldyBcInZpZXdcIiBpcyBhIGdyb3VwIG9mIEhUTUwgYEVsZW1lbnRgIGNvbnRyb2xzIHRoYXQgY29tcGxldGVseSBkZXNjcmliZSB0aGUgY29uZGl0aW9uYWwgZXhwcmVzc2lvbiB0aGlzIG9iamVjdCByZXByZXNlbnRzLiBUaGlzIG1ldGhvZCBjcmVhdGVzIHRoZSB2aWV3LCBzZXR0aW5nIGB0aGlzLmVsYCB0byBwb2ludCB0byBpdCwgYW5kIHRoZSBtZW1iZXJzIG9mIGB0aGlzLnZpZXdgIHRvIHBvaW50IHRvIHRoZSBpbmRpdmlkdWFsIGNvbnRyb2xzIHRoZXJlaW4uXG4gICAgICogQG1lbWJlck9mIEZpbHRlckxlYWYjXG4gICAgICovXG4gICAgY3JlYXRlVmlldzogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICBlbC5jbGFzc05hbWUgPSAnZmlsdGVyLXRyZWUtZWRpdG9yIGZpbHRlci10cmVlLWRlZmF1bHQnO1xuXG4gICAgICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS5jb2x1bW4pIHtcbiAgICAgICAgICAgIC8vIFN0YXRlIGluY2x1ZGVzIGNvbHVtbjpcbiAgICAgICAgICAgIC8vIE9wZXJhdG9yIG1lbnUgaXMgYnVpbHQgbGF0ZXIgaW4gbG9hZFN0YXRlOyB3ZSBkb24ndCBuZWVkIHRvIGJ1aWxkIGl0IG5vdy4gVGhlIGNhbGwgdG9cbiAgICAgICAgICAgIC8vIGdldE9wTWVudSBiZWxvdyB3aXRoIHVuZGVmaW5lZCBjb2x1bW5OYW1lIHJldHVybnMgW10gcmVzdWx0aW5nIGluIGFuIGVtcHR5IGRyb3AtZG93bi5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdoZW4gc3RhdGUgZG9lcyBOT1QgaW5jbHVkZSBjb2x1bW4sIGl0J3MgYmVjYXVzZSBlaXRoZXI6XG4gICAgICAgICAgICAvLyBhLiBjb2x1bW4gaXMgdW5rbm93biBhbmQgb3AgbWVudSB3aWxsIGJlIGVtcHR5IHVudGlsIHVzZXIgY2hvb3NlcyBhIGNvbHVtbjsgb3JcbiAgICAgICAgICAgIC8vIGIuIGNvbHVtbiBpcyBoYXJkLWNvZGVkIHdoZW4gdGhlcmUncyBvbmx5IG9uZSBwb3NzaWJsZSBjb2x1bW4gYXMgaW5mZXJhYmxlIGZyb20gc2NoZW1hOlxuICAgICAgICAgICAgdmFyIHNjaGVtYSA9IHRoaXMuc2NoZW1hICYmIHRoaXMuc2NoZW1hLmxlbmd0aCA9PT0gMSAmJiB0aGlzLnNjaGVtYVswXSxcbiAgICAgICAgICAgICAgICBjb2x1bW5OYW1lID0gc2NoZW1hICYmIHNjaGVtYS5uYW1lIHx8IHNjaGVtYTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmlldyA9IHtcbiAgICAgICAgICAgIGNvbHVtbjogdGhpcy5tYWtlRWxlbWVudCh0aGlzLnNjaGVtYSwgJ2NvbHVtbicsIHRoaXMuc29ydENvbHVtbk1lbnUpLFxuICAgICAgICAgICAgb3BlcmF0b3I6IHRoaXMubWFrZUVsZW1lbnQoZ2V0T3BNZW51LmNhbGwodGhpcywgY29sdW1uTmFtZSksICdvcGVyYXRvcicpLFxuICAgICAgICAgICAgb3BlcmFuZDogdGhpcy5tYWtlRWxlbWVudCgpXG4gICAgICAgIH07XG5cbiAgICAgICAgZWwuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnInKSk7XG4gICAgfSxcblxuICAgIGxvYWRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgdmFyIHZhbHVlLCBlbCwgaSwgYiwgc2VsZWN0ZWQsIG9wcywgdGhpc09wLCBvcE1lbnUsIG5vdGVzO1xuICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgIG5vdGVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3RhdGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUZpbHRlck5vZGUub3B0aW9uc1NjaGVtYVtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpc1trZXldID0gc3RhdGVba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZWwgPSB0aGlzLnZpZXdba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChlbC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFtuYW1lPVxcJycgKyBlbC5uYW1lICsgJ1xcJ10nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxbaV0uY2hlY2tlZCA9IHZhbHVlLmluZGV4T2YoZWxbaV0udmFsdWUpID49IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbCA9IGVsLm9wdGlvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMCwgYiA9IGZhbHNlOyBpIDwgZWwubGVuZ3RoOyBpKyssIGIgPSBiIHx8IHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkID0gdmFsdWUuaW5kZXhPZihlbFtpXS52YWx1ZSkgPj0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxbaV0uc2VsZWN0ZWQgPSBzZWxlY3RlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRmlsdGVyTm9kZS5zZXRXYXJuaW5nQ2xhc3MoZWwsIGIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC52YWx1ZSA9PT0gJycgJiYga2V5ID09PSAnb3BlcmF0b3InKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhdG9yIG1heSBiZSBhIHN5bm9ueW0uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wcyA9IHRoaXMucm9vdC5jb25kaXRpb25hbHMub3BzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzT3AgPSBvcHNbdmFsdWVdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcE1lbnUgPSBnZXRPcE1lbnUuY2FsbCh0aGlzLCBzdGF0ZS5jb2x1bW4gfHwgdGhpcy5jb2x1bW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBlYWNoIG1lbnUgaXRlbSdzIG9wIG9iamVjdCBmb3IgZXF1aXZhbGVuY3kgdG8gcG9zc2libGUgc3lub255bSdzIG9wIG9iamVjdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wTWVudS53YWxrLmNhbGwob3BNZW51LCBlcXVpdik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghRmlsdGVyTm9kZS5zZXRXYXJuaW5nQ2xhc3MoZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGVzLnB1c2goeyBrZXk6IGtleSwgdmFsdWU6IHZhbHVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnY29sdW1uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWtlT3BNZW51LmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXVsdGlwbGUgPSBub3Rlcy5sZW5ndGggPiAxLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgZm9vdG5vdGVzID0gdGVtcGxhdGVzLmdldChtdWx0aXBsZSA/ICdub3RlcycgOiAnbm90ZScpLFxuICAgICAgICAgICAgICAgICAgICBpbm5lciA9IGZvb3Rub3Rlcy5xdWVyeVNlbGVjdG9yKCcuZm9vdG5vdGUnKTtcbiAgICAgICAgICAgICAgICBub3Rlcy5mb3JFYWNoKGZ1bmN0aW9uKG5vdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvb3Rub3RlID0gbXVsdGlwbGUgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpIDogaW5uZXI7XG4gICAgICAgICAgICAgICAgICAgIG5vdGUgPSB0ZW1wbGF0ZXMuZ2V0KCdvcHRpb25NaXNzaW5nJywgbm90ZS5rZXksIG5vdGUudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAobm90ZS5sZW5ndGgpIHsgZm9vdG5vdGUuYXBwZW5kQ2hpbGQobm90ZVswXSk7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlKSB7IGlubmVyLmFwcGVuZENoaWxkKGZvb3Rub3RlKTsgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ub3Rlc0VsID0gZm9vdG5vdGVzO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGVxdWl2KG9wTWVudUl0ZW0pIHtcbiAgICAgICAgICAgIHZhciBvcE5hbWUgPSBvcE1lbnVJdGVtLm5hbWUgfHwgb3BNZW51SXRlbTtcbiAgICAgICAgICAgIGlmIChvcHNbb3BOYW1lXSA9PT0gdGhpc09wKSB7XG4gICAgICAgICAgICAgICAgZWwudmFsdWUgPSBvcE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHByb3BlcnR5IHtjb252ZXJ0ZXJ9IG51bWJlclxuICAgICAqIEBwcm9wZXJ0eSB7Y29udmVydGVyfSBpbnQgLSBzeW5vbnltIG9mIGBudW1iZXJgXG4gICAgICogQHByb3BlcnR5IHtjb252ZXJ0ZXJ9IGZsb2F0IC0gc3lub255bSBvZiBgbnVtYmVyYFxuICAgICAqIEBwcm9wZXJ0eSB7Y29udmVydGVyfSBkYXRlXG4gICAgICogQHByb3BlcnR5IHtjb252ZXJ0ZXJ9IHN0cmluZ1xuICAgICAqL1xuICAgIGNvbnZlcnRlcnM6IHtcbiAgICAgICAgbnVtYmVyOiBudW1iZXJDb252ZXJ0ZXIsXG4gICAgICAgIGludDogbnVtYmVyQ29udmVydGVyLFxuICAgICAgICBmbG9hdDogbnVtYmVyQ29udmVydGVyLFxuICAgICAgICBkYXRlOiBkYXRlQ29udmVydGVyXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENhbGxlZCBieSB0aGUgcGFyZW50IG5vZGUncyB7QGxpbmsgRmlsdGVyVHJlZSNpbnZhbGlkfGludmFsaWQoKX0gbWV0aG9kLCB3aGljaCBjYXRjaGVzIHRoZSBlcnJvciB0aHJvd24gd2hlbiBpbnZhbGlkLlxuICAgICAqXG4gICAgICogQWxzbyBwZXJmb3JtcyB0aGUgZm9sbG93aW5nIGNvbXBpbGF0aW9uIGFjdGlvbnM6XG4gICAgICogKiBDb3BpZXMgYWxsIGB0aGlzLnZpZXdgJyB2YWx1ZXMgZnJvbSB0aGUgRE9NIHRvIHNpbWlsYXJseSBuYW1lZCBwcm9wZXJ0aWVzIG9mIGB0aGlzYC5cbiAgICAgKiAqIFByZS1zZXRzIGB0aGlzLm9wYCBhbmQgYHRoaXMuY29udmVydGVyYCBmb3IgdXNlIGluIGB0ZXN0YCdzIHRyZWUgd2Fsay5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudGhyb3c9ZmFsc2VdIC0gVGhyb3cgYW4gZXJyb3IgaWYgbWlzc2luZyBvciBpbnZhbGlkIHZhbHVlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuZm9jdXM9ZmFsc2VdIC0gTW92ZSBmb2N1cyB0byBvZmZlbmRpbmcgY29udHJvbC5cbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfSBUaGlzIGlzIHRoZSBub3JtYWwgcmV0dXJuIHdoZW4gdmFsaWQ7IG90aGVyd2lzZSB0aHJvd3MgZXJyb3Igd2hlbiBpbnZhbGlkLlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJMZWFmI1xuICAgICAqL1xuICAgIGludmFsaWQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGVsZW1lbnROYW1lLCB0eXBlLCBmb2N1c2VkO1xuXG4gICAgICAgIGZvciAoZWxlbWVudE5hbWUgaW4gdGhpcy52aWV3KSB7XG4gICAgICAgICAgICB2YXIgZWwgPSB0aGlzLnZpZXdbZWxlbWVudE5hbWVdLFxuICAgICAgICAgICAgICAgIHZhbHVlID0gY29udHJvbFZhbHVlKGVsKS50cmltKCk7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PT0gJycgJiYgZWxlbWVudE5hbWUgPT09ICdvcGVyYXRvcicgJiYgLy8gbm90IGluIG9wZXJhdG9yIG1lbnVcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3QuY29uZGl0aW9uYWxzLm9wc1t0aGlzLm9wZXJhdG9yXSAmJiAvLyBidXQgdmFsaWQgaW4gb3BlcmF0b3IgaGFzaFxuICAgICAgICAgICAgICAgICFnZXRQcm9wZXJ0eS5jYWxsKHRoaXMsIHRoaXMuY29sdW1uLCAnb3BNdXN0QmVJbk1lbnUnKSAvLyBhbmQgaXMgZG9lc24ndCBoYXZlIHRvIGJlIGluIG1lbnUgdG8gYmUgdmFsaWRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5vcGVyYXRvcjsgLy8gdXNlIGl0IGFzIGlzIHRoZW5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAnJykge1xuICAgICAgICAgICAgICAgIGlmICghZm9jdXNlZCAmJiBvcHRpb25zICYmIG9wdGlvbnMuZm9jdXMpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xpY2tJbihlbCk7XG4gICAgICAgICAgICAgICAgICAgIGZvY3VzZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnRocm93KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyB0aGlzLkVycm9yKCdNaXNzaW5nIG9yIGludmFsaWQgJyArIGVsZW1lbnROYW1lICsgJyBpbiBjb25kaXRpb25hbCBleHByZXNzaW9uLiBDb21wbGV0ZSB0aGUgZXhwcmVzc2lvbiBvciByZW1vdmUgaXQuJywgdGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDb3B5IGVhY2ggY29udHJvbHMncyB2YWx1ZSBhcyBhIG5ldyBzaW1pbGFybHkgbmFtZWQgcHJvcGVydHkgb2YgdGhpcyBvYmplY3QuXG4gICAgICAgICAgICAgICAgdGhpc1tlbGVtZW50TmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3AgPSB0aGlzLnJvb3QuY29uZGl0aW9uYWxzLm9wc1t0aGlzLm9wZXJhdG9yXTtcblxuICAgICAgICB0eXBlID0gdGhpcy5nZXRUeXBlKCk7XG5cbiAgICAgICAgdGhpcy5jb252ZXJ0ZXIgPSB0eXBlICYmIHR5cGUgIT09ICdzdHJpbmcnICYmIHRoaXMuY29udmVydGVyc1t0eXBlXTtcblxuICAgICAgICB0aGlzLmNhbGN1bGF0b3IgPSB0aGlzLmdldENhbGN1bGF0b3IoKTtcbiAgICB9LFxuXG4gICAgZ2V0VHlwZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9wLnR5cGUgfHwgZ2V0UHJvcGVydHkuY2FsbCh0aGlzLCB0aGlzLmNvbHVtbiwgJ3R5cGUnKTtcbiAgICB9LFxuXG4gICAgZ2V0Q2FsY3VsYXRvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBnZXRQcm9wZXJ0eS5jYWxsKHRoaXMsIHRoaXMuY29sdW1uLCAnY2FsY3VsYXRvcicpO1xuICAgIH0sXG5cbiAgICB2YWxPckZ1bmM6IGZ1bmN0aW9uKGRhdGFSb3csIGNvbHVtbk5hbWUsIGNhbGN1bGF0b3IpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgaWYgKGRhdGFSb3cpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGRhdGFSb3dbY29sdW1uTmFtZV07XG4gICAgICAgICAgICBjYWxjdWxhdG9yID0gKHR5cGVvZiByZXN1bHQpWzBdID09PSAnZicgPyByZXN1bHQgOiBjYWxjdWxhdG9yO1xuICAgICAgICAgICAgaWYgKGNhbGN1bGF0b3IpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBjYWxjdWxhdG9yKGRhdGFSb3csIGNvbHVtbk5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQgfHwgcmVzdWx0ID09PSAwIHx8IHJlc3VsdCA9PT0gZmFsc2UgPyByZXN1bHQgOiAnJztcbiAgICB9LFxuXG4gICAgcDogZnVuY3Rpb24oZGF0YVJvdykge1xuICAgICAgICByZXR1cm4gdGhpcy52YWxPckZ1bmMoZGF0YVJvdywgdGhpcy5jb2x1bW4sIHRoaXMuY2FsY3VsYXRvcik7XG4gICAgfSxcblxuICAgIC8vIFRvIGJlIG92ZXJyaWRkZW4gd2hlbiBvcGVyYW5kIGlzIGEgY29sdW1uIG5hbWUgKHNlZSBjb2x1bW5zLmpzKS5cbiAgICBxOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3BlcmFuZDtcbiAgICB9LFxuXG4gICAgdGVzdDogZnVuY3Rpb24oZGF0YVJvdykge1xuICAgICAgICB2YXIgcCwgcSwgLy8gdW50eXBlZCB2ZXJzaW9ucyBvZiBhcmdzXG4gICAgICAgICAgICBQLCBRLCAvLyB0eXBlZCB2ZXJzaW9ucyBvZiBwIGFuZCBxXG4gICAgICAgICAgICBjb252ZXJ0ZXI7XG5cbiAgICAgICAgLy8gVE9ETzogSWYgYSBsaXRlcmFsIChpLmUuLCB3aGVuIHRoaXMucSBpcyBub3Qgb3ZlcnJpZGRlbiksIHEgb25seSBuZWVkcyB0byBiZSBmZXRjaGVkIE9OQ0UgZm9yIGFsbCByb3dzXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAocCA9IHRoaXMucChkYXRhUm93KSkgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgKHEgPSB0aGlzLnEoZGF0YVJvdykpID09PSB1bmRlZmluZWRcbiAgICAgICAgKVxuICAgICAgICAgICAgPyBmYWxzZSAvLyBkYXRhIGluYWNjZXNzaWJsZSBzbyBleGNsdWRlIHJvd1xuICAgICAgICAgICAgOiAoXG4gICAgICAgICAgICAgICAgKGNvbnZlcnRlciA9IHRoaXMuY29udmVydGVyKSAmJlxuICAgICAgICAgICAgICAgICFjb252ZXJ0ZXIuZmFpbGVkKFAgPSBjb252ZXJ0ZXIudG9UeXBlKHApKSAmJiAvLyBhdHRlbXB0IHRvIGNvbnZlcnQgZGF0YSB0byB0eXBlXG4gICAgICAgICAgICAgICAgIWNvbnZlcnRlci5mYWlsZWQoUSA9IGNvbnZlcnRlci50b1R5cGUocSkpXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgPyB0aGlzLm9wLnRlc3QoUCwgUSkgLy8gYm90aCBjb252ZXJzaW9ucyBzdWNjZXNzZnVsOiBjb21wYXJlIGFzIHR5cGVzXG4gICAgICAgICAgICAgICAgOiB0aGlzLm9wLnRlc3QodG9TdHJpbmcocCksIHRvU3RyaW5nKHEpKTsgLy8gb25lIG9yIGJvdGggY29udmVyc2lvbnMgZmFpbGVkOiBjb21wYXJlIGFzIHN0cmluZ3NcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXRlID0ge307XG4gICAgICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgICAgICAgc3RhdGUuZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMudmlldykge1xuICAgICAgICAgICAgc3RhdGVba2V5XSA9IHRoaXNba2V5XTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zY2hlbWEgIT09IHRoaXMucGFyZW50LnNjaGVtYSkge1xuICAgICAgICAgICAgc3RhdGUuc2NoZW1hID0gdGhpcy5zY2hlbWE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBGb3IgYCdvYmplY3QnYCBhbmQgYCdKU09OJ2Agbm90ZSB0aGF0IHRoZSBzdWJ0cmVlJ3MgdmVyc2lvbiBvZiBgZ2V0U3RhdGVgIHdpbGwgbm90IGNhbGwgdGhpcyBsZWFmIHZlcnNpb24gb2YgYGdldFN0YXRlYCBiZWNhdXNlIHRoZSBmb3JtZXIgdXNlcyBgdW5zdHJ1bmdpZnkoKWAgYW5kIGBKU09OLnN0cmluZ2lmeSgpYCwgcmVzcGVjdGl2ZWx5LCBib3RoIG9mIHdoaWNoIHJlY3Vyc2UgYW5kIGNhbGwgYHRvSlNPTigpYCBvbiB0aGVpciBvd24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnM9J29iamVjdCddIC0gU2VlIHRoZSBzdWJ0cmVlIHZlcnNpb24gb2Yge0BsaW5rIEZpbHRlclRyZWUjZ2V0U3RhdGV8Z2V0U3RhdGV9IGZvciBtb3JlIGluZm8uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVyTGVhZiNcbiAgICAgKi9cbiAgICBnZXRTdGF0ZTogZnVuY3Rpb24gZ2V0U3RhdGUob3B0aW9ucykge1xuICAgICAgICB2YXIgcmVzdWx0ID0gJycsXG4gICAgICAgICAgICBzeW50YXggPSBvcHRpb25zICYmIG9wdGlvbnMuc3ludGF4IHx8ICdvYmplY3QnO1xuXG4gICAgICAgIHN3aXRjaCAoc3ludGF4KSB7XG4gICAgICAgICAgICBjYXNlICdvYmplY3QnOiAvLyBzZWUgbm90ZSBhYm92ZVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMudG9KU09OKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdKU09OJzogLy8gc2VlIG5vdGUgYWJvdmVcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh0aGlzLCBudWxsLCBvcHRpb25zICYmIG9wdGlvbnMuc3BhY2UpIHx8ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnU1FMJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmdldFN5bnRheCh0aGlzLnJvb3QuY29uZGl0aW9uYWxzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIG1ha2VTcWxPcGVyYW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucm9vdC5jb25kaXRpb25hbHMubWFrZVNxbFN0cmluZyh0aGlzLm9wZXJhbmQpOyAvLyB0b2RvOiB0aGlzIHNob3VsZCBiZSBhIG51bWJlciBpZiB0eXBlIGlzIG51bWJlciBpbnN0ZWFkIG9mIGEgc3RyaW5nIC0tIGJ1dCB3ZSB3aWxsIGhhdmUgdG8gZW5zdXJlIGl0IGlzIG51bWVyaWMhXG4gICAgfSxcblxuICAgIGdldFN5bnRheDogZnVuY3Rpb24oY29uZGl0aW9uYWxzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY29uZGl0aW9uYWxzLm9wc1t0aGlzLm9wZXJhdG9yXS5tYWtlLmNhbGwoY29uZGl0aW9uYWxzLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLyoqIEBzdW1tYXJ5IEhUTUwgZm9ybSBjb250cm9scyBmYWN0b3J5LlxuICAgICAqIEBkZXNjIENyZWF0ZXMgYW5kIGFwcGVuZHMgYSB0ZXh0IGJveCBvciBhIGRyb3AtZG93bi5cbiAgICAgKiA+IERlZmluZWQgb24gdGhlIEZpbHRlclRyZWUgcHJvdG90eXBlIGZvciBhY2Nlc3MgYnkgZGVyaXZlZCB0eXBlcyAoYWx0ZXJuYXRlIGZpbHRlciBlZGl0b3JzKS5cbiAgICAgKiBAcmV0dXJucyBUaGUgbmV3IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHttZW51SXRlbVtdfSBbbWVudV0gLSBPdmVybG9hZHM6XG4gICAgICogKiBJZiBvbWl0dGVkLCB3aWxsIGNyZWF0ZSBhbiBgPGlucHV0Lz5gICh0ZXh0IGJveCkgZWxlbWVudC5cbiAgICAgKiAqIElmIGNvbnRhaW5zIG9ubHkgYSBzaW5nbGUgb3B0aW9uLCB3aWxsIGNyZWF0ZSBhIGA8c3Bhbj4uLi48L3NwYW4+YCBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIHN0cmluZyBhbmQgYSBgPGlucHV0IHR5cGU9aGlkZGVuPmAgY29udGFpbmluZyB0aGUgdmFsdWUuXG4gICAgICogKiBPdGhlcndpc2UsIGNyZWF0ZXMgYSBgPHNlbGVjdD4uLi48L3NlbGVjdD5gIGVsZW1lbnQgd2l0aCB0aGVzZSBtZW51IGl0ZW1zLlxuICAgICAqIEBwYXJhbSB7bnVsbHxzdHJpbmd9IFtwcm9tcHQ9JyddIC0gQWRkcyBhbiBpbml0aWFsIGA8b3B0aW9uPi4uLjwvb3B0aW9uPmAgZWxlbWVudCB0byB0aGUgZHJvcC1kb3duIHdpdGggdGhpcyB2YWx1ZSwgcGFyZW50aGVzaXplZCwgYXMgaXRzIGB0ZXh0YDsgYW5kIGVtcHR5IHN0cmluZyBhcyBpdHMgYHZhbHVlYC4gT21pdHRpbmcgY3JlYXRlcyBhIGJsYW5rIHByb21wdDsgYG51bGxgIHN1cHByZXNzZXMuXG4gICAgICogQHBhcmFtIFtzb3J0XVxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJMZWFmI1xuICAgICAqL1xuICAgIG1ha2VFbGVtZW50OiBmdW5jdGlvbihtZW51LCBwcm9tcHQsIHNvcnQpIHtcbiAgICAgICAgdmFyIGVsLCByZXN1bHQsIG9wdGlvbnMsXG4gICAgICAgICAgICBvcHRpb24gPSBtZW51LFxuICAgICAgICAgICAgdGFnTmFtZSA9IG1lbnUgPyAnU0VMRUNUJyA6ICdJTlBVVCc7XG5cbiAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIHRoZXJlIHdvdWxkIGJlIG9ubHkgYSBzaW5nbGUgaXRlbSBpbiB0aGUgZHJvcGRvd25cbiAgICAgICAgd2hpbGUgKG9wdGlvbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBpZiAob3B0aW9uLmxlbmd0aCA9PT0gMSAmJiAhcG9wTWVudS5pc0dyb3VwUHJveHkob3B0aW9uWzBdKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbiA9IG9wdGlvblswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG9wdGlvbikge1xuICAgICAgICAgICAgLy8gaGFyZCB0ZXh0IHdoZW4gc2luZ2xlIGl0ZW1cbiAgICAgICAgICAgIGVsID0gdGhpcy50ZW1wbGF0ZXMuZ2V0KFxuICAgICAgICAgICAgICAgICdsb2NrZWRDb2x1bW4nLFxuICAgICAgICAgICAgICAgIG9wdGlvbi5hbGlhcyB8fCBvcHRpb24uaGVhZGVyIHx8IG9wdGlvbi5uYW1lIHx8IG9wdGlvbixcbiAgICAgICAgICAgICAgICBvcHRpb24ubmFtZSB8fCBvcHRpb24uYWxpYXMgfHwgb3B0aW9uLmhlYWRlciB8fCBvcHRpb25cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXN1bHQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBwcm9tcHQ6IHByb21wdCxcbiAgICAgICAgICAgICAgICBzb3J0OiBzb3J0LFxuICAgICAgICAgICAgICAgIGdyb3VwOiBmdW5jdGlvbihncm91cE5hbWUpIHsgcmV0dXJuIENvbmRpdGlvbmFscy5ncm91cHNbZ3JvdXBOYW1lXTsgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gbWFrZSBhbiBlbGVtZW50XG4gICAgICAgICAgICBlbCA9IHBvcE1lbnUuYnVpbGQodGFnTmFtZSwgbWVudSwgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIC8vIGlmIGl0J3MgYSB0ZXh0Ym94LCBsaXN0ZW4gZm9yIGtleXVwIGV2ZW50c1xuICAgICAgICAgICAgaWYgKGVsLnR5cGUgPT09ICd0ZXh0JyAmJiB0aGlzLmV2ZW50SGFuZGxlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLmV2ZW50SGFuZGxlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGhhbmRsZSBvbmNoYW5nZSBldmVudHNcbiAgICAgICAgICAgIHRoaXMub25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlIHx8IGNsZWFuVXBBbmRNb3ZlT24uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5vbkNoYW5nZSk7XG5cbiAgICAgICAgICAgIEZpbHRlck5vZGUuc2V0V2FybmluZ0NsYXNzKGVsKTtcbiAgICAgICAgICAgIHJlc3VsdCA9IGVsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZChlbCk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59KTtcblxuLyoqIGBjaGFuZ2VgIGV2ZW50IGhhbmRsZXIgZm9yIGFsbCBmb3JtIGNvbnRyb2xzLlxuICogUmVidWlsZHMgdGhlIG9wZXJhdG9yIGRyb3AtZG93biBhcyBuZWVkZWQuXG4gKiBSZW1vdmVzIGVycm9yIENTUyBjbGFzcyBmcm9tIGNvbnRyb2wuXG4gKiBBZGRzIHdhcm5pbmcgQ1NTIGNsYXNzIGZyb20gY29udHJvbCBpZiBibGFuazsgcmVtb3ZlcyBpZiBub3QgYmxhbmsuXG4gKiBBZGRzIHdhcm5pbmcgQ1NTIGNsYXNzIGZyb20gY29udHJvbCBpZiBibGFuazsgcmVtb3ZlcyBpZiBub3QgYmxhbmsuXG4gKiBNb3ZlcyBmb2N1cyB0byBuZXh0IG5vbi1ibGFuayBzaWJsaW5nIGNvbnRyb2wuXG4gKiBAdGhpcyB7RmlsdGVyTGVhZn1cbiAqL1xuZnVuY3Rpb24gY2xlYW5VcEFuZE1vdmVPbihldnQpIHtcbiAgICB2YXIgZWwgPSBldnQudGFyZ2V0O1xuXG4gICAgLy8gcmVtb3ZlIGBlcnJvcmAgQ1NTIGNsYXNzLCB3aGljaCBtYXkgaGF2ZSBiZWVuIGFkZGVkIGJ5IGBGaWx0ZXJMZWFmLnByb3RvdHlwZS5pbnZhbGlkYFxuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2ZpbHRlci10cmVlLWVycm9yJyk7XG5cbiAgICAvLyBzZXQgb3IgcmVtb3ZlICd3YXJuaW5nJyBDU1MgY2xhc3MsIGFzIHBlciBlbC52YWx1ZVxuICAgIEZpbHRlck5vZGUuc2V0V2FybmluZ0NsYXNzKGVsKTtcblxuICAgIGlmIChlbCA9PT0gdGhpcy52aWV3LmNvbHVtbikge1xuICAgICAgICAvLyByZWJ1aWxkIG9wZXJhdG9yIGxpc3QgYWNjb3JkaW5nIHRvIHNlbGVjdGVkIGNvbHVtbiBuYW1lIG9yIHR5cGUsIHJlc3RvcmluZyBzZWxlY3RlZCBpdGVtXG4gICAgICAgIG1ha2VPcE1lbnUuY2FsbCh0aGlzLCBlbC52YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKGVsLnZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgbmV4dCBzaWJsaW5nIGNvbnRyb2wsIGlmIGFueVxuICAgICAgICBpZiAoIWVsLm11bHRpcGxlKSB7XG4gICAgICAgICAgICB3aGlsZSAoKGVsID0gZWwubmV4dEVsZW1lbnRTaWJsaW5nKSAmJiAoISgnbmFtZScgaW4gZWwpIHx8IGVsLnZhbHVlLnRyaW0oKSAhPT0gJycpKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjdXJseVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gYW5kIGNsaWNrIGluIGl0IChvcGVucyBzZWxlY3QgbGlzdClcbiAgICAgICAgaWYgKGVsICYmIGVsLnZhbHVlLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIGVsLnZhbHVlID0gJyc7IC8vIHJpZCBvZiBhbnkgd2hpdGUgc3BhY2VcbiAgICAgICAgICAgIEZpbHRlck5vZGUuY2xpY2tJbihlbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmb3J3YXJkIHRoZSBldmVudCB0byB0aGUgYXBwbGljYXRpb24ncyBldmVudCBoYW5kbGVyXG4gICAgaWYgKHRoaXMuZXZlbnRIYW5kbGVyKSB7XG4gICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyKGV2dCk7XG4gICAgfVxufVxuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0aGUgbm9kZSBwcm9wZXJ0eS5cbiAqIEBkZXNjIFByaW9yaXR5IGxhZGRlcjpcbiAqIDEuIFNjaGVtYSBwcm9wZXJ0eS5cbiAqIDIuIE1peGluIChpZiBnaXZlbikuXG4gKiAzLiBOb2RlIHByb3BlcnR5IGlzIGZpbmFsIHByaW9yaXR5LlxuICogQHRoaXMge0ZpbHRlckxlYWZ9XG4gKiBAcGFyYW0ge3N0cmluZ30gY29sdW1uTmFtZVxuICogQHBhcmFtIHtzdHJpbmd9IHByb3BlcnR5TmFtZVxuICogQHBhcmFtIHtmdW5jdGlvbnxib29sZWFufSBbbWl4aW5dIC0gT3B0aW9uYWwgZnVuY3Rpb24gb3IgdmFsdWUgaWYgc2NoZW1hIHByb3BlcnR5IHVuZGVmaW5lZC4gSWYgZnVuY3Rpb24sIGNhbGxlZCBpbiBjb250ZXh0IHdpdGggYHByb3BlcnR5TmFtZWAgYW5kIGBjb2x1bW5OYW1lYC5cbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIGdldFByb3BlcnR5KGNvbHVtbk5hbWUsIHByb3BlcnR5TmFtZSwgbWl4aW4pIHtcbiAgICB2YXIgY29sdW1uU2NoZW1hID0gdGhpcy5zY2hlbWEubG9va3VwKGNvbHVtbk5hbWUpIHx8IHt9O1xuICAgIHJldHVybiAoXG4gICAgICAgIGNvbHVtblNjaGVtYVtwcm9wZXJ0eU5hbWVdIC8vIHRoZSBleHByZXNzaW9uJ3MgY29sdW1uIHNjaGVtYSBwcm9wZXJ0eVxuICAgICAgICAgICAgfHxcbiAgICAgICAgdHlwZW9mIG1peGluID09PSAnZnVuY3Rpb24nICYmIG1peGluLmNhbGwodGhpcywgY29sdW1uU2NoZW1hLCBwcm9wZXJ0eU5hbWUpXG4gICAgICAgICAgICB8fFxuICAgICAgICB0eXBlb2YgbWl4aW4gIT09ICdmdW5jdGlvbicgJiYgbWl4aW5cbiAgICAgICAgICAgIHx8XG4gICAgICAgIHRoaXNbcHJvcGVydHlOYW1lXSAvLyB0aGUgZXhwcmVzc2lvbiBub2RlJ3MgcHJvcGVydHlcbiAgICApO1xufVxuXG4vKipcbiAqIEB0aGlzIHtGaWx0ZXJMZWFmfVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8bWVudUl0ZW1bXX1cbiAqL1xuZnVuY3Rpb24gZ2V0T3BNZW51KGNvbHVtbk5hbWUpIHtcbiAgICByZXR1cm4gZ2V0UHJvcGVydHkuY2FsbCh0aGlzLCBjb2x1bW5OYW1lLCAnb3BNZW51JywgZnVuY3Rpb24oY29sdW1uU2NoZW1hKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVPcE1hcCAmJiB0aGlzLnR5cGVPcE1hcFtjb2x1bW5TY2hlbWEudHlwZSB8fCB0aGlzLnR5cGVdO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIEB0aGlzIHtGaWx0ZXJMZWFmfVxuICogQHBhcmFtIHtzdHJpbmd9IGNvbHVtbk5hbWVcbiAqL1xuZnVuY3Rpb24gbWFrZU9wTWVudShjb2x1bW5OYW1lKSB7XG4gICAgdmFyIG9wTWVudSA9IGdldE9wTWVudS5jYWxsKHRoaXMsIGNvbHVtbk5hbWUpO1xuXG4gICAgaWYgKG9wTWVudSAhPT0gdGhpcy5yZW5kZXJlZE9wTWVudSkge1xuICAgICAgICB2YXIgbmV3T3BEcm9wID0gdGhpcy5tYWtlRWxlbWVudChvcE1lbnUsICdvcGVyYXRvcicpO1xuXG4gICAgICAgIG5ld09wRHJvcC52YWx1ZSA9IHRoaXMudmlldy5vcGVyYXRvci52YWx1ZTtcbiAgICAgICAgdGhpcy5lbC5yZXBsYWNlQ2hpbGQobmV3T3BEcm9wLCB0aGlzLnZpZXcub3BlcmF0b3IpO1xuICAgICAgICB0aGlzLnZpZXcub3BlcmF0b3IgPSBuZXdPcERyb3A7XG5cbiAgICAgICAgRmlsdGVyTm9kZS5zZXRXYXJuaW5nQ2xhc3MobmV3T3BEcm9wKTtcblxuICAgICAgICB0aGlzLnJlbmRlcmVkT3BNZW51ID0gb3BNZW51O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gY2xpY2tJbihlbCkge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2ZpbHRlci10cmVlLWVycm9yJyk7XG4gICAgICAgIEZpbHRlck5vZGUuY2xpY2tJbihlbCk7XG4gICAgfSwgMCk7XG59XG5cbmZ1bmN0aW9uIGNvbnRyb2xWYWx1ZShlbCkge1xuICAgIHZhciB2YWx1ZSwgaTtcblxuICAgIHN3aXRjaCAoZWwudHlwZSkge1xuICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgIGNhc2UgJ3JhZGlvJzpcbiAgICAgICAgICAgIGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbbmFtZT1cXCcnICsgZWwubmFtZSArICdcXCddOmVuYWJsZWQ6Y2hlY2tlZCcpO1xuICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFtdLCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUucHVzaChlbFtpXS52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdzZWxlY3QtbXVsdGlwbGUnOlxuICAgICAgICAgICAgZWwgPSBlbC5vcHRpb25zO1xuICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFtdLCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlbC5kaXNhYmxlZCAmJiBlbC5zZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5wdXNoKGVsW2ldLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFsdWUgPSBlbC52YWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIE1lYW50IHRvIGJlIGNhbGxlZCBieSBGaWx0ZXJUcmVlLnByb3RvdHlwZS5zZXRTZW5zaXRpdml0eSBvbmx5XG5GaWx0ZXJMZWFmLnNldFRvU3RyaW5nID0gZnVuY3Rpb24oZm4pIHtcbiAgICB0b1N0cmluZyA9IGZuO1xuICAgIHJldHVybiBDb25kaXRpb25hbHMuc2V0VG9TdHJpbmcoZm4pO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlckxlYWY7XG4iLCIvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJ29iamVjdC1pdGVyYXRvcnMnKTtcbnZhciBleHRlbmQgPSByZXF1aXJlKCdleHRlbmQtbWUnKSwgQmFzZSA9IGV4dGVuZC5CYXNlOyBleHRlbmQuZGVidWcgPSB0cnVlO1xudmFyIHBvcE1lbnUgPSByZXF1aXJlKCdwb3AtbWVudScpO1xuXG52YXIgY3NzSW5qZWN0b3IgPSByZXF1aXJlKCcuL3N0eWxlc2hlZXQnKTtcbnZhciBUZW1wbGF0ZXMgPSByZXF1aXJlKCcuL1RlbXBsYXRlcycpO1xudmFyIENvbmRpdGlvbmFscyA9IHJlcXVpcmUoJy4vQ29uZGl0aW9uYWxzJyk7XG52YXIgUGFyc2VyU1FMID0gcmVxdWlyZSgnLi9wYXJzZXItU1FMJyk7XG5cblxudmFyIENISUxEUkVOX1RBRyA9ICdPTCcsXG4gICAgQ0hJTERfVEFHID0gJ0xJJztcblxuLy8gSlNPTi1kZXRlY3RvcjogYmVnaW5zIF9hbmRfIGVuZHMgd2l0aCBlaXRoZXIgWyBhbmQgXSBfb3JfIHsgYW5kIH1cbnZhciByZUpTT04gPSAvXlxccyooKFxcW1teXSpcXF0pfChcXHtbXl0qXFx9KSlcXHMqJC87XG5cbmZ1bmN0aW9uIEZpbHRlclRyZWVFcnJvcihtZXNzYWdlLCBub2RlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xufVxuRmlsdGVyVHJlZUVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbkZpbHRlclRyZWVFcnJvci5wcm90b3R5cGUubmFtZSA9ICdGaWx0ZXJUcmVlRXJyb3InO1xuXG4vKiogQHR5cGVkZWYge29iamVjdH0gRmlsdGVyVHJlZVNldFN0YXRlT3B0aW9uc09iamVjdFxuICpcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3N5bnRheD0nYXV0byddIC0gU3BlY2lmeSBwYXJzZXIgdG8gdXNlIG9uIGBzdGF0ZWAuIE9uZSBvZjpcbiAqICogYCdhdXRvJ2AgLSBBdXRvLWRldGVjdDsgc2VlIHtAbGluayBGaWx0ZXJOb2RlI3BhcnNlU3RhdGVTdHJpbmd9IGZvciBhbGdvcml0aG0uXG4gKiAqIGAnb2JqZWN0J2AgLSBBIHJhdyBzdGF0ZSBvYmplY3Qgc3VjaCBhcyB0aGF0IHByb2R1Y2VkIGJ5IHRoZSBbZ2V0U3RhdGUoKV17QGxpbmsgRmlsdGVyVHJlZSNnZXRTdGF0ZX0gbWV0aG9kLlxuICogKiBgJ0pTT04nYCAtIEEgSlNPTiBzdHJpbmcgdmVyc2lvbiBvZiBhIHN0YXRlIG9iamVjdCBzdWNoIGFzIHRoYXQgcHJvZHVjZWQgYnkgdGhlIFtnZXRTdGF0ZSgpXXtAbGluayBGaWx0ZXJUcmVlI2dldFN0YXRlfSBtZXRob2QuXG4gKiAqIGAnU1FMJ2AgLSBBIFNRTCBbc2VhcmNoIGNvbmRpdGlvbiBleHByZXNzaW9uXXtAbGluayBodHRwczovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zMTczNTQ1LmFzcHh9IHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IFtjb250ZXh0XSBJZiBkZWZpbmVkLCB0aGUgcHJvdmlkZWQgaW5wdXQgc3RyaW5nIGlzIHVzZWQgYXMgYSBzZWxlY3RvciB0byBhbiBgSFRNTEVsZW1lbnRgIGNvbnRhaW5lZCBpbiBgY29udGV4dGAuIFRoZSBgdmFsdWVgIHByb3BlcnR5IG9mIHRoaXMgZWxlbWVudCBpcyBmZXRjaGVkIGZyb20gdGhlIERPTSBhbmQgaXMgdXNlZCBhcyB0aGUgaW5wdXQgc3RhdGUgc3RyaW5nOyBwcm9jZWVkIGFzIGFib3ZlLlxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSBGaWx0ZXJUcmVlT3B0aW9uc09iamVjdFxuICpcbiAqIEBwcm9wZXJ0eSB7bWVudUl0ZW1bXX0gW3NjaGVtYV0gLSBBIGRlZmF1bHQgbGlzdCBvZiBjb2x1bW4gbmFtZXMgZm9yIGZpZWxkIGRyb3AtZG93bnMgb2YgYWxsIGRlc2NlbmRhbnQgdGVybWluYWwgbm9kZXMuIE92ZXJyaWRlcyBgb3B0aW9ucy5zdGF0ZS5zY2hlbWFgIChzZWUpLiBNYXkgYmUgZGVmaW5lZCBmb3IgYW55IG5vZGUgYW5kIHBlcnRhaW5zIHRvIGFsbCBkZXNjZW5kYW50cyBvZiB0aGF0IG5vZGUgKGluY2x1ZGluZyB0ZXJtaW5hbCBub2RlcykuIElmIG9taXR0ZWQgKGFuZCBubyBgb3duU2NoZW1hYCksIHdpbGwgdXNlIHRoZSBuZWFyZXN0IGFuY2VzdG9yIGBzY2hlbWFgIGRlZmluaXRpb24uIEhvd2V2ZXIsIGRlc2NlbmRhbnRzIHdpdGggdGhlaXIgb3duIGRlZmluaXRpb24gb2YgYHR5cGVzYCB3aWxsIG92ZXJyaWRlIGFueSBhbmNlc3RvciBkZWZpbml0aW9uLlxuICpcbiAqID4gVHlwaWNhbGx5IG9ubHkgdXNlZCBieSB0aGUgY2FsbGVyIGZvciB0aGUgdG9wLWxldmVsIChyb290KSB0cmVlLlxuICpcbiAqIEBwcm9wZXJ0eSB7bWVudUl0ZW1bXX0gW293blNjaGVtYV0gLSBBIGRlZmF1bHQgbGlzdCBvZiBjb2x1bW4gbmFtZXMgZm9yIGZpZWxkIGRyb3AtZG93bnMgb2YgaW1tZWRpYXRlIGRlc2NlbmRhbnQgdGVybWluYWwgbm9kZXMgX29ubHlfLiBPdmVycmlkZXMgYG9wdGlvbnMuc3RhdGUub3duU2NoZW1hYCAoc2VlKS5cbiAqXG4gKiBBbHRob3VnaCBib3RoIGBvcHRpb25zLnNjaGVtYWAgYW5kIGBvcHRpb25zLm93blNjaGVtYWAgYXJlIG5vdGF0ZWQgYXMgb3B0aW9uYWwgaGVyZWluLCBieSB0aGUgdGltZSBhIHRlcm1pbmFsIG5vZGUgdHJpZXMgdG8gcmVuZGVyIGEgc2NoZW1hIGRyb3AtZG93biwgYSBgc2NoZW1hYCBsaXN0IHNob3VsZCBiZSBkZWZpbmVkIHRocm91Z2ggKGluIG9yZGVyIG9mIHByaW9yaXR5KTpcbiAqXG4gKiAqIFRlcm1pbmFsIG5vZGUncyBvd24gYG9wdGlvbnMuc2NoZW1hYCAob3IgYG9wdGlvbnMuc3RhdGUuc2NoZW1hYCkgZGVmaW5pdGlvbi5cbiAqICogVGVybWluYWwgbm9kZSdzIHBhcmVudCBub2RlJ3MgYG9wdGlvbi5vd25TY2hlbWFgIChvciBgb3B0aW9uLnN0YXRlLm5vZGVzRmllbGRzYCkgZGVmaW5pdGlvbi5cbiAqICogVGVybWluYWwgbm9kZSdzIHBhcmVudCAob3IgYW55IGFuY2VzdG9yKSBub2RlJ3MgYG9wdGlvbnMuc2NoZW1hYCAob3IgYG9wdGlvbnMuc3RhdGUuc2NoZW1hYCkgZGVmaW5pdGlvbi5cbiAqXG4gKiBAcHJvcGVydHkge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH0gW3N0YXRlXSAtIEEgZGF0YSBzdHJ1Y3R1cmUgdGhhdCBkZXNjcmliZXMgYSB0cmVlLCBzdWJ0cmVlLCBvciBsZWFmICh0ZXJtaW5hbCBub2RlKS4gSWYgdW5kZWZpbmVkLCBsb2FkcyBhbiBlbXB0eSBmaWx0ZXIsIHdoaWNoIGlzIGEgYEZpbHRlclRyZWVgIG5vZGUgY29uc2lzdGluZyB0aGUgZGVmYXVsdCBgb3BlcmF0b3JgIHZhbHVlIChgJ29wLWFuZCdgKS5cbiAqXG4gKiBAcHJvcGVydHkge2Z1bmN0aW9ufSBbZWRpdG9yPSdEZWZhdWx0J10gLSBUaGUgbmFtZSBvZiB0aGUgY29uZGl0aW9uYWwgZXhwcmVzc2lvbidzIFVJIFwiZWRpdG9yLlwiIFRoaXMgbmFtZSBtdXN0IGJlIHJlZ2lzdGVyZWQgaW4gdGhlIHBhcmVudCBub2RlJ3Mge0BsaW5rIEZpbHRlclRyZWUjZWRpdG9yc3xlZGl0b3JzfSBoYXNoLCB3aGVyZSBpdCBtYXBzIHRvIGEgbGVhZiBjb25zdHJ1Y3RvciAoYEZpbHRlckxlYWZgIG9yIGEgZGVzY2VuZGFudCB0aGVyZW9mKS4gKFVzZSB7QGxpbmsgRmlsdGVyVHJlZSNhZGRFZGl0b3J9IHRvIHJlZ2lzdGVyIG5ldyBlZGl0b3JzLilcbiAqXG4gKiBAcHJvcGVydHkge0ZpbHRlclRyZWV9IFtwYXJlbnRdIC0gVXNlZCBpbnRlcm5hbGx5IHRvIGluc2VydCBlbGVtZW50IHdoZW4gY3JlYXRpbmcgbmVzdGVkIHN1YnRyZWVzLiBUaGUgb25seSB0aW1lIGl0IG1heSBiZSAoYW5kIG11c3QgYmUpIG9taXR0ZWQgaXMgd2hlbiBjcmVhdGluZyB0aGUgcm9vdCBub2RlLlxuICpcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfEhUTUxFbGVtZW50fSBbY3NzU3R5bGVzaGVldFJlZmVyZW5jZUVsZW1lbnRdIC0gcGFzc2VkIHRvIGNzc0luc2VydFxuICovXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fHN0cmluZ30gRmlsdGVyVHJlZVN0YXRlT2JqZWN0XG4gKlxuICogQHN1bW1hcnkgU3RhdGUgd2l0aCB3aGljaCB0byBjcmVhdGUgYSBuZXcgbm9kZSBvciByZXBsYWNlIGFuIGV4aXN0aW5nIG5vZGUuXG4gKlxuICogQGRlc2MgQSBzdHJpbmcgb3IgcGxhaW4gb2JqZWN0IHRoYXQgZGVzY3JpYmVzIGEgZmlsdGVyLXRyZWUgbm9kZS4gSWYgYSBzdHJpbmcsIGl0IGlzIHBhcnNlZCBpbnRvIGFuIG9iamVjdCBieSB7QGxpbmsgRmlsdGVyTm9kZX5wYXJzZVN0YXRlU3RyaW5nfS4gKFNlZSwgZm9yIGF2YWlsYWJsZSBvdmVybG9hZHMuKVxuICpcbiAqIFRoZSByZXN1bHRpbmcgb2JqZWN0IG1heSBiZSBhIGZsYXQgb2JqZWN0IHRoYXQgZGVzY3JpYmVzIGEgdGVybWluYWwgbm9kZSBvciBhIGNoaWxkbGVzcyByb290IG9yIGJyYW5jaCBub2RlOyBvciBtYXkgYmUgYSBoaWVyYXJjaGljYWwgb2JqZWN0IHRvIGRlZmluZSBhbiBlbnRpcmUgdHJlZSBvciBzdWJ0cmVlLlxuICpcbiAqIEluIGFueSBjYXNlLCB0aGUgcmVzdWx0aW5nIG9iamVjdCBtYXkgaGF2ZSBhbnkgb2YgdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICpcbiAqIEBwcm9wZXJ0eSB7bWVudUl0ZW1bXX0gW3NjaGVtYV0gLSBTZWUgYHNjaGVtYWAgcHJvcGVydHkgb2Yge0BsaW5rIEZpbHRlclRyZWVPcHRpb25zT2JqZWN0fS5cbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2VkaXRvcj0nRGVmYXVsdCddIC0gU2VlIGBlZGl0b3JgIHByb3BlcnR5IG9mIHtAbGluayBGaWx0ZXJUcmVlT3B0aW9uc09iamVjdH0uXG4gKlxuICogQHByb3BlcnR5IG1pc2MgLSBPdGhlciBtaXNjZWxsYW5lb3VzIHByb3BlcnRpZXMgd2lsbCBiZSBjb3BpZWQgZGlyZWN0bHkgdG8gdGhlIG5ldyBgRml0bGVyTm9kZWAgb2JqZWN0LiAoVGhlIG5hbWUgXCJtaXNjXCIgaGVyZSBpcyBqdXN0IGEgc3RhbmQtaW47IHRoZXJlIGlzIG5vIHNwZWNpZmljIHByb3BlcnR5IGNhbGxlZCBcIm1pc2NcIi4pXG4gKlxuICogKiBNYXkgZGVzY3JpYmUgYSBub24tdGVybWluYWwgbm9kZSB3aXRoIHByb3BlcnRpZXM6XG4gKiAgICogYHNjaGVtYWAgLSBPdmVycmlkZGVuIG9uIGluc3RhbnRpYXRpb24gYnkgYG9wdGlvbnMuc2NoZW1hYC4gSWYgYm90aCB1bnNwZWNpZmllZCwgdXNlcyBwYXJlbnQncyBkZWZpbml0aW9uLlxuICogICAqIGBvcGVyYXRvcmAgLSBPbmUgb2Yge0BsaW5rIHRyZWVPcGVyYXRvcnN9LlxuICogICAqIGBjaGlsZHJlbmAgLSAgQXJyYXkgY29udGFpbmluZyBhZGRpdGlvbmFsIHRlcm1pbmFsIGFuZCBub24tdGVybWluYWwgbm9kZXMuXG4gKlxuICogVGhlIGNvbnN0cnVjdG9yIGF1dG8tZGV0ZWN0cyBgc3RhdGVgJ3MgdHlwZTpcbiAqICAqIEpTT04gc3RyaW5nIHRvIGJlIHBhcnNlZCBieSBgSlNPTi5wYXJzZSgpYCBpbnRvIGEgcGxhaW4gb2JqZWN0XG4gKiAgKiBTUUwgV0hFUkUgY2xhdXNlIHN0cmluZyB0byBiZSBwYXJzZWQgaW50byBhIHBsYWluIG9iamVjdFxuICogICogQ1NTIHNlbGVjdG9yIG9mIGFuIEVsZW1lbnQgd2hvc2UgYHZhbHVlYCBjb250YWlucyBvbmUgb2YgdGhlIGFib3ZlXG4gKiAgKiBwbGFpbiBvYmplY3RcbiAqL1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBzdW1tYXJ5IEEgbm9kZSBpbiBhIGZpbHRlciB0cmVlLlxuICpcbiAqIEBkZXNjcmlwdGlvbiBBIGZpbHRlciB0cmVlIHJlcHJlc2VudHMgYSBfY29tcGxleCBjb25kaXRpb25hbCBleHByZXNzaW9uXyBhbmQgY29uc2lzdHMgb2YgYSBzaW5nbGUgaW5zdGFuY2Ugb2YgYSB7QGxpbmsgRmlsdGVyVHJlZX0gb2JqZWN0IGFzIHRoZSBfcm9vdF8gb2YgYW4gX25fLWFyeSB0cmVlLlxuICpcbiAqIEZpbHRlciB0cmVlcyBhcmUgY29tcHJpc2VkIG9mIGluc3RhbmNlcyBvZiBgRmlsdGVyTm9kZWAgb2JqZWN0cy4gSG93ZXZlciwgdGhlIGBGaWx0ZXJOb2RlYCBjb25zdHJ1Y3RvciBpcyBhbiBcImFic3RyYWN0IGNsYXNzXCI7IGZpbHRlciBub2RlIG9iamVjdHMgYXJlIG5ldmVyIGluc3RhbnRpYXRlZCBkaXJlY3RseSBmcm9tIHRoaXMgY29uc3RydWN0b3IuIEEgZmlsdGVyIHRyZWUgaXMgYWN0dWFsbHkgY29tcHJpc2VkIG9mIGluc3RhbmNlcyBvZiB0d28gXCJzdWJjbGFzc2VzXCIgb2YgYEZpbHRlck5vZGVgIG9iamVjdHM6XG4gKiAqIHtAbGluayBGaWx0ZXJUcmVlfSAob3Igc3ViY2xhc3MgdGhlcmVvZikgb2JqZWN0cywgaW5zdGFuY2VzIG9mIHdoaWNoIHJlcHJlc2VudCB0aGUgcm9vdCBub2RlIGFuZCBhbGwgdGhlIGJyYW5jaCBub2RlczpcbiAqICAgKiBUaGVyZSBpcyBhbHdheXMgZXhhY3RseSBvbmUgcm9vdCBub2RlLCBjb250YWluaW5nIHRoZSB3aG9sZSBmaWx0ZXIgdHJlZSwgd2hpY2ggcmVwcmVzZW50cyB0aGUgZmlsdGVyIGV4cHJlc3Npb24gaW4gaXRzIGVudGlyZXR5LiBUaGUgcm9vdCBub2RlIGlzIGRpc3Rpbmd1aXNoZWQgYnkgaGF2aW5nIG5vIHBhcmVudCBub2RlLlxuICogICAqIFRoZXJlIGFyZSB6ZXJvIG9yIG1vcmUgYnJhbmNoIG5vZGVzLCBvciBzdWJ0cmVlcywgd2hpY2ggYXJlIGNoaWxkIG5vZGVzIG9mIHRoZSByb290IG9yIG90aGVyIGJyYW5jaGVzIGhpZ2hlciB1cCBpbiB0aGUgdHJlZSwgcmVwcmVzZW50aW5nIHN1YmV4cHJlc3Npb25zIHdpdGhpbiB0aGUgbGFyZ2VyIGZpbHRlciBleHByZXNzaW9uLiBFYWNoIGJyYW5jaCBub2RlIGhhcyBleGFjdGx5IG9uZSBwYXJlbnQgbm9kZS5cbiAqICAgKiBUaGVzZSBub2RlcyBwb2ludCB0byB6ZXJvIG9yIG1vcmUgY2hpbGQgbm9kZXMgd2hpY2ggYXJlIGVpdGhlciBuZXN0ZWQgc3VidHJlZXMsIG9yOlxuICogKiB7QGxpbmsgRmlsdGVyTGVhZn0gKG9yIHN1YmNsYXNzIHRoZXJlb2YpIG9iamVjdHMsIGVhY2ggaW5zdGFuY2Ugb2Ygd2hpY2ggcmVwcmVzZW50cyBhIHNpbmdsZSBzaW1wbGUgY29uZGl0aW9uYWwgZXhwcmVzc2lvbi4gVGhlc2UgYXJlIHRlcm1pbmFsIG5vZGVzLCBoYXZpbmcgZXhhY3RseSBvbmUgcGFyZW50IG5vZGUsIGFuZCBubyBjaGlsZCBub2Rlcy5cbiAqXG4gKiBUaGUgcHJvZ3JhbW1lciBtYXkgZXh0ZW5kIHRoZSBzZW1hbnRpY3Mgb2YgZmlsdGVyIHRyZWVzIGJ5IGV4dGVuZGluZyB0aGUgYWJvdmUgb2JqZWN0cy5cbiAqXG4gKiBAcHJvcGVydHkge3NxbElkUXRzT2JqZWN0fSBbc3FsSWRRdHM9e2JlZzonXCInLGVuZDonXCInfV0gLSBRdW90ZSBjaGFyYWN0ZXJzIGZvciBTUUwgaWRlbnRpZmllcnMuIFVzZWQgZm9yIGJvdGggcGFyc2luZyBhbmQgZ2VuZXJhdGluZyBTUUwuIFNob3VsZCBiZSBwbGFjZWQgb24gdGhlIHJvb3Qgbm9kZS5cbiAqXG4gKiBAcHJvcGVydHkge0hUTUxFbGVtZW50fSBlbCAtIFRoZSBET00gZWxlbWVudCBjcmVhdGVkIGJ5IHRoZSBgcmVuZGVyYCBtZXRob2QgdG8gcmVwcmVzZW50IHRoaXMgbm9kZS4gQ29udGFpbnMgdGhlIGBlbGBzIGZvciBhbGwgY2hpbGQgbm9kZXMgKHdoaWNoIGFyZSB0aGVtc2VsdmVzIHBvaW50ZWQgdG8gYnkgdGhvc2Ugbm9kZXMpLiBUaGlzIGlzIGFsd2F5cyBnZW5lcmF0ZWQgYnV0IGlzIG9ubHkgaW4gdGhlIHBhZ2UgRE9NIGlmIHlvdSBwdXQgaXQgdGhlcmUuXG4gKi9cblxudmFyIEZpbHRlck5vZGUgPSBCYXNlLmV4dGVuZCgnRmlsdGVyTm9kZScsIHtcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IENyZWF0ZSBhIG5ldyBub2RlIG9yIHN1YnRyZWUuXG4gICAgICogQGRlc2MgVHlwaWNhbGx5IHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9uIGxheWVyIHRvIGNyZWF0ZSB0aGUgZW50aXJlIGZpbHRlciB0cmVlOyBhbmQgaW50ZXJuYWxseSwgcmVjdXJzaXZlbHksIHRvIGNyZWF0ZSBlYWNoIG5vZGUgaW5jbHVkaW5nIGJvdGggc3VidHJlZXMgYW5kIGxlYXZlcy5cbiAgICAgKlxuICAgICAqICoqTm9kZSBwcm9wZXJ0aWVzIGFuZCBvcHRpb25zOioqIE5vZGVzIGFyZSBpbnN0YW50aWF0ZWQgd2l0aDpcbiAgICAgKiAxLiBDZXJ0YWluICoqcmVxdWlyZWQgcHJvcGVydGllcyoqIHdoaWNoIGRpZmZlciBmb3Igc3VidHJlZXMgYW5kIGxlYXZlcy5cbiAgICAgKiAyLiBBcmJpdHJhcnkgKipub24tc3RhbmRhcmQgb3B0aW9uIHByb3BlcnRpZXMqKiBhcmUgZGVmaW5lZCBvbiB0aGUgYG9wdGlvbnNgIG9iamVjdCAoc28gbG9uZyBhcyB0aGVpciBuYW1lcyBkbyBub3QgY29uZmxpY3Qgd2l0aCBhbnkgc3RhbmRhcmQgb3B0aW9ucykgYW5kIG5ldmVyIHBlcnNpc3QuXG4gICAgICogMy4gQ2VydGFpbiAqKnN0YW5kYXJkIG9wdGlvbnMgcHJvcGVydGllcyoqIGFzIGRlZmluZWQgaW4gdGhlIHtAbGluayBGaWx0ZXJOb2Rlfm9wdGlvbnNTY2hlbWF8b3B0aW9uc1NjaGVtYX0gaGFzaCwgY29tZSBmcm9tIHZhcmlvdXMgc291cmNlcywgYXMgcHJpb3JpdGl6ZWQgYXMgZm9sbG93czpcbiAgICAgKiAgICAxLiBgb3B0aW9uc2Agb2JqZWN0OyBkb2VzIG5vdCBwZXJzaXN0XG4gICAgICogICAgMi4gYHN0YXRlYDsgb2JqZWN0OyBwZXJzaXN0c1xuICAgICAqICAgIDMuIGBwYXJlbnRgIG9iamVjdDsgcGVyc2lzdHNcbiAgICAgKiAgICA0LiBgZGVmYXVsdGAgb2JqZWN0OyBkb2VzIG5vdCBwZXJzaXN0XG4gICAgICpcbiAgICAgKiBOb3RlczpcbiAgICAgKiAxLiBcIlBlcnNpc3RzXCIgbWVhbnMgb3V0cHV0IGJ5IHtAbGluayBGaWx0ZXJUcmVlI2dldFN0YXRlfGdldFN0YXRlKCl9LlxuICAgICAqIDIuIFRoZSBgcGFyZW50YCBvYmplY3QgaXMgZ2VuZXJhdGVkIGludGVybmFsbHkgZm9yIHN1YnRyZWVzLiBJdCBhbGxvd3Mgc3RhbmRhcmQgb3B0aW9ucyB0byBpbmhlcml0IGZyb20gdGhlIHBhcmVudCBub2RlLlxuICAgICAqIDMuIFRoZSBgZGVmYXVsdGAgb2JqZWN0IGNvbWVzIGZyb20gdGhlIGBkZWZhdWx0YCBwcm9wZXJ0eSwgaWYgYW55LCBvZiB0aGUge0BsaW5rIEZpbHRlck5vZGV+b3B0aW9uc1NjaGVtYXxzY2hlbWEgb2JqZWN0fSBmb3IgdGhlIHN0YW5kYXJkIG9wdGlvbiBpbiBxdWVzdGlvbi4gTm90ZSB0aGF0IG9uY2UgZGVmaW5lZCwgc3VidHJlZXMgd2lsbCB0aGVuIGluaGVyaXQgdGhpcyB2YWx1ZS5cbiAgICAgKiA0LiBJZiBub3QgZGVmaW5lZCBieSBhbnkgb2YgdGhlIGFib3ZlLCB0aGUgc3RhbmRhcmQgb3B0aW9uIHJlbWFpbnMgdW5kZWZpbmVkIG9uIHRoZSBub2RlLlxuICAgICAqXG4gICAgICogKipRdWVyeSBCdWlsZGVyIFVJIHN1cHBvcnQ6KiogSWYgeW91ciBhcHAgd2FudHMgdG8gbWFrZSB1c2Ugb2YgdGhlIGdlbmVyYXRlZCBVSSwgeW91IGFyZSByZXNwb25zaWJsZSBmb3IgaW5zZXJ0aW5nIHRoZSB0b3AtbGV2ZWwgYC5lbGAgaW50byB0aGUgRE9NLiAoT3RoZXJ3aXNlIGp1c3QgaWdub3JlIGl0LilcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZU9wdGlvbnNPYmplY3R9IFtvcHRpb25zXSAtIFRoZSBub2RlIHN0YXRlOyBvciBhbiBvcHRpb25zIG9iamVjdCBwb3NzaWJseSBjb250YWluaW5nIGBzdGF0ZWAgYW1vbmcgb3RoZXIgb3B0aW9ucy4gQWx0aG91Z2ggeW91IGNhbiBpbnN0YW50aWF0ZSBhIGZpbHRlciB3aXRob3V0IGFueSBvcHRpb25zLCB0aGlzIGlzIGdlbmVyYWxseSBub3QgdXNlZnVsLiBTZWUgKkluc3RhbnRpYXRpbmcgYSBmaWx0ZXIqIGluIHRoZSB7QGxpbmsgaHR0cDovL2pvbmVpdC5naXRodWIuaW8vZmlsdGVyLXRyZWUvaW5kZXguaHRtbHxyZWFkbWV9IGZvciBhIHByYWN0aWNhbCBkaXNjdXNzaW9uIG9mIG1pbmltdW0gb3B0aW9ucy5cbiAgICAgKlxuICAgICAqICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICovXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAvKiogQHN1bW1hcnkgUmVmZXJlbmNlIHRvIHRoaXMgbm9kZSdzIHBhcmVudCBub2RlLlxuICAgICAgICAgKiBAZGVzYyBXaGVuIHRoaXMgcHJvcGVydHkgaXMgdW5kZWZpbmVkLCB0aGlzIG5vZGUgaXMgdGhlIHJvb3Qgbm9kZS5cbiAgICAgICAgICogQHR5cGUge0ZpbHRlck5vZGV9XG4gICAgICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAgICAgKi9cbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50ID0gdGhpcy5wYXJlbnQgfHwgb3B0aW9ucy5wYXJlbnQsXG4gICAgICAgICAgICByb290ID0gcGFyZW50ICYmIHBhcmVudC5yb290O1xuXG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcm9vdCA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuc3R5bGVzaGVldCA9IHRoaXMuc3R5bGVzaGVldCB8fFxuICAgICAgICAgICAgICAgIGNzc0luamVjdG9yKG9wdGlvbnMuY3NzU3R5bGVzaGVldFJlZmVyZW5jZUVsZW1lbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbmFscyA9IG5ldyBDb25kaXRpb25hbHMob3B0aW9ucyk7IC8vIC5zcWxJZFF0c1xuXG4gICAgICAgICAgICB0aGlzLlBhcnNlclNRTCA9IG5ldyBQYXJzZXJTUUwob3B0aW9ucyk7IC8vIC5zY2hlbWEsIC5jYXNlU2Vuc2l0aXZlQ29sdW1uTmFtZXMsIC5yZXNvbHZlQWxpYXNlc1xuXG4gICAgICAgICAgICB2YXIga2V5cyA9IFsnbmFtZSddO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVzb2x2ZUFsaWFzZXMpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goJ2FsaWFzJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZmluZE9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgY2FzZVNlbnNpdGl2ZTogb3B0aW9ucy5jYXNlU2Vuc2l0aXZlQ29sdW1uTmFtZXMsXG4gICAgICAgICAgICAgICAga2V5czoga2V5c1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAc3VtbWFyeSBDb252ZW5pZW5jZSByZWZlcmVuY2UgdG8gdGhlIHJvb3Qgbm9kZS5cbiAgICAgICAgICogQG5hbWUgcm9vdFxuICAgICAgICAgKiBAdHlwZSB7RmlsdGVyTm9kZX1cbiAgICAgICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJvb3QgPSByb290O1xuXG4gICAgICAgIHRoaXMuZG9udFBlcnNpc3QgPSB7fTsgLy8gaGFzaCBvZiB0cnV0aHkgdmFsdWVzXG5cbiAgICAgICAgdGhpcy5zZXRTdGF0ZShvcHRpb25zLnN0YXRlLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLyoqIEluc2VydCBlYWNoIHN1YnRyZWUgaW50byBpdHMgcGFyZW50IG5vZGUgYWxvbmcgd2l0aCBhIFwiZGVsZXRlXCIgYnV0dG9uLlxuICAgICAqXG4gICAgICogTk9URTogVGhlIHJvb3QgdHJlZSAod2hpY2ggaGFzIG5vIHBhcmVudCkgbXVzdCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBET00gYnkgdGhlIGluc3RhbnRpYXRpbmcgY29kZSAod2l0aG91dCBhIGRlbGV0ZSBidXR0b24pLlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqL1xuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudCkge1xuICAgICAgICAgICAgdmFyIG5ld0xpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChDSElMRF9UQUcpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5ub3Rlc0VsKSB7XG4gICAgICAgICAgICAgICAgbmV3TGlzdEl0ZW0uYXBwZW5kQ2hpbGQodGhpcy5ub3Rlc0VsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLmtlZXApIHtcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSB0aGlzLnRlbXBsYXRlcy5nZXQoJ3JlbW92ZUJ1dHRvbicpO1xuICAgICAgICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZW1vdmUuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgbmV3TGlzdEl0ZW0uYXBwZW5kQ2hpbGQoZWwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZXdMaXN0SXRlbS5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcblxuICAgICAgICAgICAgdGhpcy5wYXJlbnQuZWwucXVlcnlTZWxlY3RvcihDSElMRFJFTl9UQUcpLmFwcGVuZENoaWxkKG5ld0xpc3RJdGVtKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVN0YXRlT2JqZWN0fSBzdGF0ZVxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVNldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICovXG4gICAgc2V0U3RhdGU6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBvbGRFbCA9IHRoaXMuZWw7XG5cbiAgICAgICAgc3RhdGUgPSB0aGlzLnBhcnNlU3RhdGVTdHJpbmcoc3RhdGUsIG9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMubWl4SW5TdGFuZGFyZE9wdGlvbnMoc3RhdGUsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLm1peEluTm9uc3RhbmRhcmRPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmNyZWF0ZVZpZXcoc3RhdGUpO1xuICAgICAgICB0aGlzLmxvYWRTdGF0ZShzdGF0ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgaWYgKG9sZEVsKSB7XG4gICAgICAgICAgICB2YXIgbmV3RWwgPSB0aGlzLmVsO1xuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50ICYmIG9sZEVsLnBhcmVudEVsZW1lbnQudGFnTmFtZSA9PT0gJ0xJJykge1xuICAgICAgICAgICAgICAgIG9sZEVsID0gb2xkRWwucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBuZXdFbCA9IG5ld0VsLnBhcmVudE5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvbGRFbC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChuZXdFbCwgb2xkRWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IENvbnZlcnQgYSBzdHJpbmcgdG8gYSBzdGF0ZSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAZGVzYyBUaGV5IHN0cmluZydzIHN5bnRheCBpcyBpbmZlcnJlZCBhcyBmb2xsb3dzOlxuICAgICAqIDEuIElmIHN0YXRlIGlzIHVuZGVmaW5lZCBvciBhbHJlYWR5IGFuIG9iamVjdCwgcmV0dXJuIGFzIGlzLlxuICAgICAqIDIuIElmIGBvcHRpb25zLmNvbnRleHRgIGlzIGRlZmluZWQsIGBzdGF0ZWAgaXMgYXNzdW1lZCB0byBiZSBhIENTUyBzZWxlY3RvciBzdHJpbmcgKGF1dG8tZGV0ZWN0ZWQpIHBvaW50aW5nIHRvIGFuIEhUTUwgZm9ybSBjb250cm9sIHdpdGggYSBgdmFsdWVgIHByb3BlcnR5LCBzdWNoIGFzIGEge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MSW5wdXRFbGVtZW50IEhUTUxJbnB1dEVsZW1lbnR9IG9yIGEge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9IVE1MVGV4dEFyZWFFbGVtZW50IEhUTUxUZXh0QXJlYUVsZW1lbnR9LiBUaGUgZWxlbWVudCBpcyBzZWxlY3RlZCBhbmQgaWYgZm91bmQsIGl0cyB2YWx1ZSBpcyBmZXRjaGVkIGZyb20gdGhlIERPTSBhbmQgYXNzaWduZWQgdG8gYHN0YXRlYC5cbiAgICAgKiAzLiBJZiBgb3B0aW9ucy5zeW50YXhgIGlzIGAnYXV0bydgLCBKU09OIHN5bnRheCBpcyBkZXRlY3RlZCBpZiBgc3RhdGVgIGJlZ2lucyBfYW5kXyBlbmRzIHdpdGggZWl0aGVyIGBbYCBhbmQgYF1gIF9vcl8gYHtgIGFuZCBgfWAgKGlnbm9yaW5nIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlIHNwYWNlKS5cbiAgICAgKiA0LiBJZiBKU09OIHN5bnRheCwgcGFyc2UgdGhlIHN0cmluZyBpbnRvIGFuIGFjdHVhbCBgRmlsdGVyVHJlZVN0YXRlT2JqZWN0YCB1c2luZyB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvSlNPTi9wYXJzZXxKU09OLnBhcnNlfSBhbmQgdGhyb3cgYW4gZXJyb3IgaWYgdW5wYXJzYWJsZS5cbiAgICAgKiA1LiBJZiBub3QgSlNPTiwgcGFyc2UgdGhlIHN0cmluZyBhcyBTUUwgaW50byBhbiBhY3R1YWwgYEZpbHRlclRyZWVTdGF0ZU9iamVjdGAgdXNpbmcgcGFyc2VyLVNRTCdzIHtAbGluayBQYXJzZXJTUUwjcGFyc2VyfHBhcnNlcn0gYW5kIHRocm93IGFuIGVycm9yIGlmIHVucGFyc2FibGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbHRlclRyZWVTdGF0ZU9iamVjdH0gW3N0YXRlXVxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVNldFN0YXRlT3B0aW9uc09iamVjdH0gW29wdGlvbnNdXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RmlsdGVyVHJlZVN0YXRlT2JqZWN0fSBUaGUgdW5tb2xlc3RlZCBgc3RhdGVgIHBhcmFtZXRlci4gVGhyb3dzIGFuIGVycm9yIGlmIGBzdGF0ZWAgaXMgdW5rbm93biBvciBpbnZhbGlkIHN5bnRheC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqIEBpbm5lclxuICAgICAqL1xuICAgIHBhcnNlU3RhdGVTdHJpbmc6IGZ1bmN0aW9uKHN0YXRlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICBzeW50YXggPSBvcHRpb25zICYmIG9wdGlvbnMuc3ludGF4IHx8ICdhdXRvJzsgLy8gZGVmYXVsdCBpcyAnYXV0bydcblxuICAgICAgICAgICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gY29udGV4dC5xdWVyeVNlbGVjdG9yKHN0YXRlKS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3ludGF4ID09PSAnYXV0bycpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4ID0gcmVKU09OLnRlc3Qoc3RhdGUpID8gJ0pTT04nIDogJ1NRTCc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChzeW50YXgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnSlNPTic6XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gSlNPTi5wYXJzZShzdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBGaWx0ZXJUcmVlRXJyb3IoJ0pTT04gcGFyc2VyOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ1NRTCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gdGhpcy5yb290LlBhcnNlclNRTC5wYXJzZShzdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBGaWx0ZXJUcmVlRXJyb3IoJ1NRTCBXSEVSRSBjbGF1c2UgcGFyc2VyOiAnICsgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBGaWx0ZXJUcmVlRXJyb3IoJ1VuZXhwZWN0ZWQgaW5wdXQgc3RhdGUuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBlYWNoIHN0YW5kYXJkIG9wdGlvbiBmcm9tIHdoZW4gZm91bmQgb24gdGhlIGBvcHRpb25zYCBvciBgc3RhdGVgIG9iamVjdHMsIHJlc3BlY3RpdmVseTsgb3IgaWYgbm90IGFuIFwib3duXCIgb3B0aW9uLCBvbiB0aGUgYHBhcmVudGAgb2JqZWN0IG9yIGZyb20gdGhlIG9wdGlvbnMgc2NoZW1hIGRlZmF1bHQgKGlmIGFueSlcbiAgICAgKiBAcGFyYW0gc3RhdGVcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIG1peEluU3RhbmRhcmRPcHRpb25zOiBmdW5jdGlvbihzdGF0ZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXM7XG5cbiAgICAgICAgXyhGaWx0ZXJOb2RlLm9wdGlvbnNTY2hlbWEpLmVhY2goZnVuY3Rpb24ob3B0aW9uU2NoZW1hLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9uU2NoZW1hLmlnbm9yZSAmJiAodGhpcyAhPT0gdGhpcy5yb290IHx8IG9wdGlvblNjaGVtYS5yb290Qm91bmQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbjtcblxuICAgICAgICAgICAgICAgIG5vZGUuZG9udFBlcnNpc3Rba2V5XSA9IC8vIHRydXRoeSBpZiBmcm9tIGBvcHRpb25zYCBvciBgZGVmYXVsdGBcbiAgICAgICAgICAgICAgICAgICAgKG9wdGlvbiA9IG9wdGlvbnMgJiYgb3B0aW9uc1trZXldKSAhPT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICAgICAgIChvcHRpb24gPSBzdGF0ZSAmJiBzdGF0ZVtrZXldKSA9PT0gdW5kZWZpbmVkICYmXG4gICAgICAgICAgICAgICAgICAgICEob3B0aW9uU2NoZW1hLm93biB8fCBub2RlLmhhc093blByb3BlcnR5KGtleSkgJiYgb3B0aW9uICE9PSBudWxsKSAmJlxuICAgICAgICAgICAgICAgICAgICAhKG9wdGlvbiA9IG5vZGUucGFyZW50ICYmIG5vZGUucGFyZW50W2tleV0pICYmXG4gICAgICAgICAgICAgICAgICAgIChvcHRpb24gPSBvcHRpb25TY2hlbWEuZGVmYXVsdCk7XG5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlW2tleV07XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZG9udFBlcnNpc3Rba2V5XSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdzY2hlbWEnICYmICFvcHRpb24ud2Fsaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXR0YWNoIHRoZSBgd2Fsa2AgYW5kIGBmaW5kYCBjb252ZW5pZW5jZSBtZXRob2RzIHRvIHRoZSBgc2NoZW1hYCBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLndhbGsgPSBwb3BNZW51LndhbGsuYmluZChvcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uLmxvb2t1cCA9IHBvcE1lbnUubG9va3VwLmJpbmQob3B0aW9uLCBub2RlLnJvb3QuZmluZE9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5vZGVba2V5XSA9IG9wdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIG1peEluTm9uc3RhbmRhcmRPcHRpb25zOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcztcblxuICAgICAgICAvLyBjb3B5IGFsbCByZW1haW5pbmcgb3B0aW9ucyBkaXJlY3RseSB0byB0aGUgbmV3IGluc3RhbmNlLCBvdmVycmlkaW5nIHByb3RvdHlwZSBtZW1iZXJzIG9mIHRoZSBzYW1lIG5hbWVcbiAgICAgICAgXyhvcHRpb25zKS5lYWNoKGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghRmlsdGVyTm9kZS5vcHRpb25zU2NoZW1hW2tleV0pIHtcbiAgICAgICAgICAgICAgICBub2RlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKiBSZW1vdmUgYm90aDpcbiAgICAgKiAqIGB0aGlzYCBmaWx0ZXIgbm9kZSBmcm9tIGl0J3MgYHBhcmVudGAncyBgY2hpbGRyZW5gIGNvbGxlY3Rpb247IGFuZFxuICAgICAqICogYHRoaXNgIGZpbHRlciBub2RlJ3MgYGVsYCdzIGNvbnRhaW5lciAoYWx3YXlzIGEgYDxsaT5gIGVsZW1lbnQpIGZyb20gaXRzIHBhcmVudCBlbGVtZW50LlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhdmVydCxcbiAgICAgICAgICAgIHBhcmVudCA9IHRoaXMucGFyZW50O1xuXG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRIYW5kbGVyLmNhbGwocGFyZW50LCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdkZWxldGUnLFxuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7IGF2ZXJ0ID0gdHJ1ZTsgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFhdmVydCkge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmtlZXAgfHwgLy8gbmV2ZXIgXCJwcnVuZVwiIChyZW1vdmUgaWYgZW1wdHkpIHRoaXMgcGFydGljdWxhciBzdWJleHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbi5sZW5ndGggPiAxIC8vIHRoaXMgbm9kZSBoYXMgc2libGluZ3Mgc28gd2lsbCBub3QgYmUgZW1wdHkgYWZ0ZXIgdGhpcyByZW1vdmVcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJvY2VlZCB3aXRoIHJlbW92ZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsLnBhcmVudE5vZGUucmVtb3ZlKCk7IC8vIHRoZSBwYXJlbnQgaXMgYWx3YXlzIHRoZSBjb250YWluaW5nIDxsaT4gdGFnXG4gICAgICAgICAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbi5zcGxpY2UocGFyZW50LmNoaWxkcmVuLmluZGV4T2YodGhpcyksIDEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlY3Vyc2UgdG8gcHJ1bmUgZW50aXJlIHN1YmV4cHJlc3Npb24gYmVjYXVzZSBpdCdzIHBydW5lLWFibGUgYW5kIHdvdWxkIGVuZCB1cCBlbXB0eSAoY2hpbGRsZXNzKVxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFdvcmstYXJvdW5kIGZvciBgdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCc6c2NvcGU+JyArIHNlbGVjdG9yKWAgYmVjYXVzZSBgOnNjb3BlYCBub3Qgc3VwcG9ydGVkIGluIElFMTEuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHNlbGVjdG9yXG4gICAgICovXG4gICAgZmlyc3RDaGlsZE9mVHlwZTogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgaWYgKGVsICYmIGVsLnBhcmVudEVsZW1lbnQgIT09IHRoaXMuZWwpIHtcbiAgICAgICAgICAgIGVsID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfSxcblxuICAgIEVycm9yOiBGaWx0ZXJUcmVlRXJyb3IsXG5cbiAgICB0ZW1wbGF0ZXM6IG5ldyBUZW1wbGF0ZXMoKVxufSk7XG5cbi8qKiBAdHlwZWRlZiBvcHRpb25zU2NoZW1hT2JqZWN0XG4gKiBAc3VtbWFyeSBTdGFuZGFyZCBvcHRpb24gc2NoZW1hXG4gKiBAZGVzYyBTdGFuZGFyZCBvcHRpb25zIGFyZSBhdXRvbWF0aWNhbGx5IGFkZGVkIHRvIG5vZGVzLiBEYXRhIHNvdXJjZXMgZm9yIHN0YW5kYXJkIG9wdGlvbnMgaW5jbHVkZSBgb3B0aW9uc2AsIGBzdGF0ZWAsIGBwYXJlbnRgIGFuZCBgZGVmYXVsdGAgKGluIHRoYXQgb3JkZXIpLiBEZXNjcmliZXMgc3RhbmRhcmQgb3B0aW9ucyB0aHJvdWdoIHZhcmlvdXMgcHJvcGVydGllczpcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2lnbm9yZV0gLSBEbyBub3QgYXV0b21hdGljYWxseSBhZGQgdG8gbm9kZXMgKHByb2Nlc3NlZCBlbHNld2hlcmUpLlxuICogQHByb3BlcnR5IHtib29sZWFufSBbb3duXSAtIERvIG5vdCBhdXRvbWF0aWNhbGx5IGFkZCBmcm9tIGBwYXJlbnRgIG9yIGBkZWZhdWx0YC5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3Jvb3RCb3VuZF0gLSBBdXRvbWF0aWNhbGx5IGFkZCB0byByb290IG5vZGUgb25seS5cbiAqIEBwcm9wZXJ0eSB7Kn0gW2RlZmF1bHRdIC0gVGhpcyBpcyB0aGUgZGVmYXVsdCBkYXRhIHNvdXJjZSB3aGVuIGFsbCBvdGhlciBzdHJhdGVnaWVzIGZhaWwuXG4gKi9cblxuLyoqXG4gKiBAc3VtbWFyeSBEZWZpbmVzIHRoZSBzdGFuZGFyZCBvcHRpb25zIGF2YWlsYWJsZSB0byBhIG5vZGUuXG4gKiBAZGVzYyBUaGUgZm9sbG93aW5nIHByb3BlcnRpZXMgYmVhciB0aGUgc2FtZSBuYW1lcyBhcyB0aGUgbm9kZSBvcHRpb25zIHRoZXkgZGVmaW5lLlxuICogQHR5cGUge29iamVjdH1cbiAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlXG4gKi9cbkZpbHRlck5vZGUub3B0aW9uc1NjaGVtYSA9IHtcblxuICAgIHN0YXRlOiB7IGlnbm9yZTogdHJ1ZSB9LFxuXG4gICAgY3NzU3R5bGVzaGVldFJlZmVyZW5jZUVsZW1lbnQ6IHsgaWdub3JlOiB0cnVlIH0sXG5cbiAgICAvKiogQHN1bW1hcnkgRGVmYXVsdCBjb2x1bW4gc2NoZW1hIGZvciBjb2x1bW4gZHJvcC1kb3ducyBvZiBkaXJlY3QgZGVzY2VuZGFudCBsZWFmIG5vZGVzIG9ubHkuXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICogQHR5cGUge3N0cmluZ1tdfVxuICAgICAqL1xuICAgIG93blNjaGVtYTogeyBvd246IHRydWUgfSxcblxuICAgIC8qKiBAc3VtbWFyeSBDb2x1bW4gc2NoZW1hIGZvciBjb2x1bW4gZHJvcC1kb3ducyBvZiBhbGwgZGVzY2VuZGFudCBub2Rlcy4gUGVydGFpbnMgdG8gbGVhZiBub2RlcyBvbmx5LlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqIEB0eXBlIHttZW51SXRlbVtdfVxuICAgICAqL1xuICAgIHNjaGVtYToge30sXG5cbiAgICAvKiogQHN1bW1hcnkgRmlsdGVyIGVkaXRvciBmb3IgdXNlciBpbnRlcmZhY2UuXG4gICAgICogQGRlc2MgTmFtZSBvZiBmaWx0ZXIgZWRpdG9yIHVzZWQgYnkgdGhpcyBhbmQgYWxsIGRlc2NlbmRhbnQgbm9kZXMuIFBlcnRhaW5zIHRvIGxlYWYgbm9kZXMgb25seS5cbiAgICAgKiBAZGVmYXVsdCAnRGVmYXVsdCdcbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVyTm9kZSNcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGVkaXRvcjoge30sXG5cbiAgICAvKiogQHN1bW1hcnkgRXZlbnQgaGFuZGxlciBmb3IgVUkgZXZlbnRzLlxuICAgICAqIEBkZXNjIFNlZSAqRXZlbnRzKiBpbiB0aGUge0BsaW5rIGh0dHA6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlL2luZGV4Lmh0bWx8cmVhZG1lfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVyTm9kZSNcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICovXG4gICAgZXZlbnRIYW5kbGVyOiB7fSxcblxuICAgIC8qKiBAc3VtbWFyeSBGaWVsZHMgZGF0YSB0eXBlLlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgdHlwZTogeyBvd246IHRydWUgfSxcblxuICAgIC8qKiBAc3VtbWFyeSBVbmRlbGV0ZWFibGUgbm9kZS5cbiAgICAgKiBAZGVzYyBUcnV0aHkgbWVhbnMgZG9uJ3QgcmVuZGVyIGEgZGVsZXRlIGJ1dHRvbiBuZXh0IHRvIHRoZSBmaWx0ZXIgZWRpdG9yIGZvciB0aGlzIG5vZGUuXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAga2VlcDogeyBvd246IHRydWUgfSxcblxuICAgIC8qKiBAc3VtbWFyeSBPdmVycmlkZSBvcGVyYXRvciBsaXN0IGF0IGFueSBub2RlLlxuICAgICAqIEBkZXNjIFRoZSBkZWZhdWx0IGlzIGFwcGxpZWQgdG8gdGhlIHJvb3Qgbm9kZSBhbmQgYW55IG90aGVyIG5vZGUgd2l0aG91dCBhbiBvcGVyYXRvciBtZW51LlxuICAgICAqIEBkZWZhdWx0IHtAbGluayBDb25kaXRpb25hbHMuZGVmYXVsdE9wTWVudX0uXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICogQHR5cGUge21lbnVJdGVtW119XG4gICAgICovXG4gICAgb3BNZW51OiB7IGRlZmF1bHQ6IENvbmRpdGlvbmFscy5kZWZhdWx0T3BNZW51IH0sXG5cbiAgICAvKiogQHN1bW1hcnkgVHJ1dGh5IGNvbnNpZGVycyBvcCB2YWxpZCBvbmx5IGlmIGluIG1lbnUuXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgb3BNdXN0QmVJbk1lbnU6IHt9LFxuXG4gICAgLyoqIEBzdW1tYXJ5IERpY3Rpb25hcnkgb2Ygb3BlcmF0b3IgbWVudXMgZm9yIHNwZWNpZmljIGRhdGEgdHlwZXMuXG4gICAgICogQG1lbWJlck9mIEZpbHRlck5vZGUjXG4gICAgICogQHR5cGUge29iamVjdH1cbiAgICAgKiBAZGVzYyBBIGhhc2ggb2YgdHlwZSBuYW1lcy4gRWFjaCBtZW1iZXIgdGh1cyBkZWZpbmVkIGNvbnRhaW5zIGEgc3BlY2lmaWMgb3BlcmF0b3IgbWVudSBmb3IgYWxsIGRlc2NlbmRhbnQgbGVhZiBub2RlcyB0aGF0OlxuICAgICAqIDEuIGRvIG5vdCBoYXZlIHRoZWlyIG93biBvcGVyYXRvciBtZW51IChgb3BNZW51YCBwcm9wZXJ0eSkgb2YgdGhlaXIgb3duOyBhbmRcbiAgICAgKiAyLiB3aG9zZSBjb2x1bW5zIHJlc29sdmUgdG8gdGhhdCB0eXBlLlxuICAgICAqXG4gICAgICogVGhlIHR5cGUgaXMgZGV0ZXJtaW5lZCBieSAoaW4gcHJpb3JpdHkgb3JkZXIpOlxuICAgICAqIDEuIHRoZSBgdHlwZWAgcHJvcGVydHkgb2YgdGhlIHtAbGluayBGaWx0ZXJMZWFmfTsgb3JcbiAgICAgKiAyLiB0aGUgYHR5cGVgIHByb3BlcnR5IG9mIHRoZSBlbGVtZW50IGluIHRoZSBuZWFyZXN0IG5vZGUgKGluY2x1ZGluZyB0aGUgbGVhZiBub2RlIGl0c2VsZikgdGhhdCBoYXMgYSBkZWZpbmVkIGBvd25TY2hlbWFgIG9yIGBzY2hlbWFgIGFycmF5IHByb3BlcnR5IHdpdGggYW4gZWxlbWVudCBoYXZpbmcgYSBtYXRjaGluZyBjb2x1bW4gbmFtZS5cbiAgICAgKi9cbiAgICB0eXBlT3BNYXA6IHsgcm9vdEJvdW5kOiB0cnVlIH0sXG5cbiAgICAvKiogQHN1bW1hcnkgVHJ1dGh5IHdpbGwgc29ydCB0aGUgY29sdW1uIG1lbnVzLlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJOb2RlI1xuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIHNvcnRDb2x1bW5NZW51OiB7fVxufTtcblxuRmlsdGVyTm9kZS5zZXRXYXJuaW5nQ2xhc3MgPSBmdW5jdGlvbihlbCwgdmFsdWUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdmFsdWUgPSBlbC52YWx1ZTtcbiAgICB9XG4gICAgZWwuY2xhc3NMaXN0W3ZhbHVlID8gJ3JlbW92ZScgOiAnYWRkJ10oJ2ZpbHRlci10cmVlLXdhcm5pbmcnKTtcbiAgICByZXR1cm4gdmFsdWU7XG59O1xuXG5GaWx0ZXJOb2RlLmNsaWNrSW4gPSBmdW5jdGlvbihlbCkge1xuICAgIGlmIChlbCkge1xuICAgICAgICBpZiAoZWwudGFnTmFtZSA9PT0gJ1NFTEVDVCcpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGVsLmRpc3BhdGNoRXZlbnQobmV3IE1vdXNlRXZlbnQoJ21vdXNlZG93bicpKTsgfSwgMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbC5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJOb2RlO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbi8vIFRoaXMgaXMgdGhlIG1haW4gZmlsZSwgdXNhYmxlIGFzIGlzLCBzdWNoIGFzIGJ5IC90ZXN0L2luZGV4LmpzLlxuXG4vLyBGb3IgbnBtOiByZXF1aXJlIHRoaXMgZmlsZVxuLy8gRm9yIENETjogZ3VscGZpbGUuanMgYnJvd3NlcmlmaWVzIHRoaXMgZmlsZSB3aXRoIHNvdXJjZW1hcCB0byAvYnVpbGQvZmlsdGVyLXRyZWUuanMgYW5kIHVnbGlmaWVkIHdpdGhvdXQgc291cmNlbWFwIHRvIC9idWlsZC9maWx0ZXItdHJlZS5taW4uanMuIFRoZSBDRE4gaXMgaHR0cHM6Ly9qb25laXQuZ2l0aHViLmlvL2ZpbHRlci10cmVlLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwb3BNZW51ID0gcmVxdWlyZSgncG9wLW1lbnUnKTtcbnZhciB1bnN0cnVuZ2lmeSA9IHJlcXVpcmUoJ3Vuc3RydW5naWZ5Jyk7XG5cbnZhciBfID0gcmVxdWlyZSgnb2JqZWN0LWl0ZXJhdG9ycycpO1xudmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuL0ZpbHRlck5vZGUnKTtcbnZhciBGaWx0ZXJMZWFmID0gcmVxdWlyZSgnLi9GaWx0ZXJMZWFmJyk7XG52YXIgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi90cmVlLW9wZXJhdG9ycycpO1xuXG5cbnZhciBvcmRpbmFsID0gMDtcblxuLyoqIEBjb25zdHJ1Y3RvclxuICogQHN1bW1hcnkgQW4gb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgcm9vdCBub2RlIG9yIGEgYnJhbmNoIG5vZGUgaW4gYSBmaWx0ZXIgdHJlZS5cbiAqIEBkZXNjIEEgbm9kZSByZXByZXNlbnRpbmcgYSBzdWJleHByZXNzaW9uIGluIHRoZSBmaWx0ZXIgZXhwcmVzc2lvbi4gTWF5IGJlIHRob3VnaHQgb2YgYXMgYSBwYXJlbnRoZXNpemVkIHN1YmV4cHJlc3Npb24gaW4gYWxnZWJyYWljIGV4cHJlc3Npb24gc3ludGF4LiBBcyBkaXNjdXNzZWQgdW5kZXIge0BsaW5rIEZpbHRlck5vZGV9LCBhIGBGaWx0ZXJUcmVlYCBpbnN0YW5jZSdzIGNoaWxkIG5vZGVzIG1heSBiZSBlaXRoZXI6XG4gKiAqIE90aGVyIChuZXN0ZWQpIGBGaWx0ZXJUcmVlYCAob3Igc3ViY2xhc3MgdGhlcmVvZikgbm9kZXMgcmVwcmVzZW50aW5nIHN1YmV4cHJlc3Npb25zLlxuICogKiB7QGxpbmsgRmlsdGVyTGVhZn0gKG9yIHN1YmNsYXNzIHRoZXJlb2YpIHRlcm1pbmFsIG5vZGVzIHJlcHJlc2VudGluZyBjb25kaXRpb25hbCBleHByZXNzaW9ucy5cbiAqXG4gKiBUaGUgYEZpbHRlclRyZWVgIG9iamVjdCBhbHNvIGhhcyBtZXRob2RzLCBzb21lIG9mIHdoaWNoIG9wZXJhdGUgb24gYSBzcGVjaWZpYyBzdWJ0cmVlIGluc3RhbmNlLCBhbmQgc29tZSBvZiB3aGljaCByZWN1cnNlIHRocm91Z2ggYWxsIHRoZSBzdWJ0cmVlJ3MgY2hpbGQgbm9kZXMgYW5kIGFsbCB0aGVpciBkZXNjZW5kYW50cywgX2V0Yy5fXG4gKlxuICogVGhlIHJlY3Vyc2l2ZSBtZXRob2RzIGFyZSBpbnRlcmVzdGluZy4gVGhleSBhbGwgd29yayBzaW1pbGFybHksIGxvb3BpbmcgdGhyb3VnaCB0aGUgbGlzdCBvZiBjaGlsZCBub2RlcywgcmVjdXJzaW5nIHdoZW4gdGhlIGNoaWxkIG5vZGUgaXMgYSBuZXN0ZWQgc3VidHJlZSAod2hpY2ggd2lsbCByZWN1cnNlIGZ1cnRoZXIgd2hlbiBpdCBoYXMgaXRzIG93biBuZXN0ZWQgc3VidHJlZXMpOyBhbmQgY2FsbGluZyB0aGUgcG9seW1vcnBoaWMgbWV0aG9kIHdoZW4gdGhlIGNoaWxkIG5vZGUgaXMgYSBgRmlsdGVyTGVhZmAgb2JqZWN0LCB3aGljaCBpcyBhIHRlcm1pbmFsIG5vZGUuIFN1Y2ggcG9seW1vcnBoaWMgbWV0aG9kcyBpbmNsdWRlIGBzZXRTdGF0ZSgpYCwgYGdldFN0YXRlKClgLCBgaW52YWxpZCgpYCwgYW5kIGB0ZXN0KClgLlxuICpcbiAqIEZvciBleGFtcGxlLCBjYWxsaW5nIGB0ZXN0KGRhdGFSb3cpYCBvbiB0aGUgcm9vdCB0cmVlIHJlY3Vyc2VzIHRocm91Z2ggYW55IHN1YnRyZWVzIGV2ZW50dWFsbHkgY2FsbGluZyBgdGVzdChkYXRhUm93KWAgb24gZWFjaCBvZiBpdHMgbGVhZiBub2RlcyBhbmQgY29uY2F0ZW5hdGluZyB0aGUgcmVzdWx0cyB0b2dldGhlciB1c2luZyB0aGUgc3VidHJlZSdzIGBvcGVyYXRvcmAuIFRoZSBzdWJ0cmVlJ3MgYHRlc3QoZGF0YVJvdylgIGNhbGwgdGhlbiByZXR1cm5zIHRoZSByZXN1bHQgdG8gaXQncyBwYXJlbnQncyBgdGVzdCgpYCBjYWxsLCBfZXRjLixfIGV2ZW50dWFsbHkgYnViYmxpbmcgdXAgdG8gdGhlIHJvb3Qgbm9kZSdzIGB0ZXN0KGRhdGFSb3cpYCBjYWxsLCB3aGljaCByZXR1cm5zIHRoZSBmaW5hbCByZXN1bHQgdG8gdGhlIG9yaWdpbmFsIGNhbGxlci4gVGhpcyByZXN1bHQgZGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZGF0YSByb3cgcGFzc2VkIHRocm91Z2ggdGhlIGVudGlyZSBmaWx0ZXIgZXhwcmVzc2lvbiBzdWNjZXNzZnVsbHkgKGB0cnVlYCkgYW5kIHNob3VsZCBiZSBkaXNwbGF5ZWQsIG9yIHdhcyBibG9ja2VkIHNvbWV3aGVyZSAoYGZhbHNlYCkgYW5kIHNob3VsZCBub3QgYmUgZGlzcGxheWVkLlxuICpcbiAqIE5vdGUgdGhhdCBpbiBwcmFjdGljZTpcbiAqIDEuIGBjaGlsZHJlbmAgbWF5IGJlIGVtcHR5LiBUaGlzIHJlcHJlc2VudHMgYSBhbiBlbXB0eSBzdWJleHByZXNzaW9uLiBOb3JtYWxseSBwb2ludGxlc3MsIGVtcHR5IHN1YmV4cHJlc3Npb25zIGNvdWxkIGJlIHBydW5lZC4gRmlsdGVyLXRyZWUgYWxsb3dzIHRoZW0gaG93ZXZlciBhcyBoYXJtbGVzcyBwbGFjZWhvbGRlcnMuXG4gKiAxLiBgb3BlcmF0b3JgIG1heSBiZSBvbWl0dGVkIGluIHdoaWNoIGNhc2UgaXQgZGVmYXVsdHMgdG8gQU5ELlxuICogMS4gQSBgZmFsc2VgIHJlc3VsdCBmcm9tIGEgY2hpbGQgbm9kZSB3aWxsIHNob3J0LXN0b3AgYW4gQU5EIG9wZXJhdGlvbjsgYSBgdHJ1ZWAgcmVzdWx0IHdpbGwgc2hvcnQtc3RvcCBhbiBPUiBvciBOT1Igb3BlcmF0aW9uLlxuICpcbiAqIEFkZGl0aW9uYWwgbm90ZXM6XG4gKiAxLiBBIGBGaWx0ZXJUcmVlYCBtYXkgY29uc2lzdCBvZiBhIHNpbmdsZSBsZWFmLCBpbiB3aGljaCBjYXNlIHRoZSBjb25jYXRlbmF0aW9uIGBvcGVyYXRvcmAgaXMgbm90IG5lZWRlZCBhbmQgbWF5IGJlIGxlZnQgdW5kZWZpbmVkLiBIb3dldmVyLCBpZiBhIHNlY29uZCBjaGlsZCBpcyBhZGRlZCBhbmQgdGhlIG9wZXJhdG9yIGlzIHN0aWxsIHVuZGVmaW5lZCwgaXQgd2lsbCBiZSBzZXQgdG8gdGhlIGRlZmF1bHQgKGAnb3AtYW5kJ2ApLlxuICogMi4gVGhlIG9yZGVyIG9mIHRoZSBjaGlsZHJlbiBpcyB1bmRlZmluZWQgYXMgYWxsIG9wZXJhdG9ycyBhcmUgY29tbXV0YXRpdmUuIEZvciB0aGUgJ2BvcC1vcmAnIG9wZXJhdG9yLCBldmFsdWF0aW9uIGNlYXNlcyBvbiB0aGUgZmlyc3QgcG9zaXRpdmUgcmVzdWx0IGFuZCBmb3IgZWZmaWNpZW5jeSwgYWxsIHNpbXBsZSBjb25kaXRpb25hbCBleHByZXNzaW9ucyB3aWxsIGJlIGV2YWx1YXRlZCBiZWZvcmUgYW55IGNvbXBsZXggc3ViZXhwcmVzc2lvbnMuXG4gKiAzLiBBIG5lc3RlZCBgRmlsdGVyVHJlZWAgaXMgZGlzdGluZ3Vpc2hlZCAoZHVjay10eXBlZCkgZnJvbSBhIGxlYWYgbm9kZSBieSB0aGUgcHJlc2VuY2Ugb2YgYSBgY2hpbGRyZW5gIG1lbWJlci5cbiAqIDQuIE5lc3RpbmcgYSBgRmlsdGVyVHJlZWAgY29udGFpbmluZyBhIHNpbmdsZSBjaGlsZCBpcyB2YWxpZCAoYWxiZWl0IHBvaW50bGVzcykuXG4gKlxuICogKipTZWUgYWxzbyB0aGUgcHJvcGVydGllcyBvZiB0aGUgc3VwZXJjbGFzczoqKiB7QGxpbmsgRmlsdGVyTm9kZX1cbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW29wZXJhdG9yPSdvcC1hbmQnXSAtIFRoZSBvcGVyYXRvciB0aGF0IGNvbmNhdGVudGF0ZXMgdGhlIHRlc3QgcmVzdWx0cyBmcm9tIGFsbCB0aGUgbm9kZSdzIGBjaGlsZHJlbmAgKGNoaWxkIG5vZGVzKS4gTXVzdCBiZSBvbmUgb2Y6XG4gKiAqIGAnb3AtYW5kJ2BcbiAqICogYCdvcC1vcidgXG4gKiAqIGAnb3Atbm9yJ2BcbiAqXG4gKiBOb3RlIHRoYXQgdGhlcmUgaXMgb25seSBvbmUgYG9wZXJhdG9yYCBwZXIgc3ViZXhwcmVzc2lvbi4gSWYgeW91IG5lZWQgdG8gbWl4IG9wZXJhdG9ycywgY3JlYXRlIGEgc3Vib3JkaW5hdGUgc3ViZXhwcmVzc2lvbiBhcyBvbmUgb2YgdGhlIGNoaWxkIG5vZGVzLlxuICpcbiAqIEBwcm9wZXJ0eSB7RmlsdGVyTm9kZVtdfSBjaGlsZHJlbiAtIEEgbGlzdCBvZiBkZXNjZW5kYW50cyBvZiB0aGlzIG5vZGUuIEFzIG5vdGVkLCB0aGVzZSBtYXkgYmUgb3RoZXIgYEZpbHRlclRyZWVgIChvciBzdWJjbGFzcyB0aGVyZW9mKSBub2Rlczsgb3IgbWF5IGJlIHRlcm1pbmFsIGBGaWx0ZXJMZWFmYCAob3Igc3ViY2xhc3MgdGhlcmVvZikgbm9kZXMuIE1heSBiZSBhbnkgbGVuZ3RoIGluY2x1ZGluZyAwIChub25lOyBlbXB0eSkuXG4gKlxuICogQHByb3BlcnR5IHtib29sZWFufSBba2VlcD1mYWxzZV0gLSBEbyBub3QgYXV0b21hdGljYWxseSBwcnVuZSB3aGVuIGxhc3QgY2hpbGQgcmVtb3ZlZC5cbiAqXG4gKiBAcHJvcGVydHkge2ZpZWxkSXRlbVtdfSBbb3duU2NoZW1hXSAtIENvbHVtbiBtZW51IHRvIGJlIHVzZWQgb25seSBieSBsZWFmIG5vZGVzIHRoYXQgYXJlIGNoaWxkcmVuIChkaXJlY3QgZGVzY2VuZGFudHMpIG9mIHRoaXMgbm9kZS5cbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3R5cGU9J3N1YnRyZWUnXSAtIFR5cGUgb2Ygbm9kZSwgZm9yIHJlbmRlcmluZyBwdXJwb3NlczsgbmFtZXMgdGhlIHJlbmRlcmluZyB0ZW1wbGF0ZSB0byB1c2UgdG8gZ2VuZXJhdGUgdGhlIG5vZGUncyBVSSByZXByZXNlbnRhdGlvbi5cbiAqL1xudmFyIEZpbHRlclRyZWUgPSBGaWx0ZXJOb2RlLmV4dGVuZCgnRmlsdGVyVHJlZScsIHtcblxuICAgIC8qKlxuICAgICAqIEhhc2ggb2YgY29uc3RydWN0b3JzIGZvciBvYmplY3RzIHRoYXQgZXh0ZW5kIGZyb20ge0BsaW5rIEZpbHRlckxlYWZ9LCB3aGljaCBpcyB0aGUgYERlZmF1bHRgIG1lbWJlciBoZXJlLlxuICAgICAqXG4gICAgICogQWRkIGFkZGl0aW9uYWwgZWRpdG9ycyB0byB0aGlzIG9iamVjdCAoaW4gdGhlIHByb3RvdHlwZSkgcHJpb3IgdG8gaW5zdGFudGlhdGluZyBhIGxlYWYgbm9kZSB0aGF0IHJlZmVycyB0byBpdC4gVGhpcyBvYmplY3QgZXhpc3RzIGluIHRoZSBwcm90b3R5cGUgYW5kIGFkZGl0aW9ucyB0byBpdCB3aWxsIGFmZmVjdCBhbGwgbm9kZXMgdGhhdCBkb24ndCBoYXZlIHRoZWlyIGFuIFwib3duXCIgaGFzaC5cbiAgICAgKlxuICAgICAqIElmIHlvdSBjcmVhdGUgYW4gXCJvd25cIiBoYXNoIGluIHlvdXIgaW5zdGFuY2UgYmUgc3VyZSB0byBpbmNsdWRlIHRoZSBkZWZhdWx0IGVkaXRvciwgZm9yIGV4YW1wbGU6IGB7IERlZmF1bHQ6IEZpbHRlclRyZWUucHJvdG90eXBlLmVkaXRvcnMuRGVmYXVsdCwgLi4uIH1gLiAoT25lIHdheSBvZiBvdmVycmlkaW5nIHdvdWxkIGJlIHRvIGluY2x1ZGUgc3VjaCBhbiBvYmplY3QgaW4gYW4gYGVkaXRvcnNgIG1lbWJlciBvZiB0aGUgb3B0aW9ucyBvYmplY3QgcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvciBvbiBpbnN0YW50aWF0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgYWxsIG1pc2NlbGxhbmVvdXMgbWVtYmVycyBhcmUgc2ltcGx5IGNvcGllZCB0byB0aGUgbmV3IGluc3RhbmNlLiBOb3QgdG8gYmUgY29uZnVzZWQgd2l0aCB0aGUgc3RhbmRhcmQgb3B0aW9uIGBlZGl0b3JgIHdoaWNoIGlzIGEgc3RyaW5nIGNvbnRhaW5pbmcgYSBrZXkgZnJvbSB0aGlzIGhhc2ggYW5kIHRlbGxzIHRoZSBsZWFmIG5vZGUgd2hhdCB0eXBlIHRvIHVzZS4pXG4gICAgICovXG4gICAgZWRpdG9yczoge1xuICAgICAgICBEZWZhdWx0OiBGaWx0ZXJMZWFmXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFuIGV4dGVuc2lvbiBpcyBhIGhhc2ggb2YgcHJvdG90eXBlIG92ZXJyaWRlcyAobWV0aG9kcywgcHJvcGVydGllcykgdXNlZCB0byBleHRlbmQgdGhlIGRlZmF1bHQgZWRpdG9yLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBba2V5PSdEZWZhdWx0J10gLSBObWUgb2YgdGhlIG5ldyBleHRlbnNpb24gZ2l2ZW4gaW4gYGV4dGAgb3IgbmFtZSBvZiBhbiBleGlzdGluZyBleHRlbnNpb24gaW4gYEZpbHRlclRyZWUuZXh0ZW5zaW9uc2AuIEFzIGEgY29uc3RydWN0b3IsIHNob3VsZCBoYXZlIGFuIGluaXRpYWwgY2FwaXRhbC4gSWYgb21pdHRlZCwgcmVwbGFjZXMgdGhlIGRlZmF1bHQgZWRpdG9yIChGaWx0ZXJMZWFmKS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2V4dF0gQW4gZXh0ZW5zaW9uIGhhc2hcbiAgICAgKiBAcGFyYW0ge0ZpbGVyTGVhZn0gW0Jhc2VFZGl0b3I9dGhpcy5lZGl0b3JzLkRlZmF1bHRdIC0gQ29uc3RydWN0b3IgdG8gZXh0ZW5kIGZyb20uXG4gICAgICogQHJldHVybnMge0ZpbGx0ZXJMZWFmfSBBIG5ldyBjbGFzcyBleHRlbmRlZCBmcm9tIGBCYXNlRWRpdG9yYCAtLSB3aGljaCBpcyBpbml0aWFsbHkgYEZpbHRlckxlYWZgIGJ1dCBtYXkgaXRzZWxmIGhhdmUgYmVlbiBleHRlbmRlZCBieSBhIGNhbGwgdG8gYC5hZGRFZGl0b3IoJ0RlZmF1bHQnLCBleHRlbnNpb24pYC5cbiAgICAgKi9cbiAgICBhZGRFZGl0b3I6IGZ1bmN0aW9uKGtleSwgZXh0LCBCYXNlRWRpdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgLy8gYGtleWAgKHN0cmluZykgd2FzIG9taXR0ZWRcbiAgICAgICAgICAgIEJhc2VFZGl0b3IgPSBleHQ7XG4gICAgICAgICAgICBleHQgPSBrZXk7XG4gICAgICAgICAgICBrZXkgPSAnRGVmYXVsdCc7XG4gICAgICAgIH1cbiAgICAgICAgQmFzZUVkaXRvciA9IEJhc2VFZGl0b3IgfHwgdGhpcy5lZGl0b3JzLkRlZmF1bHQ7XG4gICAgICAgIGV4dCA9IGV4dCB8fCBGaWx0ZXJUcmVlLmV4dGVuc2lvbnNba2V5XTtcbiAgICAgICAgcmV0dXJuICh0aGlzLmVkaXRvcnNba2V5XSA9IEJhc2VFZGl0b3IuZXh0ZW5kKGtleSwgZXh0KSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgbmFtZSBvZiB0aGUgZXhpc3RpbmcgZWRpdG9yIHRvIHJlbW92ZS5cbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVyVHJlZSNcbiAgICAgKi9cbiAgICByZW1vdmVFZGl0b3I6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAoa2V5ID09PSAnRGVmYXVsdCcpIHtcbiAgICAgICAgICAgIHRocm93ICdDYW5ub3QgcmVtb3ZlIGRlZmF1bHQgZWRpdG9yLic7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIHRoaXMuZWRpdG9yc1trZXldO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJUcmVlI1xuICAgICAqL1xuICAgIGNyZWF0ZVZpZXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsID0gdGhpcy50ZW1wbGF0ZXMuZ2V0KFxuICAgICAgICAgICAgdGhpcy50eXBlIHx8ICdzdWJ0cmVlJyxcbiAgICAgICAgICAgICsrb3JkaW5hbCxcbiAgICAgICAgICAgIHRoaXMuc2NoZW1hWzBdICYmIHBvcE1lbnUuZm9ybWF0SXRlbSh0aGlzLnNjaGVtYVswXSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBBZGQgdGhlIGV4cHJlc3Npb24gZWRpdG9ycyB0byB0aGUgXCJhZGQgbmV3XCIgZHJvcC1kb3duXG4gICAgICAgIHZhciBhZGROZXdDdHJsID0gdGhpcy5maXJzdENoaWxkT2ZUeXBlKCdzZWxlY3QnKTtcbiAgICAgICAgaWYgKGFkZE5ld0N0cmwpIHtcbiAgICAgICAgICAgIHZhciBzdWJtZW51LCBvcHRncm91cCxcbiAgICAgICAgICAgICAgICBlZGl0b3JzID0gdGhpcy5lZGl0b3JzO1xuXG4gICAgICAgICAgICBpZiAoYWRkTmV3Q3RybC5sZW5ndGggPT09IDEgJiYgdGhpcy5lZGl0b3JzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgZWRpdG9yIGlzIHRoZSBvbmx5IG9wdGlvbiBiZXNpZGVzIHRoZSBudWxsIHByb21wdCBvcHRpb25cbiAgICAgICAgICAgICAgICAvLyBzbyBtYWtlIGl0IHRoIGVvbmx5IGl0ZW0gaSB0aGUgZHJvcC1kb3duXG4gICAgICAgICAgICAgICAgc3VibWVudSA9IGFkZE5ld0N0cmw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHRoZXJlIGFyZSBhbHJlYWR5IG9wdGlvbnMgYW5kL29yIG11bHRpcGxlIGVkaXRvcnNcbiAgICAgICAgICAgICAgICBzdWJtZW51ID0gb3B0Z3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRncm91cCcpO1xuICAgICAgICAgICAgICAgIG9wdGdyb3VwLmxhYmVsID0gJ0NvbmRpdGlvbmFsIEV4cHJlc3Npb25zJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGVkaXRvcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBlZGl0b3JzW2tleV0ucHJvdG90eXBlLm5hbWUgfHwga2V5O1xuICAgICAgICAgICAgICAgIHN1Ym1lbnUuYXBwZW5kQ2hpbGQobmV3IE9wdGlvbihuYW1lLCBrZXkpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKG9wdGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgYWRkTmV3Q3RybC5hZGQob3B0Z3JvdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBvbmNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvblRyZWVPcENsaWNrLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJUcmVlI1xuICAgICAqL1xuICAgIGxvYWRTdGF0ZTogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9ICdvcC1hbmQnO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG5cbiAgICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5hZGQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIGBzdGF0ZS5jaGlsZHJlbmAgKHJlcXVpcmVkKVxuICAgICAgICAgICAgaWYgKCEoc3RhdGUuY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgdGhpcy5FcnJvcignRXhwZWN0ZWQgYGNoaWxkcmVuYCBwcm9wZXJ0eSB0byBiZSBhbiBhcnJheS4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgYHN0YXRlLm9wZXJhdG9yYCAoaWYgZ2l2ZW4pXG4gICAgICAgICAgICBpZiAoc3RhdGUub3BlcmF0b3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wZXJhdG9yc1tzdGF0ZS5vcGVyYXRvcl0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IHRoaXMuRXJyb3IoJ0V4cGVjdGVkIGBvcGVyYXRvcmAgcHJvcGVydHkgdG8gYmUgb25lIG9mOiAnICsgT2JqZWN0LmtleXMob3BlcmF0b3JzKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5vcGVyYXRvciA9IHN0YXRlLm9wZXJhdG9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdGF0ZS5jaGlsZHJlbi5mb3JFYWNoKHRoaXMuYWRkLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEZpbHRlclRyZWUjXG4gICAgICovXG4gICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJhZGlvQnV0dG9uID0gdGhpcy5maXJzdENoaWxkT2ZUeXBlKCdsYWJlbCA+IGlucHV0W3ZhbHVlPScgKyB0aGlzLm9wZXJhdG9yICsgJ10nKSxcbiAgICAgICAgICAgIGFkZEZpbHRlckxpbmsgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItdHJlZS1hZGQtY29uZGl0aW9uYWwnKTtcblxuICAgICAgICBpZiAocmFkaW9CdXR0b24pIHtcbiAgICAgICAgICAgIHJhZGlvQnV0dG9uLmNoZWNrZWQgPSB0cnVlO1xuICAgICAgICAgICAgb25UcmVlT3BDbGljay5jYWxsKHRoaXMsIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHJhZGlvQnV0dG9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoZW4gbXVsdGlwbGUgZmlsdGVyIGVkaXRvcnMgYXZhaWxhYmxlLCBzaW11bGF0ZSBjbGljayBvbiB0aGUgbmV3IFwiYWRkIGNvbmRpdGlvbmFsXCIgbGlua1xuICAgICAgICBpZiAoYWRkRmlsdGVyTGluayAmJiAhdGhpcy5jaGlsZHJlbi5sZW5ndGggJiYgT2JqZWN0LmtleXModGhpcy5lZGl0b3JzKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB0aGlzWydmaWx0ZXItdHJlZS1hZGQtY29uZGl0aW9uYWwnXSh7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBhZGRGaWx0ZXJMaW5rXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHByb2NlZWQgd2l0aCByZW5kZXJcbiAgICAgICAgRmlsdGVyTm9kZS5wcm90b3R5cGUucmVuZGVyLmNhbGwodGhpcyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBzdW1tYXJ5IENyZWF0ZSBhIG5ldyBub2RlIGFzIHBlciBgc3RhdGVgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zPXtzdGF0ZTp7fX1dIC0gTWF5IGJlIG9uZSBvZjpcbiAgICAgKlxuICAgICAqICogYW4gYG9wdGlvbnNgIG9iamVjdCBjb250YWluaW5nIGEgYHN0YXRlYCBwcm9wZXJ0eVxuICAgICAqICogYSBgc3RhdGVgIG9iamVjdCAoaW4gd2hpY2ggY2FzZSB0aGVyZSBpcyBubyBgb3B0aW9uc2Agb2JqZWN0KVxuICAgICAqXG4gICAgICogSW4gYW55IGNhc2UsIHJlc3VsdGluZyBgc3RhdGVgIG9iamVjdCBtYXkgYmUgZWl0aGVyLi4uXG4gICAgICogKiBBIG5ldyBzdWJ0cmVlIChoYXMgYSBgY2hpbGRyZW5gIHByb3BlcnR5KTpcbiAgICAgKiAgIEFkZCBhIG5ldyBgRmlsdGVyVHJlZWAgbm9kZS5cbiAgICAgKiAqIEEgbmV3IGxlYWYgKG5vIGBjaGlsZHJlbmAgcHJvcGVydHkpOiBhZGQgYSBuZXcgYEZpbHRlckxlYWZgIG5vZGU6XG4gICAgICogICAqIElmIHRoZXJlIGlzIGFuIGBlZGl0b3JgIHByb3BlcnR5OlxuICAgICAqICAgICBBZGQgbGVhZiB1c2luZyBgdGhpcy5lZGl0b3JzW3N0YXRlLmVkaXRvcl1gLlxuICAgICAqICAgKiBPdGhlcndpc2UgKGluY2x1ZGluZyB0aGUgY2FzZSB3aGVyZSBgc3RhdGVgIGlzIHVuZGVmaW5lZCk6XG4gICAgICogICAgIEFkZCBsZWFmIHVzaW5nIGB0aGlzLmVkaXRvcnMuRGVmYXVsdGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmZvY3VzPWZhbHNlXSBDYWxsIGludmFsaWQoKSBhZnRlciBpbnNlcnRpbmcgdG8gZm9jdXMgb24gZmlyc3QgYmxhbmsgY29udHJvbCAoaWYgYW55KS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGaWx0ZXJOb2RlfSBUaGUgbmV3IG5vZGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVyVHJlZSNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIENvbnN0cnVjdG9yLCBuZXdOb2RlO1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIGlmICghb3B0aW9ucy5zdGF0ZSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHsgc3RhdGU6IG9wdGlvbnMgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLnN0YXRlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICBDb25zdHJ1Y3RvciA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBDb25zdHJ1Y3RvciA9IHRoaXMuZWRpdG9yc1tvcHRpb25zLnN0YXRlLmVkaXRvciB8fCAnRGVmYXVsdCddO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucy5wYXJlbnQgPSB0aGlzO1xuICAgICAgICBuZXdOb2RlID0gbmV3IENvbnN0cnVjdG9yKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2gobmV3Tm9kZSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMuZm9jdXMpIHtcbiAgICAgICAgICAgIC8vIGZvY3VzIG9uIGJsYW5rIGNvbnRyb2wgYSBiZWF0IGFmdGVyIGFkZGluZyBpdFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgbmV3Tm9kZS5pbnZhbGlkKG9wdGlvbnMpOyB9LCA3NTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgfSxcblxuICAgIC8qKiBAdHlwZWRlZiB7b2JqZWN0fSBGaWx0ZXJUcmVlVmFsaWRhdGlvbk9wdGlvbnNPYmplY3RcbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFt0aHJvdz1mYWxzZV0gLSBUaHJvdyAoZG8gbm90IGNhdGNoKSBgRmlsdGVyVHJlZUVycm9yYHMuXG4gICAgICogQHByb3BlcnR5IHtib29sZWFufSBbYWxlcnQ9ZmFsc2VdIC0gQW5ub3VuY2UgZXJyb3IgdmlhIHdpbmRvdy5hbGVydCgpIGJlZm9yZSByZXR1cm5pbmcuXG4gICAgICogQHByb3BlcnR5IHtib29sZWFufSBbZm9jdXM9ZmFsc2VdIC0gUGxhY2UgdGhlIGZvY3VzIG9uIHRoZSBvZmZlbmRpbmcgY29udHJvbCBhbmQgZ2l2ZSBpdCBlcnJvciBjb2xvci5cbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7RmlsdGVyVHJlZVZhbGlkYXRpb25PcHRpb25zT2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcmV0dXJucyB7dW5kZWZpbmVkfEZpbHRlclRyZWVFcnJvcn0gYHVuZGVmaW5lZGAgaWYgdmFsaWQ7IG9yIHRoZSBjYXVnaHQgYEZpbHRlclRyZWVFcnJvcmAgaWYgZXJyb3IuXG4gICAgICogQG1lbWJlck9mIEZpbHRlclRyZWUjXG4gICAgICovXG4gICAgaW52YWxpZDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICB2YXIgcmVzdWx0LCB0aHJvd1dhcztcblxuICAgICAgICB0aHJvd1dhcyA9IG9wdGlvbnMudGhyb3c7XG4gICAgICAgIG9wdGlvbnMudGhyb3cgPSB0cnVlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpbnZhbGlkLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVzdWx0ID0gZXJyO1xuXG4gICAgICAgICAgICAvLyBUaHJvdyB3aGVuIHVuZXhwZWN0ZWQgKG5vdCBhIGZpbHRlciB0cmVlIGVycm9yKVxuICAgICAgICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgdGhpcy5FcnJvcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zLnRocm93ID0gdGhyb3dXYXM7XG5cbiAgICAgICAgLy8gQWx0ZXIgYW5kL29yIHRocm93IHdoZW4gcmVxdWVzdGVkXG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFsZXJ0KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmFsZXJ0KHJlc3VsdC5tZXNzYWdlIHx8IHJlc3VsdCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYWxlcnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLnRocm93KSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVzdWx0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YVJvd1xuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqIEBtZW1iZXJPZiBGaWx0ZXJUcmVlI1xuICAgICAqL1xuICAgIHRlc3Q6IGZ1bmN0aW9uIHRlc3QoZGF0YVJvdykge1xuICAgICAgICB2YXIgb3BlcmF0b3IgPSBvcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0sXG4gICAgICAgICAgICByZXN1bHQgPSBvcGVyYXRvci5zZWVkLFxuICAgICAgICAgICAgbm9DaGlsZHJlbkRlZmluZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZmluZChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgbm9DaGlsZHJlbkRlZmluZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQgaW5zdGFuY2VvZiBGaWx0ZXJMZWFmKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG9wZXJhdG9yLnJlZHVjZShyZXN1bHQsIGNoaWxkLnRlc3QoZGF0YVJvdykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IG9wZXJhdG9yLnJlZHVjZShyZXN1bHQsIHRlc3QuY2FsbChjaGlsZCwgZGF0YVJvdykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0ID09PSBvcGVyYXRvci5hYm9ydDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9DaGlsZHJlbkRlZmluZWQgfHwgKG9wZXJhdG9yLm5lZ2F0ZSA/ICFyZXN1bHQgOiByZXN1bHQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBOdW1iZXIgb2YgZmlsdGVycyAodGVybWluYWwgbm9kZXMpIGRlZmluZWQgaW4gdGhpcyBzdWJ0cmVlLlxuICAgICAqL1xuICAgIGZpbHRlckNvdW50OiBmdW5jdGlvbiBmaWx0ZXJDb3VudCgpIHtcbiAgICAgICAgdmFyIG4gPSAwO1xuXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgbiArPSBjaGlsZCBpbnN0YW5jZW9mIEZpbHRlckxlYWYgPyAxIDogZmlsdGVyQ291bnQuY2FsbChjaGlsZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuO1xuICAgIH0sXG5cbiAgICAvKiogQHR5cGVkZWYge29iamVjdH0gRmlsdGVyVHJlZUdldFN0YXRlT3B0aW9uc09iamVjdFxuICAgICAqXG4gICAgICogQHN1bW1hcnkgT2JqZWN0IGNvbnRhaW5pbmcgb3B0aW9ucyBmb3IgcHJvZHVjaW5nIGEgc3RhdGUgb2JqZWN0LlxuICAgICAqXG4gICAgICogQGRlc2MgU3RhdGUgaXMgY29tbW9ubHkgdXNlZCBmb3IgdHdvIHB1cnBvc2VzOlxuICAgICAqIDEuIFRvIHBlcnNpc3QgdGhlIGZpbHRlciBzdGF0ZSBzbyB0aGF0IGl0IGNhbiBiZSByZWxvYWRlZCBsYXRlci5cbiAgICAgKiAyLiBUbyBzZW5kIGEgcXVlcnkgdG8gYSBkYXRhYmFzZSBlbmdpbmUuXG4gICAgICpcbiAgICAgKiBAcHJvcGVydHkge2Jvb2xlYW59IFtzeW50YXg9J29iamVjdCddIC0gQSBjYXNlLXNlbnNpdGl2ZSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgZXhwZWN0ZWQgdHlwZSBhbmQgZm9ybWF0IG9mIGEgc3RhdGUgb2JqZWN0IHRvIGJlIGdlbmVyYXRlZCBmcm9tIGEgZmlsdGVyIHRyZWUuIE9uZSBvZjpcbiAgICAgKiAqIGAnb2JqZWN0J2AgKGRlZmF1bHQpIEEgcmF3IHN0YXRlIG9iamVjdCBwcm9kdWNlZCBieSB3YWxraW5nIHRoZSB0cmVlIHVzaW5nIGB7QGxpbmsgaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvdW5zdHJ1bmdpZnl8dW5zdHJ1bmdpZnkoKX1gLCByZXNwZWN0aW5nIGBKU09OLnN0cmluZ2lmeSgpYCdzIFwie0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0pTT04vc3RyaW5naWZ5I3RvSlNPTigpX2JlaGF2aW9yfHRvSlNPTigpIGJlaGF2aW9yfSxcIiBhbmQgcmV0dXJuaW5nIGEgcGxhaW4gb2JqZWN0IHN1aXRhYmxlIGZvciByZXN1Ym1pdHRpbmcgdG8ge0BsaW5rIEZpbHRlck5vZGUjc2V0U3RhdGV8c2V0U3RhdGV9LiBUaGlzIGlzIGFuIFwiZXNzZW50aWFsXCIgdmVyc2lvbiBvZiB0aGUgYWN0dWFsIG5vZGUgb2JqZWN0cyBpbiB0aGUgdHJlZS5cbiAgICAgKiAqIGAnSlNPTidgIC0gQSBzdHJpbmdpZmllZCBzdGF0ZSBvYmplY3QgcHJvZHVjZWQgYnkgd2Fsa2luZyB0aGUgdHJlZSB1c2luZyBge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0pTT04vc3RyaW5naWZ5I3RvSlNPTigpX2JlaGF2aW9yfEpTT04uc3RyaW5naWZ5KCl9YCwgcmV0dXJuaW5nIGEgSlNPTiBzdHJpbmcgYnkgY2FsbGluZyBgdG9KU09OYCBhdCBldmVyeSBub2RlLiBUaGlzIGlzIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBzYW1lIFwiZXNzZW50aWFsXCIgb2JqZWN0IGFzIHRoYXQgcHJvZHVjZWQgYnkgdGhlIGAnb2JqZWN0J2Agb3B0aW9uLCBidXQgXCJzdHJpbmdpZmllZFwiIGFuZCB0aGVyZWZvcmUgc3VpdGFibGUgZm9yIHRleHQtYmFzZWQgc3RvcmFnZSBtZWRpYS5cbiAgICAgKiAqIGAnU1FMJ2AgLSBUaGUgc3ViZXhwcmVzc2lvbiBpbiBTUUwgY29uZGl0aW9uYWwgc3ludGF4IHByb2R1Y2VkIGJ5IHdhbGtpbmcgdGhlIHRyZWUgYW5kIHJldHVybmluZyBhIFNRTCBbc2VhcmNoIGNvbmRpdGlvbiBleHByZXNzaW9uXXtAbGluayBodHRwczovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L21zMTczNTQ1LmFzcHh9LiBTdWl0YWJsZSBmb3IgdXNlIGluIHRoZSBXSEVSRSBjbGF1c2Ugb2YgYSBTUUwgYFNFTEVDVGAgc3RhdGVtZW50IHVzZWQgdG8gcXVlcnkgYSBkYXRhYmFzZSBmb3IgYSBmaWx0ZXJlZCByZXN1bHQgc2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbc3BhY2VdIC0gV2hlbiBgb3B0aW9ucy5zeW50YXggPT09ICdKU09OJ2AsIGZvcndhcmRlZCB0byBgSlNPTi5zdHJpbmdpZnlgIGFzIHRoZSB0aGlyZCBwYXJhbWV0ZXIsIGBzcGFjZWAgKHNlZSkuXG4gICAgICpcbiAgICAgKiBOT1RFOiBUaGUgU1FMIHN5bnRheCByZXN1bHQgY2Fubm90IGFjY29tbW9kYXRlIG5vZGUgbWV0YS1kYXRhLiBXaGlsZSBtZXRhLWRhdGEgc3VjaCBhcyBgdHlwZWAgdHlwaWNhbGx5IGNvbWVzIGZyb20gdGhlIGNvbHVtbiBzY2hlbWEsIG1ldGEtZGF0YSBjYW4gYmUgaW5zdGFsbGVkIGRpcmVjdGx5IG9uIGEgbm9kZS4gU3VjaCBtZXRhLWRhdGEgd2lsbCBub3QgYmUgcGFydCBvZiB0aGUgcmVzdWx0aW5nIFNRTCBleHByZXNzaW9uLiBGb3IgdGhpcyByZWFzb24sIFNRTCBzaG91bGQgbm90IGJlIHVzZWQgdG8gcGVyc2lzdCBmaWx0ZXIgc3RhdGUgYnV0IHJhdGhlciBpdHMgdXNlIHNob3VsZCBiZSBsaW1pdGVkIHRvIGdlbmVyYXRpbmcgYSBmaWx0ZXIgcXVlcnkgZm9yIGEgcmVtb3RlIGRhdGEgc2VydmVyLlxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgR2V0IGEgcmVwcmVzZW50YXRpb24gb2YgZmlsdGVyIHN0YXRlLlxuICAgICAqIEBkZXNjIENhbGxpbmcgdGhpcyBvbiB0aGUgcm9vdCB3aWxsIGdldCB0aGUgZW50aXJlIHRyZWUncyBzdGF0ZTsgY2FsbGluZyB0aGlzIG9uIGFueSBzdWJ0cmVlIHdpbGwgZ2V0IGp1c3QgdGhhdCBzdWJ0cmVlJ3Mgc3RhdGUuXG4gICAgICpcbiAgICAgKiBPbmx5IF9lc3NlbnRpYWxfIHByb3BlcnRpZXMgd2lsbCBiZSBvdXRwdXQ6XG4gICAgICpcbiAgICAgKiAxLiBgRmlsdGVyVHJlZWAgbm9kZXMgd2lsbCBvdXRwdXQgYXQgbGVhc3QgMiBwcm9wZXJ0aWVzOlxuICAgICAqICAgICogYG9wZXJhdG9yYFxuICAgICAqICAgICogYGNoaWxkcmVuYFxuICAgICAqIDIuIGBGaWx0ZXJMZWFmYCBub2RlcyB3aWxsIG91dHB1dCAodmlhIHtAbGluayBGaWx0ZXJMZWFmI2dldFN0YXRlfGdldFN0YXRlfSkgYXQgbGVhc3QgMyBwcm9wZXJ0aWVzLCBvbmUgcHJvcGVydHkgZm9yIGVhY2ggaXRlbSBpbiBpdCdzIGB2aWV3YDpcbiAgICAgKiAgICAqIGBjb2x1bW5gXG4gICAgICogICAgKiBgb3BlcmF0b3JgXG4gICAgICogICAgKiBgb3BlcmFuZGBcbiAgICAgKiAzLiBBZGRpdGlvbmFsIG5vZGUgcHJvcGVydGllcyB3aWxsIGJlIG91dHB1dCB3aGVuOlxuICAgICAqICAgIDEuIFdoZW4gdGhlIHByb3BlcnR5IHdhcyAqKk5PVCoqIGV4dGVybmFsbHkgc291cmNlZDpcbiAgICAgKiAgICAgICAxLiBEaWQgKm5vdCogY29tZSBmcm9tIHRoZSBgb3B0aW9uc2Agb2JqZWN0IG9uIG5vZGUgaW5zdGFudGlhdGlvbi5cbiAgICAgKiAgICAgICAyLiBEaWQgKm5vdCogY29tZSBmcm9tIHRoZSBvcHRpb25zIHNjaGVtYSBgZGVmYXVsdGAgb2JqZWN0LCBpZiBhbnkuXG4gICAgICogICAgMi4gKipBTkQqKiBhdCBsZWFzdCBvbmUgb2YgdGhlIGZvbGxvd2luZyBpcyB0cnVlOlxuICAgICAqICAgICAgIDEuIFdoZW4gaXQncyBhbiBcIm93blwiIHByb3BlcnR5LlxuICAgICAqICAgICAgIDIuIFdoZW4gaXRzIHZhbHVlIGRpZmZlcnMgZnJvbSBpdCdzIHBhcmVudCdzLlxuICAgICAqICAgICAgIDMuIFdoZW4gdGhpcyBpcyB0aGUgcm9vdCBub2RlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWx0ZXJUcmVlR2V0U3RhdGVPcHRpb25zT2JqZWN0fSBbb3B0aW9uc11cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnMuc3FsSWRRdHNdIC0gV2hlbiBgb3B0aW9ucy5zeW50YXggPT09ICdTUUwnYCwgZm9yd2FyZGVkIHRvIGBjb25kaXRpb25hbHMucHVzaFNxbElkUXRzKClgLlxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8c3RyaW5nfSBSZXR1cm5zIG9iamVjdCB3aGVuIGBvcHRpb25zLnN5bnRheCA9PT0gJ29iamVjdCdgOyBvdGhlcndpc2UgcmV0dXJucyBzdHJpbmcuXG4gICAgICogQG1lbWJlck9mIEZpbHRlclRyZWUjXG4gICAgICovXG4gICAgZ2V0U3RhdGU6IGZ1bmN0aW9uIGdldFN0YXRlKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9ICcnLFxuICAgICAgICAgICAgc3ludGF4ID0gb3B0aW9ucyAmJiBvcHRpb25zLnN5bnRheCB8fCAnb2JqZWN0JztcblxuICAgICAgICBzd2l0Y2ggKHN5bnRheCkge1xuICAgICAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB1bnN0cnVuZ2lmeS5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdKU09OJzpcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBKU09OLnN0cmluZ2lmeSh0aGlzLCBudWxsLCBvcHRpb25zICYmIG9wdGlvbnMuc3BhY2UpIHx8ICcnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdTUUwnOlxuICAgICAgICAgICAgICAgIHZhciBsZXhlbWUgPSBvcGVyYXRvcnNbdGhpcy5vcGVyYXRvcl0uU1FMO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkLCBpZHgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9wID0gaWR4ID8gJyAnICsgbGV4ZW1lLm9wICsgJyAnIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEZpbHRlckxlYWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCArPSBvcCArIGNoaWxkLmdldFN0YXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IG9wICsgZ2V0U3RhdGUuY2FsbChjaGlsZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbGV4ZW1lLmJlZyArIHJlc3VsdCArIGxleGVtZS5lbmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyB0aGlzLkVycm9yKCdVbmtub3duIHN5bnRheCBvcHRpb24gXCInICsgc3ludGF4ICsgJ1wiJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uIHRvSlNPTigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgc3RhdGUgPSB7XG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IHRoaXMub3BlcmF0b3IsXG4gICAgICAgICAgICAgICAgY2hpbGRyZW46IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCkge1xuICAgICAgICAgICAgc3RhdGUuY2hpbGRyZW4ucHVzaChjaGlsZCBpbnN0YW5jZW9mIEZpbHRlckxlYWYgPyBjaGlsZCA6IHRvSlNPTi5jYWxsKGNoaWxkKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF8oRmlsdGVyTm9kZS5vcHRpb25zU2NoZW1hKS5lYWNoKGZ1bmN0aW9uKG9wdGlvblNjaGVtYSwga2V5KSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgc2VsZltrZXldICYmIC8vIHRoZXJlIGlzIGEgc3RhbmRhcmQgb3B0aW9uIG9uIHRoZSBub2RlIHdoaWNoIG1heSBuZWVkIHRvIGJlIG91dHB1dFxuICAgICAgICAgICAgICAgICFzZWxmLmRvbnRQZXJzaXN0W2tleV0gJiYgKFxuICAgICAgICAgICAgICAgICAgICBvcHRpb25TY2hlbWEub3duIHx8IC8vIG91dHB1dCBiZWNhdXNlIGl0J3MgYW4gXCJvd25cIiBvcHRpb24gKGJlbG9uZ3MgdG8gdGhlIG5vZGUpXG4gICAgICAgICAgICAgICAgICAgICFzZWxmLnBhcmVudCB8fCAvLyBvdXRwdXQgYmVjYXVzZSBpdCdzIHRoZSByb290IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgc2VsZltrZXldICE9PSBzZWxmLnBhcmVudFtrZXldIC8vIG91dHB1dCBiZWNhdXNlIGl0IGRpZmZlcnMgZnJvbSBpdHMgcGFyZW50J3MgdmVyc2lvblxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHN0YXRlW2tleV0gPSBzZWxmW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHN1bW1hcnkgU2V0IHRoZSBjYXNlIHNlbnNpdGl2aXR5IG9mIGZpbHRlciB0ZXN0cyBhZ2FpbnN0IGRhdGEuXG4gICAgICogQGRlc2MgQ2FzZSBzZW5zaXRpdml0eSBwZXJ0YWlucyB0byBzdHJpbmcgY29tcGFyZXMgb25seS4gVGhpcyBpbmNsdWRlcyB1bnR5cGVkIGNvbHVtbnMsIGNvbHVtbnMgdHlwZWQgYXMgc3RyaW5ncywgdHlwZWQgY29sdW1ucyBjb250YWluaW5nIGRhdGEgdGhhdCBjYW5ub3QgYmUgY29lcmNlZCB0byB0eXBlIG9yIHdoZW4gdGhlIGZpbHRlciBleHByZXNzaW9uIG9wZXJhbmQgY2Fubm90IGJlIGNvZXJjZWQuXG4gICAgICpcbiAgICAgKiBOT1RFOiBUaGlzIGlzIGEgc2hhcmVkIHByb3BlcnR5IGFuZCBhZmZlY3RzIGFsbCBmaWx0ZXItdHJlZSBpbnN0YW5jZXMgY29uc3RydWN0ZWQgYnkgdGhpcyBjb2RlIGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNTZW5zaXRpdmVcbiAgICAgKiBAbWVtYmVyT2YgRmlsdGVydHJlZSMucHJvdG90eXBlXG4gICAgICovXG4gICAgc2V0IGNhc2VTZW5zaXRpdmVEYXRhKGlzU2Vuc2l0aXZlKSB7XG4gICAgICAgIHZhciB0b1N0cmluZyA9IGlzU2Vuc2l0aXZlID8gdG9TdHJpbmdDYXNlU2Vuc2l0aXZlIDogdG9TdHJpbmdDYXNlSW5zZW5zaXRpdmU7XG4gICAgICAgIEZpbHRlckxlYWYuc2V0VG9TdHJpbmcodG9TdHJpbmcpO1xuICAgIH1cblxufSk7XG5cbmZ1bmN0aW9uIHRvU3RyaW5nQ2FzZUluc2Vuc2l0aXZlKHMpIHsgcmV0dXJuIChzICsgJycpLnRvVXBwZXJDYXNlKCk7IH1cbmZ1bmN0aW9uIHRvU3RyaW5nQ2FzZVNlbnNpdGl2ZShzKSB7IHJldHVybiBzICsgJyc7IH1cblxuLy8gU29tZSBldmVudCBoYW5kbGVycyBib3VuZCB0byBGaWx0ZXJUcmVlIG9iamVjdFxuXG5mdW5jdGlvbiBvbmNoYW5nZShldnQpIHsgLy8gY2FsbGVkIGluIGNvbnRleHRcbiAgICB2YXIgY3RybCA9IGV2dC50YXJnZXQ7XG4gICAgaWYgKGN0cmwucGFyZW50RWxlbWVudCA9PT0gdGhpcy5lbCkge1xuICAgICAgICBpZiAoY3RybC52YWx1ZSA9PT0gJ3N1YmV4cCcpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChuZXcgRmlsdGVyVHJlZSh7XG4gICAgICAgICAgICAgICAgcGFyZW50OiB0aGlzXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFkZCh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHsgZWRpdG9yOiBjdHJsLnZhbHVlIH0sXG4gICAgICAgICAgICAgICAgZm9jdXM6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGN0cmwuc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvblRyZWVPcENsaWNrKGV2dCkgeyAvLyBjYWxsZWQgaW4gY29udGV4dFxuICAgIHZhciBjdHJsID0gZXZ0LnRhcmdldDtcblxuICAgIGlmIChjdHJsLmNsYXNzTmFtZSA9PT0gJ2ZpbHRlci10cmVlLW9wLWNob2ljZScpIHtcbiAgICAgICAgdGhpcy5vcGVyYXRvciA9IGN0cmwudmFsdWU7XG5cbiAgICAgICAgLy8gZGlzcGxheSBzdHJpa2UtdGhyb3VnaFxuICAgICAgICB2YXIgcmFkaW9CdXR0b25zID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yQWxsKCdsYWJlbD5pbnB1dC5maWx0ZXItdHJlZS1vcC1jaG9pY2VbbmFtZT0nICsgY3RybC5uYW1lICsgJ10nKTtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChyYWRpb0J1dHRvbnMsIGZ1bmN0aW9uKGN0cmwpIHtcbiAgICAgICAgICAgIGN0cmwucGFyZW50RWxlbWVudC5zdHlsZS50ZXh0RGVjb3JhdGlvbiA9IGN0cmwuY2hlY2tlZCA/ICdub25lJyA6ICdsaW5lLXRocm91Z2gnO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBkaXNwbGF5IG9wZXJhdG9yIGJldHdlZW4gZmlsdGVycyBieSBhZGRpbmcgb3BlcmF0b3Igc3RyaW5nIGFzIGEgQ1NTIGNsYXNzIG9mIHRoaXMgdHJlZVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gb3BlcmF0b3JzKSB7XG4gICAgICAgICAgICB0aGlzLmVsLmNsYXNzTGlzdC5yZW1vdmUoa2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVsLmNsYXNzTGlzdC5hZGQodGhpcy5vcGVyYXRvcik7XG4gICAgfVxufVxuXG4vKipcbiAqIFRocm93cyBlcnJvciBpZiBpbnZhbGlkIGV4cHJlc3Npb24gdHJlZS5cbiAqIENhdWdodCBieSB7QGxpbmsgRmlsdGVyVHJlZSNpbnZhbGlkfEZpbHRlclRyZWUucHJvdG90eXBlLmludmFsaWQoKX0uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLmZvY3VzPWZhbHNlXSAtIE1vdmUgZm9jdXMgdG8gb2ZmZW5kaW5nIGNvbnRyb2wuXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfSBpZiB2YWxpZFxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gaW52YWxpZChvcHRpb25zKSB7IC8vIGNhbGxlZCBpbiBjb250ZXh0XG4gICAgLy9pZiAodGhpcyBpbnN0YW5jZW9mIEZpbHRlclRyZWUgJiYgIXRoaXMuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgLy8gICAgdGhyb3cgbmV3IHRoaXMuRXJyb3IoJ0VtcHR5IHN1YmV4cHJlc3Npb24gKG5vIGZpbHRlcnMpLicpO1xuICAgIC8vfVxuXG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIEZpbHRlckxlYWYpIHtcbiAgICAgICAgICAgIGNoaWxkLmludmFsaWQob3B0aW9ucyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgICBpbnZhbGlkLmNhbGwoY2hpbGQsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbkZpbHRlclRyZWUuZXh0ZW5zaW9ucyA9IHtcbiAgICBDb2x1bW5zOiByZXF1aXJlKCcuL2V4dGVuc2lvbnMvY29sdW1ucycpXG59O1xuXG4vLyBtb2R1bGUgaW5pdGlhbGl6YXRpb25cbkZpbHRlclRyZWUucHJvdG90eXBlLmNhc2VTZW5zaXRpdmVEYXRhID0gdHJ1ZTsgIC8vIGRlZmF1bHQgaXMgY2FzZS1zZW5zaXRpdmUgd2hpY2ggaXMgbW9yZSBlZmZpY2llbnQ7IG1heSBiZSByZXNldCBhdCB3aWxsXG5cblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJUcmVlO1xuIiwiLyogZXNsaW50LWVudiBicm93c2VyICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHRlbXBsZXggPSByZXF1aXJlKCd0ZW1wbGV4Jyk7XG5cbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuLi9odG1sJyk7XG5cbnZhciBlbmNvZGVycyA9IC9cXHsoXFxkKylcXDplbmNvZGVcXH0vZztcblxuZnVuY3Rpb24gVGVtcGxhdGVzKCkge31cbnZhciBjb25zdHJ1Y3RvciA9IFRlbXBsYXRlcy5wcm90b3R5cGUuY29uc3RydWN0b3I7XG5UZW1wbGF0ZXMucHJvdG90eXBlID0gdGVtcGxhdGVzO1xuVGVtcGxhdGVzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yOyAvLyByZXN0b3JlIGl0XG5UZW1wbGF0ZXMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHRlbXBsYXRlTmFtZSkgeyAvLyBtaXggaXQgaW5cbiAgICB2YXIga2V5cyxcbiAgICAgICAgbWF0Y2hlcyA9IHt9LFxuICAgICAgICB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gICAgICAgIHRleHQgPSB0aGlzW3RlbXBsYXRlTmFtZV0sXG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgZW5jb2RlcnMubGFzdEluZGV4ID0gMDtcblxuICAgIHdoaWxlICgoa2V5cyA9IGVuY29kZXJzLmV4ZWModGV4dCkpKSB7XG4gICAgICAgIG1hdGNoZXNba2V5c1sxXV0gPSB0cnVlO1xuICAgIH1cblxuICAgIGtleXMgPSBPYmplY3Qua2V5cyhtYXRjaGVzKTtcblxuICAgIGlmIChrZXlzLmxlbmd0aCkge1xuICAgICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB0ZW1wLnRleHRDb250ZW50ID0gYXJnc1trZXldO1xuICAgICAgICAgICAgYXJnc1trZXldID0gdGVtcC5pbm5lckhUTUw7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGVuY29kZXJzLCAneyQxfScpO1xuICAgIH1cblxuICAgIHRlbXAuaW5uZXJIVE1MID0gdGVtcGxleC5hcHBseSh0aGlzLCBbdGV4dF0uY29uY2F0KGFyZ3MpKTtcblxuICAgIC8vIGlmIG9ubHkgb25lIEhUTUxFbGVtZW50LCByZXR1cm4gaXQ7IG90aGVyd2lzZSBlbnRpcmUgbGlzdCBvZiBub2Rlc1xuICAgIHJldHVybiB0ZW1wLmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0ZW1wLmNoaWxkTm9kZXMubGVuZ3RoID09PSAxXG4gICAgICAgID8gdGVtcC5maXJzdENoaWxkXG4gICAgICAgIDogdGVtcC5jaGlsZE5vZGVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25kaXRpb25hbHMgPSByZXF1aXJlKCcuLi9Db25kaXRpb25hbHMnKTtcbnZhciBGaWx0ZXJMZWFmID0gcmVxdWlyZSgnLi4vRmlsdGVyTGVhZicpO1xuXG4vKipcbiAqIEBzdW1tYXJ5IFByb3RvdHlwZSBhZGRpdGlvbnMgb2JqZWN0IGZvciBleHRlbmRpbmcge0BsaW5rIEZpbHRlckxlYWZ9LlxuICogQGRlc2MgUmVzdWx0aW5nIG9iamVjdCBpcyBzaW1pbGFyIHRvIHtAbGluayBGaWx0ZXJMZWFmfSBleGNlcHQ6XG4gKiAxLiBUaGUgYG9wZXJhbmRgIHByb3BlcnR5IG5hbWVzIGFub3RoZXIgY29sdW1uIHJhdGhlciB0aGFuIGNvbnRhaW5zIGEgbGl0ZXJhbC5cbiAqIDIuIE9wZXJhdG9ycyBhcmUgbGltaXRlZCB0byBlcXVhbGl0eSwgaW5lcXVhbGl0aWVzLCBhbmQgc2V0cyAoSU4vTk9UIElOKS4gT21pdHRlZCBhcmUgdGhlIHN0cmluZyBhbmQgcGF0dGVybiBzY2FucyAoQkVHSU5TL05PVCBCRUdJTlMsIEVORFMvTk9UIEVORFMsIENPTlRBSU5TL05PVCBDT05UQUlOUywgYW5kIExJS0UvTk9UIExJS0UpLlxuICpcbiAqIEBleHRlbmRzIEZpbHRlckxlYWZcbiAqXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRlbnRpZmllciAtIE5hbWUgb2YgY29sdW1uIChtZW1iZXIgb2YgZGF0YSByb3cgb2JqZWN0KSB0byBjb21wYXJlIGFnYWluc3QgdGhpcyBjb2x1bW4gKG1lbWJlciBvZiBkYXRhIHJvdyBvYmplY3QgbmFtZWQgYnkgYGNvbHVtbmApLlxuICovXG52YXIgQ29sdW1uTGVhZiA9IHtcbiAgICBuYW1lOiAnY29sdW1uID0gY29sdW1uJywgLy8gZGlzcGxheSBzdHJpbmcgZm9yIGRyb3AtZG93blxuXG4gICAgY3JlYXRlVmlldzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYHZpZXdgIGhhc2ggYW5kIGluc2VydCB0aGUgdGhyZWUgZGVmYXVsdCBlbGVtZW50cyAoYGNvbHVtbmAsIGBvcGVyYXRvcmAsIGBvcGVyYW5kYCkgaW50byBgLmVsYFxuICAgICAgICBGaWx0ZXJMZWFmLnByb3RvdHlwZS5jcmVhdGVWaWV3LmNhbGwodGhpcyk7XG5cbiAgICAgICAgLy8gUmVwbGFjZSB0aGUgYG9wZXJhbmRgIGVsZW1lbnQgZnJvbSB0aGUgYHZpZXdgIGhhc2hcbiAgICAgICAgdmFyIG9sZE9wZXJhbmQgPSB0aGlzLnZpZXcub3BlcmFuZCxcbiAgICAgICAgICAgIG5ld09wZXJhbmQgPSB0aGlzLnZpZXcub3BlcmFuZCA9IHRoaXMubWFrZUVsZW1lbnQodGhpcy5yb290LnNjaGVtYSwgJ2NvbHVtbicsIHRoaXMuc29ydENvbHVtbk1lbnUpO1xuXG4gICAgICAgIC8vIFJlcGxhY2UgdGhlIG9wZXJhbmQgZWxlbWVudCB3aXRoIHRoZSBuZXcgb25lLiBUaGVyZSBhcmUgbm8gZXZlbnQgbGlzdGVuZXJzIHRvIHdvcnJ5IGFib3V0LlxuICAgICAgICB0aGlzLmVsLnJlcGxhY2VDaGlsZChuZXdPcGVyYW5kLCBvbGRPcGVyYW5kKTtcbiAgICB9LFxuXG4gICAgbWFrZVNxbE9wZXJhbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LmNvbmRpdGlvbmFscy5tYWtlU3FsSWRlbnRpZmllcih0aGlzLm9wZXJhbmQpO1xuICAgIH0sXG5cbiAgICBvcE1lbnU6IFtcbiAgICAgICAgQ29uZGl0aW9uYWxzLmdyb3Vwcy5lcXVhbGl0eSxcbiAgICAgICAgQ29uZGl0aW9uYWxzLmdyb3Vwcy5pbmVxdWFsaXRpZXMsXG4gICAgICAgIENvbmRpdGlvbmFscy5ncm91cHMuc2V0c1xuICAgIF0sXG5cbiAgICBxOiBmdW5jdGlvbihkYXRhUm93KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbE9yRnVuYyhkYXRhUm93LCB0aGlzLm9wZXJhbmQsIHRoaXMuY2FsY3VsYXRvcik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2x1bW5MZWFmO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVPcCA9IC9eKCg9fD49P3w8Wz49XT8pfChOT1QgKT8oTElLRXxJTilcXGIpL2ksIC8vIG1hdGNoWzFdXG4gICAgcmVGbG9hdCA9IC9eKFsrLV0/KFxcZCsoXFwuXFxkKik/fFxcZCpcXC5cXGQrKShlWystXVxcZCspPylbXlxcZF0/L2ksXG4gICAgcmVMaXQgPSAvXicoXFxkKyknLyxcbiAgICByZUxpdEFueXdoZXJlID0gLycoXFxkKyknLyxcbiAgICByZUluID0gL15cXCgoLio/KVxcKS8sXG4gICAgcmVCb29sID0gL14oQU5EfE9SKVxcYi9pLFxuICAgIHJlR3JvdXAgPSAvXihOT1QgPyk/XFwoL2k7XG5cbnZhciBTUVQgPSAnXFwnJztcblxudmFyIGRlZmF1bHRJZFF0cyA9IHtcbiAgICBiZWc6ICdcIicsXG4gICAgZW5kOiAnXCInXG59O1xuXG5mdW5jdGlvbiBQYXJzZXJTcWxFcnJvcihtZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbn1cblBhcnNlclNxbEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcblBhcnNlclNxbEVycm9yLnByb3RvdHlwZS5uYW1lID0gJ1BhcnNlclNxbEVycm9yJztcblxuLyoqIEB0eXBlZGVmIHtvYmplY3R9IHNxbElkUXRzT2JqZWN0XG4gKiBAZGVzYyBPbiBhIHByYWN0aWNhbCBsZXZlbCwgdGhlIHVzZWZ1bCBjaGFyYWN0ZXJzIGFyZTpcbiAqICogU1FMLTkyIHN0YW5kYXJkOiBcImRvdWJsZSBxdW90ZXNcIlxuICogKiBTUUwgU2VydmVyOiBcImRvdWJsZSBxdW90ZXNcIiBvciBcXFtzcXVhcmUgYnJhY2tldHNcXF1cbiAqICogbXlTUUw6IFxcYHRpY2sgbWFya3NcXGBcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBiZWcgLSBUaGUgb3BlbiBxdW90ZSBjaGFyYWN0ZXIuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZW5kIC0gVGhlIGNsb3NlIHF1b3RlIGNoYXJhY3Rlci5cbiAqL1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHN1bW1hcnkgU3RydWN0dXJlZCBRdWVyeSBMYW5ndWFnZSAoU1FMKSBwYXJzZXJcbiAqIEBhdXRob3IgSm9uYXRoYW4gRWl0ZW4gPGpvbmF0aGFuQG9wZW5maW4uY29tPlxuICogQGRlc2MgVGhpcyBpcyBhIHN1YnNldCBvZiBTUUwgY29uZGl0aW9uYWwgZXhwcmVzc2lvbiBzeW50YXguXG4gKlxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9tczE3MzU0NS5hc3B4IFNRTCBTZWFyY2ggQ29uZGl0aW9ufVxuICpcbiAqIEBwYXJhbSB7bWVudUl0ZW1bXX0gW29wdGlvbnMuc2NoZW1hXSAtIENvbHVtbiBzY2hlbWEgZm9yIGNvbHVtbiBuYW1lIHZhbGlkYXRpb24uIFRocm93cyBhbiBlcnJvciBpZiBuYW1lIGZhaWxzIHZhbGlkYXRpb24gKGJ1dCBzZWUgYHJlc29sdmVBbGlhc2VzYCkuIE9taXQgdG8gc2tpcCBjb2x1bW4gbmFtZSB2YWxpZGF0aW9uLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5yZXNvbHZlQWxpYXNlc10gLSBWYWxpZGF0ZSBjb2x1bW4gYWxpYXNlcyBhZ2FpbnN0IHNjaGVtYSBhbmQgdXNlIHRoZSBhc3NvY2lhdGVkIGNvbHVtbiBuYW1lIGluIHRoZSByZXR1cm5lZCBleHByZXNzaW9uIHN0YXRlIG9iamVjdC4gUmVxdWlyZXMgYG9wdGlvbnMuc2NoZW1hYC4gVGhyb3dzIGVycm9yIGlmIG5vIHN1Y2ggY29sdW1uIGZvdW5kLlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5jYXNlU2Vuc2l0aXZlQ29sdW1uTmFtZXNdIC0gSWdub3JlIGNhc2Ugd2hpbGUgdmFsaWRhdGluZyBjb2x1bW4gbmFtZXMgYW5kIGFsaWFzZXMuXG4gKiBAcGFyYW0ge3NxbElkUXRzT2JqZWN0fSBbb3B0aW9ucy5zcWxJZFF0cz17YmVnOidcIicsZW5kOidcIid9XVxuICovXG5mdW5jdGlvbiBQYXJzZXJTUUwob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdGhpcy5zY2hlbWEgPSBvcHRpb25zLnNjaGVtYTtcblxuICAgIHZhciBpZFF0cyA9IG9wdGlvbnMuc3FsSWRRdHMgfHwgZGVmYXVsdElkUXRzO1xuICAgIHRoaXMucmVOYW1lID0gbmV3IFJlZ0V4cCgnXignICsgaWRRdHMuYmVnICsgJyguKz8pJyArIGlkUXRzLmVuZCArICd8KFtBLVpfXVtBLVpfQFxcXFwkI10qKVxcXFxiKScsICdpJyk7IC8vIG1hdGNoWzJdIHx8IG1hdGNoWzNdXG59XG5cblBhcnNlclNRTC5wcm90b3R5cGUgPSB7XG5cbiAgICBjb25zdHJ1Y3RvcjogUGFyc2VyU1FMLnByb3RvdHlwZS5jb25zdHJ1Y3RvcixcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzcWxcbiAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgKiBAbWVtYmVyT2YgbW9kdWxlOnNxbFNlYXJjaENvbmRpdGlvblxuICAgICAqL1xuICAgIHBhcnNlOiBmdW5jdGlvbihzcWwpIHtcbiAgICAgICAgdmFyIHN0YXRlO1xuXG4gICAgICAgIC8vIHJlZHVjZSBhbGwgcnVucyBvZiB3aGl0ZSBzcGFjZSB0byBhIHNpbmdsZSBzcGFjZTsgdGhlbiB0cmltXG4gICAgICAgIHNxbCA9IHNxbC5yZXBsYWNlKC9cXHNcXHMrL2csICcgJykudHJpbSgpO1xuXG4gICAgICAgIHNxbCA9IHN0cmlwTGl0ZXJhbHMuY2FsbCh0aGlzLCBzcWwpO1xuICAgICAgICBzdGF0ZSA9IHdhbGsuY2FsbCh0aGlzLCBzcWwpO1xuXG4gICAgICAgIGlmICghc3RhdGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHN0YXRlID0geyBjaGlsZHJlbjogWyBzdGF0ZSBdIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxufTtcblxuZnVuY3Rpb24gd2Fsayh0KSB7XG4gICAgdmFyIG0sIG5hbWUsIG9wLCBvcGVyYW5kLCBlZGl0b3IsIGJvb2wsIHRva2VuLCB0b2tlbnMgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB0ID0gdC50cmltKCk7XG5cbiAgICB3aGlsZSAoaSA8IHQubGVuZ3RoKSB7XG4gICAgICAgIG0gPSB0LnN1YnN0cihpKS5tYXRjaChyZUdyb3VwKTtcbiAgICAgICAgaWYgKG0pIHtcbiAgICAgICAgICAgIHZhciBub3QgPSAhIW1bMV07XG5cbiAgICAgICAgICAgIGkgKz0gbVswXS5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSwgdiA9IDE7IGogPCB0Lmxlbmd0aCAmJiB2OyArK2opIHtcbiAgICAgICAgICAgICAgICBpZiAodFtqXSA9PT0gJygnKSB7XG4gICAgICAgICAgICAgICAgICAgICsrdjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRbal0gPT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICAtLXY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZXJTcWxFcnJvcignRXhwZWN0ZWQgXCIpXCInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRva2VuID0gd2Fsay5jYWxsKHRoaXMsIHQuc3Vic3RyKGksIGogLSAxIC0gaSkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChub3QpIHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4ub3BlcmF0b3IgIT09ICdvcC1vcicpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlclNxbEVycm9yKCdFeHBlY3RlZCBPUiBpbiBOT1QoLi4uKSBzdWJleHByZXNzaW9uIGJ1dCBmb3VuZCAnICsgdG9rZW4ub3BlcmF0b3Iuc3Vic3RyKDMpLnRvVXBwZXJDYXNlKCkgKyAnLicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0b2tlbi5vcGVyYXRvciA9ICdvcC1ub3InO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpID0gajtcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gY29sdW1uOlxuXG4gICAgICAgICAgICBtID0gdC5zdWJzdHIoaSkubWF0Y2godGhpcy5yZU5hbWUpO1xuICAgICAgICAgICAgaWYgKCFtKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlclNxbEVycm9yKCdFeHBlY3RlZCBpZGVudGlmaWVyIG9yIHF1b3RlZCBpZGVudGlmaWVyLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmFtZSA9IG1bMl0gfHwgbVszXTtcbiAgICAgICAgICAgIGlmICghL15bQS1aX10vaS50ZXN0KHRbaV0pKSB7IGkgKz0gMjsgfVxuICAgICAgICAgICAgaSArPSBuYW1lLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gb3BlcmF0b3I6XG5cbiAgICAgICAgICAgIGlmICh0W2ldID09PSAnICcpIHsgKytpOyB9XG4gICAgICAgICAgICBtID0gdC5zdWJzdHIoaSkubWF0Y2gocmVPcCk7XG4gICAgICAgICAgICBpZiAoIW0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyU3FsRXJyb3IoJ0V4cGVjdGVkIHJlbGF0aW9uYWwgb3BlcmF0b3IuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcCA9IG1bMV0udG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGkgKz0gb3AubGVuZ3RoO1xuXG4gICAgICAgICAgICAvLyBvcGVyYW5kOlxuXG4gICAgICAgICAgICBlZGl0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAodFtpXSA9PT0gJyAnKSB7ICsraTsgfVxuICAgICAgICAgICAgaWYgKG1bNF0gJiYgbVs0XS50b1VwcGVyQ2FzZSgpID09PSAnSU4nKSB7XG4gICAgICAgICAgICAgICAgbSA9IHQuc3Vic3RyKGkpLm1hdGNoKHJlSW4pO1xuICAgICAgICAgICAgICAgIGlmICghbSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyU3FsRXJyb3IoJ0V4cGVjdGVkIHBhcmVudGhlc2l6ZWQgbGlzdC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb3BlcmFuZCA9IG1bMV07XG4gICAgICAgICAgICAgICAgaSArPSBvcGVyYW5kLmxlbmd0aCArIDI7XG4gICAgICAgICAgICAgICAgd2hpbGUgKChtID0gb3BlcmFuZC5tYXRjaChyZUxpdEFueXdoZXJlKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQucmVwbGFjZShyZUxpdEFueXdoZXJlLCB0aGlzLmxpdGVyYWxzW21bMV1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChtID0gdC5zdWJzdHIoaSkubWF0Y2gocmVMaXQpKSkge1xuICAgICAgICAgICAgICAgIG9wZXJhbmQgPSBtWzFdO1xuICAgICAgICAgICAgICAgIGkgKz0gb3BlcmFuZC5sZW5ndGggKyAyO1xuICAgICAgICAgICAgICAgIG9wZXJhbmQgPSB0aGlzLmxpdGVyYWxzW29wZXJhbmRdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgobSA9IHQuc3Vic3RyKGkpLm1hdGNoKHJlRmxvYXQpKSkge1xuICAgICAgICAgICAgICAgIG9wZXJhbmQgPSBtWzFdO1xuICAgICAgICAgICAgICAgIGkgKz0gb3BlcmFuZC5sZW5ndGg7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKChtID0gdC5zdWJzdHIoaSkubWF0Y2godGhpcy5yZU5hbWUpKSkge1xuICAgICAgICAgICAgICAgIG9wZXJhbmQgPSBtWzJdIHx8IG1bM107XG4gICAgICAgICAgICAgICAgaSArPSBvcGVyYW5kLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBlZGl0b3IgPSAnQ29sdW1ucyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZXJTcWxFcnJvcignRXhwZWN0ZWQgbnVtYmVyIG9yIHN0cmluZyBsaXRlcmFsIG9yIGNvbHVtbi4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuc2NoZW1hKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IGxvb2t1cC5jYWxsKHRoaXMsIG5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgICAgICAgICBvcGVyYW5kID0gbG9va3VwLmNhbGwodGhpcywgb3BlcmFuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b2tlbiA9IHtcbiAgICAgICAgICAgICAgICBjb2x1bW46IG5hbWUsXG4gICAgICAgICAgICAgICAgb3BlcmF0b3I6IG9wLFxuICAgICAgICAgICAgICAgIG9wZXJhbmQ6IG9wZXJhbmRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICB0b2tlbi5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG5cbiAgICAgICAgaWYgKGkgPCB0Lmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKHRbaV0gPT09ICcgJykgeyArK2k7IH1cbiAgICAgICAgICAgIG0gPSB0LnN1YnN0cihpKS5tYXRjaChyZUJvb2wpO1xuICAgICAgICAgICAgaWYgKCFtKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlclNxbEVycm9yKCdFeHBlY3RlZCBib29sZWFuIG9wZXJhdG9yLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm9vbCA9IG1bMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGkgKz0gYm9vbC5sZW5ndGg7XG4gICAgICAgICAgICBib29sID0gJ29wLScgKyBib29sO1xuICAgICAgICAgICAgaWYgKHRva2Vucy5vcGVyYXRvciAmJiB0b2tlbnMub3BlcmF0b3IgIT09IGJvb2wpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyU3FsRXJyb3IoJ0V4cGVjdGVkIHNhbWUgYm9vbGVhbiBvcGVyYXRvciB0aHJvdWdob3V0IHN1YmV4cHJlc3Npb24uJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbnMub3BlcmF0b3IgPSBib29sO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRbaV0gPT09ICcgJykgeyArK2k7IH1cbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICB0b2tlbnMubGVuZ3RoID09PSAxID8gdG9rZW5zWzBdIDoge1xuICAgICAgICAgICAgb3BlcmF0b3I6IHRva2Vucy5vcGVyYXRvcixcbiAgICAgICAgICAgIGNoaWxkcmVuOiB0b2tlbnNcbiAgICAgICAgfVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGxvb2t1cChuYW1lKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLnNjaGVtYS5sb29rdXAobmFtZSk7XG5cbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlclNxbEVycm9yKHRoaXMucmVzb2x2ZUFsaWFzZXNcbiAgICAgICAgICAgID8gJ0V4cGVjdGVkIHZhbGlkIGNvbHVtbiBuYW1lLidcbiAgICAgICAgICAgIDogJ0V4cGVjdGVkIHZhbGlkIGNvbHVtbiBuYW1lIG9yIGFsaWFzLidcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbS5uYW1lO1xufVxuXG5mdW5jdGlvbiBzdHJpcExpdGVyYWxzKHQpIHtcbiAgICB2YXIgaSA9IDAsIGogPSAwLCBrO1xuXG4gICAgdGhpcy5saXRlcmFscyA9IFtdO1xuXG4gICAgd2hpbGUgKChqID0gdC5pbmRleE9mKFNRVCwgaikpID49IDApIHtcbiAgICAgICAgayA9IGo7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGsgPSB0LmluZGV4T2YoU1FULCBrICsgMSk7XG4gICAgICAgICAgICBpZiAoayA8IDApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyU3FsRXJyb3IoJ0V4cGVjdGVkICcgKyBTUVQgKyAnIChzaW5nbGUgcXVvdGUpLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlICh0Wysra10gPT09IFNRVCk7XG4gICAgICAgIHRoaXMubGl0ZXJhbHMucHVzaCh0LnNsaWNlKCsraiwgLS1rKS5yZXBsYWNlKC8nJy9nLCBTUVQpKTtcbiAgICAgICAgdCA9IHQuc3Vic3RyKDAsIGopICsgaSArIHQuc3Vic3RyKGspO1xuICAgICAgICBqID0gaiArIDEgKyAoaSArICcnKS5sZW5ndGggKyAxO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyc2VyU1FMO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3NzSW5qZWN0b3IgPSByZXF1aXJlKCdjc3MtaW5qZWN0b3InKTtcblxudmFyIGNzczsgLy8gZGVmaW5lZCBieSBjb2RlIGluc2VydGVkIGJ5IGd1bHBmaWxlIGJldHdlZW4gZm9sbG93aW5nIGNvbW1lbnRzXG4vKiBpbmplY3Q6Y3NzICovXG5jc3MgPSAnLmZpbHRlci10cmVle2ZvbnQtZmFtaWx5OnNhbnMtc2VyaWY7Zm9udC1zaXplOjEwcHQ7bGluZS1oZWlnaHQ6MS41ZW19LmZpbHRlci10cmVlIGxhYmVse2ZvbnQtd2VpZ2h0OjQwMH0uZmlsdGVyLXRyZWUgaW5wdXRbdHlwZT1jaGVja2JveF0sLmZpbHRlci10cmVlIGlucHV0W3R5cGU9cmFkaW9de21hcmdpbi1sZWZ0OjNweDttYXJnaW4tcmlnaHQ6M3B4fS5maWx0ZXItdHJlZSBvbHttYXJnaW4tdG9wOjB9LmZpbHRlci10cmVlPnNlbGVjdHtmbG9hdDpyaWdodDtib3JkZXI6MXB4IGRvdHRlZCBncmV5O2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzpub25lfS5maWx0ZXItdHJlZS1yZW1vdmUtYnV0dG9ue2Rpc3BsYXk6aW5saW5lLWJsb2NrO3dpZHRoOjE1cHg7aGVpZ2h0OjE1cHg7Ym9yZGVyLXJhZGl1czo4cHg7YmFja2dyb3VuZC1jb2xvcjojZTg4O2ZvbnQtc2l6ZToxMS41cHg7Y29sb3I6I2ZmZjt0ZXh0LWFsaWduOmNlbnRlcjtsaW5lLWhlaWdodDpub3JtYWw7Zm9udC1zdHlsZTpub3JtYWw7Zm9udC1mYW1pbHk6c2Fucy1zZXJpZjttYXJnaW4tcmlnaHQ6NHB4O2N1cnNvcjpwb2ludGVyfS5maWx0ZXItdHJlZS1yZW1vdmUtYnV0dG9uOmhvdmVye2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2U4ODtmb250LXdlaWdodDo3MDA7Ym94LXNoYWRvdzpyZWQgMCAwIDJweCBpbnNldH0uZmlsdGVyLXRyZWUtcmVtb3ZlLWJ1dHRvbjo6YmVmb3Jle2NvbnRlbnQ6XFwnXFxcXGQ3XFwnfS5maWx0ZXItdHJlZSBsaTo6YWZ0ZXJ7Zm9udC1zaXplOjcwJTtmb250LXN0eWxlOml0YWxpYztmb250LXdlaWdodDo3MDA7Y29sb3I6IzA4MH0uZmlsdGVyLXRyZWU+b2w+bGk6bGFzdC1jaGlsZDo6YWZ0ZXJ7ZGlzcGxheTpub25lfS5vcC1hbmQ+b2wsLm9wLW5vcj5vbCwub3Atb3I+b2x7cGFkZGluZy1sZWZ0OjVweDttYXJnaW4tbGVmdDoyN3B4fS5vcC1vcj5vbD5saTo6YWZ0ZXJ7bWFyZ2luLWxlZnQ6Mi41ZW07Y29udGVudDpcXCfigJQgT1Ig4oCUXFwnfS5vcC1hbmQ+b2w+bGk6OmFmdGVye21hcmdpbi1sZWZ0OjIuNWVtO2NvbnRlbnQ6XFwn4oCUIEFORCDigJRcXCd9Lm9wLW5vcj5vbD5saTo6YWZ0ZXJ7bWFyZ2luLWxlZnQ6Mi41ZW07Y29udGVudDpcXCfigJQgTk9SIOKAlFxcJ30uZmlsdGVyLXRyZWUtZWRpdG9yPip7Zm9udC13ZWlnaHQ6NzAwfS5maWx0ZXItdHJlZS1lZGl0b3I+c3Bhbntmb250LXNpemU6c21hbGxlcn0uZmlsdGVyLXRyZWUtZWRpdG9yPmlucHV0W3R5cGU9dGV4dF17d2lkdGg6OGVtO3BhZGRpbmc6MXB4IDVweCAycHh9LmZpbHRlci10cmVlLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZjIWltcG9ydGFudDtib3JkZXItY29sb3I6I2VkYiFpbXBvcnRhbnQ7Zm9udC13ZWlnaHQ6NDAwIWltcG9ydGFudH0uZmlsdGVyLXRyZWUtZXJyb3J7YmFja2dyb3VuZC1jb2xvcjojZmNjIWltcG9ydGFudDtib3JkZXItY29sb3I6I2M5OSFpbXBvcnRhbnQ7Zm9udC13ZWlnaHQ6NDAwIWltcG9ydGFudH0uZmlsdGVyLXRyZWUtZGVmYXVsdD46ZW5hYmxlZHttYXJnaW46MCAuNGVtO2JhY2tncm91bmQtY29sb3I6I2RkZDtib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50fS5maWx0ZXItdHJlZS5maWx0ZXItdHJlZS10eXBlLWNvbHVtbi1maWx0ZXJzPm9sPmxpOm5vdCg6bGFzdC1jaGlsZCl7cGFkZGluZy1ib3R0b206Ljc1ZW07Ym9yZGVyLWJvdHRvbTozcHggZG91YmxlICMwODA7bWFyZ2luLWJvdHRvbTouNzVlbX0uZmlsdGVyLXRyZWUgLmZvb3Rub3Rlc3ttYXJnaW46MCAwIDZweDtmb250LXNpemU6OHB0O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDpub3JtYWw7d2hpdGUtc3BhY2U6bm9ybWFsO2NvbG9yOiNjMDB9LmZpbHRlci10cmVlIC5mb290bm90ZXM+cHttYXJnaW46MH0uZmlsdGVyLXRyZWUgLmZvb3Rub3Rlcz51bHttYXJnaW46LTNweCAwIDA7cGFkZGluZy1sZWZ0OjE3cHg7dGV4dC1pbmRleDotNnB4fS5maWx0ZXItdHJlZSAuZm9vdG5vdGVzPnVsPmxpe21hcmdpbjoycHggMH0uZmlsdGVyLXRyZWUgLmZvb3Rub3RlcyAuZmllbGQtbmFtZSwuZmlsdGVyLXRyZWUgLmZvb3Rub3RlcyAuZmllbGQtdmFsdWV7Zm9udC13ZWlnaHQ6NzAwO2ZvbnQtc3R5bGU6bm9ybWFsfS5maWx0ZXItdHJlZSAuZm9vdG5vdGVzIC5maWVsZC12YWx1ZXtmb250LWZhbWlseTptb25vc3BhY2U7Y29sb3I6IzAwMDtiYWNrZ3JvdW5kLWNvbG9yOiNkZGQ7cGFkZGluZzowIDVweDttYXJnaW46MCAzcHg7Ym9yZGVyLXJhZGl1czozcHh9Jztcbi8qIGVuZGluamVjdCAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNzc0luamVjdG9yLmJpbmQodGhpcywgY3NzLCAnZmlsdGVyLXRyZWUtYmFzZScpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiogQHR5cGVkZWYge2Z1bmN0aW9ufSBvcGVyYXRpb25SZWR1Y2VyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHBcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcVxuICogQHJldHVybnMge2Jvb2xlYW59IFRoZSByZXN1bHQgb2YgYXBwbHlpbmcgdGhlIG9wZXJhdG9yIHRvIHRoZSB0d28gcGFyYW1ldGVycy5cbiAqL1xuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7b3BlcmF0aW9uUmVkdWNlcn1cbiAqL1xuZnVuY3Rpb24gQU5EKHAsIHEpIHtcbiAgICByZXR1cm4gcCAmJiBxO1xufVxuXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAdHlwZSB7b3BlcmF0aW9uUmVkdWNlcn1cbiAqL1xuZnVuY3Rpb24gT1IocCwgcSkge1xuICAgIHJldHVybiBwIHx8IHE7XG59XG5cbi8qKiBAdHlwZWRlZiB7b2JlamN0fSB0cmVlT3BlcmF0b3JcbiAqIEBkZXNjIEVhY2ggYHRyZWVPcGVyYXRvcmAgb2JqZWN0IGRlc2NyaWJlcyB0d28gdGhpbmdzOlxuICpcbiAqIDEuIEhvdyB0byB0YWtlIHRoZSB0ZXN0IHJlc3VsdHMgb2YgX25fIGNoaWxkIG5vZGVzIGJ5IGFwcGx5aW5nIHRoZSBvcGVyYXRvciB0byBhbGwgdGhlIHJlc3VsdHMgdG8gXCJyZWR1Y2VcIiBpdCBkb3duIHRvIGEgc2luZ2xlIHJlc3VsdC5cbiAqIDIuIEhvdyB0byBnZW5lcmF0ZSBTUUwgV0hFUkUgY2xhdXNlIHN5bnRheCB0aGF0IGFwcGxpZXMgdGhlIG9wZXJhdG9yIHRvIF9uXyBjaGlsZCBub2Rlcy5cbiAqXG4gKiBAcHJvcGVydHkge29wZXJhdGlvblJlZHVjZXJ9IHJlZHVjZVxuICogQHByb3BlcnR5IHtib29sZWFufSBzZWVkIC1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gYWJvcnQgLVxuICogQHByb3BlcnR5IHtib29sZWFufSBuZWdhdGUgLVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFNRTC5vcCAtXG4gKiBAcHJvcGVydHkge3N0cmluZ30gU1FMLmJlZyAtXG4gKiBAcHJvcGVydHkge3N0cmluZ30gU1FMLmVuZCAtXG4gKi9cblxuLyoqIEEgaGFzaCBvZiB7QGxpbmsgdHJlZU9wZXJhdG9yfSBvYmplY3RzLlxuICogQHR5cGUge29iamVjdH1cbiAqL1xudmFyIHRyZWVPcGVyYXRvcnMgPSB7XG4gICAgJ29wLWFuZCc6IHtcbiAgICAgICAgcmVkdWNlOiBBTkQsXG4gICAgICAgIHNlZWQ6IHRydWUsXG4gICAgICAgIGFib3J0OiBmYWxzZSxcbiAgICAgICAgbmVnYXRlOiBmYWxzZSxcbiAgICAgICAgU1FMOiB7XG4gICAgICAgICAgICBvcDogJ0FORCcsXG4gICAgICAgICAgICBiZWc6ICcoJyxcbiAgICAgICAgICAgIGVuZDogJyknXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdvcC1vcic6IHtcbiAgICAgICAgcmVkdWNlOiBPUixcbiAgICAgICAgc2VlZDogZmFsc2UsXG4gICAgICAgIGFib3J0OiB0cnVlLFxuICAgICAgICBuZWdhdGU6IGZhbHNlLFxuICAgICAgICBTUUw6IHtcbiAgICAgICAgICAgIG9wOiAnT1InLFxuICAgICAgICAgICAgYmVnOiAnKCcsXG4gICAgICAgICAgICBlbmQ6ICcpJ1xuICAgICAgICB9XG4gICAgfSxcbiAgICAnb3Atbm9yJzoge1xuICAgICAgICByZWR1Y2U6IE9SLFxuICAgICAgICBzZWVkOiBmYWxzZSxcbiAgICAgICAgYWJvcnQ6IHRydWUsXG4gICAgICAgIG5lZ2F0ZTogdHJ1ZSxcbiAgICAgICAgU1FMOiB7XG4gICAgICAgICAgICBvcDogJ09SJyxcbiAgICAgICAgICAgIGJlZzogJ05PVCAoJyxcbiAgICAgICAgICAgIGVuZDogJyknXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRyZWVPcGVyYXRvcnM7XG4iLCIvKiBvYmplY3QtaXRlcmF0b3JzLmpzIC0gTWluaSBVbmRlcnNjb3JlIGxpYnJhcnlcbiAqIGJ5IEpvbmF0aGFuIEVpdGVuXG4gKlxuICogVGhlIG1ldGhvZHMgYmVsb3cgb3BlcmF0ZSBvbiBvYmplY3RzIChidXQgbm90IGFycmF5cykgc2ltaWxhcmx5XG4gKiB0byBVbmRlcnNjb3JlIChodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jY29sbGVjdGlvbnMpLlxuICpcbiAqIEZvciBtb3JlIGluZm9ybWF0aW9uOlxuICogaHR0cHM6Ly9naXRodWIuY29tL2pvbmVpdC9vYmplY3QtaXRlcmF0b3JzXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHN1bW1hcnkgV3JhcCBhbiBvYmplY3QgZm9yIG9uZSBtZXRob2QgY2FsbC5cbiAqIEBEZXNjIE5vdGUgdGhhdCB0aGUgYG5ld2Aga2V5d29yZCBpcyBub3QgbmVjZXNzYXJ5LlxuICogQHBhcmFtIHtvYmplY3R8bnVsbHx1bmRlZmluZWR9IG9iamVjdCAtIGBudWxsYCBvciBgdW5kZWZpbmVkYCBpcyB0cmVhdGVkIGFzIGFuIGVtcHR5IHBsYWluIG9iamVjdC5cbiAqIEByZXR1cm4ge1dyYXBwZXJ9IFRoZSB3cmFwcGVkIG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gV3JhcHBlcihvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgV3JhcHBlcikge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgV3JhcHBlcikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBXcmFwcGVyKG9iamVjdCk7XG4gICAgfVxuICAgIHRoaXMub3JpZ2luYWxWYWx1ZSA9IG9iamVjdDtcbiAgICB0aGlzLm8gPSBvYmplY3QgfHwge307XG59XG5cbi8qKlxuICogQG5hbWUgV3JhcHBlci5jaGFpblxuICogQHN1bW1hcnkgV3JhcCBhbiBvYmplY3QgZm9yIGEgY2hhaW4gb2YgbWV0aG9kIGNhbGxzLlxuICogQERlc2MgQ2FsbHMgdGhlIGNvbnN0cnVjdG9yIGBXcmFwcGVyKClgIGFuZCBtb2RpZmllcyB0aGUgd3JhcHBlciBmb3IgY2hhaW5pbmcuXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0XG4gKiBAcmV0dXJuIHtXcmFwcGVyfSBUaGUgd3JhcHBlZCBvYmplY3QuXG4gKi9cbldyYXBwZXIuY2hhaW4gPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIHdyYXBwZWQgPSBXcmFwcGVyKG9iamVjdCk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICAgIHdyYXBwZWQuY2hhaW5pbmcgPSB0cnVlO1xuICAgIHJldHVybiB3cmFwcGVkO1xufTtcblxuV3JhcHBlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogVW53cmFwIGFuIG9iamVjdCB3cmFwcGVkIHdpdGgge0BsaW5rIFdyYXBwZXIuY2hhaW58V3JhcHBlci5jaGFpbigpfS5cbiAgICAgKiBAcmV0dXJuIHtvYmplY3R8bnVsbHx1bmRlZmluZWR9IFRoZSB2YWx1ZSBvcmlnaW5hbGx5IHdyYXBwZWQgYnkgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAqIEBtZW1iZXJPZiBXcmFwcGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIHZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsVmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXNjIE1pbWljcyBVbmRlcnNjb3JlJ3MgW2VhY2hdKGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyNlYWNoKSBtZXRob2Q6IEl0ZXJhdGUgb3ZlciB0aGUgbWVtYmVycyBvZiB0aGUgd3JhcHBlZCBvYmplY3QsIGNhbGxpbmcgYGl0ZXJhdGVlKClgIHdpdGggZWFjaC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBpdGVyYXRlZSAtIEZvciBlYWNoIG1lbWJlciBvZiB0aGUgd3JhcHBlZCBvYmplY3QsIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggdGhyZWUgYXJndW1lbnRzOiBgKHZhbHVlLCBrZXksIG9iamVjdClgLiBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoaXMgZnVuY3Rpb24gaXMgdW5kZWZpbmVkOyBhbiBgLmVhY2hgIGxvb3AgY2Fubm90IGJlIGJyb2tlbiBvdXQgb2YgKHVzZSB7QGxpbmsgV3JhcHBlciNmaW5kfC5maW5kfSBpbnN0ZWFkKS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gSWYgZ2l2ZW4sIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gdGhpcyBvYmplY3QuIEluIG90aGVyIHdvcmRzLCB0aGlzIG9iamVjdCBiZWNvbWVzIHRoZSBgdGhpc2AgdmFsdWUgaW4gdGhlIGNhbGxzIHRvIGBpdGVyYXRlZWAuIChPdGhlcndpc2UsIHRoZSBgdGhpc2AgdmFsdWUgd2lsbCBiZSB0aGUgdW53cmFwcGVkIG9iamVjdC4pXG4gICAgICogQHJldHVybiB7V3JhcHBlcn0gVGhlIHdyYXBwZWQgb2JqZWN0IGZvciBjaGFpbmluZy5cbiAgICAgKiBAbWVtYmVyT2YgV3JhcHBlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBlYWNoOiBmdW5jdGlvbiAoaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzLm87XG4gICAgICAgIE9iamVjdC5rZXlzKG8pLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgaXRlcmF0ZWUuY2FsbCh0aGlzLCBvW2tleV0sIGtleSwgbyk7XG4gICAgICAgIH0sIGNvbnRleHQgfHwgbyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBNaW1pY3MgVW5kZXJzY29yZSdzIFtmaW5kXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jZmluZCkgbWV0aG9kOiBMb29rIHRocm91Z2ggZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCByZXR1cm5pbmcgdGhlIGZpcnN0IG9uZSB0aGF0IHBhc3NlcyBhIHRydXRoIHRlc3QgKGBwcmVkaWNhdGVgKSwgb3IgYHVuZGVmaW5lZGAgaWYgbm8gdmFsdWUgcGFzc2VzIHRoZSB0ZXN0LiBUaGUgZnVuY3Rpb24gcmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IGFjY2VwdGFibGUgbWVtYmVyLCBhbmQgZG9lc24ndCBuZWNlc3NhcmlseSB0cmF2ZXJzZSB0aGUgZW50aXJlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcmVkaWNhdGUgLSBGb3IgZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogYCh2YWx1ZSwga2V5LCBvYmplY3QpYC4gVGhlIHJldHVybiB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uIHNob3VsZCBiZSB0cnV0aHkgaWYgdGhlIG1lbWJlciBwYXNzZXMgdGhlIHRlc3QgYW5kIGZhbHN5IG90aGVyd2lzZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gSWYgZ2l2ZW4sIGBwcmVkaWNhdGVgIGlzIGJvdW5kIHRvIHRoaXMgb2JqZWN0LiBJbiBvdGhlciB3b3JkcywgdGhpcyBvYmplY3QgYmVjb21lcyB0aGUgYHRoaXNgIHZhbHVlIGluIHRoZSBjYWxscyB0byBgcHJlZGljYXRlYC4gKE90aGVyd2lzZSwgdGhlIGB0aGlzYCB2YWx1ZSB3aWxsIGJlIHRoZSB1bndyYXBwZWQgb2JqZWN0LilcbiAgICAgKiBAcmV0dXJuIHsqfSBUaGUgZm91bmQgcHJvcGVydHkncyB2YWx1ZSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZC5cbiAgICAgKiBAbWVtYmVyT2YgV3JhcHBlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICBmaW5kOiBmdW5jdGlvbiAocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICBpZiAobykge1xuICAgICAgICAgICAgcmVzdWx0ID0gT2JqZWN0LmtleXMobykuZmluZChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWRpY2F0ZS5jYWxsKHRoaXMsIG9ba2V5XSwga2V5LCBvKTtcbiAgICAgICAgICAgIH0sIGNvbnRleHQgfHwgbyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBvW3Jlc3VsdF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgTWltaWNzIFVuZGVyc2NvcmUncyBbZmlsdGVyXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jZmlsdGVyKSBtZXRob2Q6IExvb2sgdGhyb3VnaCBlYWNoIG1lbWJlciBvZiB0aGUgd3JhcHBlZCBvYmplY3QsIHJldHVybmluZyB0aGUgdmFsdWVzIG9mIGFsbCBtZW1iZXJzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QgKGBwcmVkaWNhdGVgKSwgb3IgZW1wdHkgYXJyYXkgaWYgbm8gdmFsdWUgcGFzc2VzIHRoZSB0ZXN0LiBUaGUgZnVuY3Rpb24gYWx3YXlzIHRyYXZlcnNlcyB0aGUgZW50aXJlIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBwcmVkaWNhdGUgLSBGb3IgZWFjaCBtZW1iZXIgb2YgdGhlIHdyYXBwZWQgb2JqZWN0LCB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogYCh2YWx1ZSwga2V5LCBvYmplY3QpYC4gVGhlIHJldHVybiB2YWx1ZSBvZiB0aGlzIGZ1bmN0aW9uIHNob3VsZCBiZSB0cnV0aHkgaWYgdGhlIG1lbWJlciBwYXNzZXMgdGhlIHRlc3QgYW5kIGZhbHN5IG90aGVyd2lzZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gSWYgZ2l2ZW4sIGBwcmVkaWNhdGVgIGlzIGJvdW5kIHRvIHRoaXMgb2JqZWN0LiBJbiBvdGhlciB3b3JkcywgdGhpcyBvYmplY3QgYmVjb21lcyB0aGUgYHRoaXNgIHZhbHVlIGluIHRoZSBjYWxscyB0byBgcHJlZGljYXRlYC4gKE90aGVyd2lzZSwgdGhlIGB0aGlzYCB2YWx1ZSB3aWxsIGJlIHRoZSB1bndyYXBwZWQgb2JqZWN0LilcbiAgICAgKiBAcmV0dXJuIHsqfSBBbiBhcnJheSBjb250YWluaW5nIHRoZSBmaWx0ZXJlZCB2YWx1ZXMuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZmlsdGVyOiBmdW5jdGlvbiAocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGlmIChvKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlZGljYXRlLmNhbGwodGhpcywgb1trZXldLCBrZXksIG8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG9ba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgY29udGV4dCB8fCBvKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBNaW1pY3MgVW5kZXJzY29yZSdzIFttYXBdKGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyNtYXApIG1ldGhvZDogUHJvZHVjZXMgYSBuZXcgYXJyYXkgb2YgdmFsdWVzIGJ5IG1hcHBpbmcgZWFjaCB2YWx1ZSBpbiBsaXN0IHRocm91Z2ggYSB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbiAoYGl0ZXJhdGVlYCkuIFRoZSBmdW5jdGlvbiBhbHdheXMgdHJhdmVyc2VzIHRoZSBlbnRpcmUgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGl0ZXJhdGVlIC0gRm9yIGVhY2ggbWVtYmVyIG9mIHRoZSB3cmFwcGVkIG9iamVjdCwgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aHJlZSBhcmd1bWVudHM6IGAodmFsdWUsIGtleSwgb2JqZWN0KWAuIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBmdW5jdGlvbiBpcyBjb25jYXRlbmF0ZWQgdG8gdGhlIGVuZCBvZiB0aGUgbmV3IGFycmF5LlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbY29udGV4dF0gLSBJZiBnaXZlbiwgYGl0ZXJhdGVlYCBpcyBib3VuZCB0byB0aGlzIG9iamVjdC4gSW4gb3RoZXIgd29yZHMsIHRoaXMgb2JqZWN0IGJlY29tZXMgdGhlIGB0aGlzYCB2YWx1ZSBpbiB0aGUgY2FsbHMgdG8gYHByZWRpY2F0ZWAuIChPdGhlcndpc2UsIHRoZSBgdGhpc2AgdmFsdWUgd2lsbCBiZSB0aGUgdW53cmFwcGVkIG9iamVjdC4pXG4gICAgICogQHJldHVybiB7Kn0gQW4gYXJyYXkgY29udGFpbmluZyB0aGUgZmlsdGVyZWQgdmFsdWVzLlxuICAgICAqIEBtZW1iZXJPZiBXcmFwcGVyLnByb3RvdHlwZVxuICAgICAqL1xuICAgIG1hcDogZnVuY3Rpb24gKGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGlmIChvKSB7XG4gICAgICAgICAgICBPYmplY3Qua2V5cyhvKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChpdGVyYXRlZS5jYWxsKHRoaXMsIG9ba2V5XSwga2V5LCBvKSk7XG4gICAgICAgICAgICB9LCBjb250ZXh0IHx8IG8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBkZXNjIE1pbWljcyBVbmRlcnNjb3JlJ3MgW3JlZHVjZV0oaHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvI3JlZHVjZSkgbWV0aG9kOiBCb2lsIGRvd24gdGhlIHZhbHVlcyBvZiBhbGwgdGhlIG1lbWJlcnMgb2YgdGhlIHdyYXBwZWQgb2JqZWN0IGludG8gYSBzaW5nbGUgdmFsdWUuIGBtZW1vYCBpcyB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgcmVkdWN0aW9uLCBhbmQgZWFjaCBzdWNjZXNzaXZlIHN0ZXAgb2YgaXQgc2hvdWxkIGJlIHJldHVybmVkIGJ5IGBpdGVyYXRlZSgpYC5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBpdGVyYXRlZSAtIEZvciBlYWNoIG1lbWJlciBvZiB0aGUgd3JhcHBlZCBvYmplY3QsIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggZm91ciBhcmd1bWVudHM6IGAobWVtbywgdmFsdWUsIGtleSwgb2JqZWN0KWAuIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBmdW5jdGlvbiBiZWNvbWVzIHRoZSBuZXcgdmFsdWUgb2YgYG1lbW9gIGZvciB0aGUgbmV4dCBpdGVyYXRpb24uXG4gICAgICogQHBhcmFtIHsqfSBbbWVtb10gLSBJZiBubyBtZW1vIGlzIHBhc3NlZCB0byB0aGUgaW5pdGlhbCBpbnZvY2F0aW9uIG9mIHJlZHVjZSwgdGhlIGl0ZXJhdGVlIGlzIG5vdCBpbnZva2VkIG9uIHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBsaXN0LiBUaGUgZmlyc3QgZWxlbWVudCBpcyBpbnN0ZWFkIHBhc3NlZCBhcyB0aGUgbWVtbyBpbiB0aGUgaW52b2NhdGlvbiBvZiB0aGUgaXRlcmF0ZWUgb24gdGhlIG5leHQgZWxlbWVudCBpbiB0aGUgbGlzdC5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbnRleHRdIC0gSWYgZ2l2ZW4sIGBpdGVyYXRlZWAgaXMgYm91bmQgdG8gdGhpcyBvYmplY3QuIEluIG90aGVyIHdvcmRzLCB0aGlzIG9iamVjdCBiZWNvbWVzIHRoZSBgdGhpc2AgdmFsdWUgaW4gdGhlIGNhbGxzIHRvIGBpdGVyYXRlZWAuIChPdGhlcndpc2UsIHRoZSBgdGhpc2AgdmFsdWUgd2lsbCBiZSB0aGUgdW53cmFwcGVkIG9iamVjdC4pXG4gICAgICogQHJldHVybiB7Kn0gVGhlIHZhbHVlIG9mIGBtZW1vYCBcInJlZHVjZWRcIiBhcyBwZXIgYGl0ZXJhdGVlYC5cbiAgICAgKiBAbWVtYmVyT2YgV3JhcHBlci5wcm90b3R5cGVcbiAgICAgKi9cbiAgICByZWR1Y2U6IGZ1bmN0aW9uIChpdGVyYXRlZSwgbWVtbywgY29udGV4dCkge1xuICAgICAgICB2YXIgbyA9IHRoaXMubztcbiAgICAgICAgaWYgKG8pIHtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG8pLmZvckVhY2goZnVuY3Rpb24gKGtleSwgaWR4KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9ICghaWR4ICYmIG1lbW8gPT09IHVuZGVmaW5lZCkgPyBvW2tleV0gOiBpdGVyYXRlZShtZW1vLCBvW2tleV0sIGtleSwgbyk7XG4gICAgICAgICAgICB9LCBjb250ZXh0IHx8IG8pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZGVzYyBNaW1pY3MgVW5kZXJzY29yZSdzIFtleHRlbmRdKGh0dHA6Ly91bmRlcnNjb3JlanMub3JnLyNleHRlbmQpIG1ldGhvZDogQ29weSBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gZWFjaCBvZiB0aGUgYHNvdXJjZWAgb2JqZWN0IHBhcmFtZXRlcihzKSBvdmVyIHRvIHRoZSAod3JhcHBlZCkgZGVzdGluYXRpb24gb2JqZWN0ICh0aHVzIG11dGF0aW5nIGl0KS4gSXQncyBpbi1vcmRlciwgc28gdGhlIHByb3BlcnRpZXMgb2YgdGhlIGxhc3QgYHNvdXJjZWAgb2JqZWN0IHdpbGwgb3ZlcnJpZGUgcHJvcGVydGllcyB3aXRoIHRoZSBzYW1lIG5hbWUgaW4gcHJldmlvdXMgYXJndW1lbnRzIG9yIGluIHRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogPiBUaGlzIG1ldGhvZCBjb3BpZXMgb3duIG1lbWJlcnMgYXMgd2VsbCBhcyBtZW1iZXJzIGluaGVyaXRlZCBmcm9tIHByb3RvdHlwZSBjaGFpbi5cbiAgICAgKiBAcGFyYW0gey4uLm9iamVjdHxudWxsfHVuZGVmaW5lZH0gc291cmNlIC0gVmFsdWVzIG9mIGBudWxsYCBvciBgdW5kZWZpbmVkYCBhcmUgdHJlYXRlZCBhcyBlbXB0eSBwbGFpbiBvYmplY3RzLlxuICAgICAqIEByZXR1cm4ge1dyYXBwZXJ8b2JqZWN0fSBUaGUgd3JhcHBlZCBkZXN0aW5hdGlvbiBvYmplY3QgaWYgY2hhaW5pbmcgaXMgaW4gZWZmZWN0OyBvdGhlcndpc2UgdGhlIHVud3JhcHBlZCBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmZvckVhY2goZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgb1trZXldID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhaW5pbmcgPyB0aGlzIDogbztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGRlc2MgTWltaWNzIFVuZGVyc2NvcmUncyBbZXh0ZW5kT3duXShodHRwOi8vdW5kZXJzY29yZWpzLm9yZy8jZXh0ZW5kT3duKSBtZXRob2Q6IExpa2Uge0BsaW5rIFdyYXBwZXIjZXh0ZW5kfGV4dGVuZH0sIGJ1dCBvbmx5IGNvcGllcyBpdHMgXCJvd25cIiBwcm9wZXJ0aWVzIG92ZXIgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICAgKiBAcGFyYW0gey4uLm9iamVjdHxudWxsfHVuZGVmaW5lZH0gc291cmNlIC0gVmFsdWVzIG9mIGBudWxsYCBvciBgdW5kZWZpbmVkYCBhcmUgdHJlYXRlZCBhcyBlbXB0eSBwbGFpbiBvYmplY3RzLlxuICAgICAqIEByZXR1cm4ge1dyYXBwZXJ8b2JqZWN0fSBUaGUgd3JhcHBlZCBkZXN0aW5hdGlvbiBvYmplY3QgaWYgY2hhaW5pbmcgaXMgaW4gZWZmZWN0OyBvdGhlcndpc2UgdGhlIHVud3JhcHBlZCBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAgICogQG1lbWJlck9mIFdyYXBwZXIucHJvdG90eXBlXG4gICAgICovXG4gICAgZXh0ZW5kT3duOiBmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgICAgIHZhciBvID0gdGhpcy5vO1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmZvckVhY2goZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgV3JhcHBlcihvYmplY3QpLmVhY2goZnVuY3Rpb24gKHZhbCwga2V5KSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbmV3LWNhcFxuICAgICAgICAgICAgICAgIG9ba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhaW5pbmcgPyB0aGlzIDogbztcbiAgICB9XG59O1xuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kXG5pZiAoIUFycmF5LnByb3RvdHlwZS5maW5kKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAocHJlZGljYXRlKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tZXh0ZW5kLW5hdGl2ZVxuICAgICAgICBpZiAodGhpcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJyYXkucHJvdG90eXBlLmZpbmQgY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGlzdCA9IE9iamVjdCh0aGlzKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGxpc3QubGVuZ3RoID4+PiAwO1xuICAgICAgICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXTtcbiAgICAgICAgdmFyIHZhbHVlO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhbHVlID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdyYXBwZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKiBAbW9kdWxlIG92ZXJyaWRlciAqL1xuXG4vKipcbiAqIE1peGVzIG1lbWJlcnMgb2YgYWxsIGBzb3VyY2VzYCBpbnRvIGB0YXJnZXRgLCBoYW5kbGluZyBnZXR0ZXJzIGFuZCBzZXR0ZXJzIHByb3Blcmx5LlxuICpcbiAqIEFueSBudW1iZXIgb2YgYHNvdXJjZXNgIG9iamVjdHMgbWF5IGJlIGdpdmVuIGFuZCBlYWNoIGlzIGNvcGllZCBpbiB0dXJuLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgb3ZlcnJpZGVyID0gcmVxdWlyZSgnb3ZlcnJpZGVyJyk7XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxIH0sIHNvdXJjZTEgPSB7IGI6IDIgfSwgc291cmNlMiA9IHsgYzogMyB9O1xuICogdGFyZ2V0ID09PSBvdmVycmlkZXIodGFyZ2V0LCBzb3VyY2UxLCBzb3VyY2UyKTsgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGEsIGIsIGFuZCBjOyBzb3VyY2Ugb2JqZWN0cyB1bnRvdWNoZWRcbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IC0gVGhlIHRhcmdldCBvYmplY3QgdG8gcmVjZWl2ZSBzb3VyY2VzLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IFtzb3VyY2VzXSAtIE9iamVjdChzKSBjb250YWluaW5nIG1lbWJlcnMgdG8gY29weSB0byBgdGFyZ2V0YC4gKE9taXR0aW5nIGlzIGEgbm8tb3AuKVxuICogQHJldHVybnMge29iamVjdH0gVGhlIHRhcmdldCBvYmplY3QgKGB0YXJnZXRgKVxuICovXG5mdW5jdGlvbiBvdmVycmlkZXIodGFyZ2V0LCBzb3VyY2VzKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBtaXhJbi5jYWxsKHRhcmdldCwgYXJndW1lbnRzW2ldKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG4vKipcbiAqIE1peCBgdGhpc2AgbWVtYmVycyBpbnRvIGB0YXJnZXRgLlxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBBLiBTaW1wbGUgdXNhZ2UgKHVzaW5nIC5jYWxsKTpcbiAqIHZhciBtaXhJblRvID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW5UbztcbiAqIHZhciB0YXJnZXQgPSB7IGE6IDEgfSwgc291cmNlID0geyBiOiAyIH07XG4gKiB0YXJnZXQgPT09IG92ZXJyaWRlci5taXhJblRvLmNhbGwoc291cmNlLCB0YXJnZXQpOyAvLyB0cnVlXG4gKiAvLyB0YXJnZXQgb2JqZWN0IG5vdyBoYXMgYm90aCBhIGFuZCBiOyBzb3VyY2Ugb2JqZWN0IHVudG91Y2hlZFxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBCLiBTZW1hbnRpYyB1c2FnZSAod2hlbiB0aGUgc291cmNlIGhvc3RzIHRoZSBtZXRob2QpOlxuICogdmFyIG1peEluVG8gPSByZXF1aXJlKCdvdmVycmlkZXInKS5taXhJblRvO1xuICogdmFyIHRhcmdldCA9IHsgYTogMSB9LCBzb3VyY2UgPSB7IGI6IDIsIG1peEluVG86IG1peEluVG8gfTtcbiAqIHRhcmdldCA9PT0gc291cmNlLm1peEluVG8odGFyZ2V0KTsgLy8gdHJ1ZVxuICogLy8gdGFyZ2V0IG9iamVjdCBub3cgaGFzIGJvdGggYSBhbmQgYjsgc291cmNlIG9iamVjdCB1bnRvdWNoZWRcbiAqXG4gKiBAdGhpcyB7b2JqZWN0fSBUYXJnZXQuXG4gKiBAcGFyYW0gdGFyZ2V0XG4gKiBAcmV0dXJucyB7b2JqZWN0fSBUaGUgdGFyZ2V0IG9iamVjdCAoYHRhcmdldGApXG4gKiBAbWVtYmVyT2YgbW9kdWxlOm92ZXJyaWRlclxuICovXG5mdW5jdGlvbiBtaXhJblRvKHRhcmdldCkge1xuICAgIHZhciBkZXNjcmlwdG9yO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzKSB7XG4gICAgICAgIGlmICgoZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGhpcywga2V5KSkpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cblxuLyoqXG4gKiBNaXggYHNvdXJjZWAgbWVtYmVycyBpbnRvIGB0aGlzYC5cbiAqXG4gKiBAZXhhbXBsZVxuICogLy8gQS4gU2ltcGxlIHVzYWdlICh1c2luZyAuY2FsbCk6XG4gKiB2YXIgbWl4SW4gPSByZXF1aXJlKCdvdmVycmlkZXInKS5taXhJbjtcbiAqIHZhciB0YXJnZXQgPSB7IGE6IDEgfSwgc291cmNlID0geyBiOiAyIH07XG4gKiB0YXJnZXQgPT09IG92ZXJyaWRlci5taXhJbi5jYWxsKHRhcmdldCwgc291cmNlKSAvLyB0cnVlXG4gKiAvLyB0YXJnZXQgb2JqZWN0IG5vdyBoYXMgYm90aCBhIGFuZCBiOyBzb3VyY2Ugb2JqZWN0IHVudG91Y2hlZFxuICpcbiAqIEBleGFtcGxlXG4gKiAvLyBCLiBTZW1hbnRpYyB1c2FnZSAod2hlbiB0aGUgdGFyZ2V0IGhvc3RzIHRoZSBtZXRob2QpOlxuICogdmFyIG1peEluID0gcmVxdWlyZSgnb3ZlcnJpZGVyJykubWl4SW47XG4gKiB2YXIgdGFyZ2V0ID0geyBhOiAxLCBtaXhJbjogbWl4SW4gfSwgc291cmNlID0geyBiOiAyIH07XG4gKiB0YXJnZXQgPT09IHRhcmdldC5taXhJbihzb3VyY2UpIC8vIHRydWVcbiAqIC8vIHRhcmdldCBub3cgaGFzIGJvdGggYSBhbmQgYiAoYW5kIG1peEluKTsgc291cmNlIHVudG91Y2hlZFxuICpcbiAqIEBwYXJhbSBzb3VyY2VcbiAqIEByZXR1cm5zIHtvYmplY3R9IFRoZSB0YXJnZXQgb2JqZWN0IChgdGhpc2ApXG4gKiBAbWVtYmVyT2Ygb3ZlcnJpZGVyXG4gKiBAbWVtYmVyT2YgbW9kdWxlOm92ZXJyaWRlclxuICovXG5mdW5jdGlvbiBtaXhJbihzb3VyY2UpIHtcbiAgICB2YXIgZGVzY3JpcHRvcjtcbiAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgIGlmICgoZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Ioc291cmNlLCBrZXkpKSkge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbm92ZXJyaWRlci5taXhJblRvID0gbWl4SW5Ubztcbm92ZXJyaWRlci5taXhJbiA9IG1peEluO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG92ZXJyaWRlcjtcbiIsIi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBSRUdFWFBfSU5ESVJFQ1RJT04gPSAvXihcXHcrKVxcKChcXHcrKVxcKSQvOyAgLy8gZmluZHMgY29tcGxldGUgcGF0dGVybiBhKGIpIHdoZXJlIGJvdGggYSBhbmQgYiBhcmUgcmVnZXggXCJ3b3Jkc1wiXG5cbi8qKiBAdHlwZWRlZiB7b2JqZWN0fSB2YWx1ZUl0ZW1cbiAqIFlvdSBzaG91bGQgc3VwcGx5IGJvdGggYG5hbWVgIGFuZCBgYWxpYXNgIGJ1dCB5b3UgY291bGQgb21pdCBvbmUgb3IgdGhlIG90aGVyIGFuZCB3aGljaGV2ZXIgeW91IHByb3ZpZGUgd2lsbCBiZSB1c2VkIGZvciBib3RoLlxuICogPiBJZiB5b3Ugb25seSBnaXZlIHRoZSBgbmFtZWAgcHJvcGVydHksIHlvdSBtaWdodCBhcyB3ZWxsIGp1c3QgZ2l2ZSBhIHN0cmluZyBmb3Ige0BsaW5rIG1lbnVJdGVtfSByYXRoZXIgdGhhbiB0aGlzIG9iamVjdC5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbmFtZT1hbGlhc10gLSBWYWx1ZSBvZiBgdmFsdWVgIGF0dHJpYnV0ZSBvZiBgPG9wdGlvbj4uLi48L29wdGlvbj5gIGVsZW1lbnQuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2FsaWFzPW5hbWVdIC0gVGV4dCBvZiBgPG9wdGlvbj4uLi48L29wdGlvbj5gIGVsZW1lbnQuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3R5cGVdIE9uZSBvZiB0aGUga2V5cyBvZiBgdGhpcy5jb252ZXJ0ZXJzYC4gSWYgbm90IG9uZSBvZiB0aGVzZSAoaW5jbHVkaW5nIGB1bmRlZmluZWRgKSwgZmllbGQgdmFsdWVzIHdpbGwgYmUgdGVzdGVkIHdpdGggYSBzdHJpbmcgY29tcGFyaXNvbi5cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2hpZGRlbj1mYWxzZV1cbiAqL1xuXG4vKiogQHR5cGVkZWYge29iamVjdHxtZW51SXRlbVtdfSBzdWJtZW51SXRlbVxuICogQHN1bW1hcnkgSGllcmFyY2hpY2FsIGFycmF5IG9mIHNlbGVjdCBsaXN0IGl0ZW1zLlxuICogQGRlc2MgRGF0YSBzdHJ1Y3R1cmUgcmVwcmVzZW50aW5nIHRoZSBsaXN0IG9mIGA8b3B0aW9uPi4uLjwvb3B0aW9uPmAgYW5kIGA8b3B0Z3JvdXA+Li4uPC9vcHRncm91cD5gIGVsZW1lbnRzIHRoYXQgbWFrZSB1cCBhIGA8c2VsZWN0Pi4uLjwvc2VsZWN0PmAgZWxlbWVudC5cbiAqXG4gKiA+IEFsdGVybmF0ZSBmb3JtOiBJbnN0ZWFkIG9mIGFuIG9iamVjdCB3aXRoIGEgYG1lbnVgIHByb3BlcnR5IGNvbnRhaW5pbmcgYW4gYXJyYXksIG1heSBpdHNlbGYgYmUgdGhhdCBhcnJheS4gQm90aCBmb3JtcyBoYXZlIHRoZSBvcHRpb25hbCBgbGFiZWxgIHByb3BlcnR5LlxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtsYWJlbF0gLSBEZWZhdWx0cyB0byBhIGdlbmVyYXRlZCBzdHJpbmcgb2YgdGhlIGZvcm0gXCJHcm91cCBuWy5tXS4uLlwiIHdoZXJlIGVhY2ggZGVjaW1hbCBwb3NpdGlvbiByZXByZXNlbnRzIGEgbGV2ZWwgb2YgdGhlIG9wdGdyb3VwIGhpZXJhcmNoeS5cbiAqIEBwcm9wZXJ0eSB7bWVudUl0ZW1bXX0gc3VibWVudVxuICovXG5cbi8qKiBAdHlwZWRlZiB7c3RyaW5nfHZhbHVlSXRlbXxzdWJtZW51SXRlbX0gbWVudUl0ZW1cbiAqIE1heSBiZSBvbmUgb2YgdGhyZWUgcG9zc2libGUgdHlwZXMgdGhhdCBzcGVjaWZ5IGVpdGhlciBhbiBgPG9wdGlvbj4uLi4uPC9vcHRpb24+YCBlbGVtZW50IG9yIGFuIGA8b3B0Z3JvdXA+Li4uLjwvb3B0Z3JvdXA+YCBlbGVtZW50IGFzIGZvbGxvd3M6XG4gKiAqIElmIGEgYHN0cmluZ2AsIHNwZWNpZmllcyB0aGUgdGV4dCBvZiBhbiBgPG9wdGlvbj4uLi4uPC9vcHRpb24+YCBlbGVtZW50IHdpdGggbm8gYHZhbHVlYCBhdHRyaWJ1dGUuIChJbiB0aGUgYWJzZW5jZSBvZiBhIGB2YWx1ZWAgYXR0cmlidXRlLCB0aGUgYHZhbHVlYCBwcm9wZXJ0eSBvZiB0aGUgZWxlbWVudCBkZWZhdWx0cyB0byB0aGUgdGV4dC4pXG4gKiAqIElmIHNoYXBlZCBsaWtlIGEge0BsaW5rIHZhbHVlSXRlbX0gb2JqZWN0LCBzcGVjaWZpZXMgYm90aCB0aGUgdGV4dCBhbmQgdmFsdWUgb2YgYW4gYDxvcHRpb24uLi4uPC9vcHRpb24+YCBlbGVtZW50LlxuICogKiBJZiBzaGFwZWQgbGlrZSBhIHtAbGluayBzdWJtZW51SXRlbX0gb2JqZWN0IChvciBpdHMgYWx0ZXJuYXRlIGFycmF5IGZvcm0pLCBzcGVjaWZpZXMgYW4gYDxvcHRncm91cD4uLi4uPC9vcHRncm91cD5gIGVsZW1lbnQuXG4gKi9cblxuLyoqXG4gKiBAc3VtbWFyeSBCdWlsZHMgYSBuZXcgbWVudSBwcmUtcG9wdWxhdGVkIHdpdGggaXRlbXMgYW5kIGdyb3Vwcy5cbiAqIEBkZXNjIFRoaXMgZnVuY3Rpb24gY3JlYXRlcyBhIG5ldyBwb3AtdXAgbWVudSAoYS5rLmEuIFwiZHJvcC1kb3duXCIpLiBUaGlzIGlzIGEgYDxzZWxlY3Q+Li4uPC9zZWxlY3Q+YCBlbGVtZW50LCBwcmUtcG9wdWxhdGVkIHdpdGggaXRlbXMgKGA8b3B0aW9uPi4uLjwvb3B0aW9uPmAgZWxlbWVudHMpIGFuZCBncm91cHMgKGA8b3B0Z3JvdXA+Li4uPC9vcHRncm91cD5gIGVsZW1lbnRzKS5cbiAqID4gQm9udXM6IFRoaXMgZnVuY3Rpb24gYWxzbyBidWlsZHMgYGlucHV0IHR5cGU9dGV4dGAgZWxlbWVudHMuXG4gKiA+IE5PVEU6IFRoaXMgZnVuY3Rpb24gZ2VuZXJhdGVzIE9QVEdST1VQIGVsZW1lbnRzIGZvciBzdWJ0cmVlcy4gSG93ZXZlciwgbm90ZSB0aGF0IEhUTUw1IHNwZWNpZmllcyB0aGF0IE9QVEdST1VQIGVsZW1uZW50cyBtYWRlIG5vdCBuZXN0ISBUaGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyB0aGUgbWFya3VwIGZvciB0aGVtIGJ1dCB0aGV5IGFyZSBub3QgcmVuZGVyZWQgYnkgbW9zdCBicm93c2Vycywgb3Igbm90IGNvbXBsZXRlbHkuIFRoZXJlZm9yZSwgZm9yIG5vdywgZG8gbm90IHNwZWNpZnkgbW9yZSB0aGFuIG9uZSBsZXZlbCBzdWJ0cmVlcy4gRnV0dXJlIHZlcnNpb25zIG9mIEhUTUwgbWF5IHN1cHBvcnQgaXQuIEkgYWxzbyBwbGFuIHRvIGFkZCBoZXJlIG9wdGlvbnMgdG8gYXZvaWQgT1BUR1JPVVBTIGVudGlyZWx5IGVpdGhlciBieSBpbmRlbnRpbmcgb3B0aW9uIHRleHQsIG9yIGJ5IGNyZWF0aW5nIGFsdGVybmF0ZSBET00gbm9kZXMgdXNpbmcgYDxsaT5gIGluc3RlYWQgb2YgYDxzZWxlY3Q+YCwgb3IgYm90aC5cbiAqIEBtZW1iZXJPZiBwb3BNZW51XG4gKlxuICogQHBhcmFtIHtFbGVtZW50fHN0cmluZ30gZWwgLSBNdXN0IGJlIG9uZSBvZiAoY2FzZS1zZW5zaXRpdmUpOlxuICogKiB0ZXh0IGJveCAtIGFuIGBIVE1MSW5wdXRFbGVtZW50YCB0byB1c2UgYW4gZXhpc3RpbmcgZWxlbWVudCBvciBgJ0lOUFVUJ2AgdG8gY3JlYXRlIGEgbmV3IG9uZVxuICogKiBkcm9wLWRvd24gLSBhbiBgSFRNTFNlbGVjdEVsZW1lbnRgIHRvIHVzZSBhbiBleGlzdGluZyBlbGVtZW50IG9yIGAnU0VMRUNUJ2AgdG8gY3JlYXRlIGEgbmV3IG9uZVxuICogKiBzdWJtZW51IC0gYW4gYEhUTUxPcHRHcm91cEVsZW1lbnRgIHRvIHVzZSBhbiBleGlzdGluZyBlbGVtZW50IG9yIGAnT1BUR1JPVVAnYCB0byBjcmVhdGUgYSBuZXcgb25lIChtZWFudCBmb3IgaW50ZXJuYWwgdXNlIG9ubHkpXG4gKlxuICogQHBhcmFtIHttZW51SXRlbVtdfSBbbWVudV0gLSBIaWVyYXJjaGljYWwgbGlzdCBvZiBzdHJpbmdzIHRvIGFkZCBhcyBgPG9wdGlvbj4uLi48L29wdGlvbj5gIG9yIGA8b3B0Z3JvdXA+Li4uLjwvb3B0Z3JvdXA+YCBlbGVtZW50cy4gT21pdHRpbmcgY3JlYXRlcyBhIHRleHQgYm94LlxuICpcbiAqIEBwYXJhbSB7bnVsbHxzdHJpbmd9IFtvcHRpb25zLnByb21wdD0nJ10gLSBBZGRzIGFuIGluaXRpYWwgYDxvcHRpb24+Li4uPC9vcHRpb24+YCBlbGVtZW50IHRvIHRoZSBkcm9wLWRvd24gd2l0aCB0aGlzIHZhbHVlIGluIHBhcmVudGhlc2VzIGFzIGl0cyBgdGV4dGA7IGFuZCBlbXB0eSBzdHJpbmcgYXMgaXRzIGB2YWx1ZWAuIERlZmF1bHQgaXMgZW1wdHkgc3RyaW5nLCB3aGljaCBjcmVhdGVzIGEgYmxhbmsgcHJvbXB0OyBgbnVsbGAgc3VwcHJlc3NlcyBwcm9tcHQgYWx0b2dldGhlci5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNvcnRdIC0gV2hldGhlciB0byBhbHBoYSBzb3J0IG9yIG5vdC4gSWYgdHJ1dGh5LCBzb3J0cyBlYWNoIG9wdGdyb3VwIG9uIGl0cyBgbGFiZWxgOyBhbmQgZWFjaCBzZWxlY3Qgb3B0aW9uIG9uIGl0cyB0ZXh0IChpdHMgYGFsaWFzYCBpZiBnaXZlbjsgb3IgaXRzIGBuYW1lYCBpZiBub3QpLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nW119IFtvcHRpb25zLmJsYWNrbGlzdF0gLSBPcHRpb25hbCBsaXN0IG9mIG1lbnUgaXRlbSBuYW1lcyB0byBiZSBpZ25vcmVkLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyW119IFtvcHRpb25zLmJyZWFkY3J1bWJzXSAtIExpc3Qgb2Ygb3B0aW9uIGdyb3VwIHNlY3Rpb24gbnVtYmVycyAocm9vdCBpcyBzZWN0aW9uIDApLiAoRm9yIGludGVybmFsIHVzZS4pXG4gKlxuICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5hcHBlbmQ9ZmFsc2VdIC0gV2hlbiBgZWxgIGlzIGFuIGV4aXN0aW5nIGA8c2VsZWN0PmAgRWxlbWVudCwgZ2l2aW5nIHRydXRoeSB2YWx1ZSBhZGRzIHRoZSBuZXcgY2hpbGRyZW4gd2l0aG91dCBmaXJzdCByZW1vdmluZyBleGlzdGluZyBjaGlsZHJlbi5cbiAqXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRWl0aGVyIGEgYDxzZWxlY3Q+YCBvciBgPG9wdGdyb3VwPmAgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gYnVpbGQoZWwsIG1lbnUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBwcm9tcHQgPSBvcHRpb25zLnByb21wdCxcbiAgICAgICAgYmxhY2tsaXN0ID0gb3B0aW9ucy5ibGFja2xpc3QsXG4gICAgICAgIHNvcnQgPSBvcHRpb25zLnNvcnQsXG4gICAgICAgIGJyZWFkY3J1bWJzID0gb3B0aW9ucy5icmVhZGNydW1icyB8fCBbXSxcbiAgICAgICAgcGF0aCA9IGJyZWFkY3J1bWJzLmxlbmd0aCA/IGJyZWFkY3J1bWJzLmpvaW4oJy4nKSArICcuJyA6ICcnLFxuICAgICAgICBzdWJ0cmVlTmFtZSA9IHBvcE1lbnUuc3VidHJlZSxcbiAgICAgICAgZ3JvdXBJbmRleCA9IDAsXG4gICAgICAgIHRhZ05hbWU7XG5cbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgIHRhZ05hbWUgPSBlbC50YWdOYW1lO1xuICAgICAgICBpZiAoIW9wdGlvbnMuYXBwZW5kKSB7XG4gICAgICAgICAgICBlbC5pbm5lckhUTUwgPSAnJzsgLy8gcmVtb3ZlIGFsbCA8b3B0aW9uPiBhbmQgPG9wdGdyb3VwPiBlbGVtZW50c1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFnTmFtZSA9IGVsO1xuICAgICAgICBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKG1lbnUpIHtcbiAgICAgICAgdmFyIGFkZCwgbmV3T3B0aW9uO1xuICAgICAgICBpZiAodGFnTmFtZSA9PT0gJ1NFTEVDVCcpIHtcbiAgICAgICAgICAgIGFkZCA9IGVsLmFkZDtcbiAgICAgICAgICAgIGlmIChwcm9tcHQpIHtcbiAgICAgICAgICAgICAgICBuZXdPcHRpb24gPSBuZXcgT3B0aW9uKHByb21wdCwgJycpO1xuICAgICAgICAgICAgICAgIG5ld09wdGlvbi5pbm5lckhUTUwgKz0gJyZoZWxsaXA7JztcbiAgICAgICAgICAgICAgICBlbC5hZGQobmV3T3B0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvbXB0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZWwuYWRkKG5ldyBPcHRpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZGQgPSBlbC5hcHBlbmRDaGlsZDtcbiAgICAgICAgICAgIGVsLmxhYmVsID0gcHJvbXB0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNvcnQpIHtcbiAgICAgICAgICAgIG1lbnUgPSBtZW51LnNsaWNlKCkuc29ydChpdGVtQ29tcGFyYXRvcik7IC8vIHNvcnRlZCBjbG9uZVxuICAgICAgICB9XG5cbiAgICAgICAgbWVudS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgIC8vIGlmIGl0ZW0gaXMgb2YgZm9ybSBhKGIpIGFuZCB0aGVyZSBpcyBhbiBmdW5jdGlvbiBhIGluIG9wdGlvbnMsIHRoZW4gaXRlbSA9IG9wdGlvbnMuYShiKVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZGlyZWN0aW9uID0gaXRlbS5tYXRjaChSRUdFWFBfSU5ESVJFQ1RJT04pO1xuICAgICAgICAgICAgICAgIGlmIChpbmRpcmVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGluZGlyZWN0aW9uWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgYiA9IGluZGlyZWN0aW9uWzJdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZiA9IG9wdGlvbnNbYV07XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGYoYik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyAnYnVpbGQ6IEV4cGVjdGVkIG9wdGlvbnMuJyArIGEgKyAnIHRvIGJlIGEgZnVuY3Rpb24uJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN1YnRyZWUgPSBpdGVtW3N1YnRyZWVOYW1lXSB8fCBpdGVtO1xuICAgICAgICAgICAgaWYgKHN1YnRyZWUgaW5zdGFuY2VvZiBBcnJheSkge1xuXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwT3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWRjcnVtYnM6IGJyZWFkY3J1bWJzLmNvbmNhdCgrK2dyb3VwSW5kZXgpLFxuICAgICAgICAgICAgICAgICAgICBwcm9tcHQ6IGl0ZW0ubGFiZWwgfHwgJ0dyb3VwICcgKyBwYXRoICsgZ3JvdXBJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogc29ydCxcbiAgICAgICAgICAgICAgICAgICAgYmxhY2tsaXN0OiBibGFja2xpc3RcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIG9wdGdyb3VwID0gYnVpbGQoJ09QVEdST1VQJywgc3VidHJlZSwgZ3JvdXBPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgIGlmIChvcHRncm91cC5jaGlsZEVsZW1lbnRDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChvcHRncm91cCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtICE9PSAnb2JqZWN0Jykge1xuXG4gICAgICAgICAgICAgICAgaWYgKCEoYmxhY2tsaXN0ICYmIGJsYWNrbGlzdC5pbmRleE9mKGl0ZW0pID49IDApKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZC5jYWxsKGVsLCBuZXcgT3B0aW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIWl0ZW0uaGlkZGVuKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZSB8fCBpdGVtLmFsaWFzO1xuICAgICAgICAgICAgICAgIGlmICghKGJsYWNrbGlzdCAmJiBibGFja2xpc3QuaW5kZXhPZihuYW1lKSA+PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICBhZGQuY2FsbChlbCwgbmV3IE9wdGlvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxpYXMgfHwgaXRlbS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWwudHlwZSA9ICd0ZXh0JztcbiAgICB9XG5cbiAgICByZXR1cm4gZWw7XG59XG5cbmZ1bmN0aW9uIGl0ZW1Db21wYXJhdG9yKGEsIGIpIHtcbiAgICBhID0gYS5hbGlhcyB8fCBhLm5hbWUgfHwgYS5sYWJlbCB8fCBhO1xuICAgIGIgPSBiLmFsaWFzIHx8IGIubmFtZSB8fCBiLmxhYmVsIHx8IGI7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IFJlY3Vyc2l2ZWx5IHNlYXJjaGVzIHRoZSBjb250ZXh0IGFycmF5IG9mIGBtZW51SXRlbWBzIGZvciBhIG5hbWVkIGBpdGVtYC5cbiAqIEBtZW1iZXJPZiBwb3BNZW51XG4gKiBAdGhpcyBBcnJheVxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmtleXM9W3BvcE1lbnUuZGVmYXVsdEtleV1dIC0gUHJvcGVydGllcyB0byBzZWFyY2ggZWFjaCBtZW51SXRlbSB3aGVuIGl0IGlzIGFuIG9iamVjdC5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuY2FzZVNlbnNpdGl2ZT1mYWxzZV0gLSBJZ25vcmUgY2FzZSB3aGlsZSBzZWFyY2hpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBWYWx1ZSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge3VuZGVmaW5lZHxtZW51SXRlbX0gVGhlIGZvdW5kIGl0ZW0gb3IgYHVuZGVmaW5lZGAgaWYgbm90IGZvdW5kLlxuICovXG5mdW5jdGlvbiBsb29rdXAob3B0aW9ucywgdmFsdWUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB2YWx1ZSA9IG9wdGlvbnM7XG4gICAgICAgIG9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdmFyIHNoYWxsb3csIGRlZXAsIGl0ZW0sIHByb3AsXG4gICAgICAgIGtleXMgPSBvcHRpb25zICYmIG9wdGlvbnMua2V5cyB8fCBbcG9wTWVudS5kZWZhdWx0S2V5XSxcbiAgICAgICAgY2FzZVNlbnNpdGl2ZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5jYXNlU2Vuc2l0aXZlO1xuXG4gICAgdmFsdWUgPSB0b1N0cmluZyh2YWx1ZSwgY2FzZVNlbnNpdGl2ZSk7XG5cbiAgICBzaGFsbG93ID0gdGhpcy5maW5kKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIHN1YnRyZWUgPSBpdGVtW3BvcE1lbnUuc3VidHJlZV0gfHwgaXRlbTtcblxuICAgICAgICBpZiAoc3VidHJlZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gKGRlZXAgPSBsb29rdXAuY2FsbChzdWJ0cmVlLCBvcHRpb25zLCB2YWx1ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIHRvU3RyaW5nKGl0ZW0sIGNhc2VTZW5zaXRpdmUpID09PSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIHByb3AgPSBpdGVtW2tleXNbaV1dO1xuICAgICAgICAgICAgICAgIGlmIChwcm9wICYmIHRvU3RyaW5nKHByb3AsIGNhc2VTZW5zaXRpdmUpID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0ZW0gPSBkZWVwIHx8IHNoYWxsb3c7XG5cbiAgICByZXR1cm4gaXRlbSAmJiAoaXRlbS5uYW1lID8gaXRlbSA6IHsgbmFtZTogaXRlbSB9KTtcbn1cblxuZnVuY3Rpb24gdG9TdHJpbmcocywgY2FzZVNlbnNpdGl2ZSkge1xuICAgIHZhciByZXN1bHQgPSAnJztcbiAgICBpZiAocykge1xuICAgICAgICByZXN1bHQgKz0gczsgLy8gY29udmVydCBzIHRvIHN0cmluZ1xuICAgICAgICBpZiAoIWNhc2VTZW5zaXRpdmUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogQHN1bW1hcnkgUmVjdXJzaXZlbHkgd2Fsa3MgdGhlIGNvbnRleHQgYXJyYXkgb2YgYG1lbnVJdGVtYHMgYW5kIGNhbGxzIGBpdGVyYXRlZWAgb24gZWFjaCBpdGVtIHRoZXJlaW4uXG4gKiBAZGVzYyBgaXRlcmF0ZWVgIGlzIGNhbGxlZCB3aXRoIGVhY2ggaXRlbSAodGVybWluYWwgbm9kZSkgaW4gdGhlIG1lbnUgdHJlZSBhbmQgYSBmbGF0IDAtYmFzZWQgaW5kZXguIFJlY3Vyc2VzIG9uIG1lbWJlciB3aXRoIG5hbWUgb2YgYHBvcE1lbnUuc3VidHJlZWAuXG4gKlxuICogVGhlIG5vZGUgd2lsbCBhbHdheXMgYmUgYSB7QGxpbmsgdmFsdWVJdGVtfSBvYmplY3Q7IHdoZW4gYSBgc3RyaW5nYCwgaXQgaXMgYm94ZWQgZm9yIHlvdS5cbiAqXG4gKiBAbWVtYmVyT2YgcG9wTWVudVxuICpcbiAqIEB0aGlzIEFycmF5XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gaXRlcmF0ZWUgLSBGb3IgZWFjaCBpdGVtIGluIHRoZSBtZW51LCBgaXRlcmF0ZWVgIGlzIGNhbGxlZCB3aXRoOlxuICogKiB0aGUgYHZhbHVlSXRlbWAgKGlmIHRoZSBpdGVtIGlzIGEgcHJpbWF0aXZlIHN0cmluZywgaXQgaXMgd3JhcHBlZCB1cCBmb3IgeW91KVxuICogKiBhIDAtYmFzZWQgYG9yZGluYWxgXG4gKlxuICogVGhlIGBpdGVyYXRlZWAgcmV0dXJuIHZhbHVlIGNhbiBiZSB1c2VkIHRvIHJlcGxhY2UgdGhlIGl0ZW0sIGFzIGZvbGxvd3M6XG4gKiAqIGB1bmRlZmluZWRgIC0gZG8gbm90aGluZ1xuICogKiBgbnVsbGAgLSBzcGxpY2Ugb3V0IHRoZSBpdGVtOyByZXN1bHRpbmcgZW1wdHkgc3VibWVudXMgYXJlIGFsc28gc3BsaWNlZCBvdXQgKHNlZSBub3RlKVxuICogKiBhbnl0aGluZyBlbHNlIC0gcmVwbGFjZSB0aGUgaXRlbSB3aXRoIHRoaXMgdmFsdWU7IGlmIHZhbHVlIGlzIGEgc3VidHJlZSAoaS5lLiwgYW4gYXJyYXkpIGBpdGVyYXRlZWAgd2lsbCB0aGVuIGJlIGNhbGxlZCB0byB3YWxrIGl0IGFzIHdlbGwgKHNlZSBub3RlKVxuICpcbiAqID4gTm90ZTogUmV0dXJuaW5nIGFueXRoaW5nIChvdGhlciB0aGFuIGB1bmRlZmluZWRgKSBmcm9tIGBpdGVyYXRlZWAgd2lsbCAoZGVlcGx5KSBtdXRhdGUgdGhlIG9yaWdpbmFsIGBtZW51YCBzbyB5b3UgbWF5IHdhbnQgdG8gY29weSBpdCBmaXJzdCAoZGVlcGx5LCBpbmNsdWRpbmcgYWxsIGxldmVscyBvZiBhcnJheSBuZXN0aW5nIGJ1dCBub3QgdGhlIHRlcm1pbmFsIG5vZGUgb2JqZWN0cykuXG4gKlxuICogQHJldHVybnMge251bWJlcn0gTnVtYmVyIG9mIGl0ZW1zICh0ZXJtaW5hbCBub2RlcykgaW4gdGhlIG1lbnUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gd2FsayhpdGVyYXRlZSkge1xuICAgIHZhciBtZW51ID0gdGhpcyxcbiAgICAgICAgb3JkaW5hbCA9IDAsXG4gICAgICAgIHN1YnRyZWVOYW1lID0gcG9wTWVudS5zdWJ0cmVlLFxuICAgICAgICBpLCBpdGVtLCBzdWJ0cmVlLCBuZXdWYWw7XG5cbiAgICBmb3IgKGkgPSBtZW51Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIGl0ZW0gPSBtZW51W2ldO1xuICAgICAgICBzdWJ0cmVlID0gaXRlbVtzdWJ0cmVlTmFtZV0gfHwgaXRlbTtcblxuICAgICAgICBpZiAoIShzdWJ0cmVlIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBzdWJ0cmVlID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFzdWJ0cmVlKSB7XG4gICAgICAgICAgICBuZXdWYWwgPSBpdGVyYXRlZShpdGVtLm5hbWUgPyBpdGVtIDogeyBuYW1lOiBpdGVtIH0sIG9yZGluYWwpO1xuICAgICAgICAgICAgb3JkaW5hbCArPSAxO1xuXG4gICAgICAgICAgICBpZiAobmV3VmFsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lbnUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBvcmRpbmFsIC09IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbWVudVtpXSA9IGl0ZW0gPSBuZXdWYWw7XG4gICAgICAgICAgICAgICAgICAgIHN1YnRyZWUgPSBpdGVtW3N1YnRyZWVOYW1lXSB8fCBpdGVtO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIShzdWJ0cmVlIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1YnRyZWUpIHtcbiAgICAgICAgICAgIG9yZGluYWwgKz0gd2Fsay5jYWxsKHN1YnRyZWUsIGl0ZXJhdGVlKTtcbiAgICAgICAgICAgIGlmIChzdWJ0cmVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIG1lbnUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIG9yZGluYWwgLT0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcmRpbmFsO1xufVxuXG4vKipcbiAqIEBzdW1tYXJ5IEZvcm1hdCBpdGVtIG5hbWUgd2l0aCBpdCdzIGFsaWFzIHdoZW4gYXZhaWxhYmxlLlxuICogQG1lbWJlck9mIHBvcE1lbnVcbiAqIEBwYXJhbSB7c3RyaW5nfHZhbHVlSXRlbX0gaXRlbVxuICogQHJldHVybnMge3N0cmluZ30gVGhlIGZvcm1hdHRlZCBuYW1lIGFuZCBhbGlhcy5cbiAqL1xuZnVuY3Rpb24gZm9ybWF0SXRlbShpdGVtKSB7XG4gICAgdmFyIHJlc3VsdCA9IGl0ZW0ubmFtZSB8fCBpdGVtO1xuICAgIGlmIChpdGVtLmFsaWFzKSB7XG4gICAgICAgIHJlc3VsdCA9ICdcIicgKyBpdGVtLmFsaWFzICsgJ1wiICgnICsgcmVzdWx0ICsgJyknO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbmZ1bmN0aW9uIGlzR3JvdXBQcm94eShzKSB7XG4gICAgcmV0dXJuIFJFR0VYUF9JTkRJUkVDVElPTi50ZXN0KHMpO1xufVxuXG4vKipcbiAqIEBuYW1lc3BhY2VcbiAqL1xudmFyIHBvcE1lbnUgPSB7XG4gICAgYnVpbGQ6IGJ1aWxkLFxuICAgIHdhbGs6IHdhbGssXG4gICAgbG9va3VwOiBsb29rdXAsXG4gICAgZm9ybWF0SXRlbTogZm9ybWF0SXRlbSxcbiAgICBpc0dyb3VwUHJveHk6IGlzR3JvdXBQcm94eSxcbiAgICBzdWJ0cmVlOiAnc3VibWVudScsXG4gICAgZGVmYXVsdEtleTogJ25hbWUnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBvcE1lbnU7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciAvLyBhIHJlZ2V4IHNlYXJjaCBwYXR0ZXJuIHRoYXQgbWF0Y2hlcyBhbGwgdGhlIHJlc2VydmVkIGNoYXJzIG9mIGEgcmVnZXggc2VhcmNoIHBhdHRlcm5cbiAgICByZXNlcnZlZCA9IC8oW1xcLlxcXFxcXCtcXCpcXD9cXF5cXCRcXChcXClcXHtcXH1cXD1cXCFcXDxcXD5cXHxcXDpcXFtcXF1dKS9nLFxuXG4gICAgLy8gcmVnZXggd2lsZGNhcmQgc2VhcmNoIHBhdHRlcm5zXG4gICAgUkVHRVhQX1dJTERDQVJEID0gJy4qJyxcbiAgICBSRUdFWFBfV0lMRENIQVIgPSAnLicsXG4gICAgUkVHRVhQX1dJTERDQVJEX01BVENIRVIgPSAnKCcgKyBSRUdFWFBfV0lMRENBUkQgKyAnKScsXG5cbiAgICAvLyBMSUtFIHNlYXJjaCBwYXR0ZXJuc1xuICAgIExJS0VfV0lMRENIQVIgPSAnXycsXG4gICAgTElLRV9XSUxEQ0FSRCA9ICclJyxcblxuICAgIC8vIHJlZ2V4IHNlYXJjaCBwYXR0ZXJucyB0aGF0IG1hdGNoIExJS0Ugc2VhcmNoIHBhdHRlcm5zXG4gICAgUkVHRVhQX0xJS0VfUEFUVEVSTl9NQVRDSEVSID0gbmV3IFJlZ0V4cCgnKCcgKyBbXG4gICAgICAgIExJS0VfV0lMRENIQVIsXG4gICAgICAgIExJS0VfV0lMRENBUkQsXG4gICAgICAgICdcXFxcW1xcXFxeP1teLVxcXFxdXStdJywgLy8gbWF0Y2hlcyBhIExJS0Ugc2V0IChzYW1lIHN5bnRheCBhcyBhIFJlZ0V4cCBzZXQpXG4gICAgICAgICdcXFxcW1xcXFxeP1teLVxcXFxdXVxcXFwtW15cXFxcXV1dJyAvLyBtYXRjaGVzIGEgTElLRSByYW5nZSAoc2FtZSBzeW50YXggYXMgYSBSZWdFeHAgcmFuZ2UpXG4gICAgXS5qb2luKCd8JykgKyAnKScsICdnJyk7XG5cbmZ1bmN0aW9uIHJlZ0V4cExJS0UocGF0dGVybiwgaWdub3JlQ2FzZSkge1xuICAgIHZhciBpLCBwYXJ0cztcblxuICAgIC8vIEZpbmQgYWxsIExJS0UgcGF0dGVybnNcbiAgICBwYXJ0cyA9IHBhdHRlcm4ubWF0Y2goUkVHRVhQX0xJS0VfUEFUVEVSTl9NQVRDSEVSKTtcblxuICAgIGlmIChwYXJ0cykge1xuICAgICAgICAvLyBUcmFuc2xhdGUgZm91bmQgTElLRSBwYXR0ZXJucyB0byByZWdleCBwYXR0ZXJucywgZXNjYXBlZCBpbnRlcnZlbmluZyBub24tcGF0dGVybnMsIGFuZCBpbnRlcmxlYXZlIHRoZSB0d29cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIC8vIEVzY2FwZSBsZWZ0IGJyYWNrZXRzICh1bnBhaXJlZCByaWdodCBicmFja2V0cyBhcmUgT0spXG4gICAgICAgICAgICBpZiAocGFydHNbaV1bMF0gPT09ICdbJykge1xuICAgICAgICAgICAgICAgIHBhcnRzW2ldID0gcmVnRXhwTElLRS5yZXNlcnZlKHBhcnRzW2ldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSBlYWNoIGZvdW5kIHBhdHRlcm4gbWF0Y2hhYmxlIGJ5IGVuY2xvc2luZyBpbiBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgcGFydHNbaV0gPSAnKCcgKyBwYXJ0c1tpXSArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hdGNoIHRoZXNlIHByZWNpc2UgcGF0dGVybnMgYWdhaW4gd2l0aCB0aGVpciBpbnRlcnZlbmluZyBub24tcGF0dGVybnMgKGkuZS4sIHRleHQpXG4gICAgICAgIHBhcnRzID0gcGF0dGVybi5tYXRjaChuZXcgUmVnRXhwKFxuICAgICAgICAgICAgUkVHRVhQX1dJTERDQVJEX01BVENIRVIgK1xuICAgICAgICAgICAgcGFydHMuam9pbihSRUdFWFBfV0lMRENBUkRfTUFUQ0hFUikgICtcbiAgICAgICAgICAgIFJFR0VYUF9XSUxEQ0FSRF9NQVRDSEVSXG4gICAgICAgICkpO1xuXG4gICAgICAgIC8vIERpc2NhcmQgZmlyc3QgbWF0Y2ggb2Ygbm9uLWdsb2JhbCBzZWFyY2ggKHdoaWNoIGlzIHRoZSB3aG9sZSBzdHJpbmcpXG4gICAgICAgIHBhcnRzLnNoaWZ0KCk7XG5cbiAgICAgICAgLy8gRm9yIGVhY2ggcmUtZm91bmQgcGF0dGVybiBwYXJ0LCB0cmFuc2xhdGUgJSBhbmQgXyB0byByZWdleCBlcXVpdmFsZW50XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBwYXJ0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpXTtcbiAgICAgICAgICAgIHN3aXRjaCAocGFydCkge1xuICAgICAgICAgICAgICAgIGNhc2UgTElLRV9XSUxEQ0FSRDogcGFydCA9IFJFR0VYUF9XSUxEQ0FSRDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBMSUtFX1dJTERDSEFSOiBwYXJ0ID0gUkVHRVhQX1dJTERDSEFSOyBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB2YXIgaiA9IHBhcnRbMV0gPT09ICdeJyA/IDIgOiAxO1xuICAgICAgICAgICAgICAgICAgICBwYXJ0ID0gJ1snICsgcmVnRXhwTElLRS5yZXNlcnZlKHBhcnQuc3Vic3RyKGosIHBhcnQubGVuZ3RoIC0gKGogKyAxKSkpICsgJ10nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFydHNbaV0gPSBwYXJ0O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGFydHMgPSBbcGF0dGVybl07XG4gICAgfVxuXG4gICAgLy8gRm9yIGVhY2ggc3Vycm91bmRpbmcgdGV4dCBwYXJ0LCBlc2NhcGUgcmVzZXJ2ZWQgcmVnZXggY2hhcnNcbiAgICBmb3IgKGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgcGFydHNbaV0gPSByZWdFeHBMSUtFLnJlc2VydmUocGFydHNbaV0pO1xuICAgIH1cblxuICAgIC8vIEpvaW4gYWxsIHRoZSBpbnRlcmxlYXZlZCBwYXJ0c1xuICAgIHBhcnRzID0gcGFydHMuam9pbignJyk7XG5cbiAgICAvLyBPcHRpbWl6ZSBvciBhbmNob3IgdGhlIHBhdHRlcm4gYXQgZWFjaCBlbmQgYXMgbmVlZGVkXG4gICAgaWYgKHBhcnRzLnN1YnN0cigwLCAyKSA9PT0gUkVHRVhQX1dJTERDQVJEKSB7IHBhcnRzID0gcGFydHMuc3Vic3RyKDIpOyB9IGVsc2UgeyBwYXJ0cyA9ICdeJyArIHBhcnRzOyB9XG4gICAgaWYgKHBhcnRzLnN1YnN0cigtMiwgMikgPT09IFJFR0VYUF9XSUxEQ0FSRCkgeyBwYXJ0cyA9IHBhcnRzLnN1YnN0cigwLCBwYXJ0cy5sZW5ndGggLSAyKTsgfSBlbHNlIHsgcGFydHMgKz0gJyQnOyB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG5ldyByZWdleFxuICAgIHJldHVybiBuZXcgUmVnRXhwKHBhcnRzLCBpZ25vcmVDYXNlID8gJ2knIDogdW5kZWZpbmVkKTtcbn1cblxucmVnRXhwTElLRS5yZXNlcnZlID0gZnVuY3Rpb24gKHMpIHtcbiAgICByZXR1cm4gcy5yZXBsYWNlKHJlc2VydmVkLCAnXFxcXCQxJyk7XG59O1xuXG52YXIgY2FjaGUsIHNpemU7XG5cbi8qKlxuICogQHN1bW1hcnkgRGVsZXRlIGEgcGF0dGVybiBmcm9tIHRoZSBjYWNoZTsgb3IgY2xlYXIgdGhlIHdob2xlIGNhY2hlLlxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXR0ZXJuXSAtIFRoZSBMSUtFIHBhdHRlcm4gdG8gcmVtb3ZlIGZyb20gdGhlIGNhY2hlLiBGYWlscyBzaWxlbnRseSBpZiBub3QgZm91bmQgaW4gdGhlIGNhY2hlLiBJZiBwYXR0ZXJuIG9taXR0ZWQsIGNsZWFycyB3aG9sZSBjYWNoZS5cbiAqL1xuKHJlZ0V4cExJS0UuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uIChwYXR0ZXJuKSB7XG4gICAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgICAgIGNhY2hlID0ge307XG4gICAgICAgIHNpemUgPSAwO1xuICAgIH0gZWxzZSBpZiAoY2FjaGVbcGF0dGVybl0pIHtcbiAgICAgICAgZGVsZXRlIGNhY2hlW3BhdHRlcm5dO1xuICAgICAgICBzaXplLS07XG4gICAgfVxuICAgIHJldHVybiBzaXplO1xufSkoKTsgLy8gaW5pdCB0aGUgY2FjaGVcblxucmVnRXhwTElLRS5nZXRDYWNoZVNpemUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzaXplOyB9O1xuXG4vKipcbiAqIEBzdW1tYXJ5IENhY2hlZCB2ZXJzaW9uIG9mIGByZWdFeHBMSUtFKClgLlxuICogQGRlc2MgQ2FjaGVkIGVudHJpZXMgYXJlIHN1YmplY3QgdG8gZ2FyYmFnZSBjb2xsZWN0aW9uIGlmIGBrZWVwYCBpcyBgdW5kZWZpbmVkYCBvciBgZmFsc2VgIG9uIGluc2VydGlvbiBvciBgZmFsc2VgIG9uIG1vc3QgcmVjZW50IHJlZmVyZW5jZS4gR2FyYmFnZSBjb2xsZWN0aW9uIHdpbGwgb2NjdXIgaWZmIGByZWdFeHBMSUtFLmNhY2hlTWF4YCBpcyBkZWZpbmVkIGFuZCBpdCBlcXVhbHMgdGhlIG51bWJlciBvZiBjYWNoZWQgcGF0dGVybnMuIFRoZSBnYXJiYWdlIGNvbGxlY3RvciBzb3J0cyB0aGUgcGF0dGVybnMgYmFzZWQgb24gbW9zdCByZWNlbnQgcmVmZXJlbmNlOyB0aGUgb2xkZXN0IDEwJSBvZiB0aGUgZW50cmllcyBhcmUgZGVsZXRlZC4gQWx0ZXJuYXRpdmVseSwgeW91IGNhbiBtYW5hZ2UgdGhlIGNhY2hlIHlvdXJzZWxmIHRvIGEgbGltaXRlZCBleHRlbnQgKHNlZSB7QGxpbmsgcmVnZUV4cExJS0UuY2xlYXJDYWNoZXxjbGVhckNhY2hlfSkuXG4gKiBAcGFyYW0gcGF0dGVybiAtIHRoZSBMSUtFIHBhdHRlcm4gKHRvIGJlKSBjb252ZXJ0ZWQgdG8gYSBSZWdFeHBcbiAqIEBwYXJhbSBba2VlcF0gLSBJZiBnaXZlbiwgY2hhbmdlcyB0aGUga2VlcCBzdGF0dXMgZm9yIHRoaXMgcGF0dGVybiBhcyBmb2xsb3dzOlxuICogKiBgdHJ1ZWAgcGVybWFuZW50bHkgY2FjaGVzIHRoZSBwYXR0ZXJuIChub3Qgc3ViamVjdCB0byBnYXJiYWdlIGNvbGxlY3Rpb24pIHVudGlsIGBmYWxzZWAgaXMgZ2l2ZW4gb24gYSBzdWJzZXF1ZW50IGNhbGxcbiAqICogYGZhbHNlYCBhbGxvd3MgZ2FyYmFnZSBjb2xsZWN0aW9uIG9uIHRoZSBjYWNoZWQgcGF0dGVyblxuICogKiBgdW5kZWZpbmVkYCBubyBjaGFuZ2UgdG8ga2VlcCBzdGF0dXNcbiAqIEByZXR1cm5zIHtSZWdFeHB9XG4gKi9cbnJlZ0V4cExJS0UuY2FjaGVkID0gZnVuY3Rpb24gKGtlZXAsIHBhdHRlcm4sIGlnbm9yZUNhc2UpIHtcbiAgICBpZiAodHlwZW9mIGtlZXAgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlnbm9yZUNhc2UgPSBwYXR0ZXJuO1xuICAgICAgICBwYXR0ZXJuID0ga2VlcDtcbiAgICAgICAga2VlcCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgcGF0dGVybkFuZENhc2UgPSBwYXR0ZXJuICsgKGlnbm9yZUNhc2UgPyAnaScgOiAnYycpLFxuICAgICAgICBpdGVtID0gY2FjaGVbcGF0dGVybkFuZENhc2VdO1xuICAgIGlmIChpdGVtKSB7XG4gICAgICAgIGl0ZW0ud2hlbiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICBpZiAoa2VlcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpdGVtLmtlZXAgPSBrZWVwO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNpemUgPT09IHJlZ0V4cExJS0UuY2FjaGVNYXgpIHtcbiAgICAgICAgICAgIHZhciBhZ2UgPSBbXSwgYWdlcyA9IDAsIGtleSwgaTtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIGNhY2hlKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGNhY2hlW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmtlZXApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGFnZXM7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0ud2hlbiA8IGFnZVtpXS5pdGVtLndoZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhZ2Uuc3BsaWNlKGksIDAsIHsga2V5OiBrZXksIGl0ZW06IGl0ZW0gfSk7XG4gICAgICAgICAgICAgICAgICAgIGFnZXMrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFnZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVnRXhwTElLRShwYXR0ZXJuLCBpZ25vcmVDYXNlKTsgLy8gY2FjaGUgaXMgZnVsbCFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSBNYXRoLmNlaWwoYWdlLmxlbmd0aCAvIDEwKTsgLy8gd2lsbCBhbHdheXMgYmUgYXQgbGVhc3QgMVxuICAgICAgICAgICAgc2l6ZSAtPSBpO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWNoZVthZ2VbaV0ua2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpdGVtID0gY2FjaGVbcGF0dGVybkFuZENhc2VdID0ge1xuICAgICAgICAgICAgcmVnZXg6IHJlZ0V4cExJS0UocGF0dGVybiwgaWdub3JlQ2FzZSksXG4gICAgICAgICAgICBrZWVwOiBrZWVwLFxuICAgICAgICAgICAgd2hlbjogbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgfTtcbiAgICAgICAgc2l6ZSsrO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbS5yZWdleDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVnRXhwTElLRTtcbiIsIi8vIHRlbXBsZXggbm9kZSBtb2R1bGVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9qb25laXQvdGVtcGxleFxuXG4vKiBlc2xpbnQtZW52IG5vZGUgKi9cblxuLyoqXG4gKiBNZXJnZXMgdmFsdWVzIG9mIGV4ZWN1dGlvbiBjb250ZXh0IHByb3BlcnRpZXMgbmFtZWQgaW4gdGVtcGxhdGUgYnkge3Byb3AxfSxcbiAqIHtwcm9wMn0sIGV0Yy4sIG9yIGFueSBqYXZhc2NyaXB0IGV4cHJlc3Npb24gaW5jb3Jwb3JhdGluZyBzdWNoIHByb3AgbmFtZXMuXG4gKiBUaGUgY29udGV4dCBhbHdheXMgaW5jbHVkZXMgdGhlIGdsb2JhbCBvYmplY3QuIEluIGFkZGl0aW9uIHlvdSBjYW4gc3BlY2lmeSBhIHNpbmdsZVxuICogY29udGV4dCBvciBhbiBhcnJheSBvZiBjb250ZXh0cyB0byBzZWFyY2ggKGluIHRoZSBvcmRlciBnaXZlbikgYmVmb3JlIGZpbmFsbHlcbiAqIHNlYXJjaGluZyB0aGUgZ2xvYmFsIGNvbnRleHQuXG4gKlxuICogTWVyZ2UgZXhwcmVzc2lvbnMgY29uc2lzdGluZyBvZiBzaW1wbGUgbnVtZXJpYyB0ZXJtcywgc3VjaCBhcyB7MH0sIHsxfSwgZXRjLiwgZGVyZWZcbiAqIHRoZSBmaXJzdCBjb250ZXh0IGdpdmVuLCB3aGljaCBpcyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5LiBBcyBhIGNvbnZlbmllbmNlIGZlYXR1cmUsXG4gKiBpZiBhZGRpdGlvbmFsIGFyZ3MgYXJlIGdpdmVuIGFmdGVyIGB0ZW1wbGF0ZWAsIGBhcmd1bWVudHNgIGlzIHVuc2hpZnRlZCBvbnRvIHRoZSBjb250ZXh0XG4gKiBhcnJheSwgdGh1cyBtYWtpbmcgZmlyc3QgYWRkaXRpb25hbCBhcmcgYXZhaWxhYmxlIGFzIHsxfSwgc2Vjb25kIGFzIHsyfSwgZXRjLiwgYXMgaW5cbiAqIGB0ZW1wbGV4KCdIZWxsbywgezF9IScsICdXb3JsZCcpYC4gKHswfSBpcyB0aGUgdGVtcGxhdGUgc28gY29uc2lkZXIgdGhpcyB0byBiZSAxLWJhc2VkLilcbiAqXG4gKiBJZiB5b3UgcHJlZmVyIHNvbWV0aGluZyBvdGhlciB0aGFuIGJyYWNlcywgcmVkZWZpbmUgYHRlbXBsZXgucmVnZXhwYC5cbiAqXG4gKiBTZWUgdGVzdHMgZm9yIGV4YW1wbGVzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVxuICogQHBhcmFtIHsuLi5zdHJpbmd9IFthcmdzXVxuICovXG5mdW5jdGlvbiB0ZW1wbGV4KHRlbXBsYXRlKSB7XG4gICAgdmFyIGNvbnRleHRzID0gdGhpcyBpbnN0YW5jZW9mIEFycmF5ID8gdGhpcyA6IFt0aGlzXTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHsgY29udGV4dHMudW5zaGlmdChhcmd1bWVudHMpOyB9XG4gICAgcmV0dXJuIHRlbXBsYXRlLnJlcGxhY2UodGVtcGxleC5yZWdleHAsIHRlbXBsZXgubWVyZ2VyLmJpbmQoY29udGV4dHMpKTtcbn1cblxudGVtcGxleC5yZWdleHAgPSAvXFx7KC4qPylcXH0vZztcblxudGVtcGxleC53aXRoID0gZnVuY3Rpb24gKGksIHMpIHtcbiAgICByZXR1cm4gJ3dpdGgodGhpc1snICsgaSArICddKXsnICsgcyArICd9Jztcbn07XG5cbnRlbXBsZXguY2FjaGUgPSBbXTtcblxudGVtcGxleC5kZXJlZiA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAoISh0aGlzLmxlbmd0aCBpbiB0ZW1wbGV4LmNhY2hlKSkge1xuICAgICAgICB2YXIgY29kZSA9ICdyZXR1cm4gZXZhbChleHByKSc7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBjb2RlID0gdGVtcGxleC53aXRoKGksIGNvZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGVtcGxleC5jYWNoZVt0aGlzLmxlbmd0aF0gPSBldmFsKCcoZnVuY3Rpb24oZXhwcil7JyArIGNvZGUgKyAnfSknKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1ldmFsXG4gICAgfVxuICAgIHJldHVybiB0ZW1wbGV4LmNhY2hlW3RoaXMubGVuZ3RoXS5jYWxsKHRoaXMsIGtleSk7XG59O1xuXG50ZW1wbGV4Lm1lcmdlciA9IGZ1bmN0aW9uIChtYXRjaCwga2V5KSB7XG4gICAgLy8gQWR2YW5jZWQgZmVhdHVyZXM6IENvbnRleHQgY2FuIGJlIGEgbGlzdCBvZiBjb250ZXh0cyB3aGljaCBhcmUgc2VhcmNoZWQgaW4gb3JkZXIuXG4gICAgdmFyIHJlcGxhY2VtZW50O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcmVwbGFjZW1lbnQgPSBpc05hTihrZXkpID8gdGVtcGxleC5kZXJlZi5jYWxsKHRoaXMsIGtleSkgOiB0aGlzWzBdW2tleV07XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXBsYWNlbWVudCA9ICd7JyArIGtleSArICd9JztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVwbGFjZW1lbnQ7XG59O1xuXG4vLyB0aGlzIGludGVyZmFjZSBjb25zaXN0cyBzb2xlbHkgb2YgdGhlIHRlbXBsZXggZnVuY3Rpb24gKGFuZCBpdCdzIHByb3BlcnRpZXMpXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsZXg7XG4iLCIvLyBDcmVhdGVkIGJ5IEpvbmF0aGFuIEVpdGVuIG9uIDEvNy8xNi5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFZlcnkgZmFzdCBhcnJheSB0ZXN0LlxuICogRm9yIGNyb3NzLWZyYW1lIHNjcmlwdGluZzsgdXNlIGBjcm9zc0ZyYW1lc0lzQXJyYXlgIGluc3RlYWQuXG4gKiBAcGFyYW0geyp9IGFyciAtIFRoZSBvYmplY3QgdG8gdGVzdC5cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG51bnN0cnVuZ2lmeS5pc0FycmF5ID0gZnVuY3Rpb24oYXJyKSB7IHJldHVybiBhcnIuY29uc3RydWN0b3IgPT09IEFycmF5OyB9O1xuXG4vKipcbiAqIEBzdW1tYXJ5IFdhbGsgYSBoaWVyYXJjaGljYWwgb2JqZWN0IGFzIEpTT04uc3RyaW5naWZ5IGRvZXMgYnV0IHdpdGhvdXQgc2VyaWFsaXppbmcuXG4gKlxuICogQGRlc2MgVXNhZ2U6XG4gKiAqIHZhciBteURpc3RpbGxlZE9iamVjdCA9IHVuc3RydW5naWZ5LmNhbGwobXlPYmplY3QpO1xuICogKiB2YXIgbXlEaXN0aWxsZWRPYmplY3QgPSBteUFwaS5nZXRTdGF0ZSgpOyAvLyB3aGVyZSBteUFwaS5wcm90b3R5cGUuZ2V0U3RhdGUgPSB1bnN0cnVuZ2lmeVxuICpcbiAqIFJlc3VsdCBlcXVpdmFsZW50IHRvIGBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHRoaXMpKWAuXG4gKlxuICogPiBEbyBub3QgdXNlIHRoaXMgZnVuY3Rpb24gdG8gZ2V0IGEgSlNPTiBzdHJpbmc7IHVzZSBgSlNPTi5zdHJpbmdpZnkodGhpcylgIGluc3RlYWQuXG4gKlxuICogQHRoaXMgeyp8b2JqZWN0fCpbXX0gLSBPYmplY3QgdG8gd2FsazsgdHlwaWNhbGx5IGFuIG9iamVjdCBvciBhcnJheS5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm51bGxFbGVtZW50cz09ZmFsc2VdIC0gUHJlc2VydmUgdW5kZWZpbmVkIGFycmF5IGVsZW1lbnRzIGFzIGBudWxsYHMuXG4gKiBVc2UgdGhpcyB3aGVuIHByZWNpc2UgaW5kZXggbWF0dGVycyAobm90IG1lcmVseSB0aGUgb3JkZXIgb2YgdGhlIGVsZW1lbnRzKS5cbiAqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm51bGxQcm9wZXJ0aWVzPT1mYWxzZV0gLSBQcmVzZXJ2ZSB1bmRlZmluZWQgb2JqZWN0IHByb3BlcnRpZXMgYXMgYG51bGxgcy5cbiAqXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIERpc3RpbGxlZCBvYmplY3QuXG4gKi9cbmZ1bmN0aW9uIHVuc3RydW5naWZ5KG9wdGlvbnMpIHtcbiAgICB2YXIgY2xvbmUsIHByZXNlcnZlLFxuICAgICAgICBvYmplY3QgPSAodHlwZW9mIHRoaXMudG9KU09OID09PSAnZnVuY3Rpb24nKSA/IHRoaXMudG9KU09OKCkgOiB0aGlzO1xuXG4gICAgaWYgKHVuc3RydW5naWZ5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgICAgICBjbG9uZSA9IFtdO1xuICAgICAgICBwcmVzZXJ2ZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5udWxsRWxlbWVudHM7XG4gICAgICAgIG9iamVjdC5mb3JFYWNoKGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdW5zdHJ1bmdpZnkuY2FsbChvYmopO1xuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjbG9uZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJlc2VydmUpIHtcbiAgICAgICAgICAgICAgICBjbG9uZS5wdXNoKG51bGwpOyAvLyB1bmRlZmluZWQgbm90IGEgdmFsaWQgSlNPTiB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgIGlmICh0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBjbG9uZSA9IHt9O1xuICAgICAgICBwcmVzZXJ2ZSA9IG9wdGlvbnMgJiYgb3B0aW9ucy5udWxsUHJvcGVydGllcztcbiAgICAgICAgT2JqZWN0LmtleXMob2JqZWN0KS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdW5zdHJ1bmdpZnkuY2FsbChvYmplY3Rba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNsb25lW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJlc2VydmUpIHtcbiAgICAgICAgICAgICAgICBjbG9uZVtrZXldID0gbnVsbDsgLy8gdW5kZWZpbmVkIG5vdCBhIHZhbGlkIEpTT04gdmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2xvbmUgPSBvYmplY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lO1xufVxuXG4vKipcbiAqIFZlcnkgc2xvdyBhcnJheSB0ZXN0LiBTdWl0YWJsZSBmb3IgY3Jvc3MtZnJhbWUgc2NyaXB0aW5nLlxuICpcbiAqIFN1Z2dlc3Rpb246IElmIHlvdSBuZWVkIHRoaXMgYW5kIGhhdmUgalF1ZXJ5IGxvYWRlZCwgdXNlIGBqUXVlcnkuaXNBcnJheWAgaW5zdGVhZCB3aGljaCBpcyByZWFzb25hYmx5IGZhc3QuXG4gKlxuICogQHBhcmFtIHsqfSBhcnIgLSBUaGUgb2JqZWN0IHRvIHRlc3QuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xudW5zdHJ1bmdpZnkuY3Jvc3NGcmFtZXNJc0FycmF5ID0gZnVuY3Rpb24oYXJyKSB7IHJldHVybiB0b1N0cmluZy5jYWxsKGFycikgPT09IGFyclN0cmluZzsgfTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuXG52YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLCBhcnJTdHJpbmcgPSAnW29iamVjdCBBcnJheV0nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVuc3RydW5naWZ5O1xuIl19
