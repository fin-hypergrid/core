'use strict';

var REGEXP_BOOLS = /\b(AND|OR|NOR)\b/gi,
    REGEXP_CELL_FILTER = /^\s*(<=|>=|<>|[<≤≠≥>=]|(NOT )?(IN|CONTAINS|BEGINS|ENDS|LIKE) )?(.*?)\s*$/i,
    EXP = '(.*?)', BR = '\\b',
    PREFIX = '^' + EXP + BR,
    INFIX = BR + EXP + BR,
    POSTFIX = BR + EXP + '$',
    opMap = {
        '>=': '≥',
        '<=': '≤',
        '<>': '≠'
    };

var optionsPrototype = {
    autoLookupByName: true,
    autoLookupByAlias: true,
    caseSensitiveColumnNames: false
};

/**
 * @module CQL
 *
 * @summary Column Query Language
 *
 * @author Jonathan Eiten <jonathan@openfin.com>
 *
 * @desc This grammar came from the legacy system in use at Barclays where they enter syntax into _column filter cells._ As in Hypergrid, each column's filter cell is directly below the column header, above the data rows.
 *
 * The original grammar was simply:
 *
 * > _expression_ ::= [ _op-symbol_ ] _operand_
 * > _op-synmbol_ ::= `=` | `<>` | `<` | `>` | `<=` | `>=`
 * > _operand_ ::= _column-name_ | _random-text_
 *
 * We expanded this grammar as follows:
 *
 * > _expression_ ::= _simple-expression_ { _logic-op_ _simple-expression_ }
 * > _simple-expression_ ::= [ _operator_ ] _operand_
 * > _operator_ ::= _op-symbol_ | _op-phrase_
 * > _op-symbol_ ::= `=` | `<>` | `<` | `>` | `<=` | `>=`
 * > _op-phrase_ ::= [ `NOT` _white-space_ ] _op-word_ _white-space_
 * > _op-word_ ::= `STARTS` | `ENDS` | `CONTAINS` | `LIKE` | `IN`
 * > _operand_ ::= _column-name_ | _column alias_ | _random-text_
 * > _logic-op_ ::=  _white-space_ ( `AND` | `OR` | `NOR` ) _white-space_
 *
 * Notes:
 * 1. The default _op-symbol_ is "equals" when no operator is given.
 * 2. Order of operations in undefined.
 * 3. In particular, there is no precedence for logical operators and to resolve any ambiguity as to which binds more tightly, all such operators in an expression _must be the same._ If you need to group two expressions more tightly, put them in a subexpression.
 * 4. Words are shown in the grammar above in upper case. However, they may be any mixture of upper and lower case.
 * 5. _white-space_ is optional if following or preceding a non-alpha character, specifically,_ an _op-symbol_).
 *
 * The original grammar was deterministic (unambiguous), consisting entirely of a single operand (after the optional operator, that is). The one exception is when that operand is an exact (case-insensitive) match for the name (or alias) of a column, it would indirect to that named column's value. Thus, there is no way to use a column name as a literal.
 *
 * The extended grammar is definitely non-deterministic because, in addition to the above, the words `and`, `or`, and `nor` also cannot be part of a literal. In a future release, we plan to allow optional paired quotation marks or parentheses to solve this problem:
 *
 * > _quoted-operand_ ::= ( `'` | `"` | `(` ) _operand_ ( `'` | `"` | `)` )
 *
 * @param {FilterTree} schema - Column schema for column name recognition.
 * @param {function} [options.propResolver]
 */
function ColumnQueryLanguage(schema, options) {
    this.schema = schema;
    this.options = Object.create(optionsPrototype);

    if (options) { this.setOptions(function(key) { return options[key]; }); }
}

ColumnQueryLanguage.prototype = {

    constructor: ColumnQueryLanguage.prototype.constructor,

    /** Override default properties with properties defined by supplied property resolver.
     * @param {function} propResolver
     */
    setOptions: function(propResolver) {
        for (var key in optionsPrototype) {
            if (optionsPrototype.hasOwnProperty(key)) {
                var prop = propResolver(key);
                if (prop !== undefined) {
                    this.options[key] = prop;
                } else {
                    delete this.options[key]; // reveals prototype (default) value
                }
            }
        }
    },

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

        if (booleans) {
            var heterogeneousOperator = booleans.find(function(op, i) {
                booleans[i] = op.toLowerCase();
                return booleans[i] !== booleans[0];
            });

            if (heterogeneousOperator) {
                throw new Error([
                    'Expected homogeneous boolean operators.',
                    'You cannot mix <code>AND</code>, <code>OR</code>, and <code>NOR</code> operators here.',
                    '(Everything after your <code style="color:red">' + heterogeneousOperator.toUpperCase() + '</code> was ignored.)',
                    '<i>Tip: You can create more complex filters by using Manage Filters.</i>'
                ].join('<br>'));
            }
        }

        return booleans;
    },

    /**
     * Break an expression chain into a list of expressions.
     * @param {string} cql
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
     *
     * @returns {expressionState[]} where `expressionState` is one of:
     * * `{column: string, operator: string, literal: string}`
     * * `{column: string, operator: string, column2: string, editor: 'Columns'}`
     */
    makeChildren: function(columnName, expressions) {
        var self = this,
            children = [],
            orphanedOps = [];

        expressions.forEach(function(expression) {
            if (expression) {
                var parts = expression.match(REGEXP_CELL_FILTER),
                    op = parts[1] && parts[1].trim().toUpperCase() || '=',
                    literal = parts[parts.length - 1];

                if (!literal) {
                    orphanedOps.push(op);
                } else {
                    var compareLiteral = self.comparable(literal);
                    var fieldName = self.schema.find(function(column) {
                        return (
                            compareLiteral === (self.autoLookupByName && self.comparable(column.name || column)) ||
                            compareLiteral === (self.autoLookupByAlias && self.comparable(column.alias))
                        );
                    });

                    var child = {
                        column: columnName,
                        operator: opMap[op] || op
                    };

                    if (fieldName) {
                        child.column2 = fieldName.name || fieldName;
                        child.editor = 'Columns';
                    } else {
                        child.literal = literal;
                    }

                    children.push(child);
                }
            }
        });

        if (children.length > 0 && orphanedOps.length > 0 || orphanedOps.length > 1) {
            var RED = ' <code style="color:red">';
            if (orphanedOps.length === 1) {
                orphanedOps = [
                    'Expected a value following' + RED + orphanedOps +
                    '</code> to compare against the column.',
                    'The incomplete expression was ignored.'
                ];
            } else {
                orphanedOps = [
                    'Expected values following' + RED + orphanedOps.join('</code> and' + RED) + '</code> to compare against the column.',
                    'The incomplete expressions were ignored.'
                ];
            }
            this.orphanedOpMsg = orphanedOps.join('<br>');
        } else {
            this.orphanedOpMsg = undefined;
        }

        return children;
    },

    comparable: function(name) {
        if (!this.caseSensitiveColumnNames && typeof name === 'string') {
            name = name.toLowerCase();
        }

        return name;
    },

    /**
     * @summary Make a "locked" subexpression definition object from an expression chain.
     * @desc _Locked_ means it is locked to a single field.
     *
     * When there is only a single expression in the chain, the `operator` is omitted (defaults to `'op-and'`).
     * @param {string} columnName
     * @param {string} cql - A CQL expression (one or more simple expressions all separated by the same logical operator).
     * @returns {undefined|{operator: string, children: string[], schema: string[]}}
     * `undefined` when there are no complete expressions
     *
     * @memberOf module:CQL
     */
    parse: function(columnName, cql) {
        // reduce all runs of white space to a single space; then trim
        cql = cql.replace(/\s\s+/g, ' ').trim();

        var booleans = this.captureBooleans(cql),
            expressions = this.captureExpressions(cql, booleans),
            children = this.makeChildren(columnName, expressions),
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

module.exports = ColumnQueryLanguage;
