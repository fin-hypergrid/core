'use strict';

/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    /**
     * @summary Get the cell's own properties object.
     * @desc May be undefined because cells only have their own properties object when at lest one own property has been set.
     * @param {CellEvent|number} xOrCellEvent - Data x coordinate.
     * @param {number} [y] - Grid row coordinate. _Omit when `xOrCellEvent` is a `CellEvent`._
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
     * @param {DataModel} [dataModel=this.dataModel] - For use only when `xOrCellEvent` is _not_ a `CellEvent`: Provide a subgrid.
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
