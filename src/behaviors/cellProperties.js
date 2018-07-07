'use strict';

var assignOrDelete = require('../lib/assignOrDelete');

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
     * @param {DataModel} [dataModel=this.dataModel]
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Column#
     */
    getCellProperties: function(rowIndex, dataModel) {
        return this.getCellOwnProperties(rowIndex, dataModel) || this.properties;
    },

    /**
     * @param {number} rowIndex - Data row coordinate.
     * @param {object|undefined} properties - Hash of cell properties. If `undefined`, this call is a no-op.
     * @param {DataModel} [dataModel=this.dataModel]
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
     * @param {DataModel} [dataModel=this.dataModel]
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
     * @param {DataModel} [dataModel=this.dataModel]
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

    /**
     * Delete cell's own properties object.
     * @param {number} rowIndex - Data row coordinate.
     * @param {DataModel} [dataModel=this.dataModel]
     * @memberOf Column#
     */
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
     * @param {DataModel} [dataModel=this.dataModel]
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
     * @param {DataModel} [dataModel=this.dataModel]
     * @returns {object} Cell's own properties object, which will be created by this call if it did not already exist.
     * @memberOf Column#
     */
    setCellProperty: function(rowIndex, key, value, dataModel) {
        var cellProps = getCellPropertiesObject.call(this, rowIndex, dataModel);
        cellProps[key] = value;
        return cellProps;
    },

    /**
     * @summary Delete a cell own property.
     * @summary If the property is not an own property, it is not deleted.
     * @param {number} rowIndex - Data row coordinate.
     * @param {string} key
     * @param {DataModel} [dataModel=this.dataModel]
     */
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
     * @param {DataModel} [dataModel=this.dataModel]
 * @returns {object}
 * @private
 */
function getCellPropertiesObject(rowIndex, dataModel) {
    return this.getCellOwnProperties(rowIndex, dataModel) || newCellPropertiesObject.call(this, rowIndex, dataModel);
}

/**
 * @this {Column}
 * @param {number} rowIndex - Data row coordinate.
     * @param {DataModel} [dataModel=this.dataModel]
 * @returns {object}
 * @private
 */
function newCellPropertiesObject(rowIndex, dataModel) {
    var metadata = (dataModel || this.dataModel).getRowMetadata(rowIndex, null),
        props = this.properties;

    switch (this.index) {
        case this.behavior.treeColumnIndex:
            props = props.treeHeader;
            break;
        case this.behavior.rowColumnIndex:
            props = props.rowHeader;
            break;
        default:
            if (dataModel && dataModel.type === 'filter') {
                props = this.properties.filterProperties;
            }
    }

    return (metadata[this.name] = Object.create(props));
}
