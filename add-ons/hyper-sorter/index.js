'use strict';

function Hypersorter(grid, objects) {
    this.grid = grid;
    objects = objects || {};

    getPrototype('Hypergrid', grid).mixIn(require('./mix-ins/grid'));
    getPrototype('Behavior', grid.behavior).mixIn(require('./mix-ins/behavior'));
    getPrototype('Column', grid.behavior.allColumns.length && grid.behavior.allColumns[0]).mixIn(require('./mix-ins/column'));
    getPrototype('DataModel', grid.behavior.dataModel).mixIn(require('./mix-ins/dataModel'));

    this.grid.addEventListener('fin-column-sort', function(c, keys){
        grid.toggleSort(c, keys);
    });

    function getPrototype(name, instance, mixin) {
        var object = objects[name];
        return object && object.prototype || Object.getPrototypeOf(instance);
    }
}

Hypersorter.prototype = {
    constructor: Hypersorter,
    $$CLASS_NAME: 'hypersorter',

    /**
     * @implements dataControlInterface#properties
     * @desc Notes regarding specific properties:
     * * `type` Notification that a column within the sorts type has changed
     * @memberOf Hypersorter.prototype
     */
    properties: function(properties) {
        var result, value,
            column = this.grid.behavior.dataModel.getColumnSortState(properties.COLUMN.index);

        if (column) {
            if (properties.GETTER) {
                result = column[properties.GETTER];
                if (result === undefined) {
                    result = null;
                }
            } else {
                for (var key in properties) {
                    value = properties[key];
                    column[key] = typeof value === 'function' ? value() : value;
                }
            }
        }

        return result;
    }
};

module.exports = Hypersorter;
