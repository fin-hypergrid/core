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
    state: {
        sorts: []
    },
    /**
     * @implements sorterAPI
     * @desc Notes regarding specific properties:
     * * `sorts` The array of objects describe the sort state of each column including type, direction and column index
     * * `type` Notification that a column within the sorts type has changed
     * @memberOf Hypersorter.prototype
     */
    properties: function(properties) {
        var result, value, object,
            dm = this.grid.behavior.dataModel;
        if (properties && properties.column) {
            object = dm.getColumnSortState(properties.column.index);
        }  else {
            object = this.state;
        }

        if (properties && object) {
            if (properties.getPropName) {
                result = object[properties.getPropName];
                if (result === undefined) {
                    result = null;
                }
            } else {
                for (var key in properties) {
                    value = properties[key];
                    if (value === undefined) {
                        delete object[key];
                    } else if (typeof value === 'function') {
                        object[key] = value();
                    } else {
                        object[key] = value;
                    }
                }
            }
        }

        return result;
    }
};

module.exports = Hypersorter;
