/* eslint-env bro wser */

'use strict';

var _ = require('object-iterators');

/**
 * Column.js mixes this module into its prototype.
 * @module
 */
var cell = {

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found; else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Column#getCellProperty} instead (which calls this method).
     * @param {number|CellEvent} yOrCellEvent - Data row coordinate or cell event object.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperties: function(yOrCellEvent) {
        var cellEvent = newDataRowCellEvent.call(this, yOrCellEvent);
        return this.getCellOwnProperties(cellEvent) || this.properties;
    },

    /**
     *
     * @param {number|CellEvent} yOrCellEvent - Data row coordinate or cell event object.
     * @param {Object} properties - Hash of cell properties.
     * @param {boolean} [preserve=false] - Falsy creates new object; truthy copies `properties` members into existing object.
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(yOrCellEvent, properties, preserve) {
        var cellEvent = newDataRowCellEvent.call(this, yOrCellEvent),
            getPropertiesObject = preserve ? getCellPropertiesObject : newCellPropertiesObject,
            cellPropertiesObject = getPropertiesObject.call(this, cellEvent);

        return _(cellPropertiesObject).extendOwn(properties);
    },

    /**
     * @summary Get the cell's own properties object.
     * @desc Due to memory constraints, we don't create a cell options properties object for every cell.
     *
     * If the cell has its own properties object, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * If the cell does not have its own properties object, this method simply returns `undefined`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link Column#getCellProperties|getCellProperties}.
     *
     * @param {number|CellEvent} yOrCellEvent - Data row coordinate or cell event object.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(yOrCellEvent) {
        return this.cellProperties[getDataIndex.call(this, yOrCellEvent)];
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {number|CellEvent} yOrCellEvent - Data row coordinate or cell event object.
     * @param {string} key
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperty: function(yOrCellEvent, key) {
        return this.getCellProperties(yOrCellEvent)[key];
    },

    /**
     * @param {number|CellEvent} yOrCellEvent - Data row coordinate or cell event object.
     * @param {string} key
     * @param value
     * @returns {object}
     * @memberOf Column#
     */
    setCellProperty: function(yOrCellEvent, key, value) {
        var propertiesObject = getCellPropertiesObject.call(this, yOrCellEvent);
        propertiesObject[key] = value;
        return propertiesObject;
    },

    clearAllCellProperties: function() {
        this.cellProperties = [];
    }
};

/**
 * @summary The data row index at the given grid row index.
 * @desc If a header row index, returns 'filter' or 'header'.
 * @this {Column}
 * @param {number} cellEvent - Grid row coordinate.
 * @returns {number|string} An index suitable for `cellProperties[]`; one of:
 * * Data section: Actual data row index.
 * * Filter row: `true`
 * * Other row (Top totals rows, bottom totals rows, header row): `false`
 *
 * @private
 */
function getDataIndex(cellEvent) {
    var type = cellEvent.visibleRow.subgrid.type;
    return type ? type.toUpperCase() : this.dataModel.getDataIndex(cellEvent.dataCell.y);
}

/**
 * @this {Column}
 * @param {number} cellEvent - Grid row coordinate.
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(cellEvent) {
    return (
        this.getCellProperties(cellEvent) ||
        newCellPropertiesObject.call(this, cellEvent)
    );
}

/**
 * @this {Column}
 * @param {number} cellEvent - Grid row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(cellEvent) {
    var newObj = Object.create(this.properties);
    this.cellProperties[getDataIndex.call(this, cellEvent)] = newObj;
    return newObj;
}

function newDataRowCellEvent(yOrCellEvent) {
    var cellEvent, firstDataGridRow;

    if (yOrCellEvent >= 0) {
        firstDataGridRow = this.behavior.getHeaderRowCount();
        cellEvent = new this.behavior.CellEvent(0, firstDataGridRow); // x coordinate not used
        cellEvent.dataCell.y = yOrCellEvent; // scroll to y
    } else {
        cellEvent = yOrCellEvent;
    }
    return cellEvent;
}

module.exports = cell;
