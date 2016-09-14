'use strict';

var _ = require('object-iterators');

var DefaultFilter = require('./js/DefaultFilter');
var ColumnSchemaFactory = require('./js/ColumnSchemaFactory');

function Hypersorter(grid, objects) {
    this.grid = grid;
    objects = objects || {};

    mixInTo('Hypergrid', grid, require('./mix-ins/grid'));
    mixInTo('Behavior', grid.behavior, require('./mix-ins/behavior'));
    mixInTo('Column', grid.behavior, require('./mix-ins/column'));
    mixInTo('DataModel', grid.behavior.dataModel, require('./mix-ins/dataModel'));

    this.grid.addEventListener('fin-column-sort', function(c, keys){
        grid.toggleSort(c, keys);
    });

    function mixInTo(name, instance, mixin) {
        var object = objects[name];
        var prototype = object && object.prototype || Object.getPrototypeOf(instance);
        _(prototype).extend(mixin);
    }
}

Hypersorter.prototype = {
    constructor: Hypersorter.prototype.constructor
};

module.exports = Hypersorter;
