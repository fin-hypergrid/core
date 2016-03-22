'use strict';

var reName,
    reOp = /^((=|>=?|<[>=]?)|(NOT )?(LIKE|IN)\b)/i, // match[1]
    reLit = /^'(\d+)'/,
    reLitAnywhere = /'(\d+)'/,
    reIn = /^\((.*?)\)/,
    reBool = /^(AND|OR)\b/i,
    reGroup = /^(NOT ?)?\(/i;

var SQT = '\'',
    optionsPrototype = {
        autoLookupByName: true,
        autoLookupByAlias: true,
        caseSensitiveColumnNames: false
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
 * @see {@link https://msdn.microsoft.com/en-us/library/ms173545.aspx SQL Search Condition}
 * @param {FilterTree} schema - Column schema for column name recognition.
 * @param {function} [propResolver]
 */
function ParserSQL(schema, propResolver) {
    this.schema = schema;
    this.options = Object.create(optionsPrototype);
    this.setOptions(propResolver);
    this.idQt = [];
    this.pushSqlIdQts({
        beg: '"',
        end: '"'
    });
}

ParserSQL.prototype = {

    constructor: ParserSQL.prototype.constructor,

    /** Override default properties with properties defined by supplied property resolver.
     * @param {function} [propResolver]
     */
    setOptions: function(propResolver) {
        if (propResolver) {
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
        }
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


    /**
     * Push a new set of quote characters onto the stack for subsequent use by the parser.
     * @param {sqlIdQtsObject} qts
     * @returns {Number}
     */
    pushSqlIdQts: function(qts) {
        reName = new RegExp('^(' + qts.beg + '(.+?)' + qts.end + '|([A-Z_][A-Z_@\\$#]*)\\b)', 'i'); // match[2] || match[3]
        return this.idQt.unshift(qts);
    },

    /**
     * Pop the current quote characters off the stack revealing the previous set to the parser..
     * @returns {sqlIdQtsObject}
     */
    popSqlIdQts: function() {
        return this.idQt.shift();
    },

    /**
     *
     * @param {string} sql
     *
     * @param {sqlIdQtsObject} [options.sqlIdQts] - The SQL identifier quote characters to accept while parsing the provided SQL. Alternatively, you can set the quote characters using the {@link module:sqlSearchCondition.pushSqlIdQts|pushSqlIdQts} method.
     * @returns {*}
     * @memberOf module:sqlSearchCondition
     */
    parse: function(sql, options) {
        var state;
        var sqlIdQts = options && options.sqlIdQts;

        // reduce all runs of white space to a single space; then trim
        sql = sql.replace(/\s\s+/g, ' ').trim();

        if (sqlIdQts) {
            this.pushSqlIdQts(sqlIdQts);
        }

        sql = stripLiterals.call(this, sql);
        state = walk.call(this, sql);

        if (!state.children) {
            state = { children: [ state ] };
        }

        if (sqlIdQts) {
            this.popSqlIdQts();
        }

        return state;
    }
};

function walk(t) {
    var m, name, op, arg, bool, token, tokens = [];
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
            m = t.substr(i).match(reName);
            if (!m) {
                throw new ParserSqlError('Expected identifier or quoted identifier.');
            }
            name = m[2] || m[3];
            if (!/^[A-Z_]/i.test(t[i])) { i += 2; }
            i += name.length;

            if (t[i] === ' ') { ++i; }
            m = t.substr(i).match(reOp);
            if (!m) {
                throw new ParserSqlError('Expected relational operator.');
            }
            op = m[1].toUpperCase();
            i += op.length;

            if (t[i] === ' ') { ++i; }
            if (m[4] && m[4].toUpperCase() === 'IN') {
                m = t.substr(i).match(reIn);
                if (!m) {
                    throw new ParserSqlError('Expected parenthesized list.');
                }
                arg = m[1];
                i += arg.length + 2;
                while ((m = arg.match(reLitAnywhere))) {
                    arg = arg.replace(reLitAnywhere, this.literals[m[1]]);
                }
            } else {
                m = t.substr(i).match(reLit);
                if (!m) {
                    throw new ParserSqlError('Expected string literal.');
                }
                arg = m[1];
                i += arg.length + 2;
                arg = this.literals[arg];
            }

            token = {
                column: name,
                operator: op,
                literal: arg
            };
        }

        tokens.push(token);

        if (i < t.length) {
            if (t[i] === ' ') { ++i; }
            m = t.substr(i).match(reBool);
            if (!m) {
                throw new ParserSqlError('Expected boolean opearator.');
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
