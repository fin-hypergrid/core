'use strict';

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

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
     * @param {object} properties - Hash of cell properties.
     * @returns {*}
     * @memberOf Column#
     */
    setCellProperties: function(rowIndex, properties, dataModel) {
        return Object.assign(newCellPropertiesObject.call(this, rowIndex, dataModel), properties);
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {object} properties - Hash of cell properties.
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
     * @memberOf Column#
     */
    addCellProperties: function(rowIndex, properties, dataModel) {
        return Object.assign(getCellPropertiesObject.call(this, rowIndex, dataModel), properties);
    },

    /**
     * @summary Get the cell's own properties object.
     * @desc Due to memory constraints, we don't create a cell properties object for every cell.
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
     * @returns {null|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `null`.
     * @memberOf Column#
     */
    getCellOwnProperties: function(rowIndex, dataModel) {
        var metadata;
        return (
            // this.index >= 0 && // no cell props on row handle cells
            (metadata = (dataModel || this.dataModel).getRowMetadata(rowIndex)) && // no cell props on non-existent rows
            metadata && metadata[this.name] ||
            null // null means not previously created
        );
    },

    deleteCellOwnProperties: function(rowIndex, dataModel) {
        dataModel = dataModel || this.dataModel;
        var metadata = dataModel.getRowMetadata(rowIndex);
        if (metadata) {
            delete metadata[this.name];
            if (Object.keys(metadata).length === 0) {
                dataModel.setRowMetadata(rowIndex);
            }
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
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
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

    /**
     * Clear all cell properties from all cells in this column.
     * @memberOf Column#
     */
    clearAllCellProperties: function() {
        this.behavior.subgrids.forEach(function(dataModel) {
            for (var y = dataModel.getRowCount(); y--;) {
                this.deleteCellOwnProperties(y, dataModel);
            }
        }, this);
    }
};

/**
 * @todo: Theoretically setData should call this method to ensure each cell's persisted properties object is properly recreated with prototype set to its column's properties object.
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(rowIndex, dataModel) {
    return this.getCellOwnProperties(rowIndex, dataModel) || newCellPropertiesObject.call(this, rowIndex, dataModel);
}

/**
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(rowIndex, dataModel) {
    var metadata = {},
        props;

    if (this._index >= 0) {
        props = this.properties;
    } else if (this._index === this.behavior.treeColumnIndex) {
        props = this.properties.treeHeader;
    } else if (this._index === this.behavior.rowColumnIndex) {
        props = this.properties.rowHeader;
    }

    (dataModel || this.dataModel).setRowMetadata(rowIndex, metadata);

    return (metadata[this.name] = Object.create(props));
}
