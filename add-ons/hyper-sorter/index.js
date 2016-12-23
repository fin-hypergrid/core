'use strict';

function Hypersorter(grid, objects) {
    this.grid = grid;

    this.sorts = [];

    objects = objects || {};

    var hypergridPrototype = getPrototype('Hypergrid', grid);

    hypergridPrototype.constructor.properties.mixIn(require('./mix-ins/defaults'));

    hypergridPrototype.mixIn(require('./mix-ins/grid'));
    getPrototype('Behavior', grid.behavior).mixIn(require('./mix-ins/behavior'));
    getPrototype('Column', grid.behavior.allColumns.length && grid.behavior.allColumns[0]).mixIn(require('./mix-ins/column'));
    getPrototype('DataModel', grid.behavior.dataModel).mixIn(require('./mix-ins/dataModel'));

    grid.behavior.dataModel.charMap.mixIn({
        ASC: '\u25b2', // UPWARDS_BLACK_ARROW, aka '▲'
        DESC: '\u25bc' // DOWNWARDS_BLACK_ARROW, aka '▼'
    });

    this.grid.addEventListener('fin-column-sort', function(c, keys){
        grid.toggleSort(c, keys);
    });

    function getPrototype(name, instance) {
        var object = objects[name];
        return object && object.prototype || Object.getPrototypeOf(instance);
    }
}

Hypersorter.prototype.name = 'hypersorter';

/** @typedef {object} sortSpecInterface
 * @property {number} columnIndex
 * @property {number} direction
 * @property {string} [type]
 */

/**
 * @implements dataControlInterface#properties
 * @desc See {@link sortSpecInterface} for available sort properties.
 * @memberOf Hypersorter.prototype
 */
Hypersorter.prototype.properties = function(properties) {
    var result, value,
        columnSort = this.grid.behavior.dataModel.getColumnSortState(properties.COLUMN.index);

    if (columnSort) {
        if (properties.GETTER) {
            result = columnSort[properties.GETTER];
            if (result === undefined) {
                result = null;
            }
        } else {
            for (var key in properties) {
                value = properties[key];
                columnSort[key] = typeof value === 'function' ? value() : value;
            }
        }
    }

    return result;
};

module.exports = Hypersorter;
