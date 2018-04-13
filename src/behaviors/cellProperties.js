/* eslint-env bro wser */

'use strict';

var assignOrDelete = require('../lib/misc').assignOrDelete;


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
     * @param {object|undefined} properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns {*} New cell properties object, based on column properties object, with `properties` copied to it.
     * @memberOf Column#
     */
    setCellProperties: function(rowIndex, properties, dataModel) {
        if (properties) {
            return Object.assign(newCellPropertiesObject.call(this, rowIndex, dataModel), properties);
        }
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {object|undefined} properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
     * @memberOf Column#
     */
    addCellProperties: function(rowIndex, properties, dataModel) {
        if (properties) {
            return assignOrDelete(getCellPropertiesObject.call(this, rowIndex, dataModel), properties);
        }
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
     * If the cell does not have its own properties object, this method returns `null`.
     *
     * Call this method only when you need to know if the the cell has its own properties object; otherwise call {@link Column#getCellProperties|getCellProperties}.
     * @param {number} rowIndex - Data row coordinate.
     * @returns {null|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(rowIndex, dataModel) {
        var rowData;
        return (
            // this.index >= 0 && // no cell props on row handle cells
            (rowData = (dataModel || this.dataModel).getRow(rowIndex)) && // no cell props on non-existent rows
            rowData.__META && rowData.__META[this.name] ||
            null // null means not previously created
        );
    },

    deleteCellOwnProperties: function(rowIndex, dataModel) {
        var rowData = (dataModel || this.dataModel).getRow(rowIndex);
        if (rowData.__META) {
            delete rowData.__META[this.name];
        }
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
        var cellProps = getCellPropertiesObject.call(this, rowIndex, dataModel);
        cellProps[key] = value;
        return cellProps;
    },

    deleteCellProperty: function(rowIndex, key, dataModel) {
        var cellProps = this.getCellOwnProperties(rowIndex, dataModel);
        if (cellProps) {
            delete cellProps[key];
        }
    },

    clearAllCellProperties: function() {
        var key = this.name;
        this.behavior.subgrids.forEach(function(dataModel) {
            for (var i = dataModel.getRowCount(); i--;) {
                var rowData = dataModel.getRow(i),
                    meta = rowData.__META;
                if (meta) {
                    if (Object.keys(meta).length === 1) {
                        delete rowData.__META;
                    }
                    if (meta) {
                        delete meta[key];
                    }
                }
            }
        });
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
 * @todo: We need a function to reset the prototypes of pre-existing __META members to their respective column properties objects.
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(rowIndex, dataModel) {
    var metadata = (dataModel || this.dataModel).getRowMetadata(rowIndex, {}),
        props = this.properties;

    switch (this._index) {
        case this.behavior.treeColumnIndex:
            props = this.properties.treeHeader;
            break;
        case this.behavior.rowColumnIndex:
            props = this.properties.rowHeader;
            break;
    }

    return (metadata[this.name] = Object.create(props));
}

module.exports = cell;
