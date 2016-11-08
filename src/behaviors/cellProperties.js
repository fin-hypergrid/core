/* eslint-env bro wser */

'use strict';

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
     * @param {number} rowIndex - Data row coordinate.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperties: function(rowIndex, dataModel) {
        return this.getCellOwnProperties(rowIndex, dataModel) || this.properties;
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {Object} properties - Hash of cell properties.
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(rowIndex, properties, dataModel) {
        return Object.assign(newCellPropertiesObject.call(this, rowIndex, dataModel), properties);
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {Object} properties - Hash of cell properties.
     * @param {boolean} [preserve=false] - Falsy creates new object; truthy copies `properties` members into existing object.
     * @returns {*}
     * @memberOf Column#
     */
    addCellProperties: function(rowIndex, properties, dataModel) {
        return Object.assign(getCellPropertiesObject.call(this, rowIndex, dataModel), properties);
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
     * @param {number} rowIndex - Data row coordinate.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(rowIndex, dataModel) {
        var rowData;
        return (
            this.index >= 0 && // no cell props on row handle cells
            (rowData = (dataModel || this.dataModel).getRow(rowIndex)) && // no cell props on non-existant rows
            rowData.__META && rowData.__META[this.name] // undefined if not previously created
        );
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {number} rowIndex - Data row coordinate.
     * @param {string} key
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperty: function(rowIndex, key, dataModel) {
        return this.getCellProperties(rowIndex, dataModel)[key];
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {string} key
     * @param value
     * @returns {object}
     * @memberOf Column#
     */
    setCellProperty: function(rowIndex, key, value, dataModel) {
        var propertiesObject = getCellPropertiesObject.call(this, rowIndex, dataModel);
        propertiesObject[key] = value;
        return propertiesObject;
    },

    clearAllCellProperties: function() {
        // Unimplemented!
        // Need to undefine all `dataModel.getData(*).__META[this.name]`.
    }
};

/**
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(rowIndex, dataModel) {
    return this.getCellOwnProperties(rowIndex, dataModel) || newCellPropertiesObject.call(this, rowIndex, dataModel);
}

/**
 * @todo: For v8 optimization, consider setting the new `__META` object to a "regularly shaped object" (i.e., with all the columns) instead of simply to `{}`. Considerations include how many of these objects are there, how often are they referenced, etc.
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(rowIndex, dataModel) {
    var rowData = (dataModel || this.dataModel).getRow(rowIndex),
        metaData = rowData.__META = rowData.__META || {};
    return (metaData[this.name] = Object.create(this.properties));
}

module.exports = cell;
