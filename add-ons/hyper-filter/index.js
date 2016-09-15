'use strict';

var DefaultFilter = require('./js/DefaultFilter');
var ColumnSchemaFactory = require('./js/ColumnSchemaFactory');

/**
 * @param {Hypergrid} grid
 * @param {boolean} [basic=false] - Truthy means to limit mixin to "GlobalFilter" methods. This would exclude the methods that deal with the table and column filter subtree states.
 * @param {object} objects - Hash of mixin targets. These are typically prototype objects. If targets are missing, targets current grid's various prototypes.
 * @constructor
 */
function Hyperfilter(grid, basic, objects) {
    this.grid = grid;
    objects = objects || {};

    mixInTo('Hypergrid', grid, require('./mix-ins/grid'));
    mixInTo('Behavior', grid.behavior, require('./mix-ins/behavior'));
    mixInTo('DataModel', grid.behavior.dataModel, require('./mix-ins/dataModel'));

    function mixInTo(target, instance, mixin) {
        var object = objects[target];
        var prototype = object && object.prototype || Object.getPrototypeOf(instance);

        for (var key in mixin) {
            if (!basic || /globalfilter/.test(key)) {
                prototype[key] = mixin[key];
            }
        }
    }
}

Hyperfilter.prototype = {
    constructor: Hyperfilter.prototype.constructor,

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
        this.factory = new ColumnSchemaFactory(this.grid.behavior.columns);
    },
    organizeSchema: function(columnGroupsRegex, options) {
        this.factory.organize(columnGroupsRegex, options);
    },
    sortSchema: function(submenuPlacement) {
        this.factory.sort(submenuPlacement);
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
