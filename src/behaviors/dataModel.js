'use strict';

/**
 * Behavior.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    getSchema: function() {
        return this.dataModel.getSchema();
    },

    setSchema: function(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    /**
     * @summary Gets the number of rows in the data subgrid.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#getRowCount|getRowCount}
     * @memberOf Behavior#
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    /**
     * @summary Get the value at cell (x,y).
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param {number} x - The horizontal grid coordinate
     * @param {number} y - The vertical coordinate.
     * @param {DataModel} [dataModel] - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     * @returns {*} The raw cell data.
     * @memberOf Behavior#
     */
    getValue: function(x, y, dataModel) {
        if (dataModel) {
            return dataModel.getValue(x, y);
        } else {
            var cellEvent = new this.CellEvent,
                visible = cellEvent.resetDataXY(x, y, dataModel);
            if (visible) {
                return cellEvent.value;
            }
        }
    },

    /**
     * @summary Update the value at cell (x,y) with the given value.
     * @desc When the last parameter (see `dataModel` below) is omitted, this method:
     * * Is backwards compatible to the v2 version.
     * * Does _not_ default to the data subgrid — although you can provide it explicitly (`this.behavior.dataModel`).
     * @param {number} x - The horizontal coordinate.
     * @param {number} y - The vertical coordinate.
     * @param {*} value - New cell data.
     * @param {DataModel} [dataModel] - `x` and `y` are _data cell coordinates_ in the given subgrid data model. If If omitted, `x` and `y` are _grid cell coordinates._
     * @memberOf Behavior#
     */
    setValue: function(x, y, value, dataModel) {
        if (dataModel) {
            dataModel.setValue(x, y, value);
        } else {
            var cellEvent = new this.CellEvent,
                visible = cellEvent.resetDataXY(x, y, dataModel);
            if (visible) {
                cellEvent.value = value;
            }
        }
    },

    /**
     * @summary Calls `apply()` on the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#reindex|reindex}
     * @memberOf Behavior#
     */
    reindex: function() {
        this.dataModel.apply();
    },

    /**
     * Retrieve a data row from the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#getRow|getRow}
     * @memberOf Behavior#
     * @return {dataRowObject} The data row object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.dataModel.getRow(y);
    },

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     * @see {@link https://fin-hypergrid.github.io/doc/DataModel.html#getData|getData}
     * @return {dataRowObject[]}
     * @memberOf Behavior#
     */
    getData: function() {
        return this.dataModel.getData();
    },

};
