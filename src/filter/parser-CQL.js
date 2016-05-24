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
 * @author Jonathan Eiten <jonathan@openfin.com>
 *
 * @desc See {@tutorial CQL} for the grammar.
 *
 * @param {object} operators - Hash of valid operators. Each is an object, the only property of interest being `complex` which if truthy means operand may be a list of multiple operands.
 * @param {menuItem[]} [options.schema] - Column schema for column name/alias validation. Throws an error if name fails validation (but see `resolveAliases`). Omit to skip column name validation.
 * @param {boolean} [options.defaultOp='='] - Default operator for column when not defined in column schema.
 */
function ParserCQL(operators, options) {
    this.schema = options && options.schema;
    this.defaultOp = (options && options.defaultOp || '=').toUpperCase();

    var scalarOperands = [],
        listOperands = [];

    _(operators).each(function(props, op) {
        if (op !== 'undefined') {
            (props.complex ? listOperands : scalarOperands).push(op);
        }
    });

    scalarOperands = toRegexGroup.call(this, scalarOperands);
    listOperands = toRegexGroup.call(this, listOperands);

    /** @summary regex to match all operators that take a scalar operand
     * @desc Match list:
     * 0. _input string_
     * 1. operator
     * 2. _operand fully dressed with parentheses and quotes_
     * 3. untrimmed operand extracted from within single quotes
     * 4. untrimmed operand extracted from within double quotes
     * 5. untrimmed operand extracted from within parenthesized single quotes
     * 6. untrimmed operand extracted from within parenthesized double quotes
     * 7. trimmed operand extracted from within parentheses
     * 8. trimmed undressed operand
     * @type {RegExp}
     * @private
     * @memberOf ParserCQL.prototype
     */
    this.REGEX_CQL_EXP_WITH_SCALAR_OPERAND = new RegExp('^\\s*' + scalarOperands + '\\s*(\'(.*)\'|"(.*)"|\\(\\s*\'(.*)\'\\s*\\)|\\(\\s*"(.*)"\\s*\\)|\\(\\s*(.+?)\\s*\\)|(.+?))\\s*$', 'i');

    /** @summary regex to match all operators that take an operand list
     * @desc Match list:
     * 0. _input string_
     * 1. operator
     * 7. parenthesized trimmed & operand extracted
     * 8. undressed operand trimmed & extracted
     * 2. _operand fully dressed with parentheses and quotes_
     * 3. trimmed operand extracted from within parentheses
     * 4. trimmed undressed operand
     * @type {RegExp}
     * @private
     * @memberOf ParserCQL.prototype
     */
    this.REGEX_CQL_EXP_WITH_OPERAND_LIST = new RegExp('^\\s*' + listOperands + '\\s*(\\(\\s*(.+?)\\s*\\)|(.+?))\\s*$', 'i');

}

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

        if (booleans) {
            var heterogeneousOperator = booleans.find(function(op, i) {
                booleans[i] = op.toLowerCase();
                return booleans[i] !== booleans[0];
            });

            if (heterogeneousOperator) {
                throw new ParserCqlError('Expected homogeneous boolean operators. You cannot mix AND, OR, and NOR operators here because the order of operations is ambiguous. Everything after your ' + heterogeneousOperator.toUpperCase() + ' was ignored. Tip: You can group operations with subexpressions but only in the QueryBuilder or by using parentheses in SQL.');
            }
        }

        return booleans;
    },

    /**
     * @summary Break an expression chain into a list of expressions.
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
     * * `{column: string, operator: string, operand: string}`
     * * `{column: string, operator: string, operand: string, editor: 'Columns'}`
     */
    makeChildren: function(columnName, expressions) {
        var self = this;
        return expressions.reduce(function(children, exp) {
            if (exp) {
                var parts = exp.match(self.REGEX_CQL_EXP_WITH_OPERAND_LIST) ||
                    exp.match(self.REGEX_CQL_EXP_WITH_SCALAR_OPERAND); // the regex with the default operator should be last

                if (parts) {
                    var literal = parts.slice(3).find(function(part) { return part !== undefined; }),
                        op = (
                            parts[1] ||
                            self.schema && self.schema.lookup(columnName).defaultOp || // column's default operator from schema
                            self.defaultOp // grid's default operator,
                        )
                            .replace(/\s+/g, ' ')
                            .toUpperCase();

                    var child = {
                        column: columnName,
                        operator: op
                    };

                    var fieldName = self.schema && self.schema.lookup(literal);
                    if (fieldName) {
                        child.operand = fieldName.name || fieldName;
                        child.editor = 'Columns';
                    } else {
                        child.operand = literal;
                    }

                    children.push(child);
                }

                return children;
            }
        }, []);
    },

    /**
     * @summary Make a "locked" subexpression definition object from an expression chain.
     * @desc _Locked_ means it is locked to a single field.
     *
     * When there is only a single expression in the chain, the `operator` is omitted (defaults to `'op-and'`).
     *
     * @param {string} cql - A compound CQL expression, consisting of one or more simple expressions all separated by the same logical operator).
     *
     * @param {string} options.columnName - (Required.)

     * @returns {undefined|{operator: string, children: string[], schema: string[]}}
     * `undefined` when there are no complete expressions
     *
     * @memberOf module:CQL
     */
    parse: function(cql, columnName) {
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

function toRegexGroup(list) {
    var g = list
        .sort(descendingByLength)// put larger ones first so that in case a smaller one is a substring of a larger one (such as '<' is to '<='), larger one will be matched first
        .join('|')
        .replace(/\s+/g, '\\s+'); // spaces to whitespace matcher

    g = '(' + g + ')';

    if (list.indexOf(this.defaultOp) >= 0) {
        g += '?';
    }

    return g;
}

function descendingByLength(a, b) {
    return b.length - a.length;
}

module.exports = ParserCQL;
