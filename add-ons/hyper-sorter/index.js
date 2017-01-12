'use strict';

function Hypersorter(grid, targets) {
    this.grid = grid;

    this.install(targets);

    this.sorts = [];

    grid.behavior.dataModel.charMap.mixIn({
        ASC: '\u25b2', // UPWARDS_BLACK_ARROW, aka '▲'
        DESC: '\u25bc' // DOWNWARDS_BLACK_ARROW, aka '▼'
    });

    grid.addEventListener('fin-column-sort', true, function(c, keys){
        grid.toggleSort(c, keys);
    });
}

Hypersorter.prototype.name = 'Hypersorter';

Hypersorter.prototype.install = function(targets) {
    var Hypergrid = Object.getPrototypeOf(this.grid).constructor;
    Hypergrid.properties.mixIn(require('./mix-ins/defaults'));
    Hypergrid.prototype.mixIn(require('./mix-ins/grid'));
    targets = targets || {};
    (targets.Behavior && targets.Behavior.prototype || Object.getPrototypeOf(this.grid.behavior)).mixIn(require('./mix-ins/behavior'));
    (targets.Column || Hypergrid.behaviors.Column).prototype.mixIn(require('./mix-ins/column'));
    (targets.DataModel && targets.DataModel.prototype || Object.getPrototypeOf(this.grid.behavior.dataModel)).mixIn(require('./mix-ins/dataModel'));
};

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
