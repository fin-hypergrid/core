'use strict';

var defaults = require('../defaults');

var COLUMNS = defaults.propClassEnum.COLUMNS,
    CELLS = defaults.propClassEnum.CELLS,
    ROWS = defaults.propClassEnum.ROWS,
    STRIPES = defaults.propClassEnum.STRIPES,
    propClassGet = [];

propClassGet[COLUMNS] = function(cellEvent) {
    return cellEvent.columnProperties;
};
propClassGet[CELLS] = function(cellEvent) {
    return cellEvent.cellOwnProperties;
};
propClassGet[STRIPES] = function(cellEvent) {
    var rowStripes = cellEvent.isDataRow && cellEvent.columnProperties.rowStripes;
    return rowStripes && rowStripes[cellEvent.dataCell.y % rowStripes.length];
};
propClassGet[ROWS] = function(cellEvent) {
    return cellEvent.rowOwnProperties;
};

function assignProps(cellEvent) {
    var i, base, assignments,
        propLayers = cellEvent.properties.propClassLayers;

    switch (propLayers[0]) {
        case ROWS:
            i = 1; // skip row prop layer
            base = cellEvent.rowOwnProperties || this.grid.properties; // because row has grid props as prototype
            break;
        case COLUMNS:
            if (propLayers[1] === CELLS) {
                i = 2; // skip both column + cell prop layers
                base = cellEvent.properties; // because cell has column props as prototype
            } else {
                i = 1; // skip column prop layer
                base = cellEvent.columnProperties; // because column has grid props as prototype
            }
            break;
        case CELLS:
            if (propLayers[1] === COLUMNS) {
                if ((base = cellEvent.cellOwnProperties)) {
                    i = 1; // skip cell prop layer because cell has column props (which has grid props) as prototype
                } else {
                    i = 2; // skip both cell + column prop layers
                    base = cellEvent.columnProperties; // because column has grid props as prototype
                }
            } else if (propLayers[2] === COLUMNS || propLayers[3] === COLUMNS) {
                i = 1; // skip cell prop layer
                base = cellEvent.properties; // because cell has column props (which has grid props) as prototype
            } else {
                i = 0; // all prop layers
                base = this.grid.properties; // because cell has column props as prototype but COLUMNS is not in the list
            }
            break;
        case STRIPES:
            i = 0; // all prop layers
            base = this.grid.properties;
            break;
    }

    for (assignments = [Object.create(base)]; i < propLayers.length; ++i) {
        assignments.push(propClassGet[propLayers[i]](cellEvent));
    }

    return Object.assign.apply(Object, assignments);
}

module.exports = assignProps;
