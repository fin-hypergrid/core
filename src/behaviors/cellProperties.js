'use strict';

var assignOrDelete = require('../lib/misc').assignOrDelete;


/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.behaviorMixin = {
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @returns {undefined|object} The "own" properties of the cell at x,y in the grid. If the cell does not own a properties object, returns `undefined`.
     * @memberOf Behavior#
     */
    getCellOwnProperties: function(xOrCellEvent, y, dataModel) {
        if (arguments.length === 1) {
            // xOrCellEvent is cellEvent
            return xOrCellEvent.column.getCellOwnProperties(xOrCellEvent.dataCell.y, xOrCellEvent.subgrid);
        } else {
            // xOrCellEvent is x
            return this.getColumn(xOrCellEvent).getCellOwnProperties(y, dataModel);
        }
    },

    /**
     * @summary Get the properties object for cell.
     * @desc This is the cell's own properties object if found else the column object.
     *
     * If you are seeking a single specific property, consider calling {@link Behavior#getCellProperty} instead.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return {object} The properties of the cell at x,y in the grid.
     * @memberOf Behavior#
     */
    getCellProperties: function(xOrCellEvent, y, dataModel) {
        if (arguments.length === 1) {
            // xOrCellEvent is cellEvent
            return xOrCellEvent.properties;
        } else {
            // xOrCellEvent is x
            return this.getColumn(xOrCellEvent).getCellProperties(y, dataModel);
        }
    },

    /**
     * @summary Return a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate._ Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @return {object} The specified property for the cell at x,y in the grid.
     * @memberOf Behavior#
     */
    getCellProperty: function(xOrCellEvent, y, key, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            key = y;
            return xOrCellEvent.properties[key];
        } else {
            return this.getColumn(xOrCellEvent).getCellProperty(y, key, dataModel);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc update the data at point x, y with value
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {Object} properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    setCellProperties: function(xOrCellEvent, y, properties, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            properties = y;
            return xOrCellEvent.column.setCellProperties(xOrCellEvent.dataCell.y, properties, xOrCellEvent.subgrid);
        } else {
            return this.getColumn(xOrCellEvent).setCellProperties(y, properties, dataModel);
        }
    },

    /**
     * @memberOf Behavior#
     * @desc update the data at point x, y with value
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {Object} properties - Hash of cell properties. _When `y` omitted, this param promoted to 2nd arg._
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     */
    addCellProperties: function(xOrCellEvent, y, properties, dataModel) {
        if (typeof xOrCellEvent === 'object') {
            properties = y;
            return xOrCellEvent.column.addCellProperties(xOrCellEvent.dataCell.y, properties, xOrCellEvent.subgrid); // y omitted so y here is actually properties
        } else {
            return this.getColumn(xOrCellEvent).addCellProperties(y, properties, dataModel);
        }
    },

    /**
     * @summary Set a specific cell property.
     * @desc If there is no cell properties object, defers to column properties object.
     *
     * NOTE: For performance reasons, renderer's cell event objects cache their respective cell properties objects. This method accepts a `CellEvent` overload. Whenever possible, use the `CellEvent` from the renderer's cell event pool. Doing so will reset the cell properties object cache.
     *
     * If you use some other `CellEvent`, the renderer's `CellEvent` properties cache will not be automatically reset until the whole cell event pool is reset on the next call to {@link Renderer#computeCellBoundaries}. If necessary, you can "manually" reset it by calling {@link Renderer#resetCellPropertiesCache|resetCellPropertiesCache(yourCellEvent)} which searches the cell event pool for one with matching coordinates and resets the cache.
     *
     * The raw coordinates overload calls the `resetCellPropertiesCache(x, y)` overload for you.
     * @param {CellEvent|number} xOrCellEvent - `CellEvent` or data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {string} key - Name of property to get. _When `y` omitted, this param promoted to 2nd arg._
     * @param value
     * @param {dataModelAPI} [dataModel=this.subgrids.lookup.data] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
     * @memberOf Behavior#
     */
    setCellProperty: function(xOrCellEvent, y, key, value, dataModel) {
        var cellOwnProperties;
        if (typeof xOrCellEvent === 'object') {
            value = key;
            key = y;
            cellOwnProperties = xOrCellEvent.setCellProperty(key, value);
        } else {
            cellOwnProperties = this.getColumn(xOrCellEvent).setCellProperty(y, key, value, dataModel);
            this.grid.renderer.resetCellPropertiesCache(xOrCellEvent, y, dataModel);
        }
        return cellOwnProperties;
    }
};

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.columnMixin = {

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
