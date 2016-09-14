/* eslint-env bro wser */

'use strict';

var _ = require('object-iterators');

/**
 * Column.js mixes this module into its prototype.
 * @module
 */
var Cell = {

    /**
     * Due to memory constraints, we don't create a cell options properties object for every cell.
     *
     * When such a properties object already exists, it:
     * * was created by a previous call to `setCellProperties` or `setCellProperty`
     * * has the column properties object as its prototype
     * * is returned
     *
     * When the cell properties object does not yet exist, this method simply returns `undefined`.
     * Call this method when you need to know if the the cell has its own properties object.
     * In general, if you are seeking a certain property, you might call {@link Column#getCellProperty} instead (which calls this method).
     *
     * @param {number} r - Grid row coordinate.
     * @returns {undefined|object}
     * @memberOf Column#
     */
    getCellProperties: function(r) {
        return this.cellProperties[getDataIndex.call(this, r)];
    },

    /**
     * @param {number} r - Grid row coordinate.
     * @param {string} key
     * @returns {object}
     * @memberOf Column#
     */
    getCellProperty: function(r, key) {
        return (this.getCellProperties(r) || this.getProperties())[key];
    },

    /**
     *
     * @param {number} r - Grid row coordinate.
     * @param {object} properties
     * @param {boolean} [preserve=false]
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(r, properties, preserve) {
        var props = preserve ? getCellPropertiesObject.call(this, r) : newCellPropertiesObject.call(this, r);
        return _(props).extendOwn(properties);
    },

    /**
     * @param {number} r - Grid row coordinate.
     * @param {string} key
     * @param value
     * @returns {object}
     * @memberOf Column#
     */
    setCellProperty: function(r, key, value) {
        var props = getCellPropertiesObject.call(this, r);
        props[key] = value;
        return props;
    },

    clearAllCellProperties: function() {
        this.cellProperties = [];
    }
};

/**
 * @summary The data row index at the given grid row index.
 * @desc If a header row index, returned as is.
 * @this {Column}
 * @param {number} r - Grid row coordinate.
 * @returns {object}
 * @private
 */
function getDataIndex(r) {
    var headers = this.behavior.getHeaderRowCount();
    return r < headers ? r : headers + this.dataModel.getDataIndex(r);
}

/**
 * @this {Column}
 * @param {number} r - Grid row coordinate.
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(r) {
    return (
        this.getCellProperties(r) ||
        newCellPropertiesObject.call(this, r)
    );
}

/**
 * @this {Column}
 * @param {number} r - Grid row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(r) {
    return (
        this.cellProperties[getDataIndex.call(this, r)] = Object.create(this.getProperties())
    );
}

module.exports = Cell;
