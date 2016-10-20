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
     *
     * For backwards compatibility, this function still accepts an absolute row coordinate as well as a CellEvent.
     * @param {number|CellEvent} yOrCellEvent - Grid row coordinate.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperties: function(yOrCellEvent) {
        if (yOrCellEvent >= 0) {
            // accept absolute row coordinate to maintain backwards compatibility
            yOrCellEvent = this.behavior.newCellEvent(0, yOrCellEvent); // x coordinate not used
        }
        return this.getCellOwnProperties(yOrCellEvent) || this.getProperties();
    },

    /**
     *
     * @param {number|CellEvent} yOrCellEvent - Grid row coordinate.
     * @param {Object} properties - Hash of cell properties.
     * @param {boolean} [preserve=false] - Falsy creates new object; truthy copies `properties` members into existing object.
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(yOrCellEvent, properties, preserve) {
        if (yOrCellEvent >= 0) {
            // accept absolute row coordinate to maintain backwards compatibility
            yOrCellEvent = this.behavior.newCellEvent(0, yOrCellEvent); // x coordinate not used
        }
        var cellPropertiesObject = preserve ? getCellPropertiesObject : newCellPropertiesObject,
            props = cellPropertiesObject.call(this, yOrCellEvent);
        return _(props).extendOwn(properties);
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
     * @param {number} cellEvent - Grid row coordinate.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(cellEvent) {
        return this.cellProperties[getDataIndex.call(this, cellEvent)];
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {number} cellEvent - Grid row coordinate.
     * @param {string} key
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperty: function(cellEvent, key) {
        return this.getCellProperties(cellEvent)[key];
    },

    /**
     * @param {number} cellEvent - Grid row coordinate.
     * @param {string} key
     * @param value
     * @returns {object}
     * @memberOf Column#
     */
    setCellProperty: function(cellEvent, key, value) {
        var props = getCellPropertiesObject.call(this, cellEvent);
        props[key] = value;
        return props;
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
    return cellEvent.type || this.dataModel.getDataIndex(cellEvent.dataCell.y);
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

module.exports = cell;
