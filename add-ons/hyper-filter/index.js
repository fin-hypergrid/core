'use strict';

var DefaultFilter = require('./js/DefaultFilter');
var ColumnSchemaFactory = require('./js/ColumnSchemaFactory');

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
        var Hypergrid = Object.getPrototypeOf(this.grid).constructor;
        Hypergrid.prototype.mixIn(require('./mix-ins/grid'));
        targets = targets || {};
        (targets.Behavior && targets.Behavior.prototype || Object.getPrototypeOf(this.grid.behavior)).mixIn(require('./mix-ins/behavior'));
        (targets.DataModel && targets.DataModel.prototype || Object.getPrototypeOf(this.grid.behavior.dataModel)).mixIn(require('./mix-ins/dataModel'));
    },

    /**
     * @type {boolean}
     */
    caseSensitiveData: true,

    /**
     * @type {boolean}
     */
    caseSensitiveColumnNames: true,

    /**
     * @type {boolean}
     */
    resolveAliases: false,

    /**
     * @type {string}
     */
    defaultColumnFilterOperator: '', // blank means use default ('=')

    /**
     * Call this before calling `create` if you want to organize and/or sort your schema.
     */
    deriveSchema: function() {
        this.factory = new ColumnSchemaFactory(this.grid.behavior.allColumns);
    },
    organizeSchema: function(columnGroupsRegex, options) {
        this.factory.organize(columnGroupsRegex, options);
    },
    sortSchema: function(submenuPlacement) {
        this.factory.sort(submenuPlacement);
    },
    lookupInSchema: function(findOptions, value) {
        return this.factory.lookup(findOptions, value);
    },
    walkSchema: function(iteratee) {
        return this.factory.walk(iteratee);
    },

    /**
     * @param {menuItem[]} [schema] - If omitted, use derived schema. If no derived schema, derive it now.
     */
    create: function(schema) {
        if (!schema) {
            if (!this.factory) {
                this.deriveSchema();
            }
            schema = this.factory.schema;
            delete this.factory; // force new schema each call to create
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

module.exports = Hyperfilter;
