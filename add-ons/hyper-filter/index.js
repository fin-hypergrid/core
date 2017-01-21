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

module.exports = Hyperfilter;
