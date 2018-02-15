'use strict';

var defaults = require('../defaults');

var COLUMNS = defaults.propClassEnum.COLUMNS,
    CELLS = defaults.propClassEnum.CELLS,
    propClassGet = [];

propClassGet[COLUMNS] = function(cellEvent) {
    return cellEvent.columnProperties;
};
propClassGet[CELLS] = function(cellEvent) {
    return cellEvent.cellOwnProperties;
};
propClassGet[defaults.propClassEnum.STRIPES] = function(cellEvent) {
    var rowStripes = cellEvent.isDataRow && cellEvent.columnProperties.rowStripes;
    return rowStripes && rowStripes[cellEvent.dataCell.y % rowStripes.length];
};
propClassGet[defaults.propClassEnum.ROWS] = function(cellEvent) {
    return cellEvent.rowOwnProperties;
};

function assignProps(cellEvent) {
    var i, base, assignments,
        props = cellEvent.properties,
        propLayers = props.propClassLayers;

    switch (propLayers[0]) {
        case COLUMNS:
            i = 1; // skip column prop layer
            base = cellEvent.columnProperties; // because column has grid props as prototype
            break;
        case CELLS:
            i = 1; // skip cell prop layer
            base = cellEvent.properties; // because cell has column props as prototype
            break;
        default:
            i = 0; // all prop layers
            base = this.grid.properties;
    }

    for (assignments = [Object.create(base)]; i < propLayers.length; ++i) {
        assignments.push(propClassGet[propLayers[i]](cellEvent));
    }

    return Object.assign.apply(Object, assignments);
}

module.exports = assignProps;
